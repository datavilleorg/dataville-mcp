# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- `news` source description now states it is a historical archive, not live
  news, so clients don't expect current headlines.

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
