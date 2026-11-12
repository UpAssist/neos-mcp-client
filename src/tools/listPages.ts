import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { callBridge } from '../bridge.js';
import { dimensionsSchema, dimensionsParam } from '../dimensions.js';

export function registerListPages(server: McpServer): void {
  server.tool(
    'neos_list_pages',
    'List all document nodes (pages) in the Neos CMS site as a flat tree with paths and titles. Neos 9: each page also lists its "references" (nodeAggregateIds of the referenced nodes).',
    {
      workspace: z.string().default('mcp').describe('Workspace name. Use "live" for published content, "mcp" for staged changes.'),
      site: z.string().optional().describe('Site node name (see neos_list_sites). Defaults to the default site of the instance.'),
      dimensions: dimensionsSchema('Pages that only exist in another dimension and are shown through a fallback have "fallback": true.'),
    },
    async ({ workspace, site, dimensions }) => {
      const data = await callBridge('listPages', 'GET', { workspace, site, ...await dimensionsParam(dimensions) });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
