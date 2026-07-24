# OpenSphere 표준 subShell 템플릿

이 Manual은 설치된 `shell-template`의 운영 계약을 설명합니다. 새 subShell의 구현·복제 절차는
저장소의 `docs/SUBSHELL-AUTHORING-GUIDE.ko.md`와 `docs/SUBSHELL-COPY-CHECKLIST.ko.md`가
상세 reference입니다.

## subShell의 정의

subShell은 하나의 도메인에 대한 self-contained vertical unit입니다. 자기 domain UI와
backend/workflow/operand를 함께 소유하고 Main Shell의 Host Contract를 통해 설치·활성화됩니다.

subShell은 Main Shell의 로그인, session, trust root, Registry, global navigation, global notification
inbox를 재구현하지 않습니다. 독립 도메인을 소유하지 않는 leaf 기능은 plugin으로 구성합니다.

## Navigation 소유권

- Main Shell 1단에는 `Shell Template` 단일 평면 entry만 표시합니다.
- Overview와 domain group/leaf tree는 subShell 내부 2단 navigation이 소유합니다.
- 이 profile은 `nav:contribute`를 요청하지 않습니다.
- manifest는 global navigation contribution을 명시적 NotApplicable로 선언합니다.
- deep-link와 뒤로/앞으로는 Main Shell이 제공하는 routing seam으로 동기화합니다.

Main Shell 1단에 `Overview`, `CLI`, `Documentation` 같은 하위 tree가 다시 나타나면 계약 역진입니다.

## Host integration

| Integration | 계약 |
|---|---|
| Page | `/p/shell-template`에 custom element 등록 |
| Navigation | Main Shell 단일 entry, 내부 2단 tree |
| API | `/api/plugins/shell-template` same-origin proxy |
| CLI | `/cli/manifest`에서 command 동적 발견 |
| Manual | 한국어 문서를 Main Shell Manual에 등록 |
| Search | page, CLI, 문서를 통합검색에서 발견 |
| Notification | Main Shell 단일 inbox에 lifecycle event 발행 |
| Observability | logs, metrics, trace/correlation context |

지원하지 않는 기능은 누락하거나 Ready로 가장하지 않고 사유와 함께 NotApplicable로 선언해야 합니다.

## API와 상태 endpoint

- `/healthz`: process liveness
- `/readyz`: serving readiness
- `/api/info`: ID, kind, version, host
- `/api/status`: integration readiness
- `/api/contract`: capability와 observability 계약
- `/openapi.json`: machine-readable API
- `/metrics`: Prometheus exposition

UI는 raw service URL이나 cluster credential을 사용하지 않고 Host의 `ctx.api.fetch`를 통해 승인된 API
base만 호출합니다. 이 템플릿 endpoint는 read-only 예시이며 실제 domain write는 backend
authorization, policy, approval, idempotency와 durable audit를 별도로 구현해야 합니다.

## CLI

```text
os template status
os template contract
```

CLI는 Console Registry가 검증·활성화한 digest의 command manifest만 사용합니다. domain command는
CLI binary에 하드코딩하지 않습니다.

## Manual, Search, Notification

- Manual source/document ID는 plugin ID namespace 안에서 안정적으로 유지합니다.
- Search provider는 빈 query에 결과를 반환하지 않고 source 태깅은 Host에 맡깁니다.
- Notification은 별도 inbox가 아니라 `ctx.notify`로 발행합니다.
- 반복 notification은 topic과 dedup key로 중복을 억제합니다.
- disable/uninstall 시 runtime contribution을 clear합니다.

## Log 통합

backend는 모든 HTTP 요청을 한 줄 JSON으로 stdout에 기록합니다.

필수 필드:

```text
schema timestamp severity service consumerId environment namespace pod
resourceKind resourceName message correlationId operationId traceId actorType
status durationMs
```

token, cookie, password, secret, request body 전체를 로그에 남기지 않습니다. file이나 ConfigMap에
로그를 이중 저장하지 않으며 collector가 없는 환경에서는 Kubernetes container log만 권위입니다.

## Metric과 Trace

- 요청 수와 실패 수
- request latency count/sum
- readiness gauge
- notification event count
- W3C `traceparent`
- `x-os-correlation-id`, `x-os-operation-id`, `x-os-trace-id`

Main Shell에서 전달된 ID는 보존하고 없을 때만 생성하며, response header와 log에 같은 값을 사용합니다.

## 보안과 가용성

기본 runtime profile:

- non-root UID/GID
- ServiceAccount token automount 금지
- privilege escalation 금지와 Linux capability drop
- read-only root filesystem
- `RuntimeDefault` seccomp
- CPU/memory requests와 limits
- 2 replicas, PDB, topology spread, 선택적 HPA
- 명시적 NetworkPolicy와 monitoring endpoint

browser에 raw cluster/service credential을 노출하지 않고 공유 Foundation은 승인된 Claim/Binding으로
소비합니다.

## Lifecycle

`activate()`는 page, Search, Manual과 Notification을 등록합니다. `deactivate()`는 runtime
contribution, DOM asset, Host bridge와 subscription을 정리해야 합니다.

설치·업데이트:

```powershell
os extensions inspect ghcr.io/opensphere-platform/opensphere-shell-template:edge
os extensions install ghcr.io/opensphere-platform/opensphere-shell-template:edge `
  --reason "Shell Template 설치 또는 업데이트 승인"
os extensions activate shell-template
```

운영 evidence에는 requested channel뿐 아니라 resolved digest, source revision, signature identity,
provenance와 SBOM 검증 결과를 보존합니다. rollback은 mutable tag가 아니라 Registry가 기록한
previous digest를 사용합니다.
