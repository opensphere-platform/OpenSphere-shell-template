// OpenSphere Shell Template — production-reference Host integration entry.
const TAG = 'osp-shell-template-shell';
const PLUGIN_ID = 'shell-template';
let injected = false;
let hostContextInstalled = false;
let activeContext;

const SEARCH_ITEMS = [
  { label: 'Shell Template', sublabel: '표준 subShell 개요', path: '/p/shell-template', kind: 'page' },
  { label: 'Shell Template CLI', sublabel: 'os template status · contract', path: '/p/shell-template/sl-cli', kind: 'result' },
  { label: 'Shell Template Manual', sublabel: '표준 subShell 구현 및 운영 안내서', path: '/manual', kind: 'result' },
  { label: 'Shell Template Observability', sublabel: '구조화 로그·Prometheus metrics·trace correlation', path: '/p/shell-template', kind: 'result' },
];

function injectOnce(base) {
  if (injected) return;
  injected = true;
  window.__OSP_NG_API_BASE__ = base;
  const v = `?v=${Date.now()}`;
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = `${base}/app/styles.css${v}`;
  css.setAttribute('data-osp-plugin', PLUGIN_ID);
  document.head.appendChild(css);
  const s = document.createElement('script');
  s.type = 'module'; s.src = `${base}/app/main.js${v}`;
  s.setAttribute('data-osp-plugin', PLUGIN_ID);
  document.head.appendChild(s);
}

async function contributeManual(ctx) {
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
      route: '/p/shell-template',
      sourcePath: 'ui-shell/manual/shell-template.ko.md',
      documentType: 'reference',
      tags: ['subshell', 'template', 'sdk', 'cli', 'manual', 'search', 'notification', 'observability', 'logs'],
    }],
  });
}

export async function activate(ctx) {
  const base = (ctx.api?.baseUrl ?? '').replace(/\/$/, '');
  const contexts = window.__OPENSPHERE_HOST_CONTEXTS__ ||= Object.create(null);
  contexts[PLUGIN_ID] = {
    api: { baseUrl: base, fetch: ctx.api?.fetch },
    identity: ctx.identity,
    grants: ctx.grants,
  };
  hostContextInstalled = true;
  activeContext = ctx;
  injectOnce(base);

  ctx.extensions.registerPage?.({ id: ctx.pluginId, title: 'Shell Template', navBand: '구축 Build', elementTag: TAG });
  ctx.extensions.nav?.contribute([{
    id: 'shell-template',
    label: 'Shell Template',
    children: [
      { id: 'shell-template-overview', label: 'Overview', route: '/p/shell-template' },
      { id: 'shell-template-cli', label: 'CLI', route: '/p/shell-template/sl-cli' },
      { id: 'shell-template-docs', label: 'Documentation', route: '/manual' },
    ],
  }]);
  ctx.extensions.search?.contribute({
    query: (raw) => {
      const q = String(raw || '').trim().toLocaleLowerCase();
      if (!q) return [];
      return SEARCH_ITEMS.filter((item) => `${item.label} ${item.sublabel}`.toLocaleLowerCase().includes(q));
    },
  });
  await contributeManual(ctx);
  ctx.notify?.publish({
    title: 'Shell Template 통합 준비 완료',
    severity: 'success',
    persistent: true,
    category: 'plugin-lifecycle',
    detail: 'Page·API·CLI·Manual·Search·Notification·Observability 표준 계약이 활성화되었습니다.',
    route: '/p/shell-template',
    topic: 'shell-template',
    dedupKey: 'shell-template-ready',
  });
}

export function deactivate() {
  activeContext?.extensions.nav?.clear();
  activeContext?.extensions.search?.clear();
  activeContext?.extensions.manual?.clear();
  activeContext?.notify?.clear();
  if (hostContextInstalled && window.__OPENSPHERE_HOST_CONTEXTS__) delete window.__OPENSPHERE_HOST_CONTEXTS__[PLUGIN_ID];
  document.querySelectorAll(`[data-osp-plugin="${PLUGIN_ID}"]`).forEach((node) => node.remove());
  activeContext = undefined;
  hostContextInstalled = false;
  injected = false;
}
