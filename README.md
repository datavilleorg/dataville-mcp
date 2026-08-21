# dataville-mcp

MCP server exposing Dataville's data source API as tools for MCP clients (Claude Desktop, Claude Code, etc.).

[Dataville](https://dataville.com) is a unified REST API over ten public datasets —
Wikipedia, arXiv, Project Gutenberg, US Census, USDA FoodData, Papers with Code,
SEC EDGAR, OpenAlex, PyPI, and Stack Exchange — behind one interface and one API
key, with CSV/Parquet export and SQL query support. This package lets an MCP
client search any of those sources as a tool call.

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
npm run dev    # tsx watch
npm test       # node test runner
npm run build  # tsc
```

## Releasing

Publishes run from CI via npm trusted publishing (OIDC) — no tokens are stored.
To cut a release: bump the version, update `CHANGELOG.md`, then publish a GitHub
Release for the new tag. The `Publish` workflow builds, tests, and publishes to npm.
