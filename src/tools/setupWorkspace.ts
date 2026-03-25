import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { callBridge } from '../bridge.js';

export function registerSetupWorkspace(server: McpServer): void {
  server.tool(
    'neos_setup_workspace',
    'Idempotently create the shared MCP review workspace. Call this once before making any content changes if the workspace does not exist yet.',
    {},
    async () => {
      const data = await callBridge('setupWorkspace', 'POST');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
