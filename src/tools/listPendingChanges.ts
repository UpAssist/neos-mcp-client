import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerListPendingChanges(server: McpServer): void {
  server.tool(
    'neos_list_pending_changes',
    'List all content changes staged in the MCP workspace that have not yet been published to live. Call this before neos_publish_changes to review what will go live.',
    {
      workspace: z.string().default('mcp').describe('Workspace name to check for pending changes'),
    },
    async ({ workspace }) => {
      const data = await callBridge('listPendingChanges', 'GET', { workspace });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
