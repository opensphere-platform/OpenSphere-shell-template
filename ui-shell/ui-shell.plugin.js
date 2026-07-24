// OpenSphere Shell Template — production-reference Host integration entry.
const TAG = 'osp-shell-template-shell';
const PLUGIN_ID = 'shell-template';
let injected = false;
let activeContext;

function searchItems(basePath) {
  return [
    { label: 'Shell Template', sublabel: '표준 subShell 개요', path: basePath, kind: 'page' },
    { label: 'Shell Template CLI', sublabel: 'os template status · contract', path: `${basePath}/sl-cli`, kind: 'result' },
    { label: 'Shell Template Manual', sublabel: '표준 subShell 구현 및 운영 안내서', path: '/manual', kind: 'result' },
    { label: 'Shell Template Observability', sublabel: '구조화 로그·Prometheus metrics·trace correlation', path: basePath, kind: 'result' },
  ];
}

async function injectOnce(ctx, base) {
  if (injected) return;
  injected = true;
  if (ctx.assets) {
    try {
      await ctx.assets.loadStyle('styles');
      if (!customElements.get(TAG)) await ctx.assets.loadModule('app');
      return;
    } catch (error) {
      injected = false;
      throw error;
    }
  }
  const v = `?v=${Date.now()}`;
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = `${base}/app/styles.css${v}`;
  css.setAttribute('data-osp-plugin', PLUGIN_ID);
  document.head.appendChild(css);
  const s = document.createElement('script');
  s.type = 'module'; s.src = `${base}/app/main.js${v}`;
  s.setAttribute('data-osp-plugin', PLUGIN_ID);
  if (!customElements.get(TAG)) document.head.appendChild(s);
}

async function contributeManual(ctx, basePath) {
  if (!ctx.extensions.manual || !ctx.api?.fetch) throw new Error('Manual contribution contract is unavailable');
  const response = await ctx.api.fetch('plugins/manual/shell-template.ko.md', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Shell Template Manual HTTP ${response.status}`);
  const content = await response.text();
  if (!content.trim()) throw new Error('Shell Template Manual is empty');
  ctx.extensions.manual.contribute({
    sourceId: 'plugin:shell-template',
    name: 'OpenSphere Shell Template Manual',
    authorityTier: 2,
    language: 'ko',
    documents: [{
      id: 'shell-template-standard-ko',
      title: 'OpenSphere 표준 subShell 템플릿 구현 및 운영 안내서',
      content,
      route: basePath,
      sourcePath: 'ui-shell/manual/shell-template.ko.md',
      documentType: 'reference',
      tags: ['subshell', 'template', 'sdk', 'cli', 'manual', 'search', 'notification', 'observability', 'logs'],
    }],
  });
}

export async function activate(ctx) {
  const base = (ctx.api?.baseUrl ?? '').replace(/\/$/, '');
  const routeBase = ctx.routing?.basePath ?? `/p/${ctx.pluginId}`;
  const contexts = window.__OPENSPHERE_HOST_CONTEXTS__ ||= Object.create(null);
  contexts[PLUGIN_ID] = {
    pluginId: ctx.pluginId,
    grants: [...(ctx.grants ?? [])],
    routing: ctx.routing,
    api: ctx.api ? { baseUrl: base, fetch: (input, init) => ctx.api.fetch(input, init) } : undefined,
    identity: ctx.identity,
    host: ctx.host,
  };
  activeContext = ctx;
  try {
    await injectOnce(ctx, base);
  } catch (error) {
    delete contexts[PLUGIN_ID];
    activeContext = undefined;
    throw error;
  }

  ctx.extensions.registerPage?.({ id: ctx.pluginId, title: 'Shell Template', navBand: '구축 Build', elementTag: TAG });
  const items = searchItems(routeBase);
  ctx.extensions.search?.contribute({
    query: (raw) => {
      const q = String(raw || '').trim().toLocaleLowerCase();
      if (!q) return [];
      return items.filter((item) => `${item.label} ${item.sublabel}`.toLocaleLowerCase().includes(q));
    },
  });
  await contributeManual(ctx, routeBase);
  ctx.notify?.publish({
    title: 'Shell Template 통합 준비 완료',
    severity: 'success',
    persistent: true,
    category: 'plugin-lifecycle',
    detail: 'Page·API·CLI·Manual·Search·Notification·Observability 표준 계약이 활성화되었습니다.',
    route: routeBase,
    topic: 'shell-template',
    dedupKey: 'shell-template-ready',
  });
}

export function deactivate() {
  activeContext?.extensions.search?.clear();
  activeContext?.extensions.manual?.clear();
  activeContext?.notify?.clear();
  document.querySelectorAll(`[data-osp-plugin="${PLUGIN_ID}"]`).forEach((node) => node.remove());
  if (window.__OPENSPHERE_HOST_CONTEXTS__) delete window.__OPENSPHERE_HOST_CONTEXTS__[PLUGIN_ID];
  activeContext = undefined;
  injected = false;
}
