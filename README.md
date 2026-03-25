# neos-mcp-client

MCP server that connects AI tools (Claude Code, Cursor, etc.) to Neos CMS via the [UpAssist.Neos.Mcp](https://github.com/UpAssist/neos-mcp) bridge. Translates MCP tool calls into HTTP requests so AI assistants can read, create, edit, and publish Neos content.

## Requirements

- Node.js 18+
- A Neos CMS instance with [UpAssist.Neos.Mcp](https://github.com/UpAssist/neos-mcp) installed

## Installation

Clone the repository to a permanent location:

```bash
git clone git@github.com:UpAssist/neos-mcp-client.git ~/Tools/neos-mcp-client
cd ~/Tools/neos-mcp-client
npm install
npm run build
```

## Configuration

The client needs two environment variables to connect to a Neos instance:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEOS_MCP_URL` | Base URL of the Neos site | `http://localhost:8081` |
| `NEOS_MCP_TOKEN` | Bearer token (must match `NEOS_MCP_BRIDGE_TOKEN` on the server) | `a3f1c9...` |

### Generating a token

The token is a shared secret you choose yourself. Generate a secure random token with:

```bash
openssl rand -hex 32
```

Use the same value in two places:
1. **Neos server** `.env` as `NEOS_MCP_BRIDGE_TOKEN`
2. **MCP client** config as `NEOS_MCP_TOKEN`

### Claude Code (global)

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "neos-mcp": {
      "command": "node",
      "args": ["/Users/you/Tools/neos-mcp-client/dist/index.js"],
      "env": {
        "NEOS_MCP_URL": "http://localhost:8081",
        "NEOS_MCP_TOKEN": "your-token"
      }
    }
  }
}
```

### Claude Code (per project)

Override the environment variables in your project's `.claude/settings.json`:

```json
{
  "mcpServers": {
    "neos-mcp": {
      "command": "node",
      "args": ["/Users/you/Tools/neos-mcp-client/dist/index.js"],
      "env": {
        "NEOS_MCP_URL": "https://staging.example.com",
        "NEOS_MCP_TOKEN": "project-specific-token"
      }
    }
  }
}
```

### Cursor

Add to Cursor's MCP settings (Settings > MCP Servers):

```json
{
  "neos-mcp": {
    "command": "node",
    "args": ["/Users/you/Tools/neos-mcp-client/dist/index.js"],
    "env": {
      "NEOS_MCP_URL": "http://localhost:8081",
      "NEOS_MCP_TOKEN": "your-token"
    }
  }
}
```

## Available tools

Once connected, the following MCP tools are available to the AI assistant:

### Reading

| Tool | Description |
|------|-------------|
| `neos_get_site_context` | Get full site context: site info, all node types with properties, page tree, and workflow instructions. **Call this first at the start of every session.** |
| `neos_list_pages` | List all pages (document nodes) in a workspace |
| `neos_get_page_content` | Get all content nodes for a specific page |
| `neos_list_node_types` | List available node types and their properties |

### Writing

| Tool | Description |
|------|-------------|
| `neos_setup_workspace` | Create the MCP workspace (auto-created on first write, but can be called explicitly) |
| `neos_update_node_property` | Update a single property on an existing node |
| `neos_create_content_node` | Create a new content node inside a parent |
| `neos_create_document_node` | Create a new page |
| `neos_move_node` | Move a node to a new position |
| `neos_delete_node` | Mark a node as removed |

### Review & publish

| Tool | Description |
|------|-------------|
| `neos_get_preview_url` | Generate a 24-hour preview URL (no Neos login required) |
| `neos_list_pending_changes` | List all unpublished changes in the workspace |
| `neos_publish_changes` | Publish all pending changes from workspace to live |

## How it works

```
AI Assistant (Claude Code, Cursor, etc.)
    │
    │  MCP protocol (stdio)
    │
neos-mcp-client  ◄── this package
    │
    │  HTTP + Bearer token
    │
UpAssist.Neos.Mcp bridge (Neos CMS)
    │
    │  ContentRepository API
    │
Neos CMS database (mcp workspace → live)
```

1. The AI assistant communicates with this MCP server via stdio
2. Each MCP tool call is translated into an HTTP request to the Neos bridge
3. All write operations go to the `mcp` workspace (not directly to live)
4. Changes can be previewed via generated URLs before publishing
5. Publishing requires an explicit call — the AI never auto-publishes

## Typical AI workflow

```
1. neos_get_site_context          → Understand site structure and node types
2. neos_get_page_content          → Read current content of a page
3. neos_update_node_property      → Make changes (text, metadata, etc.)
4. neos_get_preview_url           → Generate preview link for human review
5. (human reviews the preview)
6. neos_publish_changes           → Go live after confirmation
```

## Development

```bash
# Run in development mode (with hot reload via tsx)
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build

# Run built version
npm start
```

### Adding a new tool

1. Create a new file in `src/tools/` (e.g. `myNewTool.ts`)
2. Export a `registerMyNewTool(server: McpServer)` function
3. Use `server.tool()` to define the tool name, description, Zod schema, and handler
4. Call `callBridge()` to make the HTTP request to the Neos bridge
5. Import and call the register function in `src/server.ts`

Example:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerMyNewTool(server: McpServer): void {
  server.tool(
    'neos_my_new_tool',
    'Description of what this tool does',
    {
      some_param: z.string().describe('What this parameter does'),
    },
    async ({ some_param }) => {
      const data = await callBridge('myNewAction', 'POST', { someParam: some_param });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
```

## Tech stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| MCP SDK | `@modelcontextprotocol/sdk` |
| Validation | Zod |
| Bundler | esbuild |
| Transport | stdio (standard MCP) |

## License

Proprietary
