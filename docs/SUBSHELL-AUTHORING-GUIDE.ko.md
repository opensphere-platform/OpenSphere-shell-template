# OpenSphere subShell 작성 가이드

## 0. 문서의 역할

이 문서는 `OpenSphere-shell-template`의 코드만 보고도 새 subShell의 경계, 필수 기능, 파일 구성,
Host 연결, 보안과 출시 절차를 이해할 수 있도록 만든 구현 가이드다.

Shell/Host 규범의 최종 권위는 `CONSTITUTION-0003-SHELL-HOSTING-INTEGRATION`이고 빌드·공식
버전·channel·GHCR 게시·배포의 최종 권위는 `CONSTITUTION-0005`다. Edge와 GA의 실제 실행은
`RUNBOOK-0005-EDGE-GA-BUILD-PUBLISH-DEPLOY`를 따른다. 이 저장소는 현재 Main Shell Host API와
ModulePackage v1을 사용하는 **실행 가능한 reference profile**이며, 규범을 대체하는 별도 아키텍처가
아니다. 충돌을 발견하면 문서만 고치지 말고 source manifest, 구현과 테스트를 같은 변경으로 정렬한다.

## 1. subShell이란 무엇인가

subShell은 하나의 도메인을 끝에서 끝까지 소유하는 self-contained vertical unit다.

```text
Main Shell
  └─ subShell: domain UI + domain API/workflow + controller/operand
       └─ optional child plugin: 독립 도메인을 소유하지 않는 leaf extension
```

subShell의 판단 기준은 화면 크기나 메뉴 수가 아니다.

- 독립 domain overview와 workflow가 있다.
- domain UI와 backend/operand의 변경·배포 책임이 같은 경계에 있다.
- domain data/API/CRD/controller의 소유권을 설명할 수 있다.
- Main Shell에 host되지만 독립 image digest와 lifecycle을 가진다.

단순 화면 조각, exporter, adapter 또는 한 기능의 leaf extension은 plugin이 적합하다. 독립 backend와
operand를 갖기 시작한 plugin은 subShell 승격 대상으로 본다.

## 2. 책임 경계

| 영역 | Main Shell | subShell | plugin |
|---|---|---|---|
| 제품 frame/header | 소유 | 사용 | 사용 |
| 로그인/session/trust root | 소유 | 재사용 | 재사용 |
| global navigation band | 소유 | 단일 entry 등록 | Host 정책을 따름 |
| domain navigation | 렌더 정책 경계만 제공 | 내용·active·내부 route 소유 | 부모 Host에 leaf 기여 가능 |
| global routing/history | 소유 | `/p/<id>/*` 내부 의미 소유 | 부모가 허용한 route |
| domain UI/workflow | 소유하지 않음 | 소유 | 제한된 leaf 기능 |
| domain backend/operand | 소유하지 않음 | 소유 | 독립 operand 금지 |
| API mediation | same-origin proxy와 actor 전달 | domain authorization·업무 규칙 | 부모 경계 안의 API |
| Manual/Search/Notification | 전역 집계 표면 | 자기 source/provider/event 생산 | 자기 leaf source 생산 |
| logs/metrics/traces | 집계·표시 | 표준 telemetry 생산 | 부모 정책을 따름 |
| lifecycle/failure isolation | 설치·활성화·kill switch | activate/deactivate·복구 | 부모 Host에 종속 |

subShell이 하면 안 되는 일:

- 별도 로그인, browser session authority, trust root 만들기
- Main Shell global navigation 또는 notification inbox 복제
- Registry, signature, capability gate 또는 same-origin proxy 우회
- browser에 cluster credential, service credential, raw secret 노출
- 다른 subShell의 domain backend 소유
- PostgreSQL, object storage, Git, observability 같은 공유 Foundation 복제
- 승인받은 capability보다 넓은 권한을 child plugin에 전달

## 3. 이 템플릿의 불변 규칙

### 3.1 canonical identity

다음 값은 한 ID에서 파생되고 서로 일치해야 한다.

- manifest/package/registration ID
- route `/p/<id>`
- API base `/api/plugins/<id>`
- image와 ServiceAccount 이름
- custom element tag
- CLI namespace, Manual/Search source, notification topic

이 템플릿의 값은 `shell-template`이다. 새 저장소로 복제하면
[복제 체크리스트](SUBSHELL-COPY-CHECKLIST.ko.md)의 전체 검색 절차로 모두 바꾼다.

