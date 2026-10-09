import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge, nodeIdParam } from '../bridge.js';

export function registerUpdateNodeProperty(server: McpServer): void {
  server.tool(
    'neos_update_node_property',
    'Update a single property on an existing content node. Call neos_get_site_context first if you have not already done so this session. Always writes to the mcp workspace.',
    {
      node_id: z.string().describe(
        'Node identifier — use nodeAggregateId (Neos 9) or contextPath/path (Neos 8)'
      ),
      property: z.string().describe('Property name to update'),
      value: z.unknown().describe(
        'New property value (string, number, boolean, or object). Image/asset properties: the asset identifier. ' +
        'Link properties (type Neos\\Neos\\Domain\\Link\\Link): a URI string such as "node://<nodeAggregateId>", "asset://<id>" or "https://…", ' +
        'or an object { href, title?, target?, rel?, download? }; an empty string clears the link. ' +
        'A node:// target must exist in the workspace (check with neos_list_pages), otherwise the write is rejected.'
      ),
      workspace: z.string().default('mcp').describe('Workspace to write to'),
    },
    async ({ node_id, property, value, workspace }) => {
      const data = await callBridge('updateNodeProperty', 'POST', {
        ...await nodeIdParam('contextPath', node_id),
        property,
        value,
        workspace,
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
