#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchDataSource, DatavilleApiError } from "./client.js";
import { DATAVILLE_SOURCES } from "./sources.js";

const server = new McpServer({
  name: "dataville-mcp-server",
  version: "0.1.0",
});

server.registerTool(
  "list_dataville_sources",
  {
    title: "List Dataville data sources",
    description: "List the data sources available through Dataville's search_dataville tool.",
    inputSchema: {},
  },
  async () => ({
    content: [{ type: "text", text: JSON.stringify(DATAVILLE_SOURCES, null, 2) }],
  })
);

server.registerTool(
  "search_dataville",
  {
    title: "Search a Dataville data source",
    description:
      "Query one of Dataville's data sources (see list_dataville_sources for valid source names) with a keyword string and optional query params.",
    inputSchema: {
      source: z.string().describe("Data source name, e.g. 'wikipedia', 'arxiv', 'edgar'"),
      keywords: z.string().describe("Search keywords or identifier for the query"),
      params: z
        .record(z.union([z.string(), z.number(), z.boolean()]))
        .optional()
        .describe("Optional additional query parameters"),
    },
  },
  async ({ source, keywords, params }) => {
    try {
      const result = await searchDataSource(source, keywords, params);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      const message = error instanceof DatavilleApiError ? error.message : String(error);
      return { content: [{ type: "text", text: message }], isError: true };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error starting Dataville MCP server:", error);
  process.exit(1);
});
