'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createServer, safeFile, CLI_MANIFEST } = require('../server');

test('safeFile confines requests to the selected root', () => {
  const root = path.resolve('C:/opensphere-test-root');
  assert.equal(safeFile(root, 'main.js'), path.join(root, 'main.js'));
  assert.equal(safeFile(root, '../secret'), null);
  assert.equal(safeFile(root, '%2e%2e/secret'), null);
});

test('health, API, CLI, OpenAPI and observability are available without cluster privileges', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shell-template-test-'));
  process.env.PLUGINS_DIR = directory;
  process.env.WWW_DIR = directory;
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const { port } = server.address();

  const health = await fetch(`http://127.0.0.1:${port}/healthz`);
  assert.equal(health.status, 200);
  assert.equal(await health.text(), 'ok');

  const info = await fetch(`http://127.0.0.1:${port}/api/info`);
  assert.equal(info.status, 200);
  assert.equal(info.headers.get('x-os-correlation-id')?.length > 0, true);
  assert.deepEqual(await info.json(), {
    id: 'shell-template',
    kind: 'subShell',
    version: '0.2.0-edge.1',
    hostRef: 'main',
    permissionProfile: 'none',
  });

  const status = await fetch(`http://127.0.0.1:${port}/api/status`, {
    headers: { 'x-os-correlation-id': 'test-correlation', traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01' },
  });
  assert.equal(status.status, 200);
  assert.equal(status.headers.get('x-os-correlation-id'), 'test-correlation');
  assert.equal(status.headers.get('x-os-trace-id'), '0123456789abcdef0123456789abcdef');
  const statusBody = await status.json();
  assert.equal(statusBody.ready, true);
  assert.equal(statusBody.integrations.logs, 'Ready');

  const cli = await fetch(`http://127.0.0.1:${port}/cli/manifest`);
  assert.equal(cli.status, 200);
  assert.deepEqual(await cli.json(), CLI_MANIFEST);

  const openapi = await fetch(`http://127.0.0.1:${port}/openapi.json`);
  assert.equal((await openapi.json()).openapi, '3.1.0');

  const metrics = await fetch(`http://127.0.0.1:${port}/metrics`);
  const exposition = await metrics.text();
  assert.match(exposition, /opensphere_subshell_http_requests_total/);
  assert.match(exposition, /opensphere_subshell_ready\{service="shell-template",version="0\.2\.0-edge\.1"\} 1/);
});
