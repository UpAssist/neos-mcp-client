import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerCreateDocumentNode(server: McpServer): void {
  server.tool(
    'neos_create_document_node',
    'Create a new page (document node) as a child of a parent page. ' +
    'Call neos_get_site_context first to see available document NodeTypes and the page tree. ' +
    'Always writes to the mcp workspace.',
    {
      parent_path: z.string().describe(
        'Absolute path to the parent document node, e.g. /sites/ewijksolartechniek'
      ),
      node_type: z.string().describe(
        'Document node type name, e.g. UpAssist.EwijkSolarTechniek:Document.Page'
      ),
      properties: z.record(z.unknown()).default({}).describe(
        'Property key-value pairs, e.g. { title: "About us", uriPathSegment: "about-us" }'
      ),
      workspace: z.string().default('mcp').describe('Draft workspace name'),
      node_name: z.string().optional().describe(
        'URL slug used as the node name (auto-generated from nodeType if omitted)'
      ),
      insert_before: z.string().optional().describe(
        'contextPath of a sibling node to insert the new page before'
      ),
      insert_after: z.string().optional().describe(
        'contextPath of a sibling node to insert the new page after'
      ),
    },
    async ({ parent_path, node_type, properties, workspace, node_name, insert_before, insert_after }) => {
      const data = await callBridge('createDocumentNode', 'POST', {
        parentPath: parent_path,
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
