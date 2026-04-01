import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerGetSiteContext } from './tools/getSiteContext.js';
import { registerSetupWorkspace } from './tools/setupWorkspace.js';
import { registerListPages } from './tools/listPages.js';
import { registerGetPageContent } from './tools/getPageContent.js';
import { registerGetDocumentProperties } from './tools/getDocumentProperties.js';
import { registerListNodeTypes } from './tools/listNodeTypes.js';
import { registerListPendingChanges } from './tools/listPendingChanges.js';
import { registerGetPreviewUrl } from './tools/getPreviewUrl.js';
import { registerCreateContentNode } from './tools/createContentNode.js';
import { registerUpdateNodeProperty } from './tools/updateNodeProperty.js';
import { registerDeleteNode } from './tools/deleteNode.js';
import { registerPublishChanges } from './tools/publishChanges.js';
import { registerCreateDocumentNode } from './tools/createDocumentNode.js';
import { registerMoveNode } from './tools/moveNode.js';
import { registerRestart } from './tools/restart.js';
import { registerListAssets } from './tools/listAssets.js';
import { registerListAssetTags } from './tools/listAssetTags.js';
import { registerEntityCrudTools } from './tools/entityCrud.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'neos-mcp',
    version: '0.1.0',
  });

  registerGetSiteContext(server);
  registerSetupWorkspace(server);
  registerListPages(server);
  registerGetPageContent(server);
  registerGetDocumentProperties(server);
  registerListNodeTypes(server);
  registerListPendingChanges(server);
  registerGetPreviewUrl(server);
  registerCreateContentNode(server);
  registerUpdateNodeProperty(server);
  registerDeleteNode(server);
  registerPublishChanges(server);
  registerCreateDocumentNode(server);
  registerMoveNode(server);
  registerRestart(server);
  registerListAssets(server);
  registerListAssetTags(server);
  registerEntityCrudTools(server);

  return server;
}