### 3.2 navigation ownership

Main Shell 1단에는 subShell 단일 entry만 둔다. domain tree는 subShell 내부 2단이 소유한다.

```text
Main Shell global navigation       subShell page
└─ Shell Template                  ├─ Overview
                                  ├─ Domain group
                                  │  ├─ Leaf A
                                  │  └─ Leaf B
                                  └─ Domain docs/resource
```

따라서 이 profile은:

- `page:register`를 사용한다.
- `nav:contribute`를 요청하지 않는다.
- `contributions.navigation`을 disabled/none + 사유로 선언한다.
- `ctx.extensions.nav`를 호출하지 않는다.
- 내부 `clr-vertical-nav`에서 group/leaf/active 상태를 관리한다.

결정 근거와 변경 절차는
[ADR-0001](decisions/ADR-0001-NAVIGATION-OWNERSHIP.ko.md)에 고정되어 있다.

### 3.3 Host-owned routing

Main Shell은 `/p/<id>`와 browser history를 소유한다. subShell은 wildcard 아래의 view 의미만 소유한다.

- base route는 `ctx.routing.basePath`에서 얻는다.
- 내부 이동은 `ctx.routing.navigate()`를 사용한다.
- Host route 변경은 `ctx.routing.subscribe()`로 받는다.
- 직접 URL, 새로고침, 뒤로/앞으로가 같은 view를 복원해야 한다.
- `window.history` fallback은 Host 없는 standalone 개발에만 허용한다.

### 3.4 generated artifacts are not source

사람이 편집하는 계약은 `ui-shell/ui-shell.manifest.source.json`이다.

release 단계가 다음을 생성한다.

```text
source manifest + entry bytes + frontend assets
  └─ ui-shell.manifest.json + signature
       └─ module-package.json + signature
            └─ OCI labels + image digest + provenance + SBOM
```

생성 파일은 Git에서 제외한다. 오래된 descriptor/signature가 최신 source처럼 보이는 역진을 막기 위해서다.

## 4. 저장소 구조

```text
OpenSphere-shell-template/
├─ docs/
│  ├─ SUBSHELL-AUTHORING-GUIDE.ko.md
│  ├─ SUBSHELL-COPY-CHECKLIST.ko.md
│  └─ decisions/
├─ src/
│  ├─ main.ts                       # Angular Element 등록
│  └─ app/
│     ├─ host-context.ts            # Host bridge
│     └─ app.component.ts           # 내부 navigation + page composition
├─ ui-shell/
│  ├─ ui-shell.manifest.source.json # 사람이 편집하는 계약
│  ├─ ui-shell.plugin.js            # activate/deactivate entry
│  └─ manual/                       # runtime Manual source
├─ server.js                        # domain backend reference surface
├─ tools/
│  ├─ package-module.mjs            # digest/descriptor/signature 생성
│  └─ verify-artifacts.mjs          # 생성 산출물 검증
├─ test/                            # contract/regression tests
├─ Dockerfile                       # non-root runtime image
└─ .github/workflows/               # test, sign, publish, attest, channel advance
```

## 5. Host activation과 frontend

### 5.1 entry lifecycle

`ui-shell.plugin.js`는 Host가 검증한 뒤 import하는 ESM entry다.

`activate(ctx)`의 순서:

1. `ctx.api.baseUrl`과 `ctx.routing`을 읽는다.
2. Angular app이 사용할 최소 Host bridge를 plugin ID별 map에 노출한다.
3. Host가 digest를 검증한 style/module asset을 로드한다.
4. `registerPage()`로 canonical page를 등록한다.
5. Search provider와 Manual source를 기여한다.
6. Main Shell notification inbox에 준비 완료 event를 발행한다.

`deactivate()`의 순서:

1. Search와 Manual contribution을 clear한다.
2. 이 source가 발행한 notification을 clear한다.
3. fallback DOM asset과 Host bridge를 제거한다.
4. active context와 local lifecycle 상태를 비운다.

새 timer, subscription, event listener, child plugin을 추가하면 deactivate cleanup도 같은 변경에서 추가한다.

### 5.2 custom element와 style isolation

`src/main.ts`는 하나의 custom element를 등록한다. Angular는 zoneless로 실행해 Host Angular runtime과
중복 Zone patch를 만들지 않는다. `AppComponent`는 Shadow DOM을 사용해 style 경계를 유지한다.

