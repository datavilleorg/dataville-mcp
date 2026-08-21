import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { searchDataSource, DatavilleApiError } from "../client.js";

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

test("falls back to a generic error message when the response body isn't JSON", async () => {
  global.fetch = (async () => {
    return new Response("not json", { status: 500 });
  }) as typeof fetch;

  await assert.rejects(
    () => searchDataSource("wikipedia", "test"),
    /Dataville API request failed with status 500/
  );
});
