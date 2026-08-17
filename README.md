# dataville-mcp

MCP server exposing Dataville's data source API as tools for MCP clients (Claude Desktop, Claude Code, etc.).

Requires a Dataville API key — get one from the [Dataville dashboard](https://app.dataville.com/api-keys).

## Tools

- `list_dataville_sources` — lists the data sources available via `search_dataville`.
- `search_dataville` — query a data source: `{ source, keywords, params? }`.

## Setup

Add this to your MCP client config (Claude Code / Claude Desktop), with `DATAVILLE_API_KEY` set to your own key:

```json
{
  "mcpServers": {
    "dataville": {
      "command": "npx",
      "args": ["-y", "@dataville/dataville-mcp"],
      "env": {
        "DATAVILLE_API_KEY": "dataville_your_key_here"
      }
    }
  }
}
```

No install step needed — `npx` fetches and runs the package on demand.

`DATAVILLE_API_BASE_URL` is optional and defaults to `https://api.dataville.com`; set it to `http://localhost:5000` to point at a local backend during development.

### Running from source

```bash
git clone https://github.com/datavilleorg/dataville-mcp.git
cd dataville-mcp
npm install
npm run build
```

## Development

```bash
npm run dev   # tsx watch
```
