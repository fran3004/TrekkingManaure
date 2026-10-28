# Trekking Desafío Perijá 13K

Primer esqueleto visual basado en `diseno.html`: página pública y administración con React, TypeScript y Vite. Conserva la identidad verde profundo, dorado, rojo y naranja del diseño adjunto.

## Organización

- `frontend/`: la aplicación que se ejecuta. Sirve el sitio público y, en `/admin`, el panel.
- `admin/src/`: código del panel (acceso, resumen, participantes, pagos, cupos y exportación). No tiene servidor propio: lo carga `frontend`.
- `shared/`: recursos compartidos: configuración del evento, imágenes, fuentes, colores, iconos, diálogos y el sistema de reservas (`shared/reservas/`).
- `docs/INTEGRACION-BACKEND.md`: qué reemplazar para conectar la API.
- `backend/`: estructura de la futura API, conservada sin implementar integraciones.
- `docs/ESTRUCTURA.md`: mapa de componentes, decisiones y continuación del desarrollo.

El código fuente está formateado en varias líneas. No se incrusta el archivo HTML completo ni se ejecuta su script original.

## Trabajo en equipo

El reparto de Santiago, Damian, administración y backend está en [TRABAJO-EN-EQUIPO.md](docs/TRABAJO-EN-EQUIPO.md). Cada archivo tiene un único responsable definido en `docs/responsables.json`.

Durante el trabajo paralelo, usa `node scripts/team-workflow.mjs check RESPONSABLE --base origin/main` para comprobar tu alcance y `node scripts/team-workflow.mjs format RESPONSABLE --base origin/main` para dar formato solo a tus cambios. Los identificadores son `santiago`, `damian`, `admin` y `backend`.

El comando general de formato que aparece más abajo se reserva para una integración coordinada: también modifica archivos de otras áreas.

## Ejecutar el proyecto

Se requiere Node.js y npm. Desde la raíz:

```powershell
npm.cmd install --prefix frontend
npm.cmd run dev --prefix frontend
```

- Sitio público: http://localhost:5173/
- Panel de administración: http://localhost:5173/admin (no hay enlace en el sitio; se escribe en la barra de direcciones)

El acceso al panel es simulado: entra con cualquier correo y contraseña de formato válido. Detalles en `docs/admin/ACCESO-SIMULADO.md`.

Al publicar, el hosting debe responder `index.html` también para `/admin` (reescritura de SPA).

## Ejecutar con Docker

El sitio y el panel también se empaquetan en una imagen (nginx + archivos compilados), con un servicio PostgreSQL opcional para quien conecte la base de datos. Requiere [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up -d --build                 # sitio en http://localhost:8080
docker compose --profile db up -d --build    # sitio + PostgreSQL
```

Por qué, cómo y cómo conectar la base de datos: [docs/DOCKER.md](docs/DOCKER.md).

## Comprobar y dar formato

```powershell
npm.cmd run build --prefix frontend
npm.cmd run format:check --prefix frontend
```

Para aplicar el formato a ambas aplicaciones, a `shared/` y a la documentación:

```powershell
npm.cmd run format --prefix frontend
```

La configuración de Prettier está en `.prettierrc.json`. El build incluye la comprobación de TypeScript del sitio, del panel y de `shared/`.

## Alcance de esta entrega

El sitio y el panel comparten un único sistema de reservas (`shared/reservas/`), que lee y escribe en la API del backend (`VITE_API_URL`, por defecto `http://localhost:8080`; ver `shared/reservas/servicios/`). Nada de las reservas se guarda en el navegador; la sesión del panel vive solo en memoria y se restaura con la cookie de refresh:

1. La persona completa el formulario, revisa el resumen y confirma. La reserva se registra con un código (`PER-0001`…) y con su primer pago esperado en «Por revisar».
2. Paga por llave Bre-B. En el panel, la organización verifica que el dinero llegó y aprueba o rechaza ese pago. No hay comprobantes: la decisión del panel es la única fuente de verdad.
3. Al aprobar el primer pago, quien se queda en el páramo (titular o acompañante) ocupa cupo; hotel en Manaure y regreso a casa no gastan cupo. Si se agotan los cupos del páramo, el formulario deshabilita esa estadía y la inscripción sigue abierta. El contador del sitio, el panel y las demás pestañas abiertas se actualizan al instante.
4. Los saldos se registran desde el detalle de cada participante. Los cupos del páramo (60 al inicio) y la fecha de cierre (9 de noviembre de 2026 al inicio; último día para inscribirse y para pagar el restante) solo cambian desde «Gestión de cupos».

El sistema arranca vacío: no hay datos ni cuentas de ejemplo. La cuenta de administración la crea el backend.

La configuración de referencia está en `shared/config/index.ts`. Las imágenes del sitio viven en Cloudinary (carpeta `trekking-manaure/`) y se entregan optimizadas para móvil y PC; las dos aplicaciones usan el mismo catálogo (`shared/data/imagenes.ts`). Cómo agregar o cambiar una imagen: `docs/frontend/imagenes-cloudinary.md`.
