import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerPublishChanges(server: McpServer): void {
  server.tool(
    'neos_publish_changes',
    'Publish all pending changes from the mcp workspace to live. This is irreversible. Always call neos_list_pending_changes first and confirm with the user before publishing. ' +
      'On a multi-site instance, pass "site" to publish only the changes of that site; without it, the changes of all sites go live.',
    {
      workspace: z.string().default('mcp').describe('Workspace to publish from'),
      site: z.string().optional().describe('Only publish changes of this site (site node name, see neos_list_sites). Without it, all pending changes of all sites are published.'),
    },
    async ({ workspace, site }) => {
      if (site) {
        // A bridge without multi-site support ignores "site" and would publish the changes of
        // all sites. Publishing cannot be undone, so only go ahead when the bridge knows sites.
        try {
          await callBridge('listSites', 'GET');
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          throw new Error(
            `Not published: could not confirm that the bridge supports multi-site (${reason}). ` +
            'A bridge without multi-site support would publish the changes of all sites. ' +
            'Update the bridge (upassist/neos-mcp 2.3+ for Neos 9, 1.2+ for Neos 8) or publish without "site" if that is what you want.'
          );
        }
      }
      const data = await callBridge('publishChanges', 'POST', { workspace, site });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
