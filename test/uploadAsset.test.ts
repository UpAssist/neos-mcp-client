import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import './support/env.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/server.js';

type Call = { url: string; method: string; headers: Record<string, string>; body: any };

const realFetch = globalThis.fetch;
let calls: Call[] = [];
let tmp: string;
let client: Client;

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

/** Replaces fetch: remote downloads get `remote`, bridge calls are recorded and answered with a canned asset. */
function mockFetch(remote: { status?: number; body?: Buffer } = {}) {
  globalThis.fetch = (async (input: any, init: any = {}) => {
    const url = String(input);
    if (url.startsWith('http://bridge.test/')) {
      calls.push({
        url,
        method: init.method ?? 'GET',
        headers: init.headers ?? {},
        body: init.body ? JSON.parse(init.body) : undefined,
      });
      return new Response(JSON.stringify({ success: true, duplicate: false, asset: { identifier: 'abc', filename: 'x' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(remote.body ?? Buffer.alloc(0), { status: remote.status ?? 200 });
  }) as typeof fetch;
}

async function callUpload(args: Record<string, unknown>) {
  return client.callTool({ name: 'neos_upload_asset', arguments: args });
}

before(async () => {
  tmp = mkdtempSync(join(tmpdir(), 'neos-mcp-upload-'));
  writeFileSync(join(tmp, 'photo.png'), PNG);
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: 'test', version: '0.0.0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
});

after(() => {
  globalThis.fetch = realFetch;
  rmSync(tmp, { recursive: true, force: true });
});

beforeEach(() => {
  calls = [];
  mockFetch();
});

test('the tool is registered', async () => {
  const { tools } = await client.listTools();
  assert.ok(tools.some((t) => t.name === 'neos_upload_asset'));
});

test('file_path: reads the file, defaults the filename, base64-encodes it and posts to uploadAsset', async () => {
  const result = await callUpload({ file_path: join(tmp, 'photo.png'), title: 'T', tags: ['a'], asset_collections: ['C'] });
  assert.notEqual(result.isError, true);

  assert.equal(calls.length, 1);
  const [call] = calls;
  assert.equal(call.url, 'http://bridge.test/neos/mcp/uploadAsset');
  assert.equal(call.method, 'POST');
  assert.equal(call.body.filename, 'photo.png');
  assert.equal(call.body.content, PNG.toString('base64'));
  assert.equal(call.body.title, 'T');
  assert.deepEqual(call.body.tags, ['a']);
  assert.deepEqual(call.body.assetCollections, ['C']);
  assert.equal(call.body.allowDuplicate, false);
  assert.equal(call.headers['Authorization'], 'Bearer unit-test-token');
});

test('file_path: an explicit filename wins over the path', async () => {
  await callUpload({ file_path: join(tmp, 'photo.png'), filename: 'renamed.png' });
  assert.equal(calls[0].body.filename, 'renamed.png');
});

test('url: downloads client-side and uploads the bytes, filename derived from the URL', async () => {
  mockFetch({ body: PNG });
  await callUpload({ url: 'https://example.com/some%20dir/Logo%20Final.png?x=1' });
  assert.equal(calls[0].body.filename, 'Logo Final.png');
  assert.equal(calls[0].body.content, PNG.toString('base64'));
});

test('url: a failed download is reported as a tool error and nothing reaches the bridge', async () => {
  mockFetch({ status: 404 });
  const result = await callUpload({ url: 'https://example.com/missing.png' });
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result.content), /Download failed \(404\)/);
  assert.equal(calls.length, 0);
});

test('base64_content: strips a data: URI prefix and requires a filename', async () => {
  await callUpload({ base64_content: `data:image/png;base64,${PNG.toString('base64')}`, filename: 'inline.png' });
  assert.equal(calls[0].body.content, PNG.toString('base64'));
  assert.equal(calls[0].body.filename, 'inline.png');

  calls = [];
  const result = await callUpload({ base64_content: PNG.toString('base64') });
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result.content), /filename is required/);
  assert.equal(calls.length, 0);
});

test('exactly one source must be given', async () => {
  for (const args of [{}, { file_path: join(tmp, 'photo.png'), url: 'https://example.com/a.png' }]) {
    const result = await callUpload(args);
    assert.equal(result.isError, true);
    assert.match(JSON.stringify(result.content), /exactly one of file_path, url or base64_content/);
  }
  assert.equal(calls.length, 0);
});

test('a missing local file is a tool error', async () => {
  const result = await callUpload({ file_path: join(tmp, 'does-not-exist.png') });
  assert.equal(result.isError, true);
  assert.equal(calls.length, 0);
});

test('allow_duplicate and copyright_notice are passed to the bridge under the bridge parameter names', async () => {
  await callUpload({ file_path: join(tmp, 'photo.png'), allow_duplicate: true, copyright_notice: '(c) me', caption: 'cap' });
  assert.equal(calls[0].body.allowDuplicate, true);
  assert.equal(calls[0].body.copyrightNotice, '(c) me');
  assert.equal(calls[0].body.caption, 'cap');
});

test('the bridge response is returned to the caller', async () => {
  const result = await callUpload({ file_path: join(tmp, 'photo.png') });
  const text = (result.content as Array<{ text: string }>)[0].text;
  assert.equal(JSON.parse(text).asset.identifier, 'abc');
});
