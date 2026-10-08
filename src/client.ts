const DEFAULT_BASE_URL = "https://api.dataville.com";
// Keep in sync with package.json version (enforced by a test).
export const VERSION = "0.1.6";
const USER_AGENT = `dataville-mcp/${VERSION}`;

export class DatavilleApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "DatavilleApiError";
  }
}

/**
 * Raised when the API accepted the request but did not recognise our API key.
 *
 * Dataville's auth middleware never rejects outright — an unrecognised key
 * falls through to anonymous access, which still returns data but under the
 * much lower anonymous rate limit and without attributing usage to the
 * account. Left unchecked that failure is invisible inside an MCP client, so
 * we surface it explicitly instead of returning results that look fine.
 */
export class DatavilleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatavilleAuthError";
  }
}

function getConfig() {
  const apiKey = process.env.DATAVILLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DATAVILLE_API_KEY is not set. Generate an API key from the Dataville dashboard and set it in your MCP client config."
    );
  }
  const baseUrl = process.env.DATAVILLE_API_BASE_URL || DEFAULT_BASE_URL;
  assertSafeBaseUrl(baseUrl);
  return { apiKey, baseUrl };
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Every request carries the API key, so refuse a base URL that would send it
 * in cleartext. Plain http is allowed only for a local backend.
 */
function assertSafeBaseUrl(baseUrl: string) {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error(`DATAVILLE_API_BASE_URL "${baseUrl}" is not a valid URL.`);
  }
  if (url.protocol === "https:") return;
  if (url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname)) return;
  throw new Error(
    `DATAVILLE_API_BASE_URL must use https (plain http is allowed only for localhost), got "${baseUrl}". ` +
      "Your API key is sent with every request, so it is not sent over an unencrypted connection."
  );
}

export async function searchDataSource(
  source: string,
  keywords: string,
  params?: Record<string, string | number | boolean>
): Promise<unknown> {
  const { apiKey, baseUrl } = getConfig();

  // encodeURIComponent leaves "." alone, and URL resolution collapses a "." or
  // ".." segment — so source ".." would send the user's key to /<keywords>
  // instead of a data route.
  for (const [name, value] of [["source name", source], ["search term", keywords]] as const) {
    if (value === "." || value === "..") {
      throw new Error(`"${value}" is not a valid ${name}. Use list_dataville_sources to see valid source names.`);
    }
  }

  const url = new URL(`/${encodeURIComponent(source)}/${encodeURIComponent(keywords)}`, baseUrl);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": USER_AGENT,
    },
  });

  return readResponse(response);
}

/**
 * Run a read-only SQL SELECT against Dataville's stored copy of its sources
 * (DuckDB over the tables listed by describe_dataville_source). The API
 * rejects anything but SELECT, caps results at 1,000 rows, and times out after
 * 30 seconds; it bills per row returned.
 */
export async function queryDataville(sql: string): Promise<unknown> {
  const { apiKey, baseUrl } = getConfig();

  const response = await fetch(new URL("/api/v1/query", baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": USER_AGENT,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });

  return readResponse(response);
}

const FIX_KEY_HINT =
  "Check the key in your MCP client config, or generate a new one at https://app.dataville.com/api-keys.";

async function readResponse(response: Response): Promise<unknown> {
  const body = await response.json().catch(() => undefined);

  // SQL queries need an account, so an unrecognised key gets a 401 there
  // rather than the anonymous fallback search uses. The API's own message
  // ("include your API key") would be misleading — we did include one.
  if (response.status === 401) {
    throw new DatavilleAuthError(`Your DATAVILLE_API_KEY was not recognised. ${FIX_KEY_HINT}`);
  }

  if (!response.ok) {
    // Search errors come back as { status: "error", data: { error: "..." } },
    // query errors as { status: "error", message: "..." }. Those messages are
    // useful to the model — "no results for X", the list of valid sources, or
    // the SQL error — so prefer them over a bare status code.
    const apiMessage =
      body && typeof body === "object"
        ? (body as { data?: { error?: unknown } }).data?.error ??
          (body as { error?: unknown }).error ??
          (body as { message?: unknown }).message
        : undefined;
    const message =
      typeof apiMessage === "string" && apiMessage.length > 0
        ? apiMessage
        : `Dataville API request failed with status ${response.status}`;
    throw new DatavilleApiError(response.status, message);
  }

  // We always send an API key, so an "anonymous" account state means the key
  // was not accepted. Fail loudly rather than silently serving anonymous-tier
  // results that are neither attributed nor billed to the user's account.
  if (
    body &&
    typeof body === "object" &&
    (body as { account_state?: unknown }).account_state === "anonymous"
  ) {
    throw new DatavilleAuthError(
      "Your DATAVILLE_API_KEY was not recognised, so this request fell back to anonymous access " +
        "(much lower rate limits, and usage is not attributed to your account). " +
        FIX_KEY_HINT
    );
  }

  return body;
}
