const DEFAULT_BASE_URL = "https://api.dataville.com";
const USER_AGENT = "dataville-mcp/0.1.0";

export class DatavilleApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "DatavilleApiError";
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
    const message =
      (body && typeof body === "object" && "error" in body && String((body as { error: unknown }).error)) ||
      `Dataville API request failed with status ${response.status}`;
    throw new DatavilleApiError(response.status, message);
  }

  return body;
}
