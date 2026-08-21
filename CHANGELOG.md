# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
