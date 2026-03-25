import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerGetDocumentProperties(server: McpServer): void {
  server.tool(
    'neos_get_document_properties',
    'Get all properties of a document node (page) without its content nodes. Use this for SEO fields, meta data, and other document-level properties.',
    {
      node_path: z.string().describe('Absolute node path of the document, e.g. /sites/ewijksolartechniek/over-ons'),
      workspace: z.string().default('mcp').describe('Workspace name. Use "live" for published content, "mcp" for staged changes.'),
    },
    async ({ node_path, workspace }) => {
      const data = await callBridge('getDocumentProperties', 'GET', { nodePath: node_path, workspace });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}