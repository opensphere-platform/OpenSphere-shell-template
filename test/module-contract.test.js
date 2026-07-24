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
  assert.deepEqual(manifest.permissions, [
    'page:register', 'api:proxy', 'search:contribute',
    'manual:contribute', 'notify:publish',
  ]);
  assert.equal(manifest.nav.band, '구축 Build');
});

test('implements every production integration contract', () => {
  assert.equal(manifest.contributions.page.enabled, true);
  assert.equal(manifest.contributions.api.enabled, true);
  assert.equal(manifest.contributions.navigation.enabled, false);
  assert.equal(manifest.contributions.navigation.mode, 'none');
  assert.match(manifest.contributions.navigation.reason, /one flat page entry/);
  for (const name of ['cli', 'manual', 'search', 'notification', 'observability']) {
    assert.equal(manifest.contributions[name].enabled, true, `${name} must be implemented`);
  }
  assert.equal(manifest.contributions.cli.namespace, 'template');
  assert.equal(manifest.contributions.cli.manifestPath, '/cli/manifest');
  assert.equal(manifest.contributions.manual.sourceId, 'plugin:shell-template');
  assert.equal(manifest.contributions.notification.frontend, true);
  assert.equal(manifest.contributions.notification.backend, false);
  assert.deepEqual(
    [manifest.contributions.observability.logs, manifest.contributions.observability.metrics, manifest.contributions.observability.traces],
    [true, true, true],
  );
});

test('contains no legacy cluster privilege artifacts', () => {
  assert.equal(fs.existsSync(path.join(root, 'rbac.yaml')), false);
  assert.equal(fs.existsSync(path.join(root, 'uipluginpackage.yaml')), false);
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.doesNotMatch(server, /kubernetes\.default\.svc|Impersonate-|\/api\/k8s|k8s-exec/);
});

test('ships the runtime manual and all host contribution implementations', () => {
  const entry = fs.readFileSync(path.join(root, 'ui-shell', 'ui-shell.plugin.js'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'src', 'app', 'app.component.ts'), 'utf8');
  const manual = fs.readFileSync(path.join(root, 'ui-shell', 'manual', 'shell-template.ko.md'), 'utf8');
  assert.doesNotMatch(entry, /extensions\.nav/);
  assert.match(app, /<clr-vertical-nav/);
  assert.match(entry, /extensions\.search\?\.contribute/);
  assert.match(entry, /extensions\.manual\.contribute/);
  assert.match(entry, /notify\?\.publish/);
  assert.match(manual, /Log 통합/);
  assert.match(manual, /os template status/);
});
