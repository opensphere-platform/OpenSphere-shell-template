# subShell 문서 지도

이 디렉터리는 `OpenSphere-shell-template`를 새 subShell의 실행 가능한 참조 구현으로 사용하기 위한
문서 진입점이다. 플랫폼 전체 규범의 최종 권위는
`CONSTITUTION-0003-SHELL-HOSTING-INTEGRATION`이며, 이 저장소는 그 규범을 현재 Host API에 맞춰
코드·manifest·테스트로 구체화한다.

## 읽는 순서

1. [subShell 작성 가이드](SUBSHELL-AUTHORING-GUIDE.ko.md)
   - subShell의 정의, 책임 경계, UI/API/CLI/Manual/Search/Notification/Observability,
     보안, 배포와 수명주기를 설명한다.
2. [복제·출시 체크리스트](SUBSHELL-COPY-CHECKLIST.ko.md)
   - 이 저장소를 새 도메인 subShell로 복제할 때 바꿔야 할 값과 출시 gate를 순서대로 제공한다.
3. [ADR-0001: Navigation ownership](decisions/ADR-0001-NAVIGATION-OWNERSHIP.ko.md)
   - Main Shell 1단에는 단일 평면 entry만 두고 도메인 tree는 subShell 내부 2단이 소유한다는
     되돌리면 안 되는 결정을 기록한다.

빌드·공식 버전·channel·GHCR 게시·배포는 workspace 최상위 `CONSTITUTION-0005`와 그 실행 부속서
`RUNBOOK-0005-EDGE-GA-BUILD-PUBLISH-DEPLOY`를 먼저 읽는다. 특히 Edge의 host-local key와 GA
승인키를 공유하지 않으며, GA 승인키 부재를 Edge 중단 사유로 삼지 않는다.

## 코드가 증명하는 계약

- `ui-shell/ui-shell.manifest.source.json`: 사람이 편집하는 설치·권한·통합 계약
- `ui-shell/ui-shell.plugin.js`: Host `activate/deactivate`와 contribution 구현
- `src/app/host-context.ts`: Host routing/API/identity/child-host bridge
- `src/app/app.component.ts`: 내부 2단 navigation과 deep-link 상태
- `server.js`: API, CLI manifest, OpenAPI, health, metrics, structured logs
- `tools/package-module.mjs`: 빌드 산출물 digest 계산, descriptor 생성, 승인 키 서명
- `test/*.test.js`: 계약과 역진 방지 gate

문서와 코드가 충돌하면 배포하지 않는다. 먼저 플랫폼 Constitution을 확인하고, 이 저장소의 문서,
source manifest, 구현, 테스트를 같은 커밋에서 함께 수정해야 한다.
