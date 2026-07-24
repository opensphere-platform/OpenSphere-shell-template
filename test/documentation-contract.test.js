'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('keeps the repository self-contained as a subShell reference', () => {
  const readme = read('README.md');
  const guide = read('docs', 'SUBSHELL-AUTHORING-GUIDE.ko.md');
  const checklist = read('docs', 'SUBSHELL-COPY-CHECKLIST.ko.md');
  const index = read('docs', 'README.ko.md');

  for (const link of [
    'docs/SUBSHELL-AUTHORING-GUIDE.ko.md',
    'docs/SUBSHELL-COPY-CHECKLIST.ko.md',
    'docs/decisions/ADR-0001-NAVIGATION-OWNERSHIP.ko.md',
  ]) assert.match(readme, new RegExp(link.replaceAll('.', '\\.')));

  for (const section of [
    'subShell이란 무엇인가',
    '책임 경계',
    'navigation ownership',
    'Host Context',
    'integration contract',
    'API와 domain backend',
    'CLI',
    'Manual, Search, Notification',
    'Observability',
    'child plugin hosting',
    'runtime security와 availability',
    'packaging, signing, publishing',
    'install, update, rollback',
  ]) assert.match(guide, new RegExp(section, 'i'), `guide must contain '${section}'`);

  assert.match(checklist, /nav:contribute/);
  assert.match(checklist, /entrySha256/);
  assert.match(checklist, /durable audit/);
  assert.match(index, /코드가 증명하는 계약/);
});

test('records the flat global entry decision and its regression gates', () => {
  const adr = read('docs', 'decisions', 'ADR-0001-NAVIGATION-OWNERSHIP.ko.md');
  assert.match(adr, /상태: Accepted/);
  assert.match(adr, /단일 평면 subShell entry/);
  assert.match(adr, /contributions\.navigation\.enabled=false/);
  assert.match(adr, /nav:contribute/);
  assert.match(adr, /ctx\.routing/);
  assert.match(adr, /역진 방지 gate/);
});

test('ships the runtime Manual through the Docker build context', () => {
  const manual = read('ui-shell', 'manual', 'shell-template.ko.md');
  const dockerignore = read('.dockerignore');
  const dockerfile = read('Dockerfile');
  assert.match(manual, /Navigation 소유권/);
  assert.match(manual, /Log 통합/);
  assert.match(dockerignore, /!ui-shell\/manual\/\*\.md/);
  assert.match(dockerfile, /COPY --chmod=0644 ui-shell\/manual\//);
  assert.match(dockerfile, /find \/app\/plugins -type d -exec chmod 0755/);
  assert.match(dockerfile, /find \/app\/plugins -type f -exec chmod 0644/);
});
