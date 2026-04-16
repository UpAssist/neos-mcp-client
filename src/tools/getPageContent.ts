import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge, nodeIdParam } from '../bridge.js';

export function registerGetPageContent(server: McpServer): void {
  server.tool(
    'neos_get_page_content',
    'Get all content nodes on a specific page with their properties. Call neos_get_site_context first if you have not already done so this session.',
    {
      node_id: z.string().describe('Node identifier — use the nodeAggregateId (Neos 9) or path (Neos 8) from neos_get_site_context / neos_list_pages'),
      workspace: z.string().default('mcp').describe('Workspace name'),
    },
    async ({ node_id, workspace }) => {
      const data = await callBridge('getPageContent', 'GET', { ...await nodeIdParam('nodePath', node_id), workspace });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
