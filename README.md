# dataville-mcp

MCP server exposing Dataville's data source API as tools for MCP clients (Claude Desktop, Claude Code, etc.).

Requires a Dataville API key — get one from the [Dataville dashboard](https://app.dataville.com/api-keys).

## Tools

- `list_dataville_sources` — lists the data sources available via `search_dataville`.
- `search_dataville` — query a data source: `{ source, keywords, params? }`.

## Setup

```bash
git clone https://github.com/datavilleorg/dataville-mcp.git
cd dataville-mcp
npm install
npm run build
```

Set `DATAVILLE_API_KEY` in your MCP client config, e.g. for Claude Code / Claude Desktop:

```json
{
  "mcpServers": {
    "dataville": {
      "command": "node",
      "args": ["/absolute/path/to/dataville-mcp/dist/index.js"],
      "env": {
        "DATAVILLE_API_KEY": "dataville_your_key_here"
      }
    }
  }
}
```

Once published to npm, this will simplify to running via `npx dataville-mcp` with no clone/build step.

`DATAVILLE_API_BASE_URL` is optional and defaults to `https://api.dataville.com`; set it to `http://localhost:5000` to point at a local backend during development.

## Development

```bash
npm run dev   # tsx watch
```
