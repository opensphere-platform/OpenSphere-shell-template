# OpenSphere subShell: shell-template — standalone build.
#   Stage 1: build the Angular 22 app (Angular Element <osp-shell-template-shell>) → dist/shell-template/browser
#            (angular.json: @angular/build:application, outputHashing=none → predictable main.js + styles.css)
#   Stage 2: runtime feature-container — server.js serves the built bundle at /app/www + signed ui-shell at
#            /app/plugins + generic /api/k8s/* proxy + WS exec. ws is the only runtime dep (rest are node built-ins).
FROM docker.io/library/node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS build
WORKDIR /app
COPY package.json package-lock.json ./
# @triangles/design-kit는 private git 의존성 — 이 alpine 빌드 샌드박스엔 git도 자격증명도 없다.
# 호스트(자격증명 있음)에서 이미 npm install로 resolve된 것을 그대로 vendoring해 Docker가 clone을 아예 시도 안 하게 한다.
COPY node_modules/@triangles ./node_modules/@triangles
RUN npm install --no-audit --no-fund
COPY angular.json tsconfig.json tsconfig.app.json ./
COPY src ./src
RUN npx ng build --configuration production

FROM docker.io/library/node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2
RUN apk upgrade --no-cache
WORKDIR /app
RUN npm install --omit=dev --no-audit --no-fund --no-save ws@8.21.0 \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
COPY --chmod=0644 server.js /app/server.js
COPY ui-shell/ /app/plugins/
COPY --from=build /app/dist/shell-template/browser /app/www
# Kanidm(콘솔 IdP) self-signed CA — 쓰기/exec 시 ES256 토큰 in-cluster JWKS(svc:8443) TLS 신뢰용.
COPY kanidm-ca.crt /etc/kanidm-ca/ca.crt
ENV PLUGINS_DIR=/app/plugins WWW_DIR=/app/www PORT=8080 \
    NODE_EXTRA_CA_CERTS=/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
    KANIDM_CA_PATH=/etc/kanidm-ca/ca.crt
EXPOSE 8080
USER 1000
CMD ["node", "/app/server.js"]
