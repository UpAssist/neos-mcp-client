import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge, nodeIdParam } from '../bridge.js';

export function registerCreateContentNode(server: McpServer): void {
  server.tool(
    'neos_create_content_node',
    'Create a new content element inside a page\'s content collection. Call neos_get_site_context first if you have not already done so this session. Always writes to the mcp workspace.',
    {
      parent_id: z.string().describe(
        'Parent node identifier — the content collection to add to. Use nodeAggregateId (Neos 9) or path (Neos 8).'
      ),
      node_type: z.string().describe(
        'Node type name, e.g. UpAssist.Site:Content.Headline'
      ),
      properties: z.record(z.unknown()).default({}).describe(
        'Property key-value pairs to set on the new node. Use neos_list_node_types to see available properties.'
      ),
      workspace: z.string().default('mcp').describe('Draft workspace name'),
    },
    async ({ parent_id, node_type, properties, workspace }) => {
      const data = await callBridge('createContentNode', 'POST', {
        ...await nodeIdParam('parentPath', parent_id),
        nodeType: node_type,
        properties,
        workspace,
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
