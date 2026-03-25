import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerGetPreviewUrl(server: McpServer): void {
  server.tool(
    'neos_get_preview_url',
    'Generate a time-limited public preview URL for a page in the MCP workspace. The URL can be opened in any browser without logging into Neos — valid for 24 hours.',
    {
      node_path: z.string().describe('Absolute node path of the document to preview, e.g. /sites/ewijksolartechniek/over-ons'),
      workspace: z.string().default('mcp').describe('Workspace to preview'),
    },
    async ({ node_path, workspace }) => {
      const data = await callBridge('getPreviewUrl', 'GET', { nodePath: node_path, workspace });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
