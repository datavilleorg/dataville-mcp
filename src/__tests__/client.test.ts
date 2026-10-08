import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { searchDataSource, queryDataville, DatavilleApiError, DatavilleAuthError } from "../client.js";

const ORIGINAL_ENV = { ...process.env };
const originalFetch = global.fetch;

beforeEach(() => {
  process.env.DATAVILLE_API_KEY = "dataville_test_key";
  process.env.DATAVILLE_API_BASE_URL = "https://api.example.test";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  global.fetch = originalFetch;
});

test("throws a clear error when DATAVILLE_API_KEY is missing", async () => {
  delete process.env.DATAVILLE_API_KEY;
  await assert.rejects(
    () => searchDataSource("wikipedia", "test"),
    /DATAVILLE_API_KEY is not set/
  );
});

test("sends Authorization, User-Agent headers and returns the parsed body on success", async () => {
  let capturedUrl: string | undefined;
  let capturedHeaders: Record<string, string> | undefined;
  global.fetch = (async (url: any, init: any) => {
    capturedUrl = String(url);
    capturedHeaders = init.headers;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;

  const result = await searchDataSource("wikipedia", "Machine Learning");

  assert.equal(capturedUrl, "https://api.example.test/wikipedia/Machine%20Learning");
  assert.equal(capturedHeaders?.Authorization, "Bearer dataville_test_key");
  assert.ok(capturedHeaders?.["User-Agent"]?.startsWith("dataville-mcp/"));
  assert.deepEqual(result, { ok: true });
});

test("rejects dot segments that would resolve the URL away from the data route", async () => {
  let called = false;
  global.fetch = (async () => {
    called = true;
    return new Response(JSON.stringify({}), { status: 200 });
  }) as typeof fetch;

  for (const [source, keywords] of [["..", "health"], [".", "x"], ["wikipedia", ".."], ["wikipedia", "."]]) {
    await assert.rejects(() => searchDataSource(source, keywords), /is not a valid/);
  }
  assert.equal(called, false);
});

test("keeps dots that are not whole segments", async () => {
  let capturedUrl: string | undefined;
  global.fetch = (async (url: any) => {
    capturedUrl = String(url);
    return new Response(JSON.stringify({}), { status: 200 });
  }) as typeof fetch;

  await searchDataSource("pypi", "...");
  assert.equal(capturedUrl, "https://api.example.test/pypi/...");
  await searchDataSource("wikipedia", "%2e%2e");
  assert.equal(capturedUrl, "https://api.example.test/wikipedia/%252e%252e");
});

test("appends optional params as query string", async () => {
  let capturedUrl: string | undefined;
  global.fetch = (async (url: any) => {
    capturedUrl = String(url);
    return new Response(JSON.stringify({}), { status: 200 });
  }) as typeof fetch;

  await searchDataSource("edgar", "AAPL", { year: 2024, form: "10-K" });

  assert.ok(capturedUrl?.includes("year=2024"));
  assert.ok(capturedUrl?.includes("form=10-K"));
});

test("throws DatavilleApiError with the API's error message on a non-ok response", async () => {
  global.fetch = (async () => {
    return new Response(JSON.stringify({ error: "rate limit exceeded" }), { status: 429 });
  }) as typeof fetch;

  await assert.rejects(
    () => searchDataSource("wikipedia", "test"),
    (err: unknown) => {
      assert.ok(err instanceof DatavilleApiError);
      assert.equal(err.status, 429);
      assert.equal(err.message, "rate limit exceeded");
      return true;
    }
  );
});

test("throws DatavilleAuthError when the API falls back to anonymous access", async () => {
  // Dataville's auth middleware never rejects: an unrecognised key returns 200
  // with account_state "anonymous" instead of a 401.
  global.fetch = (async () => {
    return new Response(
      JSON.stringify({ status: "success", account_state: "anonymous", data: { title: "Machine learning" } }),
      { status: 200 }
    );
  }) as typeof fetch;

  await assert.rejects(
    () => searchDataSource("wikipedia", "Machine learning"),
    (err: unknown) => {
      assert.ok(err instanceof DatavilleAuthError);
      assert.match(err.message, /not recognised/);
      return true;
    }
  );
});

test("returns results normally when the request is authenticated", async () => {
  global.fetch = (async () => {
    return new Response(
      JSON.stringify({ status: "success", account_state: "authenticated", data: { title: "Machine learning" } }),
      { status: 200 }
    );
  }) as typeof fetch;

  const result = await searchDataSource("wikipedia", "Machine learning");
  assert.equal((result as any).account_state, "authenticated");
});

test("surfaces the API's error message from data.error", async () => {
  // Dataville nests error messages under `data.error`, not at the top level.
  global.fetch = (async () => {
    return new Response(
      JSON.stringify({
        status: "error",
        account_state: "authenticated",
        data: { error: 'No results found for "transformer" in pypi' },
      }),
      { status: 404 }
    );
  }) as typeof fetch;

  await assert.rejects(
    () => searchDataSource("pypi", "transformer"),
    (err: unknown) => {
      assert.ok(err instanceof DatavilleApiError);
      assert.equal(err.message, 'No results found for "transformer" in pypi');
      return true;
    }
  );
});

test("still reads a top-level error field if the API returns one", async () => {
  global.fetch = (async () => {
    return new Response(JSON.stringify({ error: "rate limit exceeded" }), { status: 429 });
  }) as typeof fetch;

  await assert.rejects(() => searchDataSource("wikipedia", "test"), /rate limit exceeded/);
});

test("falls back to a generic error message when the response body isn't JSON", async () => {
  global.fetch = (async () => {
    return new Response("not json", { status: 500 });
  }) as typeof fetch;

  await assert.rejects(
    () => searchDataSource("wikipedia", "test"),
    /Dataville API request failed with status 500/
  );
});

test("queryDataville POSTs JSON with auth headers to /api/v1/query", async () => {
  let capturedUrl: string | undefined;
  let capturedInit: any;
  global.fetch = (async (url: any, init: any) => {
    capturedUrl = String(url);
    capturedInit = init;
    return new Response(JSON.stringify({ status: "success", rows: [] }), { status: 200 });
  }) as typeof fetch;

  await queryDataville("SELECT 1");

  assert.equal(capturedUrl, "https://api.example.test/api/v1/query");
  assert.equal(capturedInit.method, "POST");
  assert.equal(capturedInit.headers.Authorization, "Bearer dataville_test_key");
  assert.equal(capturedInit.headers["Content-Type"], "application/json");
  assert.equal(capturedInit.body, JSON.stringify({ sql: "SELECT 1" }));
});

test("queryDataville reads the top-level message field on errors", async () => {
  global.fetch = (async () =>
    new Response(JSON.stringify({ status: "error", message: "Disallowed operation: COPY" }), {
      status: 400,
    })) as typeof fetch;

  await assert.rejects(
    () => queryDataville("SELECT 1; COPY x TO 'y'"),
    (err: unknown) => {
      assert.ok(err instanceof DatavilleApiError);
      assert.equal(err.status, 400);
      assert.equal(err.message, "Disallowed operation: COPY");
      return true;
    }
  );
});

test("a 401 says the API key was not recognised, not that it is missing", async () => {
  global.fetch = (async () =>
    new Response(
      JSON.stringify({ status: "error", message: "Authentication required. Include your API key in the Authorization header." }),
      { status: 401 }
    )) as typeof fetch;

  await assert.rejects(
    () => queryDataville("SELECT 1"),
    (err: unknown) => {
      assert.ok(err instanceof DatavilleAuthError);
      assert.match(err.message, /not recognised/);
      return true;
    }
  );
});

test("refuses to send the API key to a plain-http base URL", async () => {
  let called = false;
  global.fetch = (async () => {
    called = true;
    return new Response(JSON.stringify({}), { status: 200 });
  }) as typeof fetch;

  for (const baseUrl of ["http://api.dataville.com", "http://evil.example", "ftp://api.example.test", "not a url"]) {
    process.env.DATAVILLE_API_BASE_URL = baseUrl;
    await assert.rejects(() => searchDataSource("wikipedia", "test"), /DATAVILLE_API_BASE_URL/);
    await assert.rejects(() => queryDataville("SELECT 1"), /DATAVILLE_API_BASE_URL/);
  }
  assert.equal(called, false);
});

test("allows plain http for a local backend", async () => {
  global.fetch = (async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as typeof fetch;
  for (const baseUrl of ["http://localhost:5000", "http://127.0.0.1:5000", "http://[::1]:5000"]) {
    process.env.DATAVILLE_API_BASE_URL = baseUrl;
    assert.deepEqual(await searchDataSource("wikipedia", "test"), { ok: true });
  }
});
