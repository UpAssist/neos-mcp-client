import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { callBridge, setApiVersion } from '../bridge.js';

export function registerGetSiteContext(server: McpServer): void {
  server.tool(
    'neos_get_site_context',
    'Get the site context: site name, available content NodeTypes with their properties, current page tree, and editorial workflow instructions. Always call this first at the start of any Neos content editing session.',
    {},
    async () => {
      const data = await callBridge('getSiteContext', 'GET') as Record<string, unknown>;

      // Auto-detect bridge API version
      if (data && typeof data === 'object' && 'apiVersion' in data && data.apiVersion === 2) {
        setApiVersion(2);
      } else {
        setApiVersion(1);
      }

      return { content: [{ type: 'text', text: JSON.stringify(data) }] };
    }
  );
}
