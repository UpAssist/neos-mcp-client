import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import './support/env.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/server.js';
import { setApiVersion } from '../src/bridge.js';

type Call = { url: string; body: any };

const realFetch = globalThis.fetch;
let calls: Call[] = [];
let client: Client;

/** Records bridge calls; the bridge resolves link values, so the client must pass them through untouched. */
function mockFetch() {
  globalThis.fetch = (async (input: any, init: any = {}) => {
    calls.push({ url: String(input), body: init.body ? JSON.parse(init.body) : undefined });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
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
  mockFetch();
});

test('neos_update_node_property: a link URI string is sent as is', async () => {
  const result = await client.callTool({
    name: 'neos_update_node_property',
    arguments: { node_id: 'n1', property: 'linkObject', value: 'node://target-id' },
  });
  assert.notEqual(result.isError, true);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://bridge.test/neos/mcp/updateNodeProperty');
  assert.equal(calls[0].body.nodeAggregateId, 'n1');
  assert.equal(calls[0].body.value, 'node://target-id');
});

test('neos_update_node_property: a link object is sent as a JSON object, not stringified', async () => {
  const link = { href: 'node://target-id', title: 'Zur Seite', target: '_blank' };
  const result = await client.callTool({
    name: 'neos_update_node_property',
    arguments: { node_id: 'n1', property: 'linkObject', value: link },
  });
  assert.notEqual(result.isError, true);

  assert.deepEqual(calls[0].body.value, link);
});

test('neos_create_content_node: link objects inside properties are sent unchanged', async () => {
  const properties = { title: '<h2>Teaser</h2>', linkObject: { href: 'https://example.org', target: '_blank' } };
  const result = await client.callTool({
    name: 'neos_create_content_node',
    arguments: { parent_id: 'p1', node_type: 'Vendor.Site:Content.Teaser', properties },
  });
  assert.notEqual(result.isError, true);

  assert.equal(calls[0].url, 'http://bridge.test/neos/mcp/createContentNode');
  assert.deepEqual(calls[0].body.properties, properties);
});

test('the link formats are described on the value parameter', async () => {
  const { tools } = await client.listTools();
  const tool = tools.find((t) => t.name === 'neos_update_node_property');
  const description = (tool?.inputSchema.properties as any)?.value?.description ?? '';
  assert.match(description, /node:\/\//);
  assert.match(description, /href/);
});
