import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { callBridge, nodeIdParam } from '../bridge.js';
import { dimensionsSchema, dimensionsParam } from '../dimensions.js';

export function registerGetPreviewUrl(server: McpServer): void {
  server.tool(
    'neos_get_preview_url',
    'Generate a time-limited public preview URL for a page in the MCP workspace. The URL can be opened in any browser without logging into Neos — valid for 24 hours.',
    {
      node_id: z.string().describe('Node identifier — use the nodeAggregateId (Neos 9) or path (Neos 8) from neos_list_pages'),
      workspace: z.string().default('mcp').describe('Workspace to preview'),
      dimensions: dimensionsSchema('The preview URL shows the page in these dimensions, including the URL prefix the site uses for them (e.g. /nl).'),
    },
    async ({ node_id, workspace, dimensions }) => {
      const data = await callBridge('getPreviewUrl', 'GET', { ...await nodeIdParam('nodePath', node_id), workspace, ...await dimensionsParam(dimensions) });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
