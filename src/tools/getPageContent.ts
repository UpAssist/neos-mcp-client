import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerGetPageContent(server: McpServer): void {
  server.tool(
    'neos_get_page_content',
    'Get all content nodes on a specific page with their properties. Call neos_get_site_context first if you have not already done so this session.',
    {
      node_path: z.string().describe('Absolute node path of the document, e.g. /sites/ewijksolartechniek/over-ons'),
      workspace: z.string().default('mcp').describe('Workspace name'),
    },
    async ({ node_path, workspace }) => {
      const data = await callBridge('getPageContent', 'GET', { nodePath: node_path, workspace });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
