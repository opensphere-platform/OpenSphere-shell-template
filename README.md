# OpenSphere Standard subShell Template

OpenSphere Main Shell에 연결되는 표준 subShell의 **실행 가능한 참조 구현**입니다. 이 저장소 하나에서
subShell의 정의, 책임 경계, frontend/backend 구성, Host integration, 보안, 서명 패키징과 운영
lifecycle을 확인할 수 있습니다.

플랫폼 규범의 최종 권위는 `CONSTITUTION-0003-SHELL-HOSTING-INTEGRATION`이며, 이 저장소는
현재 Host API에 적용한 self-contained reference profile입니다.

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
| Channel | `edge` → `candidate` → `stable` |
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

승인 키가 있는 release pipeline이 생성하며 Git에 커밋하지 않는 파일:

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

서명 산출물 검증은 승인된 P-256 key와 OpenSphere SDK build가 있는 release 환경에서 실행합니다.

```powershell
$env:DUPA_SIGNING_KEY = "<approved-p256-key-path>"
$env:DUPA_SIGNING_KEY_ID = "opensphere-plugins-v5"
$env:OPENSPHERE_SDK = "<OpenSphere-SDK-path>"
npm run package:module
npm run verify:artifacts
```

## 게시와 설치

`main` push는 테스트, production build, descriptor 재생성·서명, multi-arch image, provenance와 SBOM
gate를 통과한 뒤 immutable 시간 tag와 `edge`를 같은 digest로 이동합니다.

```powershell
os extensions inspect ghcr.io/opensphere-platform/opensphere-shell-template:edge
os extensions install ghcr.io/opensphere-platform/opensphere-shell-template:edge `
  --reason "표준 subShell Template 검증 설치 또는 업데이트"
os extensions activate shell-template
os extensions list -o json
```

`edge`는 선택 포인터이고 실제 workload와 audit에는 검증된 immutable digest가 기록됩니다.
