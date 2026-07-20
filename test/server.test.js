'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createServer, safeFile } = require('../server');

test('safeFile confines requests to the selected root', () => {
  const root = path.resolve('C:/opensphere-test-root');
  assert.equal(safeFile(root, 'main.js'), path.join(root, 'main.js'));
  assert.equal(safeFile(root, '../secret'), null);
  assert.equal(safeFile(root, '%2e%2e/secret'), null);
});

test('health and sample API are available without cluster privileges', async (t) => {
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
  assert.deepEqual(await info.json(), {
    id: 'shell-template',
    kind: 'subShell',
    version: '0.1.0-edge.1',
    hostRef: 'main',
    permissionProfile: 'none',
  });
});
