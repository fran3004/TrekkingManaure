# syntax=docker/dockerfile:1

# Imagen del sitio público y del panel (/admin) de Trekking Desafío Perijá 13K.
#
# El contexto de construcción es la RAÍZ del repositorio, no `frontend/`: la aplicación
# importa código de `../admin` y `../shared` (ver frontend/tsconfig.json y vite.config.ts),
# así que las tres carpetas deben existir con la misma disposición que en el repositorio.
#
# Tres etapas:
#   deps       instala dependencias (capa que se reutiliza mientras package-lock no cambie)
#   build      compila con TypeScript + Vite y deja los archivos estáticos en dist/
#   production sirve solo esos archivos estáticos con nginx (sin Node, sin código fuente)

ARG NODE_VERSION=22
ARG NGINX_VERSION=1.28

# ---------------------------------------------------------------------------
# deps: dependencias de npm
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app/frontend

# Solo los manifiestos: si el código cambia pero las dependencias no, Docker reutiliza
# esta capa y no vuelve a descargar nada.
COPY frontend/package.json frontend/package-lock.json ./

# `npm ci` instala exactamente lo que dice el package-lock (build reproducible).
# El caché de npm acelera reconstrucciones sin quedar dentro de la imagen.
RUN --mount=type=cache,target=/root/.npm npm ci

# ---------------------------------------------------------------------------
# build: compilación de producción
# ---------------------------------------------------------------------------
FROM deps AS build
WORKDIR /app

# Misma disposición que el repositorio: /app/frontend, /app/admin y /app/shared.
COPY admin ./admin
COPY shared ./shared
COPY frontend ./frontend

# VITE_API_URL es obligatoria: sin ella el sitio llamaría a una API que no existe.
# Variables VITE_*: Vite las incrusta en el JavaScript al compilar. Por eso son públicas
# (cualquiera puede leerlas en el navegador) y se pasan como argumentos de build, no como
# variables de ejecución. Nunca pongas secretos aquí.
ARG VITE_API_URL
ARG VITE_CLOUDINARY_CLOUD_NAME=meoo7p5s
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_CLOUDINARY_CLOUD_NAME=${VITE_CLOUDINARY_CLOUD_NAME}

RUN test -n "$VITE_API_URL" || (echo "Falta VITE_API_URL" && exit 1)
WORKDIR /app/frontend
# `npm run build` = `tsc --noEmit && vite build`: si hay un error de tipos, la imagen no se crea.
RUN npm run build

# ---------------------------------------------------------------------------
# production: nginx sirviendo archivos estáticos
# ---------------------------------------------------------------------------
# nginx-unprivileged corre sin root y escucha en el puerto 8080.
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine AS production

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 8080

# Docker marca el contenedor como «healthy» o «unhealthy» según esta respuesta.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
