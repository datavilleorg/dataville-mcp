import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../server.js";
import { DATAVILLE_SOURCE_DETAILS } from "../sources.js";

const ORIGINAL_ENV = { ...process.env };
const originalFetch = global.fetch;

async function connectClient() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createServer().connect(serverTransport);
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(clientTransport);
  return client;
}

function textOf(result: Awaited<ReturnType<Client["callTool"]>>) {
  const content = result.content as Array<{ type: string; text: string }>;
  return content[0].text;
}

beforeEach(() => {
  process.env.DATAVILLE_API_KEY = "dataville_test_key";
  process.env.DATAVILLE_API_BASE_URL = "https://api.example.test";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  global.fetch = originalFetch;
});

test("every tool declares all four annotation hints as booleans", async () => {
  const client = await connectClient();
  const { tools } = await client.listTools();
  assert.deepEqual(
    tools.map((t) => t.name).sort(),
    ["describe_dataville_source", "list_dataville_sources", "query_dataville", "search_dataville"]
  );
  for (const tool of tools) {
    for (const hint of ["readOnlyHint", "destructiveHint", "idempotentHint", "openWorldHint"] as const) {
      assert.equal(typeof tool.annotations?.[hint], "boolean", `${tool.name} is missing ${hint}`);
    }
    assert.equal(tool.annotations?.readOnlyHint, true, `${tool.name} should be read-only`);
    assert.equal(tool.annotations?.destructiveHint, false, `${tool.name} should not be destructive`);
  }
});

test("list_dataville_sources returns every source with its SQL table names", async () => {
  const client = await connectClient();
  const result = await client.callTool({ name: "list_dataville_sources", arguments: {} });
  assert.notEqual(result.isError, true);
  const listed = JSON.parse(textOf(result));
  assert.deepEqual(
    listed.map((s: any) => s.name),
    DATAVILLE_SOURCE_DETAILS.map((s) => s.name)
  );
  const pwc = listed.find((s: any) => s.name === "paperswithcode");
  assert.deepEqual(pwc.sql_tables, ["pwc_methods", "pwc_datasets"]);
  const census = listed.find((s: any) => s.name === "census");
  assert.deepEqual(census.sql_tables, []);
});

test("describe_dataville_source returns keywords guidance and table columns", async () => {
  const client = await connectClient();
  const result = await client.callTool({ name: "describe_dataville_source", arguments: { source: "EDGAR" } });
  assert.notEqual(result.isError, true);
  const described = JSON.parse(textOf(result));
  assert.equal(described.name, "edgar");
  assert.equal(described.search.example.source, "edgar");
  assert.ok(described.sql_tables[0].columns.includes("form_type"));
  assert.match(described.example_sql, /FROM edgar/);
});

test("describe_dataville_source says a search-only source has no tables", async () => {
  const client = await connectClient();
  const result = await client.callTool({ name: "describe_dataville_source", arguments: { source: "news" } });
  const described = JSON.parse(textOf(result));
  assert.deepEqual(described.sql_tables, []);
  assert.match(described.note, /search_dataville/);
});

test("describe_dataville_source names the valid sources for an unknown one", async () => {
  const client = await connectClient();
  const result = await client.callTool({ name: "describe_dataville_source", arguments: { source: "nope" } });
  assert.equal(result.isError, true);
  assert.match(textOf(result), /Unknown source "nope".*wikipedia/);
});

test("search_dataville calls the API and returns its body", async () => {
  let capturedUrl: string | undefined;
  global.fetch = (async (url: any) => {
    capturedUrl = String(url);
    return new Response(JSON.stringify({ results: [1, 2] }), { status: 200 });
  }) as typeof fetch;

  const client = await connectClient();
  const result = await client.callTool({
    name: "search_dataville",
    arguments: { source: "arxiv", keywords: "transformers", params: { limit: 2 } },
  });

  assert.notEqual(result.isError, true);
  assert.ok(capturedUrl?.startsWith("https://api.example.test/arxiv/transformers"));
  assert.ok(capturedUrl?.includes("limit=2"));
  assert.deepEqual(JSON.parse(textOf(result)), { results: [1, 2] });
});

test("search_dataville sends summary=true when asked", async () => {
  let capturedUrl: string | undefined;
  global.fetch = (async (url: any) => {
    capturedUrl = String(url);
    return new Response(JSON.stringify({}), { status: 200 });
  }) as typeof fetch;

  const client = await connectClient();
  await client.callTool({
    name: "search_dataville",
    arguments: { source: "wikipedia", keywords: "Moon", summary: true },
  });
  assert.ok(capturedUrl?.includes("summary=true"));
});

test("query_dataville posts the SQL and returns the rows", async () => {
  let captured: { url: string; init: any } | undefined;
  global.fetch = (async (url: any, init: any) => {
    captured = { url: String(url), init };
    return new Response(JSON.stringify({ status: "success", row_count: 1, rows: [{ name: "requests" }] }), {
      status: 200,
    });
  }) as typeof fetch;

  const client = await connectClient();
  const sql = "SELECT name FROM pypi LIMIT 1";
  const result = await client.callTool({ name: "query_dataville", arguments: { sql } });

  assert.notEqual(result.isError, true);
  assert.equal(captured?.url, "https://api.example.test/api/v1/query");
  assert.equal(captured?.init.method, "POST");
  assert.deepEqual(JSON.parse(captured?.init.body), { sql });
  assert.deepEqual(JSON.parse(textOf(result)).rows, [{ name: "requests" }]);
});

test("query_dataville surfaces the API's SQL error as a tool error", async () => {
  global.fetch = (async () =>
    new Response(JSON.stringify({ status: "error", message: "Only SELECT statements are allowed." }), {
      status: 400,
    })) as typeof fetch;

  const client = await connectClient();
  const result = await client.callTool({ name: "query_dataville", arguments: { sql: "DROP TABLE pypi" } });
  assert.equal(result.isError, true);
  assert.equal(textOf(result), "Only SELECT statements are allowed.");
});

test("search_dataville reports client errors as a tool error", async () => {
  delete process.env.DATAVILLE_API_KEY;
  const client = await connectClient();
  const result = await client.callTool({
    name: "search_dataville",
    arguments: { source: "wikipedia", keywords: "test" },
  });
  assert.equal(result.isError, true);
  assert.match(textOf(result), /DATAVILLE_API_KEY is not set/);
});
