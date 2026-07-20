'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomBytes, randomUUID } = require('crypto');

const PORT = Number(process.env.PORT || 8080);
const PLUGINS = path.resolve(process.env.PLUGINS_DIR || '/app/plugins');
const WWW = path.resolve(process.env.WWW_DIR || '/app/www');
const VERSION = process.env.APP_VERSION || '0.2.0-edge.1';
const SERVICE = 'shell-template';
const ENVIRONMENT = process.env.OSP_ENVIRONMENT || 'development';
const NAMESPACE = process.env.POD_NAMESPACE || readOptional('/var/run/secrets/kubernetes.io/serviceaccount/namespace') || 'opensphere-console';

const MIME = Object.freeze({
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.ico': 'image/x-icon',
});

const metrics = {
  requests: new Map(),
  failures: new Map(),
  latencyCount: new Map(),
  latencySum: new Map(),
  emittedEvents: 0,
};

function readOptional(file) {
  try { return fs.readFileSync(file, 'utf8').trim(); } catch { return ''; }
}

function safeToken(value, fallback) {
  const text = String(value || '').trim();
  return /^[A-Za-z0-9._:/-]{1,128}$/.test(text) ? text : fallback;
}

function traceId(req) {
  const parent = String(req.headers.traceparent || '').match(/^[\da-f]{2}-([\da-f]{32})-[\da-f]{16}-[\da-f]{2}$/i);
  return parent?.[1]?.toLowerCase() || safeToken(req.headers['x-os-trace-id'], randomBytes(16).toString('hex'));
}

function requestContext(req, route) {
  return {
    timestamp: new Date().toISOString(),
    severity: 'info',
    service: SERVICE,
    consumerId: 'opensphere-console',
    environment: ENVIRONMENT,
    namespace: NAMESPACE,
    resourceKind: 'HTTPRoute',
    resourceName: route,
    message: '',
    correlationId: safeToken(req.headers['x-os-correlation-id'] || req.headers['x-correlation-id'], randomUUID()),
    operationId: safeToken(req.headers['x-os-operation-id'], randomUUID()),
    traceId: traceId(req),
    actorType: req.headers.authorization ? 'user' : 'system',
  };
}

function log(event) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    severity: 'info',
    service: SERVICE,
    consumerId: 'opensphere-console',
    environment: ENVIRONMENT,
    namespace: NAMESPACE,
    resourceKind: 'Process',
    resourceName: SERVICE,
    message: '',
    correlationId: 'startup',
    operationId: 'startup',
    traceId: '',
    actorType: 'system',
    ...event,
  }));
}

function responseHeaders(ctx, extra = {}) {
  return {
    'cache-control': 'no-store',
    'x-os-correlation-id': ctx.correlationId,
    'x-os-operation-id': ctx.operationId,
    'x-os-trace-id': ctx.traceId,
    ...extra,
  };
}

function json(res, status, body, ctx) {
  res.writeHead(status, responseHeaders(ctx, { 'content-type': 'application/json; charset=utf-8' }));
  res.end(JSON.stringify(body));
}

function safeFile(root, relativePath) {
  const decoded = decodeURIComponent(relativePath);
  const target = path.resolve(root, `.${path.sep}${decoded}`);
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return target;
}

function serveFile(root, relativePath, res, ctx) {
  let file;
  try { file = safeFile(root, relativePath); }
  catch { return json(res, 400, { error: 'bad path encoding' }, ctx); }
  if (!file) return json(res, 403, { error: 'forbidden' }, ctx);
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) return json(res, 404, { error: 'not found' }, ctx);
    const type = MIME[path.extname(file)] || 'application/octet-stream';
    const stream = fs.createReadStream(file);
    stream.once('open', () => res.writeHead(200, responseHeaders(ctx, { 'content-type': type })));
    stream.once('error', () => { if (!res.headersSent) json(res, 500, { error: 'read failed' }, ctx); else res.destroy(); });
    stream.pipe(res);
  });
}

function normalizedRoute(route) {
  if (route.startsWith('/plugins/')) return '/plugins/*';
  if (route.startsWith('/app/')) return '/app/*';
  return new Set([
    '/healthz', '/readyz', '/metrics', '/api/info', '/api/status', '/api/contract',
    '/openapi.json', '/cli/manifest', '/cli/status', '/cli/contract', '/plugins', '/plugins/',
  ]).has(route) ? route : 'not_found';
}

function increment(map, key, amount = 1) { map.set(key, (map.get(key) || 0) + amount); }
function metricLines(name, help, type, values, labels) {
  const out = [`# HELP ${name} ${help}`, `# TYPE ${name} ${type}`];
  for (const [key, value] of values) out.push(`${name}{${labels(key)}} ${value}`);
  return out;
}

function metricsText() {
  const parse = (key) => key.split('|');
  const labels3 = (key) => { const [method, route, status] = parse(key); return `service="${SERVICE}",method="${method}",route="${route}",status="${status}"`; };
  const labels2 = (key) => { const [method, route] = parse(key); return `service="${SERVICE}",method="${method}",route="${route}"`; };
  return [
    ...metricLines('opensphere_subshell_http_requests_total', 'HTTP requests handled by the subShell.', 'counter', metrics.requests, labels3),
    ...metricLines('opensphere_subshell_http_failures_total', 'HTTP 5xx responses returned by the subShell.', 'counter', metrics.failures, labels3),
    ...metricLines('opensphere_subshell_http_request_duration_seconds_count', 'HTTP request latency sample count.', 'counter', metrics.latencyCount, labels2),
    ...metricLines('opensphere_subshell_http_request_duration_seconds_sum', 'HTTP request latency total seconds.', 'counter', metrics.latencySum, labels2),
    '# HELP opensphere_subshell_ready SubShell readiness gauge.',
    '# TYPE opensphere_subshell_ready gauge',
    `opensphere_subshell_ready{service="${SERVICE}",version="${VERSION}"} 1`,
    '# HELP opensphere_subshell_events_emitted_total Console notification events emitted by the subShell.',
    '# TYPE opensphere_subshell_events_emitted_total counter',
    `opensphere_subshell_events_emitted_total{service="${SERVICE}"} ${metrics.emittedEvents}`,
    '',
  ].join('\n');
}

