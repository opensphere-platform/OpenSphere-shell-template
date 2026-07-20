# OpenSphere Shell Template

OpenSphere Main Shell에 연결되는 최소권한 subShell 표본입니다. Angular 22와 Clarity 18로 UI를 구성하고, 서명된 OCI module package를 `os extensions` 경로로만 설치합니다.

## 설치 계약

| 항목 | 값 |
|---|---|
| Module ID | `shell-template` |
| Kind / host | `subShell` / `main` |
| Console route | `/p/shell-template` |
| API base | `/api/plugins/shell-template` |
| Permission profile | `none` |
| OCI image | `ghcr.io/opensphere-platform/opensphere-shell-template` |
| Channel | `edge` → `candidate` → `stable` |
| Runtime | non-root Node.js, port `8080`, `/healthz` |

`rbac.yaml`과 직접 적용용 `UIPluginPackage` YAML은 의도적으로 제공하지 않습니다. Controller가 검증된 ModulePackageV1 descriptor로 ServiceAccount, Deployment, Service, PDB와 Registry registration을 생성합니다.

## 활성화되는 통합

- Page contribution: `/p/shell-template`
- API contribution: `/api/plugins/shell-template`
- Main Shell Registry, proxy, lifecycle, rollback, audit

Navigation, CLI, Manual, Search, Notification, Observability contribution은 구현되지 않았으며 manifest에 명시적으로 `disabled`로 선언합니다.

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

`main` push 또는 GitHub Actions 수동 실행은 다음 순서로 `edge`를 게시합니다.

1. 테스트와 Angular production build
2. ModulePackageV1 재생성·서명
3. `linux/amd64`, `linux/arm64` OCI index build
4. platform별 descriptor/signature/source/revision label 동일성 검증
5. GitHub SLSA provenance 및 SPDX SBOM attestation
6. 모든 gate 통과 후 `edge` tag 이동

관리자 설치:

```bash
os extensions inspect ghcr.io/opensphere-platform/opensphere-shell-template:edge
os extensions install ghcr.io/opensphere-platform/opensphere-shell-template:edge \
  --reason "Shell Template edge 검증 설치"
os extensions activate shell-template
```

`edge`는 선택 포인터이며 실제 workload에는 검증된 immutable digest가 기록됩니다.
