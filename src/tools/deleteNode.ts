import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge, nodeIdParam } from '../bridge.js';

export function registerDeleteNode(server: McpServer): void {
  server.tool(
    'neos_delete_node',
    'Mark a content node as removed in the mcp workspace. The deletion is staged and will only go live after neos_publish_changes is called.',
    {
      node_id: z.string().describe('Node identifier — use nodeAggregateId (Neos 9) or contextPath/path (Neos 8)'),
      workspace: z.string().default('mcp').describe('Workspace to operate in'),
    },
    async ({ node_id, workspace }) => {
      const data = await callBridge('deleteNode', 'POST', {
        ...nodeIdParam('contextPath', node_id),
        workspace,
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
