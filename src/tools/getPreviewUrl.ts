import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge, nodeIdParam } from '../bridge.js';

export function registerGetPreviewUrl(server: McpServer): void {
  server.tool(
    'neos_get_preview_url',
    'Generate a time-limited public preview URL for a page in the MCP workspace. The URL can be opened in any browser without logging into Neos — valid for 24 hours.',
    {
      node_id: z.string().describe('Node identifier — use the nodeAggregateId (Neos 9) or path (Neos 8) from neos_list_pages'),
      workspace: z.string().default('mcp').describe('Workspace to preview'),
    },
    async ({ node_id, workspace }) => {
      const data = await callBridge('getPreviewUrl', 'GET', { ...nodeIdParam('nodePath', node_id), workspace });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
