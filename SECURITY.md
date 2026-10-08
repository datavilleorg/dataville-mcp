# Security policy

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub's
[security advisory form](https://github.com/datavilleorg/dataville-mcp/security/advisories/new)
rather than a public issue. We aim to acknowledge reports within three business
days.

## Supported versions

Fixes are released for the latest published version of
`@dataville/dataville-mcp`.

## Credentials

The server's only secret is `DATAVILLE_API_KEY`. It is sent only to
`DATAVILLE_API_BASE_URL` (default `https://api.dataville.com`), and only over
https unless that URL points at localhost. See
[Where your API key goes](README.md#where-your-api-key-goes).
