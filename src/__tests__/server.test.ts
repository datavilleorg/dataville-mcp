import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../server.js";
import { DATAVILLE_SOURCES } from "../sources.js";

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
    ["list_dataville_sources", "search_dataville"]
  );
  for (const tool of tools) {
    for (const hint of ["readOnlyHint", "destructiveHint", "idempotentHint", "openWorldHint"] as const) {
      assert.equal(typeof tool.annotations?.[hint], "boolean", `${tool.name} is missing ${hint}`);
    }
    assert.equal(tool.annotations?.readOnlyHint, true, `${tool.name} should be read-only`);
    assert.equal(tool.annotations?.destructiveHint, false, `${tool.name} should not be destructive`);
  }
});

test("list_dataville_sources returns the bundled source list", async () => {
  const client = await connectClient();
  const result = await client.callTool({ name: "list_dataville_sources", arguments: {} });
  assert.notEqual(result.isError, true);
  assert.deepEqual(JSON.parse(textOf(result)), DATAVILLE_SOURCES);
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
