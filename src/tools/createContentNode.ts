import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerCreateContentNode(server: McpServer): void {
  server.tool(
    'neos_create_content_node',
    'Create a new content element inside a page\'s content collection. Call neos_get_site_context first if you have not already done so this session. Always writes to the mcp workspace.',
    {
      parent_path: z.string().describe(
        'Absolute path to the content collection node, e.g. /sites/ewijksolartechniek/over-ons/main'
      ),
      node_type: z.string().describe(
        'Node type name, e.g. UpAssist.EwijkSolarTechniek:Content.Headline'
      ),
      properties: z.record(z.unknown()).default({}).describe(
        'Property key-value pairs to set on the new node. Use neos_list_node_types to see available properties.'
      ),
      workspace: z.string().default('mcp').describe('Draft workspace name'),
    },
    async ({ parent_path, node_type, properties, workspace }) => {
      const data = await callBridge('createContentNode', 'POST', {
        parentPath: parent_path,
        nodeType: node_type,
        properties,
        workspace,
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
