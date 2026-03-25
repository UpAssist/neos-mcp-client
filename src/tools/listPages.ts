import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerListPages(server: McpServer): void {
  server.tool(
    'neos_list_pages',
    'List all document nodes (pages) in the Neos CMS site as a flat tree with paths and titles.',
    {
      workspace: z.string().default('mcp').describe('Workspace name. Use "live" for published content, "mcp" for staged changes.'),
    },
    async ({ workspace }) => {
      const data = await callBridge('listPages', 'GET', { workspace });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
