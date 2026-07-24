# subShell 복제·출시 체크리스트

이 문서는 `OpenSphere-shell-template`를 새 subShell 저장소로 복제할 때 사용하는 작업 순서다.
체크 항목 하나라도 설명할 수 없으면 이미지를 게시하지 않는다.

## 1. 정체성과 경계

- [ ] 이 컴포넌트가 독립 도메인의 UI와 backend/operand를 함께 소유하는지 확인한다.
- [ ] leaf 기능이면 subShell이 아니라 `plugin`으로 분류한다.
- [ ] RFC1123 ID를 결정하고 모든 위치에서 같은 값을 사용한다.
- [ ] `hostRef=main`, `kind=subShell`, Host/SDK 호환 범위를 결정한다.
- [ ] 다른 subShell의 backend, Main Shell session/trust root, 공유 Foundation을 소유하지 않는다.

다음 값을 전체 검색해 새 도메인 값으로 교체한다.

```powershell
rg -n "shell-template|Shell Template|osp-shell-template-shell|template|opensphere-shell-template"
```

필수 교체 대상:

- repository/image/service 이름
- manifest `id`, `title`, `description`, `version`, `apiBase`, `nav`
- custom element tag
- `src/app/host-context.ts`의 `SHELL_ID`
- CLI namespace와 tool ID
- Manual source/document ID
- Search label과 route
- notification topic/dedup key
- Docker label, ServiceAccount 이름, API/OpenAPI title

## 2. source manifest

- [ ] `ui-shell/ui-shell.manifest.source.json`만 사람이 편집한다.
- [ ] `entrySha256`와 `assets`를 source manifest에 넣지 않는다.
- [ ] 필요한 capability만 `permissions`에 선언한다.
- [ ] 모든 contribution은 `enabled`를 명시한다.
- [ ] 비활성 contribution은 `reason`을 반드시 기록한다.
- [ ] `apiBase`와 contribution API base를 `/api/plugins/<id>`로 일치시킨다.
- [ ] version을 `package.json`, lockfile, server fallback과 맞춘다.

다음 파일은 승인 키가 있는 패키징 단계가 생성하므로 Git에 커밋하지 않는다.

```text
module-package.json
module-package.json.sig
ui-shell/ui-shell.manifest.json
ui-shell/ui-shell.manifest.json.sig
```

## 3. UI와 routing

- [ ] Angular Element 또는 승인된 render mode로 하나의 mount element를 제공한다.
- [ ] Shadow DOM 또는 명시적 style isolation으로 Main Shell CSS와 충돌하지 않는다.
- [ ] Main Shell에는 `registerPage()`로 단일 평면 entry만 등록한다.
- [ ] domain tree는 subShell 내부 2단 navigation으로 제공한다.
- [ ] `nav:contribute`와 `extensions.nav`가 없는지 확인한다.
- [ ] 내부 이동은 `ctx.routing.basePath/navigate/subscribe`를 사용한다.
- [ ] overview, deep-link, 새로고침, 뒤로/앞으로가 같은 view를 복원한다.
- [ ] loading, empty, error, permission denied, degraded 상태를 구현한다.
- [ ] keyboard navigation, focus, label, contrast와 responsive layout을 검증한다.

역진 확인:

```powershell
rg -n "nav:contribute|extensions\.nav|/p/<새-id>" ui-shell src test
```

첫 두 패턴은 0건이어야 한다. hardcoded `/p/<새-id>`는 standalone fallback 이외에 없어야 한다.

## 4. Host integration

- [ ] Page: canonical ID와 element tag를 등록한다.
- [ ] API: UI 요청은 `ctx.api.fetch`만 사용하고 승인 base 밖 요청은 하지 않는다.
- [ ] CLI: `/cli/manifest`와 각 command endpoint를 제공한다.
- [ ] Manual: source ID, 문서 ID, 언어, route, tag를 제공하고 deactivate에서 clear한다.
- [ ] Search: 사용자에게 의미 있는 page/object/CLI를 검색하고 source 태깅은 Host에 맡긴다.
- [ ] Notification: Main Shell 단일 inbox에만 발행하고 dedup key를 사용한다.
- [ ] Observability: structured logs, metrics, trace/correlation propagation을 제공한다.
- [ ] Child plugin을 받는 경우에만 `ctx.host` adapter와 하위 capability 제한을 구현한다.
- [ ] 지원하지 않는 기능은 구현한 척하지 않고 manifest와 status에 NotApplicable 사유를 기록한다.

