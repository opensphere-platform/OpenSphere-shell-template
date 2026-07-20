'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8080);
const PLUGINS = path.resolve(process.env.PLUGINS_DIR || '/app/plugins');
const WWW = path.resolve(process.env.WWW_DIR || '/app/www');
const VERSION = process.env.APP_VERSION || '0.1.0-edge.1';

const MIME = Object.freeze({
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.ico': 'image/x-icon',
});

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

function safeFile(root, relativePath) {
  const decoded = decodeURIComponent(relativePath);
  const target = path.resolve(root, `.${path.sep}${decoded}`);
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return target;
}

function serveFile(root, relativePath, res) {
  let file;
  try { file = safeFile(root, relativePath); }
  catch { return json(res, 400, { error: 'bad path encoding' }); }
  if (!file) return json(res, 403, { error: 'forbidden' });
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) return json(res, 404, { error: 'not found' });
    const type = MIME[path.extname(file)] || 'application/octet-stream';
    const stream = fs.createReadStream(file);
    stream.once('open', () => res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }));
    stream.once('error', () => json(res, 500, { error: 'read failed' }));
    stream.pipe(res);
  });
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const route = url.pathname;

    if (req.method === 'GET' && route === '/healthz') {
      res.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' });
      return res.end('ok');
    }
    if (req.method === 'GET' && route === '/api/info') {
      return json(res, 200, {
        id: 'shell-template',
        kind: 'subShell',
        version: VERSION,
        hostRef: 'main',
        permissionProfile: 'none',
      });
    }
    if (req.method === 'GET' && (route === '/plugins' || route === '/plugins/')) {
      const files = fs.existsSync(PLUGINS)
        ? fs.readdirSync(PLUGINS).filter((name) => !name.startsWith('.'))
        : [];
      return json(res, 200, { plugins: files });
    }
    if (req.method === 'GET' && route.startsWith('/plugins/')) {
      return serveFile(PLUGINS, route.slice('/plugins/'.length), res);
    }
    if (req.method === 'GET' && route.startsWith('/app/')) {
      return serveFile(WWW, route.slice('/app/'.length), res);
    }
    return json(res, 404, { error: 'not found' });
  });
}

if (require.main === module) {
  createServer().listen(PORT, () => {
    console.log(`shell-template v${VERSION} listening on :${PORT}`);
  });
}

module.exports = { createServer, safeFile };
