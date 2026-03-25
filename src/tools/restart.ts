import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerRestart(server: McpServer): void {
  server.tool(
    'neos_restart',
    'Restart this Neos MCP server. Use after the MCP bridge code or MCP client has been rebuilt to pick up changes.',
    {},
    async () => {
      setTimeout(() => process.exit(0), 100);
      return { content: [{ type: 'text', text: 'MCP server is restarting...' }] };
    }
  );
}