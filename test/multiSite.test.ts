import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import './support/env.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/server.js';
import { setApiVersion } from '../src/bridge.js';

type Call = { url: URL; method: string; body: any };

const realFetch = globalThis.fetch;
let calls: Call[] = [];
let client: Client;

/** Records bridge calls and answers with a minimal v2 payload. */
function mockFetch() {
  globalThis.fetch = (async (input: any, init: any = {}) => {
    calls.push({
      url: new URL(String(input)),
      method: init.method ?? 'GET',
      body: init.body ? JSON.parse(init.body) : undefined,
    });
    return new Response(JSON.stringify({ apiVersion: 2, success: true }), {
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

async function call(name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  assert.notEqual(result.isError, true, JSON.stringify(result.content));
  assert.equal(calls.length, 1);
  return calls[0];
}

test('neos_list_sites is registered and calls listSites', async () => {
  const { tools } = await client.listTools();
  assert.ok(tools.some((t) => t.name === 'neos_list_sites'));

  const request = await call('neos_list_sites');
  assert.equal(request.url.pathname, '/neos/mcp/listSites');
  assert.equal(request.method, 'GET');
});

test('neos_get_site_context passes "site" only when given', async () => {
  const withSite = await call('neos_get_site_context', { site: 'azubi' });
  assert.equal(withSite.url.pathname, '/neos/mcp/getSiteContext');
  assert.equal(withSite.url.searchParams.get('site'), 'azubi');

  calls = [];
  const withoutSite = await call('neos_get_site_context');
  assert.equal(withoutSite.url.searchParams.has('site'), false);
});

test('neos_list_pages and neos_list_pending_changes pass "site" as query parameter', async () => {
  const pages = await call('neos_list_pages', { site: 'azubi' });
  assert.equal(pages.url.pathname, '/neos/mcp/listPages');
  assert.equal(pages.url.searchParams.get('site'), 'azubi');
  assert.equal(pages.url.searchParams.get('workspace'), 'mcp');

  calls = [];
  const changes = await call('neos_list_pending_changes', { site: 'site' });
  assert.equal(changes.url.pathname, '/neos/mcp/listPendingChanges');
  assert.equal(changes.url.searchParams.get('site'), 'site');
});

test('neos_publish_changes checks multi-site support, then sends "site" in the body, and no site without it', async () => {
  const result = await client.callTool({ name: 'neos_publish_changes', arguments: { site: 'azubi' } });
  assert.notEqual(result.isError, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url.pathname, '/neos/mcp/listSites');
  const perSite = calls[1];
  assert.equal(perSite.url.pathname, '/neos/mcp/publishChanges');
  assert.equal(perSite.method, 'POST');
  assert.deepEqual(perSite.body, { workspace: 'mcp', site: 'azubi' });

  calls = [];
  const all = await call('neos_publish_changes');
  assert.deepEqual(all.body, { workspace: 'mcp' });
});

test('the publish tool warns that without "site" all sites go live', async () => {
  const { tools } = await client.listTools();
  const tool = tools.find((t) => t.name === 'neos_publish_changes');
  assert.match(tool?.description ?? '', /all sites/);
});

test('neos_publish_changes with "site" does not publish when the bridge has no multi-site support', async () => {
  globalThis.fetch = (async (input: any, init: any = {}) => {
    calls.push({ url: new URL(String(input)), method: init.method ?? 'GET', body: init.body ? JSON.parse(init.body) : undefined });
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  const result = await client.callTool({ name: 'neos_publish_changes', arguments: { site: 'azubi' } });
  assert.equal(result.isError, true);
  assert.deepEqual(calls.map((c) => c.url.pathname), ['/neos/mcp/listSites']);
});
