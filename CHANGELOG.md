# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `describe_dataville_source` tool: a source's keyword format, an example that
  returns a result, and the SQL tables and columns it has. Static; makes no
  network calls.
- `query_dataville` tool: read-only SQL `SELECT` (DuckDB) over Dataville's
  stored tables via `POST /api/v1/query`, for lists, filters, aggregates,
  joins across sources, and paging with `LIMIT`/`OFFSET`. Up to 1,000 rows per
  call; billed per row.
- `search_dataville` takes an explicit `summary` flag to truncate `body`.
- Server `instructions` telling clients which tool to use for what.
- Integration test checking every declared SQL table and column against the
  live query engine (uses `LIMIT 0`, so it is not billed).

### Changed
- `list_dataville_sources` now includes each source's SQL table names.
- `search_dataville` describes what it actually returns (the single best
  match) and points to `query_dataville` for multi-row results.
- A 401 from the API now raises "API key not recognised" rather than the API's
  "include your API key" message, since a key is always sent.

### Security
- Upgraded `@modelcontextprotocol/sdk` to 1.32.1 (GHSA-6qxp-vccf-f47h, high)
  and refreshed `fast-uri`, `hono` and `ip-address` past their advisories.
- `DATAVILLE_API_BASE_URL` must use https; plain http is refused except for
  localhost, so the API key is never sent unencrypted.
- Added `SECURITY.md`, a README section on where the API key is sent, and
  Dependabot for npm and GitHub Actions updates.

## [0.1.6] - 2026-10-08

### Added
- Both tools declare all four MCP annotation hints (`readOnlyHint`,
  `destructiveHint`, `idempotentHint`, `openWorldHint`), so clients can tell
  they only read data and never change anything.
- Tests that connect a client to the server in-process and call each tool by
  name, plus one asserting every tool carries all four hints.

### Changed
- Server setup moved to `src/server.ts` (`createServer()`); `src/index.ts`
  only wires it to stdio.
- README shows the M8ven trust score badge.

## [0.1.5] - 2026-10-08

### Added
- Listed in the official MCP Registry as `com.dataville/dataville-mcp`
  (`server.json` describes both the npm package and the hosted endpoint).
  `package.json` carries the matching `mcpName`, and the `Publish` workflow
  publishes each release to the registry after npm.

### Fixed
- `search_dataville` rejects a source or keywords of exactly `.` or `..`.
  `encodeURIComponent` leaves dots alone and URL resolution collapses those
  segments, so source `..` sent the request (with the user's API key) to
  `/<keywords>` on the API instead of a data route.

### Changed
- `news` source description now states it is a historical archive, not live
  news, so clients don't expect current headlines.
- README now leads with Dataville's hosted MCP endpoint, which connects in one
  line with no install; the local stdio setup is documented as the option for
  pinning a version or working offline.
- README Setup rewritten with per-client steps (Claude Desktop config-file
  location + quit/reopen, Claude Code `claude mcp add`), a prerequisites section
  (Node.js, API key), and a note that the server appears as tools rather than in
  the Connectors directory.

## [0.1.4] - 2026-08-21

### Changed
- README now describes Dataville and lists all ten data sources reachable
  through the server. Documentation only; no functional changes.

## [0.1.3] - 2026-08-21

### Fixed
- The `paperswithcode` source was listed as `pwc`, a name the API does not
  accept — that source was unreachable.
- API error messages are now surfaced to the client. They are nested under
  `data.error`, but were being read from the top level, so every API error was
  replaced with a bare "request failed with status N". Callers now see useful
  messages such as `No results found for "x" in pypi` and the full list of
  valid sources on an unknown-source error.

### Added
- `news` (front-page headlines) to the source list; it was supported by the API
  but undocumented here.
- `npm run test:integration` — live checks that every declared source name is
  accepted by the API. Requires `DATAVILLE_API_KEY`; skipped without one.

## [0.1.2] - 2026-08-21

### Fixed
- An unrecognised `DATAVILLE_API_KEY` now raises a clear error instead of
  silently returning anonymous-tier results. Dataville's API accepts unknown
  keys and falls back to anonymous access (HTTP 200), which meant a typo'd or
  revoked key looked like it was working while applying the much lower anonymous
  rate limit and not attributing usage to the account.

## [0.1.1] - 2026-08-21

### Added
- `User-Agent: dataville-mcp/<version>` header on API requests, so MCP-originated
  traffic is distinguishable in Dataville's query logs.
- Test suite covering client request construction, auth/error handling, and the
  source registry.
- CI workflow (build + test on PRs) and a release-triggered publish workflow using
  npm trusted publishing.

### Fixed
- Compiled test files are no longer included in the published package.

## [0.1.0] - 2026-08-17

### Added
- Initial release.
- `search_dataville` tool — query a Dataville data source by keywords.
- `list_dataville_sources` tool — list the supported data sources.
- API key authentication via `DATAVILLE_API_KEY`, with `DATAVILLE_API_BASE_URL`
  override for local development.
