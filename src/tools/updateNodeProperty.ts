import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerUpdateNodeProperty(server: McpServer): void {
  server.tool(
    'neos_update_node_property',
    'Update a single property on an existing content node. Call neos_get_site_context first if you have not already done so this session. Always writes to the mcp workspace.',
    {
      context_path: z.string().describe(
        'Context path of the node, e.g. /sites/ewijksolartechniek/page/main/headline@mcp or just the node path without workspace'
      ),
      property: z.string().describe('Property name to update'),
      value: z.unknown().describe('New property value (string, number, boolean, or object)'),
      workspace: z.string().default('mcp').describe('Workspace to write to'),
    },
    async ({ context_path, property, value, workspace }) => {
      const data = await callBridge('updateNodeProperty', 'POST', {
        contextPath: context_path,
        property,
        value,
        workspace,
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
