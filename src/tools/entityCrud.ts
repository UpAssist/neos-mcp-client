import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callBridge } from '../bridge.js';

export function registerEntityCrudTools(server: McpServer): void {
  server.tool(
    'neos_entity_discover',
    'Discover all Doctrine entities exposed via MCP. Returns entity schemas with fields, filters, and available actions. Call this first before using other entity tools.',
    {},
    async () => {
      const data = await callBridge('entity/listEntities', 'GET');
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'neos_entity_list',
    'List entities from a custom Doctrine table. Use neos_entity_discover first to see available entities and their filters.',
    {
      entity: z.string().describe('Entity key from neos_entity_discover, e.g. "notifications"'),
      filter: z.string().default('').describe('Named filter from the entity schema, e.g. "active" or "byFilter"'),
      filter_params: z.string().default('{}').describe('JSON object of filter parameters, e.g. {"filter":"draft","limit":10}'),
      limit: z.number().default(50).describe('Max items to return'),
      offset: z.number().default(0).describe('Pagination offset'),
    },
    async ({ entity, filter, filter_params, limit, offset }) => {
      const data = await callBridge('entity/list', 'POST', {
        entity,
        filter,
        filterParams: filter_params,
        limit,
        offset,
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'neos_entity_show',
    'Get a single entity by its UUID identifier.',
    {
      entity: z.string().describe('Entity key, e.g. "notifications"'),
      identifier: z.string().describe('UUID of the entity'),
    },
    async ({ entity, identifier }) => {
      const data = await callBridge('entity/show', 'POST', { entity, identifier });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'neos_entity_create',
    'Create a new entity. Use neos_entity_discover to see required fields and their types. For markdown fields, pass raw markdown text.',
    {
      entity: z.string().describe('Entity key, e.g. "notifications"'),
      properties: z.string().describe('JSON object of field values, e.g. {"title":"New notification","contentMarkdown":"**Hello** world"}'),
    },
    async ({ entity, properties }) => {
      const data = await callBridge('entity/create', 'POST', { entity, properties });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'neos_entity_update',
    'Update an existing entity. Only pass the fields you want to change.',
    {
      entity: z.string().describe('Entity key, e.g. "notifications"'),
      identifier: z.string().describe('UUID of the entity to update'),
      properties: z.string().describe('JSON object of fields to update, e.g. {"title":"Updated title"}'),
    },
    async ({ entity, identifier, properties }) => {
      const data = await callBridge('entity/update', 'POST', { entity, identifier, properties });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'neos_entity_delete',
    'Delete an entity by its UUID.',
    {
      entity: z.string().describe('Entity key, e.g. "notifications"'),
      identifier: z.string().describe('UUID of the entity to delete'),
    },
    async ({ entity, identifier }) => {
      const data = await callBridge('entity/delete', 'POST', { entity, identifier });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    'neos_entity_action',
    'Execute a named action on an entity (e.g. publish, archive, unpublish). Use neos_entity_discover to see available actions.',
    {
      entity: z.string().describe('Entity key, e.g. "notifications"'),
      action: z.string().describe('Action name from entity schema, e.g. "publish"'),
      identifier: z.string().default('').describe('UUID of the entity (required if the action operates on a specific entity)'),
      params: z.string().default('{}').describe('JSON object of additional action parameters'),
    },
    async ({ entity, action, identifier, params }) => {
      const data = await callBridge('entity/execute', 'POST', { entity, action, identifier, params });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );
}
