# Docker: sitio público y panel

El sitio y el panel (`/admin`) se compilan y se sirven desde una sola imagen (`Dockerfile` en la raíz): nginx entrega los archivos estáticos, sin Node ni código fuente. La API y la base de datos viven en el repositorio del backend (`Trekkingbackend`), con su propio `docker-compose`.

## Construir y ejecutar

```bash
cp .env.example .env              # define VITE_API_URL
docker compose up -d --build      # sitio y panel en http://localhost:8081
docker compose logs -f web
docker compose down
```

El contenedor escucha en el puerto 8080 y se publica en `WEB_PORT` (8081 por defecto). Corre sin root y tiene `HEALTHCHECK`.

## Variables

| Variable                     | Para qué sirve                                                       |
| ---------------------------- | -------------------------------------------------------------------- |
| `VITE_API_URL`               | URL pública de la API (obligatoria; sin ella la imagen no se crea)   |
| `VITE_CLOUDINARY_CLOUD_NAME` | Nube de Cloudinary donde viven las imágenes (nombre público)         |
| `WEB_PORT`                   | Puerto del servidor desde el que se abre el sitio (por defecto 8081) |

Las variables `VITE_*` se incrustan en el JavaScript al compilar: son públicas, nunca pongas secretos. Si las cambias, reconstruye con `docker compose build web`.

## Despliegue en producción

En producción esta imagen no se levanta con el `docker-compose.yml` de este repositorio: forma parte del stack del backend (`docker-compose.prod.yml` del repositorio `Trekkingbackend`), que la construye desde este repositorio clonado al lado (`/opt/trekking/TrekkingManaure`).

- Un solo origen (`https://<dominio>`): Caddy termina TLS, envía `/api/*` a la API y el resto a este contenedor (puerto 8080, sin publicar).
- La imagen se construye con `VITE_API_URL=https://<dominio>`; el backend tiene `CORS_ORIGIN=https://<dominio>`.
- Caddy añade HSTS y la CSP del sitio (imágenes de `res.cloudinary.com` y `flagcdn.com`).
- `docker/nginx.conf` entrega `index.html` para cualquier ruta de la aplicación (`/`, `/admin`), cachea un año los archivos con hash de `/assets/` y no cachea `index.html`.

Pasos completos (VPS, DNS, `.env`, copias de seguridad): sección «Producción (VPS Linux)» del README del backend.

## Problemas frecuentes

- **`VITE_API_URL` is required**: define la variable en `.env` o con `docker compose build --build-arg VITE_API_URL=...`.
- **El sitio carga pero las reservas fallan con error de conexión**: la URL de `VITE_API_URL` no es alcanzable desde el navegador o la API no tiene ese origen en `CORS_ORIGIN`.
- **Cambié `VITE_API_URL` y no se nota**: la URL se fija al compilar; reconstruye la imagen.
