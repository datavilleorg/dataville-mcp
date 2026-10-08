# dataville-mcp

[![Glama MCP server score](https://glama.ai/mcp/servers/datavilleorg/dataville-mcp/badges/score.svg)](https://glama.ai/mcp/servers/datavilleorg/dataville-mcp)
[![M8ven Score](https://m8ven.ai/badge/mcp/datavilleorg-dataville-mcp-u1eou7?v=6abe1c0b98731d0af6f8978f1b3778e6)](https://m8ven.ai/mcp/datavilleorg-dataville-mcp-u1eou7?s=readme)
[![npm](https://img.shields.io/npm/v/@dataville/dataville-mcp)](https://www.npmjs.com/package/@dataville/dataville-mcp)
[![CI](https://github.com/datavilleorg/dataville-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/datavilleorg/dataville-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

[![Install in Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=dataville&config=eyJ1cmwiOiJodHRwczovL2FwaS5kYXRhdmlsbGUuY29tL21jcCJ9)
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Dataville-0098FF?logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=dataville&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fapi.dataville.com%2Fmcp%22%7D)

MCP server exposing Dataville's data source API as tools for MCP clients (Claude Desktop, Claude Code, etc.).

[Dataville](https://dataville.com) is a unified REST API over ten public datasets —
Wikipedia, arXiv, Project Gutenberg, US Census, USDA FoodData, Papers with Code,
SEC EDGAR, OpenAlex, PyPI, and Stack Exchange — behind one interface and one API
key, with CSV/Parquet export and SQL query support. This package lets an MCP
client search any of those sources as a tool call.

Requires a Dataville API key — get one from the [Dataville dashboard](https://app.dataville.com/api-keys).

## Tools

| Tool | What it does |
| --- | --- |
| `list_dataville_sources` | Every source, with the SQL tables (if any) you can query for it. |
| `describe_dataville_source` | One source's keyword format, a working example, and its tables' columns: `{ source }`. |
| `search_dataville` | Look one thing up by keywords and get the best match: `{ source, keywords, summary? }`. |
| `query_dataville` | Read-only SQL `SELECT` over the stored tables for lists, filters, counts, joins, and paging with `LIMIT`/`OFFSET`: `{ sql }`. |

All four only read data. `query_dataville` covers every stored source except
`census` and `news`, which are fetched live per search. It returns at most
1,000 rows per call and is billed per row returned. It reads Dataville's stored
copy: some sources are loaded in bulk, others only hold records fetched before,
so for one specific item `search_dataville` is the reliable route.

## What you can ask

Once connected, ask in plain language and the client picks the source:

- "Find an arXiv paper on retrieval-augmented generation and summarize it."
- "What did Apple report in its latest SEC filing?"
- "What's the median household income in Travis County, Texas, per the US Census?"
- "How much protein is in 100 g of cooked lentils, according to USDA FoodData?"
- "Look up the `requests` package on PyPI — what's the latest version and license?"
- "List ten Project Gutenberg books by Jane Austen, with their subjects."
- "List five USDA FoodData entries with 'lentils' in the name, with their categories."

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
Cursor and VS Code users can use the install buttons at the top of this page.
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

### Where your API key goes

The server reads `DATAVILLE_API_KEY` from its environment and sends it only as
an `Authorization: Bearer` header to `DATAVILLE_API_BASE_URL`, which is
`https://api.dataville.com` unless you change it. It never logs the key or sends
it anywhere else. The base URL must use `https`. Plain `http` is accepted only
for `localhost`, `127.0.0.1` and `[::1]`, so the key never crosses the network
unencrypted.

All four tools are read-only: they search and query Dataville and never create,
change or delete anything.

### Running from source

```bash
git clone https://github.com/datavilleorg/dataville-mcp.git
cd dataville-mcp
npm install
npm run build
```

## Check that it works

Ask your client one of these. Each answer is checkable on purpose — a model that
skipped the tool and answered from memory sounds just as confident, so a reply
on its own proves nothing.

| Ask | What proves it |
| --- | --- |
| `Which data sources does Dataville have?` | Calls `list_dataville_sources` and names all eleven. |
| `Using Dataville, what is the latest version of the requests package on PyPI?` | A version you can confirm on pypi.org — and it moves, so it can't come from memory. |
| `Using Dataville, get the latest SEC filing for AAPL and its revenue.` | A form type, filing date, revenue figure, and a sec.gov link to open. |
| `Using Dataville, how much protein is in 100g of uncooked quinoa?` | The exact USDA figure, 14.1 g per 100 g. |
| `Using Dataville SQL, list 5 Project Gutenberg books by Mark Twain.` | Calls `query_dataville` and returns titles with Gutenberg IDs you can open at gutenberg.org/ebooks/<id>. |

Clients show when a tool ran. If you don't see that, say "use dataville" in the
prompt to make it explicit, and check the answer against the source.

## Development

```bash
npm run dev    # tsx watch
npm test       # node test runner
npm run build  # tsc
```

## Releasing

Publishes run from CI. npm uses trusted publishing (OIDC), so no npm token is
stored; the MCP Registry step signs in with the `MCP_PRIVATE_KEY` repo secret.
To cut a release: bump the version, update `CHANGELOG.md`, then publish a GitHub
Release for the new tag. The `Publish` workflow builds, tests, and publishes to npm,
then publishes `server.json` to the [MCP Registry](https://registry.modelcontextprotocol.io)
(its version is set from `package.json`, so don't bump it by hand).

The registry name `com.dataville/dataville-mcp` is authorized by a DNS TXT record
on the `dataville.com` apex (`v=MCPv1; k=ed25519; p=<public key>`), checked
against the Ed25519 private key in the `MCP_PRIVATE_KEY` repo secret (hex). If the
`mcp-registry` job fails at login, check that record and secret, then re-run just
that job.
