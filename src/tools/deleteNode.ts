import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerDeleteNode(server: McpServer): void {
  server.tool(
    'neos_delete_node',
    'Mark a content node as removed in the mcp workspace. The deletion is staged and will only go live after neos_publish_changes is called.',
    {
      context_path: z.string().describe('Context path or node path of the node to delete'),
      workspace: z.string().default('mcp').describe('Workspace to operate in'),
    },
    async ({ context_path, workspace }) => {
      const data = await callBridge('deleteNode', 'POST', {
        contextPath: context_path,
        workspace,
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