const CONTRIBUTIONS = Object.freeze({
  page: 'Ready', navigation: 'Ready', api: 'Ready', cli: 'Ready', manual: 'Ready',
  search: 'Ready', notification: 'Ready', logs: 'Ready', metrics: 'Ready', traces: 'Ready',
});

const CLI_MANIFEST = Object.freeze({
  kind: 'OpenSphereCLICommandManifest',
  apiVersion: 'cli.opensphere.io/v1alpha1',
  namespace: 'template',
  version: VERSION,
  tools: [
    { id: 'template-status', command: 'status', method: 'GET', path: '/cli/status', params: [], risk: 'low', scope: 'read', description: '표준 subShell 템플릿의 실행·통합 상태를 확인합니다.' },
    { id: 'template-contract', command: 'contract', method: 'GET', path: '/cli/contract', params: [], risk: 'low', scope: 'read', description: '표준 템플릿이 구현한 Host 계약을 확인합니다.' },
  ],
});

const OPENAPI = Object.freeze({
  openapi: '3.1.0',
  info: { title: 'OpenSphere Shell Template API', version: VERSION },
  paths: {
    '/api/info': { get: { operationId: 'getTemplateInfo', responses: { 200: { description: 'Template identity' } } } },
    '/api/status': { get: { operationId: 'getTemplateStatus', responses: { 200: { description: 'Runtime and integration readiness' } } } },
    '/api/contract': { get: { operationId: 'getTemplateContract', responses: { 200: { description: 'Implemented host contract' } } } },
    '/metrics': { get: { operationId: 'getTemplateMetrics', responses: { 200: { description: 'Prometheus exposition' } } } },
  },
});

function createServer() {
  return http.createServer((req, res) => {
    const started = process.hrtime.bigint();
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const route = url.pathname;
    const routeName = normalizedRoute(route);
    const ctx = requestContext(req, routeName);
    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - started) / 1e9;
      const status = String(res.statusCode);
      increment(metrics.requests, `${req.method}|${routeName}|${status}`);
      if (res.statusCode >= 500) increment(metrics.failures, `${req.method}|${routeName}|${status}`);
      increment(metrics.latencyCount, `${req.method}|${routeName}`);
      increment(metrics.latencySum, `${req.method}|${routeName}`, duration);
      log({
        ...ctx,
        timestamp: new Date().toISOString(),
        severity: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warning' : 'info',
        message: `${req.method} ${routeName} ${status}`,
        status: res.statusCode,
        durationMs: Math.round(duration * 1000),
      });
    });

    if (req.method === 'GET' && (route === '/healthz' || route === '/readyz')) {
      res.writeHead(200, responseHeaders(ctx, { 'content-type': 'text/plain; charset=utf-8' }));
      return res.end('ok');
    }
    if (req.method === 'GET' && route === '/metrics') {
      res.writeHead(200, responseHeaders(ctx, { 'content-type': 'text/plain; version=0.0.4; charset=utf-8' }));
      return res.end(metricsText());
    }
    if (req.method === 'GET' && route === '/api/info') {
      return json(res, 200, { id: SERVICE, kind: 'subShell', version: VERSION, hostRef: 'main', permissionProfile: 'none' }, ctx);
    }
    if (req.method === 'GET' && (route === '/api/status' || route === '/cli/status')) {
      return json(res, 200, { id: SERVICE, version: VERSION, ready: true, integrations: CONTRIBUTIONS }, ctx);
    }
    if (req.method === 'GET' && (route === '/api/contract' || route === '/cli/contract')) {
      return json(res, 200, {
        id: SERVICE,
        standard: 'OpenSphere subShell reference template',
        capabilities: ['page:register', 'api:proxy', 'nav:contribute', 'search:contribute', 'manual:contribute', 'notify:publish'],
        contributions: CONTRIBUTIONS,
        observability: { logs: 'structured-json', metrics: '/metrics', traces: 'W3C traceparent + x-os-trace-id' },
      }, ctx);
    }
    if (req.method === 'GET' && route === '/openapi.json') return json(res, 200, OPENAPI, ctx);
    if (req.method === 'GET' && route === '/cli/manifest') return json(res, 200, CLI_MANIFEST, ctx);
    if (req.method === 'GET' && (route === '/plugins' || route === '/plugins/')) {
      const files = fs.existsSync(PLUGINS) ? fs.readdirSync(PLUGINS).filter((name) => !name.startsWith('.')) : [];
      return json(res, 200, { plugins: files }, ctx);
    }
    if (req.method === 'GET' && route.startsWith('/plugins/')) return serveFile(PLUGINS, route.slice('/plugins/'.length), res, ctx);
    if (req.method === 'GET' && route.startsWith('/app/')) return serveFile(WWW, route.slice('/app/'.length), res, ctx);
    return json(res, 404, { error: 'not found' }, ctx);
  });
}

if (require.main === module) {
  createServer().listen(PORT, () => {
    log({ resourceKind: 'HTTPServer', resourceName: `:${PORT}`, message: `${SERVICE} v${VERSION} ready`, readiness: 1 });
  });
}

module.exports = { createServer, safeFile, metricsText, CLI_MANIFEST, OPENAPI };
