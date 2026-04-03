# @upassist/neos-mcp

**MCP server that connects AI assistants to Neos CMS.** Works with Claude Code, Cursor, and any other tool that supports the [Model Context Protocol](https://modelcontextprotocol.io).

This is the client-side component. It runs locally on your machine and translates MCP tool calls into HTTP requests to the [UpAssist.Neos.Mcp](https://github.com/UpAssist/neos-mcp) bridge running inside your Neos installation.

## Compatibility

| MCP Server version | Bridge version         | Neos CMS | Node.js |
|-------------------|------------------------|----------|---------|
| 2.x (`main`)       | upassist/neos-mcp 1.x or 2.x | 8.3+ / 9.0+ | 18+     |
| 1.x (`neos-8`)     | upassist/neos-mcp 1.x | 8.3+     | 18+     |

> **v2 auto-detects** the bridge API version. A single MCP server v2 works with both Neos 8 and Neos 9 bridges.

## Requirements

- Node.js 18+
- A Neos CMS instance with [UpAssist.Neos.Mcp](https://github.com/UpAssist/neos-mcp) installed and configured

## Installation

**Via npm (recommended):**

```bash
npm install -g @upassist/neos-mcp
```

**Or clone from source:**

```bash
git clone https://github.com/UpAssist/neos-mcp-client.git ~/Tools/neos-mcp-client
cd ~/Tools/neos-mcp-client
npm install
npm run build
```

## Configuration

The MCP server connects to your Neos instance using two environment variables:

| Variable | Description | Example |
| --- | --- | --- |
| `NEOS_MCP_URL` | Base URL of the Neos site | `http://localhost:8081` |
| `NEOS_MCP_TOKEN` | Bearer token (must match `NEOS_MCP_BRIDGE_TOKEN` in Neos `.env`) | `a3f1c9...` |

### Generating a token

Pick a secure shared secret. The same token goes in two places:

```bash
# Generate a random token
openssl rand -hex 32
```

1. **Neos side** — add to your Neos `.env` file as `NEOS_MCP_BRIDGE_TOKEN`
2. **MCP client side** — add to your editor config as `NEOS_MCP_TOKEN` (see below)

### Claude Code

**Per project (recommended)** — add a `.mcp.json` to your Neos project root:

```json
{
  "mcpServers": {
    "neos-local": {
      "command": "neos-mcp",
      "env": {
        "NEOS_MCP_URL": "http://localhost:8081",
        "NEOS_MCP_TOKEN": "your-token"
      }
    }
  }
}
```

> **Important:** Add `.mcp.json` to `.gitignore` — it contains your token.

You can define multiple environments in the same file (e.g. local + production):

```json
{
  "mcpServers": {
    "neos-local": {
      "command": "neos-mcp",
      "env": {
        "NEOS_MCP_URL": "http://localhost:8081",
        "NEOS_MCP_TOKEN": "your-local-token"
      }
    },
    "neos-production": {
      "command": "neos-mcp",
      "env": {
        "NEOS_MCP_URL": "https://www.example.com",
        "NEOS_MCP_TOKEN": "your-production-token"
      }
    }
  }
}
```

**Global (all projects)** — add the same `mcpServers` block to `~/.claude.json`.

### Cursor

Add to Cursor's MCP settings (Settings > MCP Servers):

```json
{
  "neos-mcp": {
    "command": "neos-mcp",
    "env": {
      "NEOS_MCP_URL": "http://localhost:8081",
      "NEOS_MCP_TOKEN": "your-token"
    }
  }
}
```

## Available tools

Once connected, your AI assistant can use these tools:

### Reading

| Tool | Description |
| --- | --- |
| `neos_get_site_context` | Get site structure, node types, and page tree. **Call this first.** |
| `neos_list_pages` | List all pages in a workspace |
| `neos_get_page_content` | Get all content nodes on a specific page |
| `neos_get_document_properties` | Get page-level properties (title, SEO, etc.) |
| `neos_list_node_types` | List available node types and their properties |

### Writing

| Tool | Description |
| --- | --- |
| `neos_setup_workspace` | Create the MCP workspace (auto-created on first write) |
| `neos_update_node_property` | Update a property on an existing node |
| `neos_create_content_node` | Create a new content element inside a page |
| `neos_create_document_node` | Create a new page |
| `neos_move_node` | Move or reorder a node |
| `neos_delete_node` | Remove a node |

### Media

| Tool | Description |
| --- | --- |
| `neos_list_assets` | Browse images and files from the Media Manager |
| `neos_list_asset_tags` | List available asset tags |

### Review and publish

| Tool | Description |
| --- | --- |
| `neos_get_preview_url` | Generate a 24-hour preview link (no Neos login needed) |
| `neos_list_pending_changes` | See what has been changed |
| `neos_publish_changes` | Publish all changes to live |

### Entity management

If the Neos installation exposes custom Doctrine entities (see [bridge documentation](https://github.com/UpAssist/neos-mcp#entity-crud-advanced)), these tools are also available:

| Tool | Description |
| --- | --- |
| `neos_entity_discover` | List all exposed entities with their schemas |
| `neos_entity_list` | List/filter entities |
| `neos_entity_show` | Get a single entity by UUID |
| `neos_entity_create` | Create a new entity |
| `neos_entity_update` | Update entity properties |
| `neos_entity_delete` | Delete an entity |
| `neos_entity_action` | Run a named action (publish, archive, etc.) |

## How it works

```text
AI Assistant (Claude Code, Cursor, etc.)
    |
    |  MCP protocol (stdio)
    |
@upassist/neos-mcp           <-- this package
    |
    |  HTTP + Bearer token
    |
UpAssist.Neos.Mcp bridge (Neos CMS)
    |
    |  ContentRepository API
    |
Neos CMS database (mcp workspace -> live)
```

1. Your AI assistant communicates with this MCP server via stdio
2. Each tool call is translated into an HTTP request to the Neos bridge
3. All write operations go to a staging workspace (not directly to live)
4. Changes can be previewed via generated URLs before publishing
5. Publishing requires an explicit call — the AI never auto-publishes

## Development

```bash
# Run in dev mode (hot reload via tsx)
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build

# Run built version
npm start
```

### Adding a new tool

1. Create a file in `src/tools/` (e.g. `myNewTool.ts`)
2. Export a register function that calls `server.tool()` with name, description, Zod schema, and handler
3. Use `callBridge()` to make the HTTP request to the Neos bridge
4. Import and call the register function in `src/server.ts`

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

## License

MIT
