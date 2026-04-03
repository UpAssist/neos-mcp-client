import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge, nodeIdParam } from '../bridge.js';

export function registerCreateDocumentNode(server: McpServer): void {
  server.tool(
    'neos_create_document_node',
    'Create a new page (document node) as a child of a parent page. ' +
    'Call neos_get_site_context first to see available document NodeTypes and the page tree. ' +
    'Always writes to the mcp workspace.',
    {
      parent_id: z.string().describe(
        'Parent node identifier — use nodeAggregateId (Neos 9) or path (Neos 8).'
      ),
      node_type: z.string().describe(
        'Document node type name, e.g. UpAssist.Site:Document.Page'
      ),
      properties: z.record(z.unknown()).default({}).describe(
        'Property key-value pairs, e.g. { title: "About us", uriPathSegment: "about-us" }'
      ),
      workspace: z.string().default('mcp').describe('Draft workspace name'),
      node_name: z.string().optional().describe(
        'URL slug used as the node name (auto-generated from nodeType if omitted)'
      ),
      insert_before: z.string().optional().describe(
        'Sibling node identifier — insert the new page before this sibling'
      ),
      insert_after: z.string().optional().describe(
        'Sibling node identifier — insert the new page after this sibling'
      ),
    },
    async ({ parent_id, node_type, properties, workspace, node_name, insert_before, insert_after }) => {
      const data = await callBridge('createDocumentNode', 'POST', {
        ...nodeIdParam('parentPath', parent_id),
        nodeType: node_type,
        properties,
        workspace,
        nodeName: node_name ?? '',
        insertBefore: insert_before ?? '',
        insertAfter: insert_after ?? '',
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
