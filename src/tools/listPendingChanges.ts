import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { callBridge } from '../bridge.js';
import { dimensionsSchema, dimensionsParam } from '../dimensions.js';

export function registerListPendingChanges(server: McpServer): void {
  server.tool(
    'neos_list_pending_changes',
    'List all content changes staged in the MCP workspace that have not yet been published to live. Call this before neos_publish_changes to review what will go live.',
    {
      workspace: z.string().default('mcp').describe('Workspace name to check for pending changes'),
      site: z.string().optional().describe('Only list changes of this site (site node name, see neos_list_sites). Without it, changes of all sites are listed, each with its "site".'),
      dimensions: dimensionsSchema('Only list the changes made in these dimensions. Without it, the changes of all dimensions are listed, each with its "dimensions".'),
    },
    async ({ workspace, site, dimensions }) => {
      const data = await callBridge('listPendingChanges', 'GET', { workspace, site, ...await dimensionsParam(dimensions) });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
