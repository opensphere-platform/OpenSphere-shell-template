# OpenSphere subShell: shell-template — signed OCI reference implementation.
ARG OS_MODULE_DESCRIPTOR
ARG OS_MODULE_SIGNATURE
FROM docker.io/library/node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY vendor ./vendor
RUN npm ci --no-audit --no-fund
COPY angular.json tsconfig.json tsconfig.app.json ./
COPY src ./src
RUN npm run build

FROM docker.io/library/node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2
ARG OS_MODULE_DESCRIPTOR
ARG OS_MODULE_SIGNATURE
RUN apk upgrade --no-cache
LABEL org.opencontainers.image.title="OpenSphere Shell Template" \
      org.opencontainers.image.version="0.1.0-edge.1" \
      org.opencontainers.image.source="https://github.com/opensphere-platform/OpenSphere-shell-template" \
      io.opensphere.module.descriptor=$OS_MODULE_DESCRIPTOR \
      io.opensphere.module.descriptor.signature=$OS_MODULE_SIGNATURE \
      io.opensphere.module.descriptor.key-id="opensphere-plugins-v5"
WORKDIR /app
COPY --chmod=0644 server.js /app/server.js
COPY ui-shell/ /app/plugins/
COPY --from=build /app/dist/shell-template/browser /app/www
ENV PLUGINS_DIR=/app/plugins WWW_DIR=/app/www PORT=8080 \
    APP_VERSION=0.1.0-edge.1
EXPOSE 8080
USER 1000
CMD ["node", "/app/server.js"]
