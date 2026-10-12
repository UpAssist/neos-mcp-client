import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { callBridge } from '../bridge.js';

export function registerListSites(server: McpServer): void {
  server.tool(
    'neos_list_sites',
    'List all sites of the Neos instance: name, node name, online state, domains and which one is the default site. ' +
      'Pass a site node name as "site" to neos_get_site_context, neos_list_pages, neos_list_pending_changes and neos_publish_changes to work on a site other than the default one.',
    {},
    async () => {
      const data = await callBridge('listSites', 'GET');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
