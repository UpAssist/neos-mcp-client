import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerListAssets(server: McpServer): void {
  server.tool(
    'neos_list_assets',
    'List assets (images, documents, etc.) from the Neos Media Manager. Filter by media type or tag. Returns identifier, title, filename, mediaType, fileSize, tags, and collections.',
    {
      mediaType: z.string().default('image').describe('Media type prefix to filter on, e.g. "image", "video", "application". Empty string for all types.'),
      tag: z.string().default('').describe('Filter by tag label (exact match). Empty string for no tag filter.'),
      limit: z.number().default(50).describe('Maximum number of assets to return (default 50).'),
      offset: z.number().default(0).describe('Offset for pagination (default 0).'),
    },
    async ({ mediaType, tag, limit, offset }) => {
      const data = await callBridge('listAssets', 'GET', { mediaType, tag, limit, offset });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
