import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { callBridge, nodeIdParam } from '../bridge.js';
import { dimensionsParam } from '../dimensions.js';

export function registerCreateNodeVariant(server: McpServer): void {
  server.tool(
    'neos_create_node_variant',
    'Create a variant of a page or content node in another content dimension (for example a translation when the dimension is a language), starting from the node as it exists in the source dimensions. ' +
    'Use mode "copy" to start from the source content, or "empty" for a variant without properties and content. ' +
    'The parent has to exist in the target dimensions first: create variants top-down. ' +
    'Writes to the mcp workspace. Needed before you can change a node that is only shown in the target dimensions through a fallback.',
    {
      node_id: z.string().describe(
        'Node identifier — use nodeAggregateId (Neos 9) or contextPath/path (Neos 8)'
      ),
      dimensions: z.record(z.string()).describe(
        'Target dimensions the variant is created in, e.g. {"language":"nl"}, several dimensions can be combined (see "dimensions" in neos_get_site_context)'
      ),
      source_dimensions: z.record(z.string()).optional().describe(
        'Dimensions of the node to start from. Defaults to the default dimensions.'
      ),
      mode: z.enum(['copy', 'empty']).default('copy').describe(
        '"copy": copy properties and content from the source. "empty": no properties (except the URL segment) and no content.'
      ),
      workspace: z.string().default('mcp').describe('Draft workspace name'),
    },
    async ({ node_id, dimensions, source_dimensions, mode, workspace }) => {
      const data = await callBridge('createNodeVariant', 'POST', {
        ...await nodeIdParam('contextPath', node_id),
        ...await dimensionsParam(dimensions),
        ...await dimensionsParam(source_dimensions, 'sourceDimensions'),
        mode,
        workspace,
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
