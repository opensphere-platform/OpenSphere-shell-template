# OpenSphere-shell-shell-template

OpenSphere V2 **subShell** — Shell Template. **독자적·온전한 Angular 22 프로젝트** (SDK 표준 빈 골격 `_skeleton`에서 인스턴스화).

| 측면 | 값 |
|---|---|
| 기술 식별자 | `shell-template` (RFC1123 kebab) — route `/p/shell-template`, proxy `/api/plugins/shell-template` |
| 표시명 | `Shell Template` |
| 프런트엔드 | Angular 22 + Clarity 18, **Angular Element `<osp-shell-template-shell>`** |
| 백엔드 | `server.js` — 제네릭 `/api/k8s/*` 프록시(secrets 차단) + WS exec 게이트웨이 + 정적 서빙 (런타임 dep = `ws`만) |
| 종류 | subShell (1급 host-guest) |

## 구조 (루트 Angular 프로젝트 + 배포 배선)
```
angular.json · tsconfig*.json · package.json · package-lock.json   ← Angular 22 프로젝트
src/                                                                ← 앱 소스 (골격: main.ts·app.component.ts·app.config.ts placeholder)
server.js                                                           ← 백엔드 피처 컨테이너 (K8s 프록시 + WS exec + /app 서빙)
ui-shell/  (ui-shell.plugin.js + manifest)                          ← 셸 플러그인 진입점 (Angular Element 주입, ManifestV2). ⚠️빈 골격은 미서명(.sig 없음)
Dockerfile (멀티스테이지)                                            ← ng build → dist/shell-template/browser → /app/www
uipluginpackage.yaml · rbac.yaml · kanidm-ca.crt                     ← DUPA 설치계약 · RBAC · CA
```

## 로컬 개발
```bash
npm install
npm run build          # ng build --configuration production → dist/shell-template/browser (main.js·styles.css, outputHashing=none)
npm run serve:backend  # node server.js (PLUGINS_DIR/WWW_DIR/PORT env)
# 또는 ng serve (npm start) 로 프런트만
```

## 빌드/배포 (단일 이미지)
```bash
docker build -t localhost:5000/shell-template:<tag> .
docker push localhost:5000/shell-template:<tag>
```
멀티스테이지: stage1이 Angular를 빌드(`browser/main.js`), stage2가 `server.js` + 빌드본 + ui-shell + `ws`로 런타임 이미지 구성.

## DUPA 자동등록
`dupa-registry-controller`가 `uipluginpackage.yaml` reconcile → 서명검증(trust keyId `opensphere-plugins-v1`) → Deployment/Service 생성 → `/registry/plugins.json` 전사 → 메인 셸(opensphere-console)이 동적으로 nav 밴드·라우트·페이지 등록 (**셸 무수정**).

## 서명 (빈 골격 → 인스턴스화 후 1회 필수)
빈 골격은 미서명 상태(`ui-shell.manifest.json.sig` 없음, `uipluginpackage.yaml` sha256=`REPLACE_ON_SIGN`)로 출하된다. 인스턴스화 후 재서명:
```
node <console>/perspectives/_resign.mjs . <durable-key.pem>
```
`ui-shell.plugin.js`의 `entrySha256` 산출 + manifest 서명 + `uipluginpackage.yaml` sha256 핀 자동 갱신.

---
*SDK 표준 골격 출처: `OpenSphere-shell-clusterManager` (완전한 SDK 표준 Angular subShell) — 2026-06-26 빌드/런타임 골격을 추출·파라미터화(`shell-template`/`Shell Template`/`osp-shell-template-shell`).*
