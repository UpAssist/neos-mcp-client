import { z } from 'zod';
import { callBridge } from './bridge.js';

const DIMENSIONS_HINT =
  'Content dimensions as an object, e.g. {"language":"nl"} (see "dimensions" in neos_get_site_context for the available values). ' +
  'Dimensions you leave out keep their default value; without this argument the default dimensions are used.';

/**
 * Optional "dimensions" tool argument, shared by all tools that work on node content.
 * `extra` is appended to the description for tool specific behaviour.
 */
export function dimensionsSchema(extra = '') {
  return z.record(z.string()).optional().describe(DIMENSIONS_HINT + (extra ? ' ' + extra : ''));
}

let dimensionSupportConfirmed = false;

/**
 * A bridge without content dimension support ignores the "dimensions" argument and would read or
 * write the default dimensions instead. That is wrong for every call, and for writes it changes
 * the wrong content, so only go ahead when the bridge reports the dimensions it knows.
 */
export async function assertDimensionSupport(): Promise<void> {
  if (dimensionSupportConfirmed) return;
  let context: unknown;
  try {
    context = await callBridge('getSiteContext', 'GET');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Not executed: could not confirm that the bridge supports content dimensions (${reason}).`
    );
  }
  if (!context || typeof context !== 'object' || !Array.isArray((context as { dimensions?: unknown }).dimensions)) {
    throw new Error(
      'Not executed: this bridge does not support content dimensions and would use the default dimensions instead. ' +
      'Update the bridge (upassist/neos-mcp 2.4+ for Neos 9, 1.3+ for Neos 8) or leave out "dimensions".'
    );
  }
  dimensionSupportConfirmed = true;
}

/**
 * Bridge parameters for the "dimensions" argument: nothing when not given, otherwise the
 * dimensions as a JSON string (the bridge accepts it in GET queries and POST bodies alike).
 * Refuses when the bridge has no dimension support.
 */
export async function dimensionsParam(
  dimensions: Record<string, string> | undefined,
  key = 'dimensions'
): Promise<Record<string, string>> {
  if (!dimensions || Object.keys(dimensions).length === 0) return {};
  await assertDimensionSupport();
  return { [key]: JSON.stringify(dimensions) };
}

/** Test helper: forget a confirmed bridge so the next call checks again. */
export function resetDimensionSupport(): void {
  dimensionSupportConfirmed = false;
}
