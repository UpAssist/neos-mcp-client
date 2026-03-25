import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerMoveNode(server: McpServer): void {
  server.tool(
    'neos_move_node',
    'Reorder or reparent a page or content node. ' +
    'Provide exactly one of insert_before, insert_after, or new_parent_path. ' +
    'Always writes to the mcp workspace.',
    {
      context_path: z.string().describe(
        'contextPath of the node to move, e.g. /sites/ewijksolartechniek/about@mcp'
      ),
      insert_before: z.string().optional().describe(
        'contextPath of a sibling node — move the node to appear before this sibling'
      ),
      insert_after: z.string().optional().describe(
        'contextPath of a sibling node — move the node to appear after this sibling'
      ),
      new_parent_path: z.string().optional().describe(
        'Absolute path of a new parent node — move the node into this parent (as last child)'
      ),
      workspace: z.string().default('mcp').describe('Draft workspace name'),
    },
    async ({ context_path, insert_before, insert_after, new_parent_path, workspace }) => {
      const data = await callBridge('moveNode', 'POST', {
        contextPath: context_path,
        insertBefore: insert_before ?? '',
        insertAfter: insert_after ?? '',
        newParentPath: new_parent_path ?? '',
        workspace,
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
