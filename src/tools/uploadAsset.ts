import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

async function loadSource(
  filePath?: string,
  url?: string,
  base64Content?: string,
  filename?: string
): Promise<{ filename: string; content: string }> {
  const sources = [filePath, url, base64Content].filter((s) => s !== undefined && s !== '');
  if (sources.length !== 1) {
    throw new Error('Provide exactly one of file_path, url or base64_content.');
  }

  if (filePath) {
    const buffer = await readFile(filePath);
    return { filename: filename || basename(filePath), content: buffer.toString('base64') };
  }

  if (url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed (${response.status}): ${url}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const urlFilename = decodeURIComponent(basename(new URL(url).pathname));
    const resolvedFilename = filename || urlFilename;
    if (!resolvedFilename) {
      throw new Error('Could not derive a filename from the URL, please pass filename.');
    }
    return { filename: resolvedFilename, content: buffer.toString('base64') };
  }

  if (!filename) {
    throw new Error('filename is required when using base64_content.');
  }
  return { filename, content: (base64Content as string).replace(/^data:[^;]+;base64,/, '') };
}

export function registerUploadAsset(server: McpServer): void {
  server.tool(
    'neos_upload_asset',
    'Upload a file (image, PDF, video, …) into the Neos Media Manager. Provide exactly one source: a local file_path, a url to download, or base64_content. If a file with identical content already exists, the existing asset is returned (duplicate: true). The returned identifier can be used as value for image/asset properties via neos_update_node_property.',
    {
      file_path: z.string().optional().describe('Absolute path to a local file to upload'),
      url: z.string().optional().describe('HTTP(S) URL of a file to download and upload'),
      base64_content: z.string().optional().describe('Base64 encoded file content (data URI prefix allowed); requires filename'),
      filename: z.string().optional().describe('Target filename incl. extension. Defaults to the name from file_path or url.'),
      title: z.string().default('').describe('Asset title'),
      caption: z.string().default('').describe('Asset caption'),
      copyright_notice: z.string().default('').describe('Copyright notice'),
      tags: z.array(z.string()).default([]).describe('Tag labels to assign; missing tags are created'),
      asset_collections: z.array(z.string()).default([]).describe('Asset collection titles to add the asset to; missing collections are created'),
      allow_duplicate: z.boolean().default(false).describe('Create a new asset even if identical content already exists'),
    },
    async ({ file_path, url, base64_content, filename, title, caption, copyright_notice, tags, asset_collections, allow_duplicate }) => {
      const source = await loadSource(file_path, url, base64_content, filename);
      const data = await callBridge('uploadAsset', 'POST', {
        filename: source.filename,
        content: source.content,
        title,
        caption,
        copyrightNotice: copyright_notice,
        tags,
        assetCollections: asset_collections,
        allowDuplicate: allow_duplicate,
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