## 5. backend와 domain ownership

- [ ] 실제 도메인 API, workflow, CRD/controller/operand의 소유자를 명시한다.
- [ ] read API와 write API의 scope, risk, approval, idempotency를 정의한다.
- [ ] write는 backend authorization, policy, dry-run/diff/confirm, durable audit를 통과한다.
- [ ] browser에 cluster credential, service token, raw secret를 반환하지 않는다.
- [ ] Foundation 서비스는 Claim/Binding으로 소비하고 복제하지 않는다.
- [ ] OpenAPI 또는 동등한 tool manifest에 request/response/error schema를 기록한다.
- [ ] retry, timeout, partial failure, degraded와 dependency-pending 상태를 설계한다.

이 템플릿의 backend endpoint는 read-only 통합 예시다. 새 subShell의 write 보안이 자동으로 해결되는
것이 아니므로 domain backend에서 별도로 구현하고 시험해야 한다.

## 6. 보안·가용성·관측

- [ ] non-root UID/GID, privilege escalation 금지, capability drop을 유지한다.
- [ ] read-only root filesystem과 `RuntimeDefault` seccomp를 유지한다.
- [ ] ServiceAccount token automount를 금지하고 필요한 workload identity만 부여한다.
- [ ] NetworkPolicy를 default-deny에서 필요한 egress/ingress만 연다.
- [ ] requests/limits, 2개 이상 replica, PDB, topology spread, HPA 정책을 검토한다.
- [ ] `/healthz`, `/readyz`, `/metrics`가 목적에 맞게 분리되어 있다.
- [ ] 로그에 token, cookie, password, secret, request body 전체가 포함되지 않는다.
- [ ] correlation ID, operation ID, W3C traceparent를 보존한다.

## 7. lifecycle과 packaging

- [ ] `activate()`는 반복 호출과 늦은 Host 연결에 안전하다.
- [ ] `deactivate()`는 Search, Manual, Notification, DOM/style, local subscriptions를 정리한다.
- [ ] disable/uninstall 후 global contribution과 timer/listener가 남지 않는다.
- [ ] production build 후 승인 키로 `npm run package:module`을 실행한다.
- [ ] SDK descriptor validation, entry/assets digest, signature를 검증한다.
- [ ] multi-arch image, immutable digest, provenance와 SBOM을 게시한다.
- [ ] channel tag는 모든 gate가 성공한 뒤에만 새 digest로 이동한다.
- [ ] 설치·update·rollback evidence와 reason을 보존한다.

## 8. 필수 검증

```powershell
npm ci
npm test
npm run build
```

승인 키와 SDK build가 있는 release 환경:

```powershell
$env:DUPA_SIGNING_KEY = "<approved-p256-key-path>"
$env:DUPA_SIGNING_KEY_ID = "opensphere-plugins-v5"
$env:OPENSPHERE_SDK = "<OpenSphere-SDK-path>"
npm run package:module
npm run verify:artifacts
```

출시 후:

```powershell
os extensions inspect ghcr.io/<owner>/<image>:edge
os extensions install ghcr.io/<owner>/<image>:edge --reason "<승인 사유>"
os extensions activate <id>
os extensions list -o json
```

- [ ] descriptor/signature/provenance/SBOM/platform 검증이 모두 `Verified`다.
- [ ] 현재 digest와 requested channel이 기록된다.
- [ ] Main Shell 1단에 subShell entry 하나만 보인다.
- [ ] 내부 2단 tree와 모든 deep-link가 동작한다.
- [ ] disable → activate, update, rollback을 각각 검증한다.
