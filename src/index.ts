#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main() {
  const transport = new StdioServerTransport();
  await createServer().connect(transport);
}

main().catch((error) => {
  console.error("Fatal error starting Dataville MCP server:", error);
  process.exit(1);
});
