/**
 * HTTP client to the UpAssist.Neos.Mcp bridge endpoint.
 *
 * Environment variables:
 *   NEOS_MCP_URL    — Base URL, e.g. http://localhost:8081 or https://mysite.nl
 *   NEOS_MCP_TOKEN  — Bearer token matching NEOS_MCP_BRIDGE_TOKEN on the server
 */

const BASE_URL = (process.env.NEOS_MCP_URL ?? 'http://localhost:8081').replace(/\/$/, '');
const TOKEN = process.env.NEOS_MCP_TOKEN ?? '';

function getHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

export async function callBridge(
  action: string,
  method: 'GET' | 'POST',
  params: Record<string, unknown> = {}
): Promise<unknown> {
  let url = `${BASE_URL}/neos/mcp/${action}`;
  let body: string | undefined;

  if (method === 'GET') {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  } else {
    body = JSON.stringify(params);
  }

  const response = await fetch(url, {
    method,
    headers: getHeaders(),
    body,
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Bridge returned non-JSON response (${response.status}): ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    const err = data as { error?: string };
    throw new Error(`Bridge error ${response.status}: ${err?.error ?? text.slice(0, 200)}`);
  }

  return data;
}
