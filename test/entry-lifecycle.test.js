'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('entry uses Host routing, registers one page, and cleans runtime contributions', async (t) => {
  const source = fs.readFileSync(path.join(root, 'ui-shell', 'ui-shell.plugin.js'), 'utf8');
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  const entry = await import(moduleUrl);

  const originalWindow = global.window;
  const originalDocument = global.document;
  const originalCustomElements = global.customElements;
  global.window = {};
  global.document = { querySelectorAll: () => [] };
  global.customElements = { get: () => undefined };
  t.after(() => {
    global.window = originalWindow;
    global.document = originalDocument;
    global.customElements = originalCustomElements;
  });

  const calls = {
    assets: [],
    page: null,
    search: null,
    manual: null,
    notification: null,
    searchCleared: false,
    manualCleared: false,
    notificationCleared: false,
  };
  const routing = {
    basePath: '/p/runtime-id',
    currentPath: () => '/p/runtime-id',
    navigate: () => {},
    subscribe: () => () => {},
  };
  const ctx = {
    pluginId: 'shell-template',
    grants: ['page:register', 'api:proxy', 'search:contribute', 'manual:contribute', 'notify:publish'],
    routing,
    assets: {
      loadStyle: async (id) => { calls.assets.push(id); },
      loadModule: async (id) => { calls.assets.push(id); },
    },
    api: {
      baseUrl: '/api/plugins/shell-template',
      fetch: async (input) => {
        assert.equal(input, 'plugins/manual/shell-template.ko.md');
        return new Response('# runtime manual');
      },
    },
    extensions: {
      registerPage: (page) => { calls.page = page; },
      search: {
        contribute: (provider) => { calls.search = provider; },
        clear: () => { calls.searchCleared = true; },
      },
      manual: {
        contribute: (manual) => { calls.manual = manual; },
        clear: () => { calls.manualCleared = true; },
      },
    },
    notify: {
      publish: (notification) => { calls.notification = notification; return 'notification-id'; },
      clear: () => { calls.notificationCleared = true; },
    },
  };

  await entry.activate(ctx);

  assert.deepEqual(calls.assets, ['styles', 'app']);
  assert.deepEqual(calls.page, {
    id: 'shell-template',
    title: 'Shell Template',
    navBand: '구축 Build',
    elementTag: 'osp-shell-template-shell',
  });
  assert.equal(calls.manual.documents[0].route, routing.basePath);
  assert.equal(calls.notification.route, routing.basePath);
  assert.equal(calls.search.query('template')[0].path, routing.basePath);
  assert.equal(global.window.__OPENSPHERE_HOST_CONTEXTS__['shell-template'].routing, routing);

  entry.deactivate();

  assert.equal(calls.searchCleared, true);
  assert.equal(calls.manualCleared, true);
  assert.equal(calls.notificationCleared, true);
  assert.equal(global.window.__OPENSPHERE_HOST_CONTEXTS__['shell-template'], undefined);
});
