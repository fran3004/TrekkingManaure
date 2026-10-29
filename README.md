# Trekking Desafío Perijá 13K

Sitio público y panel de administración del Trekking Desafío Perijá 13K (Manaure, Cesar), hechos con React, TypeScript y Vite. Consumen la API REST del backend (repositorio `Trekkingbackend`).

## Organización

- `frontend/`: la aplicación que se ejecuta. Sirve el sitio público y, en `/admin`, el panel.
- `admin/src/`: código del panel (acceso, resumen, participantes, pagos, cupos y exportación). No tiene servidor propio: lo carga `frontend`.
- `shared/`: lo que usan las dos aplicaciones: configuración del evento, imágenes, fuentes, estilos base, iconos, diálogos y el sistema de reservas (`shared/reservas/`).
- `docker/` y `Dockerfile`: imagen de producción (nginx con los archivos compilados).
- `docs/DOCKER.md`: cómo construir y publicar la imagen.

## Ejecutar en desarrollo

Requiere Node.js 22 y la API en marcha. Desde la raíz:

```bash
cp frontend/.env.example frontend/.env
npm install --prefix frontend
npm run dev --prefix frontend
```

- Sitio público: http://localhost:5173/
- Panel: http://localhost:5173/admin (no hay enlace en el sitio; se escribe en la barra de direcciones).

`VITE_API_URL` (en `frontend/.env`) es la dirección de la API; en desarrollo es `http://localhost:8080` si no se define. La API debe tener el origen del front en `CORS_ORIGIN`. El acceso al panel usa el correo y la contraseña del administrador que crea el backend (`ADMIN_EMAIL` y `ADMIN_PASSWORD`).

Al publicar, el hosting debe responder `index.html` también para `/admin` (reescritura de SPA); la configuración de nginx de este repositorio ya lo hace.

## Producción

```bash
cp .env.example .env     # define VITE_API_URL con la URL pública de la API
docker compose up -d --build
```

Detalles y notas de despliegue: [docs/DOCKER.md](docs/DOCKER.md).

## Comprobar y dar formato

```bash
npm run build --prefix frontend          # TypeScript de sitio, panel y shared + compilación
npm run format:check --prefix frontend   # Prettier (.prettierrc.json)
npm run format --prefix frontend         # aplica el formato
```

## Cómo funciona

El sitio y el panel comparten un único sistema de reservas (`shared/reservas/`) que lee y escribe en la API. Nada de las reservas se guarda en el navegador; la sesión del panel vive solo en memoria y se restaura con la cookie de refresh.

1. La persona completa el formulario, revisa el resumen y confirma. La reserva se registra con un código (`PER-0001`…) y con su primer pago esperado en «Por revisar».
2. Paga por llave Bre-B. En el panel, la organización verifica que el dinero llegó y aprueba o rechaza ese pago. No hay comprobantes: la decisión del panel es la única fuente de verdad. Al aprobar o rechazar, el backend avisa a la persona por correo (Brevo).
3. Al aprobar el primer pago, quien se queda en el páramo (titular o acompañante) ocupa cupo; hotel en Manaure y regreso a casa no gastan cupo. Si se agotan los cupos del páramo, el formulario deshabilita esa estadía y la inscripción sigue abierta.
4. Los saldos se registran desde el detalle de cada participante. Los cupos del páramo y la fecha de cierre solo cambian desde «Gestión de cupos».

La configuración de referencia del evento está en `shared/config/index.ts`. Las imágenes viven en Cloudinary (carpeta `trekking-manaure/`) y se entregan optimizadas; el catálogo compartido es `shared/data/imagenes.ts`.
