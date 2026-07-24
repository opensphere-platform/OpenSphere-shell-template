# OpenSphere 표준 subShell 템플릿

이 문서는 `OpenSphere-shell-template`가 모든 subShell에 제공해야 하는 최소 실행·통합·운영 계약을 설명합니다.

## 필수 Host 통합

- Page: `/p/<module-id>`와 안정적인 deep link를 등록합니다.
- API: `/api/plugins/<module-id>` 동일 출처 프록시만 사용합니다.
- Navigation: Main Shell에는 단일 page entry만 등록하고, 도메인 메뉴 트리는 subShell 내부 2단에서 소유합니다.
- CLI: `os <namespace> <command>`가 동적으로 발견할 명령 manifest를 제공합니다.
- Manual: 설치된 모듈의 한국어 문서를 OpenSphere Manual에 등록합니다.
- Search: 페이지·CLI·문서를 통합검색에서 찾을 수 있게 합니다.
- Notification: 수명주기와 운영 상태를 Console 단일 알림함에 발행합니다.

## Log 통합

백엔드는 표준 출력에 한 줄 JSON 로그를 기록합니다. 각 요청 로그에는 다음 필드를 반드시 포함합니다.

`timestamp`, `severity`, `service`, `consumerId`, `environment`, `namespace`, `resourceKind`, `resourceName`, `message`, `correlationId`, `operationId`, `traceId`, `actorType`

모든 로그는 `schema=opensphere.v1`인 단일행 JSON으로 컨테이너 stdout에 기록됩니다. PFS 로그 수집기가
설치되면 Extension Host가 부착한 `opensphere.io/log-*` 메타데이터로 중앙 로그에 편입됩니다. 수집기가
없는 경우에는 Kubernetes 컨테이너 로그만 사용할 수 있으며 장기 보존은 준비되지 않은 상태입니다.

Main Shell이 전달한 `X-OS-Correlation-ID`, `X-OS-Operation-ID`, `traceparent`를 유지하며, 없을 때만 안전한 새 식별자를 생성합니다. 토큰·쿠키·비밀번호·본문은 로그에 기록하지 않습니다.

## Metric과 Trace

- `/metrics`: 요청 수, 실패 수, 지연 합계·표본 수, readiness, 발행 이벤트 수를 Prometheus 형식으로 노출합니다.
- `/readyz`: 실행 준비 상태를 반환합니다.
- `/openapi.json`: 운영 API의 기계 판독 계약을 제공합니다.
- W3C `traceparent`의 trace id와 OpenSphere correlation/operation id를 응답 헤더와 로그에 함께 남깁니다.

## CLI

```text
os template status
os template contract
```

CLI는 Console Registry가 검증·활성화한 digest의 명령 manifest만 사용합니다. 별도 CLI 재빌드가 필요하지 않습니다.

## 보안과 가용성

표준 배포는 non-root, privilege escalation 금지, 모든 Linux capability 제거, read-only root filesystem, RuntimeDefault seccomp를 사용합니다. 최소 2개 replica, PDB, topology spread, 선택적 HPA와 명시적 NetworkPolicy를 적용합니다.
