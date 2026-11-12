import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { callBridge, nodeIdParam } from '../bridge.js';
import { dimensionsSchema, dimensionsParam } from '../dimensions.js';

export function registerUpdateNodeProperty(server: McpServer): void {
  server.tool(
    'neos_update_node_property',
    'Update a single property on an existing content node. Call neos_get_site_context first if you have not already done so this session. Always writes to the mcp workspace.',
    {
      node_id: z.string().describe(
        'Node identifier — use nodeAggregateId (Neos 9) or contextPath/path (Neos 8)'
      ),
      property: z.string().describe('Property or reference name to update'),
      value: z.unknown().describe(
        'New property value (string, number, boolean, or object). Image/asset properties: the asset identifier. ' +
        'Link properties (type Neos\\Neos\\Domain\\Link\\Link): a URI string such as "node://<nodeAggregateId>", "asset://<id>" or "https://…", ' +
        'or an object { href, title?, target?, rel?, download? }; an empty string clears the link. ' +
        'A node:// target must exist in the workspace (check with neos_list_pages), otherwise the write is rejected. ' +
        'References (Neos 9: listed under "references" of the node type in neos_list_node_types, not under "properties"): ' +
        'a nodeAggregateId for type "reference", an array of nodeAggregateIds for type "references" (the complete new list in the desired order, it replaces the old one); ' +
        'an empty string or empty array clears them. Every target must exist in the workspace and be of one of the reference\'s "targetNodeTypes" (if set), otherwise the write is rejected. ' +
        'The current targets are shown under "references" in neos_get_page_content / neos_get_document_properties.'
      ),
      workspace: z.string().default('mcp').describe('Workspace to write to'),
      dimensions: dimensionsSchema('The property is changed in exactly these dimensions; a node that only exists in another dimension is refused, create a variant first with neos_create_node_variant.'),
    },
    async ({ node_id, property, value, workspace, dimensions }) => {
      const data = await callBridge('updateNodeProperty', 'POST', {
        ...await nodeIdParam('contextPath', node_id),
        property,
        value,
        workspace,
        ...await dimensionsParam(dimensions),
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
