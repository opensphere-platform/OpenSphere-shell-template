# OpenSphere Standard subShell Template

OpenSphere Main Shell에 연결되는 표준 subShell의 **실행 가능한 참조 구현**입니다. 이 저장소 하나에서
subShell의 정의, 책임 경계, frontend/backend 구성, Host integration, 보안, 서명 패키징과 운영
lifecycle을 확인할 수 있습니다.

Shell/Host 계약의 최종 권위는 `CONSTITUTION-0003-SHELL-HOSTING-INTEGRATION`이고, 빌드·공식
버전·channel·GHCR 게시·배포의 최종 권위는 workspace의 `CONSTITUTION-0005`다. 실제 명령과
완료 판정은 `RUNBOOK-0005-EDGE-GA-BUILD-PUBLISH-DEPLOY`를 따른다. 이 저장소는 현재 Host API에
적용한 self-contained reference profile이며 release 규칙을 별도로 재정의하지 않는다.

## 가장 먼저 읽을 문서

- [subShell 작성 가이드](docs/SUBSHELL-AUTHORING-GUIDE.ko.md) — 정의부터 모든 책임과 기능
- [복제·출시 체크리스트](docs/SUBSHELL-COPY-CHECKLIST.ko.md) — 새 subShell을 만드는 정확한 순서
- [ADR-0001: Navigation ownership](docs/decisions/ADR-0001-NAVIGATION-OWNERSHIP.ko.md) —
  Main Shell 1단 단일 entry와 subShell 내부 2단 tree 결정
- [문서 지도](docs/README.ko.md)

## 핵심 불변 규칙

1. subShell은 독립 도메인의 UI와 backend/operand를 함께 소유하는 vertical unit입니다.
2. Main Shell 1단에는 `registerPage()`로 단일 평면 entry만 등록합니다.
3. domain navigation tree와 내부 route 의미는 subShell 페이지 내부 2단이 소유합니다.
4. 이 profile은 `nav:contribute`를 사용하지 않고 navigation을 명시적 NotApplicable로 선언합니다.
5. 내부 이동은 hardcoded route/history가 아니라 `ctx.routing`을 사용합니다.
6. UI의 API 요청은 `ctx.api.fetch`를 통해 승인된 same-origin base만 사용합니다.
7. signed manifest와 descriptor는 source가 아니라 release pipeline 생성물입니다.
8. 비활성 기능은 누락하거나 Ready로 가장하지 않고 사유가 있는 NotApplicable로 선언합니다.

## 표준 설치 계약

| 항목 | 값 |
|---|---|
| Module ID | `shell-template` |
| Kind / host | `subShell` / `main` |
| Console route | `/p/shell-template` |
| API base | `/api/plugins/shell-template` |
| Main Shell navigation | `구축 Build` band의 단일 평면 entry |
| Domain navigation | subShell 내부 2단 tree |
| Permission profile | `none` |
| OCI image | `ghcr.io/opensphere-platform/opensphere-shell-template` |
| Channel | 개발 `edge` / 공식 `ga` (`candidate`, `stable`은 별도 검증 채널) |
| Runtime | non-root Node.js, port `8080` |
| Health / readiness | `/healthz`, `/readyz` |
| Metrics | `/metrics` |
| CLI namespace | `os template` |

## 구현한 Host integration

| Integration | 구현 |
|---|---|
| Page | `/p/shell-template` custom element 등록 |
| Navigation | global tree NotApplicable, 내부 2단 tree |
| API | `/api/plugins/shell-template` same-origin proxy |
| CLI | `os template status`, `os template contract` |
| Manual | 한국어 runtime Manual source |
| Search | page/CLI/Manual 검색 provider |
| Notification | Main Shell 단일 inbox lifecycle event |
| Observability | JSON stdout logs, Prometheus metrics, correlation/operation/trace |
| Lifecycle | activate/deactivate, signed digest install, update, rollback evidence |

실제 도메인 subShell은 이 통합 표면에 자기 API, workflow, CRD/controller/operand, authorization,
write audit와 degraded 상태를 추가해야 합니다. 이 템플릿의 read-only backend만 복사해서 write
보안이 충족되었다고 간주하면 안 됩니다.

## 사람이 편집하는 파일과 생성 파일

사람이 편집하는 manifest:

```text
ui-shell/ui-shell.manifest.source.json
```

Edge 또는 GA의 해당 trust 경계에서 release pipeline이 생성하며 Git에 커밋하지 않는 파일:

```text
ui-shell/ui-shell.manifest.json
ui-shell/ui-shell.manifest.json.sig
module-package.json
module-package.json.sig
```

이 분리는 오래된 descriptor나 signature가 현재 계약처럼 보이는 문제를 방지합니다.

## 로컬 검증

```powershell
npm ci
npm test
npm run build
```

로컬 단위 검증은 서명키 없이 끝낸다. 서명 산출물은 Edge와 GA의 서로 다른 trust 경계에서
release 절차가 생성한다.

Edge 전체 게시·설치 명령:

```powershell
$workspace = 'D:\@PROJECT\OpenSphere\OpenSphere-Platform-V2'
& (Join-Path $workspace 'tools\release\Publish-LocalEdgeModule.ps1') `
  -ModulePath (Join-Path $workspace 'OpenSphere-shell-template') `
  -Repository 'ghcr.io/opensphere-platform/opensphere-shell-template' `
  -SigningKey (Join-Path $env:USERPROFILE '.opensphere\keys\edge-local-v1-p256.pem') `
  -SigningKeyId 'opensphere-edge-local-v1' `
  -InstallReason 'Shell Template 로컬 edge 빌드·게시·설치'
```

## 게시와 설치

Edge는 Windows Docker Desktop에서 `linux/amd64`만 로컬 build하고, KST `yyyyMMddHHmm` immutable
tag와 `edge`를 같은 GHCR digest로 게시한 뒤 `cli:os`로 설치·활성화한다. 위 스크립트가 build,
edge-local 서명, artifact 검증, push, tag 검증, install과 activate를 한 transaction으로 수행한다.
GA 승인키가 로컬에 없다는 것은 Edge 중단 사유가 아니다. 단, edge-local 키 결과는 GA로 승격할
수 없다.

```powershell
$digest = 'sha256:<digest-from-publisher>'
os extensions inspect "ghcr.io/opensphere-platform/opensphere-shell-template@${digest}"
os extensions list -o json
```

`edge`는 선택 포인터이고 실제 workload와 audit에는 검증된 immutable digest가 기록됩니다.

GA는 `.github/workflows/publish-image.yml`을 GitHub Actions에서 수동 실행한다. workflow는 clean
checkout에서 승인된 `DUPA_SIGNING_KEY_PEM`/`opensphere-plugins-v5`로 다시 서명하고,
`linux/amd64,linux/arm64` build, provenance, SPDX SBOM, KST immutable tag와 `ga`를 검증한다.
로컬 Edge digest를 GA로 retag하지 않는다.

```powershell
gh workflow run publish-image.yml `
  --repo opensphere-platform/OpenSphere-shell-template `
  --ref main
gh run list `
  --repo opensphere-platform/OpenSphere-shell-template `
  --workflow publish-image.yml `
  --limit 5
$runId = '<run-id-from-run-list>'
gh run watch $runId `
  --repo opensphere-platform/OpenSphere-shell-template `
  --exit-status
```

Edge·GA의 사전 조건, GHCR 확인, 실패 처리와 완료 증거는 workspace 최상위
`_DOCS_/01-CONSTITUTION/RUNBOOK-0005-EDGE-GA-BUILD-PUBLISH-DEPLOY.md`를 따른다.
