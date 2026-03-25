import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerPublishChanges(server: McpServer): void {
  server.tool(
    'neos_publish_changes',
    'Publish all pending changes from the mcp workspace to live. This is irreversible. Always call neos_list_pending_changes first and confirm with the user before publishing.',
    {
      workspace: z.string().default('mcp').describe('Workspace to publish from'),
    },
    async ({ workspace }) => {
      const data = await callBridge('publishChanges', 'POST', { workspace });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