새 subShell은 다음을 지켜야 한다.

- custom element tag는 전역에서 유일해야 한다.
- Host global DOM/CSS를 직접 수정하지 않는다.
- design token과 accessibility convention을 상속한다.
- error가 page pane 밖의 Main Shell을 무너뜨리지 않게 한다.

### 5.3 UI state

실제 도메인 화면은 최소 다음 상태를 구분한다.

- initial/loading
- ready/content
- empty
- permission denied
- dependency pending/degraded
- recoverable error + retry
- terminal error + support evidence

데모의 dummy page는 navigation과 active/deep-link를 설명하는 자리다. 새 subShell에서는 실제 domain
component와 상태 모델로 교체한다.

## 6. Host Context 사용법

`src/app/host-context.ts`는 frontend feature가 사용할 최소 bridge다.

- `routing`: Host-owned deep-link와 history
- `api`: 승인된 same-origin API fetch
- `grants`: 실제 부여 capability 확인
- `identity`: 요청한 경우에만 제공되는 read-only actor view
- `host`: subShell이 승인된 child plugin을 받을 때만 사용하는 adapter

API 호출 예:

```ts
import { shellApiFetch } from './host-context';

const response = await shellApiFetch('api/status', { cache: 'no-store' });
if (!response.ok) throw new Error(`status HTTP ${response.status}`);
const status = await response.json();
```

`fetch('/api/...')`, raw bearer token, cluster endpoint를 직접 사용하지 않는다. Host는 승인 API base를
벗어난 요청을 거부하고 actor context를 backend proxy에 전달한다.

## 7. integration contract

현재 source manifest가 선언한 표준 profile:

| Integration | 선언 | 구현 위치 | 책임 |
|---|---|---|---|
| Page | enabled | `ui-shell.plugin.js` | canonical page와 element 등록 |
| Navigation | disabled/none | `app.component.ts` | global tree N/A, 내부 2단 tree 소유 |
| API | enabled | Host proxy + `server.js` | same-origin domain API |
| CLI | enabled | `/cli/manifest`, `/cli/*` | 동적 command 발견과 실행 계약 |
| Manual | enabled/runtime | `ui-shell/manual`, entry | 한국어 문서 source 등록 |
| Search | enabled/runtime | entry provider | page/CLI/manual 발견 |
| Notification | frontend enabled | `ctx.notify` | Main Shell 단일 inbox에 event 발행 |
| Observability | logs/metrics/traces | `server.js` | 표준 telemetry 생산 |

지원하지 않는 integration을 누락하거나 `Ready`로 가장하지 않는다. `enabled=false`, mode/boolean과
구체적인 사유를 source manifest에 기록하고 runtime status도 `NotApplicable`로 맞춘다.

현재 reference profile의 의도적인 선택:

- global navigation tree는 NotApplicable이고 내부 2단 navigation을 사용한다.
- Manual은 현재 Host v1이 제공하는 runtime contribution seam을 사용한다. 대상 release policy가
  install-time Manual을 요구하면 Host/Controller 지원을 확인한 뒤 manifest, 구현과 테스트를 함께 바꾼다.
- backend notification producer는 없고 frontend lifecycle event만 발행한다.
- domain write operation과 durable write audit는 read-only template에는 없으며, 실제 write 도메인에서는
  필수로 추가한다.
- child plugin host는 capability 표면만 설명하며 child가 있는 subShell에서만 구현한다.

## 8. API와 domain backend

### 8.1 reference endpoints

`server.js`가 제공하는 표면:

| Endpoint | 목적 |
|---|---|
| `/healthz` | process liveness |
| `/readyz` | serving readiness |
| `/api/info` | canonical identity/version |
| `/api/status` | integration readiness |
| `/api/contract` | capability와 observability 계약 |
| `/cli/manifest` | CLI command discovery |
| `/cli/status`, `/cli/contract` | read-only CLI operations |
| `/openapi.json` | machine-readable API |
| `/metrics` | Prometheus exposition |
| `/plugins/*` | signed manifest/entry/manual |
| `/app/*` | verified frontend assets |

### 8.2 실제 도메인에서 추가할 것

이 backend는 read-only 통합 예시다. 새 subShell은 자기 domain에 맞춰 다음을 구현한다.

