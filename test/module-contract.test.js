'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'ui-shell/ui-shell.manifest.json'), 'utf8'));

test('declares the canonical main-shell route and API surface', () => {
  assert.equal(manifest.id, 'shell-template');
  assert.equal(manifest.kind, 'subShell');
  assert.equal(manifest.hostRef, 'main');
  assert.equal(manifest.apiBase, '/api/plugins/shell-template');
  assert.deepEqual(manifest.permissions, ['page:register', 'api:proxy']);
});

test('declares every optional contribution truthfully', () => {
  assert.equal(manifest.contributions.page.enabled, true);
  assert.equal(manifest.contributions.api.enabled, true);
  for (const name of ['navigation', 'cli', 'manual', 'search', 'notification', 'observability']) {
    assert.equal(manifest.contributions[name].enabled, false, `${name} must remain explicitly disabled`);
    assert.ok(manifest.contributions[name].reason, `${name} must explain why it is disabled`);
  }
});

test('contains no legacy cluster privilege artifacts', () => {
  assert.equal(fs.existsSync(path.join(root, 'rbac.yaml')), false);
  assert.equal(fs.existsSync(path.join(root, 'uipluginpackage.yaml')), false);
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.doesNotMatch(server, /kubernetes\.default\.svc|Impersonate-|\/api\/k8s|k8s-exec/);
});
