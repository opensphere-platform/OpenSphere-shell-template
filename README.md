# OpenSphere Standard subShell Template

OpenSphere Main Shell에 연결되는 **표준 subShell 참조 구현**입니다. 규범의 정본은
[`CONSTITUTION-0003-SHELL-HOSTING-INTEGRATION`](../_DOCS_/01-CONSTITUTION/CONSTITUTION-0003-SHELL-HOSTING-INTEGRATION.md)이며,
이 저장소는 그 계약을 빌드·설치·운영 검증 가능한 코드로 보여 줍니다.

Angular 22와 Clarity 18로 UI를 구성하고, 서명·provenance·SBOM이 검증된 OCI module package를
Console Extensions 또는 `os extensions` 경로로만 설치합니다.

## 표준 설치 계약

| 항목 | 값 |
|---|---|
| Module ID | `shell-template` |
| Kind / host | `subShell` / `main` |
| Console route | `/p/shell-template` |
| API base | `/api/plugins/shell-template` |
| Permission profile | `none` |
| OCI image | `ghcr.io/opensphere-platform/opensphere-shell-template` |
| Channel | `edge` → `candidate` → `stable` |
| Runtime | non-root Node.js, port `8080` |
| Readiness | `/healthz`, `/readyz` |
| Metrics | `/metrics` |
| CLI namespace | `os template` |

직접 적용용 RBAC·Deployment·Service YAML은 제공하지 않습니다. 검증된 `ModulePackageV1` descriptor를
DU-PA Controller가 읽어 ServiceAccount, Deployment, Service, PDB, HPA, NetworkPolicy,
ServiceMonitor와 Registry registration을 생성합니다.

## 모든 subShell이 구현해야 하는 통합

- Page: `/p/shell-template`
- API: `/api/plugins/shell-template`
- Navigation: Main Shell의 `구축 Build` band에는 단일 page entry만 등록하고, 도메인 navigation tree는 subShell 내부 2단에서 소유
- CLI: `os template status`, `os template contract`
- Manual: 한글 문서를 Main Shell Manual에 등록
- Search: 통합 검색 provider 등록
- Notification: 활성화 결과를 사용자 알림으로 발행
- Observability: 구조화 로그, Prometheus metrics, correlation/operation/trace context 전파
- Lifecycle: digest 고정 설치, activate/deactivate, rollback, audit

## 통합 로그 계약

HTTP 요청은 한 줄 JSON으로 stdout에 기록합니다. 다음 필드는 모든 subShell의 공통 최소 필드입니다.

`timestamp`, `severity`, `service`, `consumerId`, `environment`, `namespace`,
`resourceKind`, `resourceName`, `message`, `correlationId`, `operationId`, `traceId`, `actorType`

각 레코드는 `schema=opensphere.v1`, `pod`, `status`, `durationMs`를 함께 기록합니다. 로그는 컨테이너
`stdout`으로만 출력하며 파일이나 ConfigMap에 이중 저장하지 않습니다. Extension Host가
`opensphere.io/log-*` 수집 메타데이터를 Pod에 부착하므로 PFS 관측 수집기(Loki/Vector/OTel 등)가
설치되면 재배포 없이 중앙 수집 대상으로 발견할 수 있습니다. 수집기가 없는 환경에서는 Kubernetes
컨테이너 로그만 권위이며 중앙 보존이 활성화되었다고 주장하지 않습니다.

Main Shell이 전달한 `x-correlation-id`, `x-operation-id`, `traceparent`를 보존하고, 없는 값은 안전하게
생성해 응답 헤더에도 돌려줍니다. 비밀·토큰·본문 전체는 로그에 남기지 않습니다.

Prometheus 표준 지표는 요청 수, 실패 수, 지연시간 count/sum, readiness, 발행 event 수를 제공합니다.

## 보안·가용성 기준

- ServiceAccount token 자동 mount 금지
- non-root UID/GID, `allowPrivilegeEscalation: false`, capability 전체 drop
- read-only root filesystem, `RuntimeDefault` seccomp, 쓰기 가능한 `/tmp`만 별도 mount
- 기본 2 replica, PDB, topology spread, HPA(2–4 replicas)
- 기본 deny NetworkPolicy와 같은 namespace·DNS·monitoring만 명시 허용

## 로컬 검증

```bash
npm ci
npm test
npm run build
```

서명 패키지 재생성에는 OpenSphere SDK build와 승인된 P-256 개인키가 필요합니다.

```bash
npm --prefix ../OpenSphere-SDK install
npm --prefix ../OpenSphere-SDK run build
DUPA_SIGNING_KEY=/secure/opensphere-plugins-v5.pem \
DUPA_SIGNING_KEY_ID=opensphere-plugins-v5 \
npm run package:module
```

## 게시와 설치

`main` push 또는 GitHub Actions 수동 실행은 테스트·production build·descriptor 재서명·multi-arch build·
provenance·SBOM gate를 통과한 뒤 immutable 날짜 tag와 `edge` tag를 게시합니다.

```bash
os extensions inspect ghcr.io/opensphere-platform/opensphere-shell-template:edge
os extensions install ghcr.io/opensphere-platform/opensphere-shell-template:edge \
  --reason "표준 subShell Template edge 검증 설치"
os extensions activate shell-template
os template status
os template contract
```

`edge`는 선택 포인터이며 실제 workload에는 검증된 immutable digest가 기록됩니다.