- domain API와 data model
- workflow와 long-running operation 상태
- CRD/controller/operand 또는 외부 system adapter
- actor authorization과 scope
- write risk, approval, idempotency, optimistic concurrency
- dry-run/diff/confirm/undo 정책
- durable audit와 evidence reference
- timeout/retry/circuit breaker/degraded 처리

health endpoint와 domain readiness를 혼동하지 않는다. process가 살아 있어도 hard dependency가
준비되지 않으면 status에 DependencyPending/Degraded를 표현한다.

### 8.3 security

- browser credential을 신뢰 근거로 삼지 않는다.
- backend에서 actor, scope, resource policy를 다시 검증한다.
- token/cookie/password/secret/body 전체를 로그에 남기지 않는다.
- raw Kubernetes credential과 service token을 UI에 반환하지 않는다.
- write operation은 idempotency key와 operation/correlation ID를 보존한다.

## 9. CLI

`/cli/manifest`는 namespace와 tool 목록을 제공한다. 각 tool은 최소한 다음을 선언한다.

- stable ID와 command
- HTTP method/path
- parameter와 request/response schema
- required scope
- risk와 approval
- lifecycle와 idempotency
- 사용자 설명

CLI binary에 도메인 command를 하드코딩하지 않는다. `os`는 Registry가 검증·활성화한 digest에서
manifest를 발견한다.

현재 예:

```text
os template status
os template contract
```

## 10. Manual, Search, Notification

### Manual

- source ID와 document ID는 안정적이고 plugin ID namespace 안에 둔다.
- language, authority tier, route, document type과 tag를 제공한다.
- disable/uninstall 시 clear한다.
- runtime image에 문서 파일이 실제 포함되는지 Docker context를 검증한다.

### Search

- page 이동뿐 아니라 사용자가 찾을 domain object, CLI와 Manual을 제공한다.
- query가 비어 있으면 결과를 반환하지 않는다.
- source는 Host가 plugin ID로 강제 태깅한다.
- backend search가 필요하면 같은 provider 계약으로 비동기 결과를 제공한다.

### Notification

- 별도 inbox를 만들지 않고 `ctx.notify`만 사용한다.
- lifecycle, task, SLO 등 category를 구분한다.
- 반복 event는 topic/dedup key로 스팸을 막는다.
- route는 Host basePath 또는 승인된 global page를 사용한다.
- durable domain audit를 notification으로 대체하지 않는다.

## 11. Observability

### Structured logs

모든 HTTP 요청은 한 줄 JSON으로 stdout에 기록한다.

필수 필드:

```text
schema timestamp severity service consumerId environment namespace pod
resourceKind resourceName message correlationId operationId traceId actorType
status durationMs
```

file/ConfigMap에 이중 저장하지 않는다. collector가 없는 환경에서는 container log만 권위다.

### Metrics

현재 template은 요청 수, 실패 수, latency count/sum, readiness, event count를 Prometheus 형식으로
제공한다. 실제 subShell은 domain SLI를 추가하되 secret, user ID 같은 high-cardinality label을 넣지 않는다.

### Traces

`traceparent`, `x-os-correlation-id`, `x-os-operation-id`를 보존하고 없을 때만 새 값을 만든다.
응답 header와 logs/operations에서 같은 값을 사용한다.

## 12. child plugin hosting

subShell이 자기 domain 아래 plugin을 수용할 때만 `ctx.host`를 사용한다.

- child manifest의 `hostRef`는 subShell ID다.
- Main Shell과 같은 signature/compatibility/capability 검증을 다시 적용한다.
- child에게 부모보다 넓은 capability를 위임하지 않는다.
- child contribution은 먼저 domain surface에 집계한다.
- disable/uninstall 시 child lifecycle과 cleanup 정책을 정의한다.

child plugin이 없다면 host adapter 사용을 억지로 추가하지 않는다.

## 13. runtime security와 availability

생성 descriptor의 기본값:

- non-root UID/GID 1000
- ServiceAccount token automount false
- privilege escalation 금지와 Linux capability drop
- read-only root filesystem
- `RuntimeDefault` seccomp
- CPU/memory requests와 limits
- 2 replicas, PDB minAvailable 1
- topology spread
- HPA 2–4 replicas
- NetworkPolicy와 monitoring 허용

실제 domain 의존성에 맞춰 값을 조정할 수 있지만 보안 기본값을 약화하려면 명시적인 review와 evidence가
필요하다. 공유 Foundation은 직접 배포하지 않고 승인된 Claim/Binding으로 소비한다.

