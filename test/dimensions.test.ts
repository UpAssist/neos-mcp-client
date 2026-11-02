import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import './support/env.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/server.js';
import { setApiVersion } from '../src/bridge.js';
import { resetDimensionSupport } from '../src/dimensions.js';

type Call = { url: URL; method: string; body: any };

const realFetch = globalThis.fetch;
let calls: Call[] = [];
let client: Client;
let bridgeHasDimensions = true;

/** Records bridge calls. getSiteContext reports dimensions unless the test simulates an older bridge. */
function mockFetch() {
  globalThis.fetch = (async (input: any, init: any = {}) => {
    const url = new URL(String(input));
    calls.push({ url, method: init.method ?? 'GET', body: init.body ? JSON.parse(init.body) : undefined });
    const payload = url.pathname.endsWith('/getSiteContext')
      ? { apiVersion: 2, ...(bridgeHasDimensions ? { dimensions: [{ name: 'language', default: 'en_US', values: [] }] } : {}) }
      : { apiVersion: 2, success: true };
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

before(async () => {
  setApiVersion(2);
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: 'test', version: '0.0.0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
});

after(() => {
  globalThis.fetch = realFetch;
});

beforeEach(() => {
  calls = [];
  bridgeHasDimensions = true;
  resetDimensionSupport();
  mockFetch();
});

const paths = () => calls.map((c) => c.url.pathname);

test('without "dimensions" no support check is made and nothing dimension related is sent', async () => {
  const result = await client.callTool({ name: 'neos_list_pages', arguments: {} });
  assert.notEqual(result.isError, true);
  assert.deepEqual(paths(), ['/neos/mcp/listPages']);
  assert.equal(calls[0].url.searchParams.has('dimensions'), false);
});

test('neos_list_pages sends "dimensions" as a JSON string in the query, after checking bridge support', async () => {
  const result = await client.callTool({ name: 'neos_list_pages', arguments: { workspace: 'live', dimensions: { language: 'nl' } } });
  assert.notEqual(result.isError, true, JSON.stringify(result.content));
  assert.deepEqual(paths(), ['/neos/mcp/getSiteContext', '/neos/mcp/listPages']);
  const list = calls[1];
  assert.equal(list.url.searchParams.get('workspace'), 'live');
  assert.deepEqual(JSON.parse(list.url.searchParams.get('dimensions') ?? ''), { language: 'nl' });
});

test('the bridge support check is made once', async () => {
  await client.callTool({ name: 'neos_list_pages', arguments: { dimensions: { language: 'nl' } } });
  await client.callTool({ name: 'neos_list_pages', arguments: { dimensions: { language: 'de' } } });
  assert.deepEqual(paths(), ['/neos/mcp/getSiteContext', '/neos/mcp/listPages', '/neos/mcp/listPages']);
});

test('read tools pass "dimensions" with the node id', async () => {
  await client.callTool({ name: 'neos_get_page_content', arguments: { node_id: 'abc', dimensions: { language: 'de' } } });
  const read = calls.find((c) => c.url.pathname.endsWith('/getPageContent'))!;
  assert.equal(read.url.searchParams.get('nodeAggregateId'), 'abc');
  assert.deepEqual(JSON.parse(read.url.searchParams.get('dimensions') ?? ''), { language: 'de' });

  calls = [];
  await client.callTool({ name: 'neos_get_document_properties', arguments: { node_id: 'abc', dimensions: { language: 'de' } } });
  const props = calls.find((c) => c.url.pathname.endsWith('/getDocumentProperties'))!;
  assert.deepEqual(JSON.parse(props.url.searchParams.get('dimensions') ?? ''), { language: 'de' });
});

test('write tools send "dimensions" in the body', async () => {
  const cases: Array<[string, Record<string, unknown>, string]> = [
    ['neos_update_node_property', { node_id: 'abc', property: 'title', value: 'x' }, 'updateNodeProperty'],
    ['neos_delete_node', { node_id: 'abc' }, 'deleteNode'],
    ['neos_move_node', { node_id: 'abc', insert_before: 'def' }, 'moveNode'],
    ['neos_create_content_node', { parent_id: 'abc', node_type: 'X:Y' }, 'createContentNode'],
    ['neos_create_document_node', { parent_id: 'abc', node_type: 'X:Y' }, 'createDocumentNode'],
  ];
  for (const [tool, args, action] of cases) {
    calls = [];
    const result = await client.callTool({ name: tool, arguments: { ...args, dimensions: { language: 'nl' } } });
    assert.notEqual(result.isError, true, tool + ': ' + JSON.stringify(result.content));
    const write = calls.find((c) => c.url.pathname.endsWith('/' + action))!;
    assert.equal(write.method, 'POST', tool);
    assert.deepEqual(JSON.parse(write.body.dimensions), { language: 'nl' }, tool);
  }
});

test('write tools without "dimensions" send no dimensions key', async () => {
  await client.callTool({ name: 'neos_update_node_property', arguments: { node_id: 'abc', property: 'title', value: 'x' } });
  assert.equal('dimensions' in calls[0].body, false);
});

test('neos_create_node_variant sends target and source dimensions and the mode', async () => {
  const result = await client.callTool({
    name: 'neos_create_node_variant',
    arguments: { node_id: 'abc', dimensions: { language: 'nl' }, source_dimensions: { language: 'en_US' }, mode: 'empty' },
  });
  assert.notEqual(result.isError, true, JSON.stringify(result.content));
  const variant = calls.find((c) => c.url.pathname.endsWith('/createNodeVariant'))!;
  assert.equal(variant.method, 'POST');
  assert.equal(variant.body.nodeAggregateId, 'abc');
  assert.deepEqual(JSON.parse(variant.body.dimensions), { language: 'nl' });
  assert.deepEqual(JSON.parse(variant.body.sourceDimensions), { language: 'en_US' });
  assert.equal(variant.body.mode, 'empty');
  assert.equal(variant.body.workspace, 'mcp');
});

test('neos_create_node_variant defaults to copy mode and leaves out the source dimensions', async () => {
  await client.callTool({ name: 'neos_create_node_variant', arguments: { node_id: 'abc', dimensions: { language: 'nl' } } });
  const variant = calls.find((c) => c.url.pathname.endsWith('/createNodeVariant'))!;
  assert.equal(variant.body.mode, 'copy');
  assert.equal('sourceDimensions' in variant.body, false);
});

test('neos_create_node_variant needs target dimensions', async () => {
  const result = await client.callTool({ name: 'neos_create_node_variant', arguments: { node_id: 'abc' } });
  assert.equal(result.isError, true);
  assert.equal(calls.length, 0);
});

test('with "dimensions", nothing is read or written when the bridge has no dimension support', async () => {
  bridgeHasDimensions = false;
  for (const [tool, args] of [
    ['neos_list_pages', {}],
    ['neos_update_node_property', { node_id: 'abc', property: 'title', value: 'x' }],
    ['neos_delete_node', { node_id: 'abc' }],
  ] as Array<[string, Record<string, unknown>]>) {
    calls = [];
    const result = await client.callTool({ name: tool, arguments: { ...args, dimensions: { language: 'nl' } } });
    assert.equal(result.isError, true, tool);
    assert.deepEqual(paths(), ['/neos/mcp/getSiteContext'], tool);
    assert.match(JSON.stringify(result.content), /does not support content dimensions/, tool);
  }
});

test('the dimension tools describe how to work with variants', async () => {
  const { tools } = await client.listTools();
  const variant = tools.find((t) => t.name === 'neos_create_node_variant');
  assert.ok(variant);
  assert.match(variant.description ?? '', /parent/);
  const del = tools.find((t) => t.name === 'neos_delete_node');
  assert.match(del?.description ?? '', /fallback/);
});

test('preview, pending changes and publishing pass "dimensions" and check bridge support first', async () => {
  await client.callTool({ name: 'neos_get_preview_url', arguments: { node_id: 'abc', dimensions: { language: 'nl' } } });
  const preview = calls.find((c) => c.url.pathname.endsWith('/getPreviewUrl'))!;
  assert.deepEqual(JSON.parse(preview.url.searchParams.get('dimensions') ?? ''), { language: 'nl' });

  calls = [];
  await client.callTool({ name: 'neos_list_pending_changes', arguments: { dimensions: { language: 'nl' } } });
  const pending = calls.find((c) => c.url.pathname.endsWith('/listPendingChanges'))!;
  assert.deepEqual(JSON.parse(pending.url.searchParams.get('dimensions') ?? ''), { language: 'nl' });

  calls = [];
  await client.callTool({ name: 'neos_publish_changes', arguments: { dimensions: { language: 'nl' } } });
  const publish = calls.find((c) => c.url.pathname.endsWith('/publishChanges'))!;
  assert.equal(publish.method, 'POST');
  assert.deepEqual(JSON.parse(publish.body.dimensions), { language: 'nl' });
});

test('publishing with "dimensions" is refused when the bridge has no dimension support', async () => {
  bridgeHasDimensions = false;
  const result = await client.callTool({ name: 'neos_publish_changes', arguments: { dimensions: { language: 'nl' } } });
  assert.equal(result.isError, true);
  assert.deepEqual(paths(), ['/neos/mcp/getSiteContext']);
});

test('publishing without "dimensions" sends none', async () => {
  await client.callTool({ name: 'neos_publish_changes', arguments: {} });
  assert.equal('dimensions' in calls[0].body, false);
});

test('several dimensions are sent together, for reading and writing', async () => {
  const dimensions = { language: 'nl', country: 'be' };

  await client.callTool({ name: 'neos_list_pages', arguments: { dimensions } });
  const list = calls.find((c) => c.url.pathname.endsWith('/listPages'))!;
  assert.deepEqual(JSON.parse(list.url.searchParams.get('dimensions') ?? ''), dimensions);

  calls = [];
  await client.callTool({
    name: 'neos_create_node_variant',
    arguments: { node_id: 'abc', dimensions, source_dimensions: { language: 'en_US', country: 'nl' } },
  });
  const variant = calls.find((c) => c.url.pathname.endsWith('/createNodeVariant'))!;
  assert.deepEqual(JSON.parse(variant.body.dimensions), dimensions);
  assert.deepEqual(JSON.parse(variant.body.sourceDimensions), { language: 'en_US', country: 'nl' });
});

test('an empty "dimensions" object is treated as not given', async () => {
  await client.callTool({ name: 'neos_list_pages', arguments: { dimensions: {} } });
  assert.deepEqual(paths(), ['/neos/mcp/listPages']);
  assert.equal(calls[0].url.searchParams.has('dimensions'), false);
});
