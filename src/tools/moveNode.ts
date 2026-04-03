import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge, getApiVersion, nodeIdParam } from '../bridge.js';

export function registerMoveNode(server: McpServer): void {
  server.tool(
    'neos_move_node',
    'Reorder or reparent a page or content node. ' +
    'Provide exactly one of insert_before, insert_after, or new_parent_id. ' +
    'Always writes to the mcp workspace.',
    {
      node_id: z.string().describe(
        'Node identifier to move — use nodeAggregateId (Neos 9) or contextPath (Neos 8)'
      ),
      insert_before: z.string().optional().describe(
        'Sibling node identifier — move to appear before this sibling'
      ),
      insert_after: z.string().optional().describe(
        'Sibling node identifier — move to appear after this sibling'
      ),
      new_parent_id: z.string().optional().describe(
        'New parent node identifier — move into this parent (as last child)'
      ),
      workspace: z.string().default('mcp').describe('Draft workspace name'),
    },
    async ({ node_id, insert_before, insert_after, new_parent_id, workspace }) => {
      const params: Record<string, unknown> = {
        ...nodeIdParam('contextPath', node_id),
        insertBefore: insert_before ?? '',
        insertAfter: insert_after ?? '',
        workspace,
      };

      // Map new_parent_id to the correct bridge param name
      if (new_parent_id) {
        if (getApiVersion() === 2) {
          params.newParentId = new_parent_id;
        } else {
          params.newParentPath = new_parent_id;
        }
      } else {
        if (getApiVersion() === 2) {
          params.newParentId = '';
        } else {
          params.newParentPath = '';
        }
      }

      const data = await callBridge('moveNode', 'POST', params);
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