## 14. packaging, signing, publishing

### 로컬

```powershell
npm ci
npm test
npm run build
```

### Edge release

Edge는 Windows `docker-desktop`, `linux/amd64`, GHCR canonical repository, KST official version,
exact digest 설치를 한 단위로 수행한다. Docker Desktop 전용 edge-local P-256 key를 사용하며 GA
승인키가 로컬에 없다는 이유로 중단하지 않는다.

```powershell
$workspace = 'D:\@PROJECT\OpenSphere\OpenSphere-Platform-V2'
& (Join-Path $workspace 'tools\release\Publish-LocalEdgeModule.ps1') `
  -ModulePath '<새-subShell-repository-path>' `
  -Repository 'ghcr.io/opensphere-platform/<canonical-image>' `
  -SigningKey (Join-Path $env:USERPROFILE '.opensphere\keys\edge-local-v1-p256.pem') `
  -SigningKeyId 'opensphere-edge-local-v1' `
  -InstallReason '<변경 사유>'
```

`package-module.mjs`는:

1. source manifest를 읽는다.
2. entry와 frontend asset SHA-256을 계산한다.
3. release manifest와 signature를 생성한다.
4. ModulePackage descriptor를 생성한다.
5. SDK schema로 descriptor를 검증한다.
6. descriptor를 서명한다.

publisher는 artifact 검증이 끝난 뒤 `linux/amd64` image를 push하고 KST immutable tag와 `edge`를
같은 digest로 이동한 다음 `cli:os` install/activate와 Console projection을 확인한다.

### GA release

GA는 repository의 승인된 GitHub Actions workflow가 clean checkout에서 GA P-256 key로 다시
패키징한다. `linux/amd64,linux/arm64`, provenance, SPDX SBOM, vulnerability/license gate와 승인
증거가 모두 준비된 뒤 KST immutable tag와 `ga`를 이동한다. edge-local key나 Edge digest를
재사용하지 않는다.

Shell Template reference workflow:

```powershell
gh workflow run publish-image.yml `
  --repo opensphere-platform/OpenSphere-shell-template `
  --ref main
$runId = '<run-id-from-run-list>'
gh run watch $runId `
  --repo opensphere-platform/OpenSphere-shell-template `
  --exit-status
```

새 subShell은 같은 GA 계약의 workflow와 canonical repository를 가져야 한다. 세부 secret 경계,
GHCR·attestation 검증과 완료 보고 형식은 workspace의 `RUNBOOK-0005` §6–§8을 따른다.

## 15. install, update, rollback

```powershell
$image = 'ghcr.io/opensphere-platform/<canonical-image>'
$digest = 'sha256:<digest-from-publisher>'
$moduleId = '<module-id>'
os extensions inspect "${image}@${digest}"
os extensions install "${image}:edge" --reason "<승인 사유>"
os extensions activate $moduleId
os extensions list -o json
```

`install`은 channel을 현재 immutable digest로 resolve해 기록하므로 기존 설치의 update 경로로도
사용한다. 먼저 exact digest를 inspect하고, 운영에서는 digest, official/compatibility version,
source revision, build authority, signature identity, provenance/SBOM evidence, requested channel과
reason을 확인한다. 실제 Chrome에서 메뉴·route·화면까지 확인하지 않으면 배포 완료가 아니다.

rollback은 Registry가 기록한 previous digest와 evidence를 사용한다. mutable tag를 과거 상태의
증거로 사용하지 않는다.

## 16. 완료 기준

새 subShell은 다음을 모두 설명하고 시험할 수 있어야 한다.

- 왜 이 기능이 plugin이 아니라 subShell인가
- UI/backend/operand와 data ownership은 어디인가
- Main Shell과 domain navigation의 경계는 무엇인가
- route/API/CLI/Manual/Search/Notification이 canonical ID로 연결되는가
- write authorization/audit/idempotency는 어디서 보장되는가
- loading/error/degraded/dependency pending은 어떻게 표현되는가
- logs/metrics/traces가 어떤 evidence로 수집되는가
- activate/deactivate/update/rollback이 어떤 cleanup과 검증을 거치는가
- source manifest와 signed release artifact가 어떻게 분리되는가
- tests가 어떤 역진을 차단하는가

실행 순서는 [복제·출시 체크리스트](SUBSHELL-COPY-CHECKLIST.ko.md)를 따른다.
