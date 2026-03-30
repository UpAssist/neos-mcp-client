import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { callBridge } from '../bridge.js';

export function registerListAssetTags(server: McpServer): void {
  server.tool(
    'neos_list_asset_tags',
    'List all available tags in the Neos Media Manager. Use these tags to filter assets with neos_list_assets.',
    {},
    async () => {
      const data = await callBridge('listAssetTags', 'GET');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}