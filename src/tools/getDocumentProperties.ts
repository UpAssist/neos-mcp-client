import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { callBridge, nodeIdParam } from '../bridge.js';
import { dimensionsSchema, dimensionsParam } from '../dimensions.js';

export function registerGetDocumentProperties(server: McpServer): void {
  server.tool(
    'neos_get_document_properties',
    'Get all properties of a document node (page) without its content nodes. Use this for SEO fields, meta data, and other document-level properties.',
    {
      node_id: z.string().describe('Node identifier — use the nodeAggregateId (Neos 9) or path (Neos 8) from neos_get_site_context / neos_list_pages'),
      workspace: z.string().default('mcp').describe('Workspace name. Use "live" for published content, "mcp" for staged changes.'),
      dimensions: dimensionsSchema(),
    },
    async ({ node_id, workspace, dimensions }) => {
      const data = await callBridge('getDocumentProperties', 'GET', { ...await nodeIdParam('nodePath', node_id), workspace, ...await dimensionsParam(dimensions) });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
