/**
 * HTTP client to the UpAssist.Neos.Mcp bridge endpoint.
 *
 * Environment variables:
 *   NEOS_MCP_URL    — Base URL, e.g. http://localhost:8081 or https://mysite.nl
 *   NEOS_MCP_TOKEN  — Bearer token matching NEOS_MCP_BRIDGE_TOKEN on the server
 *
 * Supports both v1 (Neos 8) and v2 (Neos 9) bridge API versions.
 * API version is auto-detected on the first getSiteContext call.
 */

const BASE_URL = (process.env.NEOS_MCP_URL ?? 'http://localhost:8081').replace(/\/$/, '');
const TOKEN = process.env.NEOS_MCP_TOKEN ?? '';

let detectedApiVersion: 1 | 2 | null = null;
let versionDetectionPromise: Promise<void> | null = null;

export function setApiVersion(version: 1 | 2): void {
  detectedApiVersion = version;
}

export function getApiVersion(): 1 | 2 {
  return detectedApiVersion ?? 1;
}

/**
 * Auto-detect API version by calling getSiteContext.
 * Cached after first successful detection; concurrent callers share the same request.
 */
async function ensureApiVersion(): Promise<void> {
  if (detectedApiVersion !== null) return;
  if (versionDetectionPromise) return versionDetectionPromise;
  versionDetectionPromise = (async () => {
    try {
      const data = await callBridge('getSiteContext', 'GET') as Record<string, unknown>;
      detectedApiVersion = (data && data.apiVersion === 2) ? 2 : 1;
    } catch {
      detectedApiVersion = 1; // fallback to v1 on error
    } finally {
      versionDetectionPromise = null;
    }
  })();
  return versionDetectionPromise;
}

/**
 * Build the correct bridge parameter name for a node identifier.
 * v1 (Neos 8) uses nodePath/contextPath, v2 (Neos 9) uses nodeAggregateId.
 * Auto-detects the API version on first use if not yet known.
 */
export async function nodeIdParam(key: 'nodePath' | 'contextPath' | 'parentPath' | 'newParentPath', nodeId: string): Promise<Record<string, string>> {
  await ensureApiVersion();
  if (detectedApiVersion === 2) {
    const v2Keys: Record<string, string> = {
      nodePath: 'nodeAggregateId',
      contextPath: 'nodeAggregateId',
      parentPath: 'parentNodeAggregateId',
      newParentPath: 'newParentId',
    };
    return { [v2Keys[key]]: nodeId };
  }
  return { [key]: nodeId };
}

/**
 * Build sibling reference params for move/insert operations.
 */
export function siblingParam(key: 'insertBefore' | 'insertAfter', siblingId: string): Record<string, string> {
  // Same parameter names for both v1 and v2
  return { [key]: siblingId };
}

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
