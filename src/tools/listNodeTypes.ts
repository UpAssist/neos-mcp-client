import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerListNodeTypes(server: McpServer): void {
  server.tool(
    'neos_list_node_types',
    'List available content node types with their property schemas. Useful to know which types and properties are available before creating or updating nodes.',
    {
      filter: z.enum(['content', 'document', 'all']).default('content').describe(
        '"content" for content elements, "document" for page types, "all" for everything'
      ),
    },
    async ({ filter }) => {
      const data = await callBridge('listNodeTypes', 'GET', { filter });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
