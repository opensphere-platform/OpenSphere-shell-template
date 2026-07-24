# ADR-0001 — subShell navigation ownership

- 상태: Accepted
- 결정일: 2026-07-24
- 적용 대상: `OpenSphere-shell-template` 및 이를 복제하는 모든 subShell
- 관련 규범: `CONSTITUTION-0003` §2.1, §2.2, §10, §20.3

## 배경

subShell이 Main Shell에 runtime navigation tree를 기여하면서 자기 페이지 안에도 domain navigation
tree를 렌더하면 다음과 같은 중복 구조가 생긴다.

```text
Main Shell global navigation
└─ Shell Template
   ├─ Overview
   ├─ CLI
   └─ Documentation

Shell Template page
├─ Overview
├─ Serverless
├─ Cluster management
└─ Design System
```

이 구조는 global navigation과 domain navigation의 소유권을 섞고 동일 목적의 메뉴를 두 번 노출한다.
또한 Main Shell의 폭을 subShell 도메인 구조에 종속시킨다.

## 결정

이 템플릿의 navigation profile은 다음으로 고정한다.

1. Main Shell 1단에는 `registerPage()`로 등록한 **단일 평면 subShell entry**만 노출한다.
2. domain overview, group, leaf로 구성된 tree는 **subShell 페이지 내부 2단 navigation**이 소유한다.
3. source manifest는 `contributions.navigation.enabled=false`, `mode=none`과 사유를 선언한다.
4. browser capability에 `nav:contribute`를 포함하지 않는다.
5. entry module은 `ctx.extensions.nav.contribute()`나 `clear()`를 호출하지 않는다.
6. 내부 route는 hardcoded `/p/<id>` 또는 직접 `history`가 아니라 Host의
   `ctx.routing.basePath`, `navigate()`, `subscribe()`를 사용한다.
7. CLI, Manual과 Search는 Main Shell의 전역 집계 표면에 기여할 수 있지만 global navigation tree의
   자식으로 복제하지 않는다.

`CONSTITUTION-0003` §20.3의 “domain navigation contribution 또는 명시적 NotApplicable” 중 이
템플릿은 **명시적 NotApplicable + 내부 navigation 소유** profile을 선택한다.

## 결과

- Main Shell은 band, 단일 entry, 전역 frame만 소유한다.
- subShell은 자기 domain navigation의 내용, 펼침 상태, active state와 내부 route 의미를 소유한다.
- subShell이 커져도 Main Shell navigation 깊이는 변하지 않는다.
- deep-link, 새로고침, 뒤로/앞으로는 Host routing seam을 통해 동기화된다.
- 전역 Search/Manual/Notification은 유지되지만 메뉴 중복은 생기지 않는다.

## 역진 방지 gate

다음 중 하나라도 발생하면 계약 위반이다.

- source manifest permissions에 `nav:contribute`가 추가됨
- `contributions.navigation.enabled=true` 또는 `mode=runtime`으로 변경됨
- `ui-shell.plugin.js`가 `extensions.nav`를 호출함
- `server.js`가 navigation을 `Ready` 또는 capability `nav:contribute`로 보고함
- 내부 `clr-vertical-nav`가 제거되면서 대체 domain navigation이 제공되지 않음
- 설치 상태에서 내부 이동이 `window.history`를 직접 소유함

`test/module-contract.test.js`와 `test/server.test.js`가 이 조건을 검사한다. 이 결정을 바꾸려면
Main Shell UX와 Host Contract 영향 분석, 본 ADR 상태 변경, source manifest, 구현, 문서와 테스트를
하나의 변경으로 제출해야 한다.
