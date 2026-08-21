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

This package is a local (stdio) MCP server: the client launches it on your
machine via `npx`. If you don't need it running locally, connecting to
Dataville's hosted endpoint instead takes one line and no install.

### Hosted, in one line (no install)

Dataville also serves MCP directly over HTTP, so a client can connect without
running anything locally — no Node, no config file, no restart:

```bash
claude mcp add --transport http dataville https://api.dataville.com/mcp
```

That works with no credentials at all (anonymous limits). Add
`--header "Authorization: Bearer dataville_your_key_here"` for the full quota.
Other clients take the same URL; the app's Integrations page has the exact
snippet for each. Use the hosted endpoint unless you specifically want to pin a
version or work offline — the rest of this section covers that local setup.

### Prerequisites

- **Node.js** (LTS) installed — this is what runs `npx`. Without it the server
  fails to start. Check with `node --version`.
- A **Dataville API key** — get one from https://app.dataville.com/api-keys.

The config block is the same everywhere; only *where* you put it differs:

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

### Claude Desktop

1. Open **Settings → Developer → Edit Config**. This opens `claude_desktop_config.json`:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
2. Add the block above (merge into `mcpServers` if the file already has one),
   with your real key.
3. **Fully quit and reopen** Claude Desktop — quit from the menu bar / system
   tray, not just closing the window.
4. The dataville tools now appear under the tools icon in the chat box, and
   Settings → Developer shows `dataville` running.

Note: the server appears as **tools**, not in the **Connectors** directory —
that directory only lists remote (hosted) connectors and will not find a local
server. Ask naturally ("get Apple's latest revenue from dataville") and the
client calls the tool.

### Claude Code

```bash
claude mcp add dataville -e DATAVILLE_API_KEY=dataville_your_key_here -- npx -y @dataville/dataville-mcp
```

Restart the session so the tools load. Add `-s user` to make it available in
every project instead of just the current one.

### Configuration

`DATAVILLE_API_BASE_URL` is optional and defaults to `https://api.dataville.com`;
set it to `http://localhost:5000` to point at a local backend during development.

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
