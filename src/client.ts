const DEFAULT_BASE_URL = "https://api.dataville.com";
// Keep in sync with package.json version (enforced by a test).
export const VERSION = "0.1.3";
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
  return { apiKey, baseUrl };
}

export async function searchDataSource(
  source: string,
  keywords: string,
  params?: Record<string, string | number | boolean>
): Promise<unknown> {
  const { apiKey, baseUrl } = getConfig();

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

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    // Errors come back as { status: "error", data: { error: "..." } }. Those
    // messages are useful to the model — "no results for X", or the full list
    // of valid sources — so prefer them over a bare status code.
    const apiMessage =
      body && typeof body === "object"
        ? (body as { data?: { error?: unknown } }).data?.error ??
          (body as { error?: unknown }).error
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
        "Check the key in your MCP client config, or generate a new one at https://app.dataville.com/api-keys."
    );
  }

  return body;
}
