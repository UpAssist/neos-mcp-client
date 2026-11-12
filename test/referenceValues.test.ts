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

/** Records bridge calls; the bridge resolves reference targets, so the client must pass them through untouched. */
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

test('neos_update_node_property: a list of reference targets is sent as an array', async () => {
  const targets = ['brand-1', 'brand-2', 'brand-3'];
  const result = await client.callTool({
    name: 'neos_update_node_property',
    arguments: { node_id: 'n1', property: 'brandReferences', value: targets },
  });
  assert.notEqual(result.isError, true);

  assert.equal(calls[0].url, 'http://bridge.test/neos/mcp/updateNodeProperty');
  assert.deepEqual(calls[0].body.value, targets);
});

test('neos_create_content_node: reference targets inside properties are sent unchanged', async () => {
  const properties = { contactPersonReference: 'person-1', brandReferences: ['brand-1', 'brand-2'] };
  const result = await client.callTool({
    name: 'neos_create_content_node',
    arguments: { parent_id: 'p1', node_type: 'Vendor.Site:Content.BrandSelection', properties },
  });
  assert.notEqual(result.isError, true);

  assert.deepEqual(calls[0].body.properties, properties);
});

test('references are described on the tools that read and write them', async () => {
  const { tools } = await client.listTools();
  const byName = (name: string) => tools.find((t) => t.name === name);

  const value = (byName('neos_update_node_property')?.inputSchema.properties as any)?.value?.description ?? '';
  assert.match(value, /"references"/);
  assert.match(value, /targetNodeTypes/);
  assert.match(byName('neos_list_node_types')?.description ?? '', /targetNodeTypes/);
  for (const name of ['neos_list_pages', 'neos_get_page_content', 'neos_get_document_properties', 'neos_get_site_context']) {
    assert.match(byName(name)?.description ?? '', /"references"/, name);
  }
});

test('the references block is described as Neos 9 only', async () => {
  const { tools } = await client.listTools();
  const value = (tools.find((t) => t.name === 'neos_update_node_property')?.inputSchema.properties as any)?.value?.description ?? '';
  assert.match(value, /Neos 9/);
  assert.match(tools.find((t) => t.name === 'neos_list_node_types')?.description ?? '', /Neos 8/);
});
