import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge, nodeIdParam } from '../bridge.js';
import { dimensionsSchema, dimensionsParam } from '../dimensions.js';

export function registerDeleteNode(server: McpServer): void {
  server.tool(
    'neos_delete_node',
    'Mark a content node as removed in the mcp workspace. The deletion is staged and will only go live after neos_publish_changes is called. ' +
    'With "dimensions" only the variant in those dimensions is removed, the other languages stay. ' +
    'Neos 8 refuses a node that is only shown through a fallback; Neos 9 then removes the page from the requested dimension (and its specializations) only, the page stays in the dimension it is stored in.',
    {
      node_id: z.string().describe('Node identifier — use nodeAggregateId (Neos 9) or contextPath/path (Neos 8)'),
      workspace: z.string().default('mcp').describe('Workspace to operate in'),
      dimensions: dimensionsSchema(),
    },
    async ({ node_id, workspace, dimensions }) => {
      const data = await callBridge('deleteNode', 'POST', {
        ...await nodeIdParam('contextPath', node_id),
        workspace,
        ...await dimensionsParam(dimensions),
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
