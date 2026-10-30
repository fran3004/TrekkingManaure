# Trekking Desafío Perijá 13K

Sitio público y panel de administración del Trekking Desafío Perijá 13K (Manaure, Cesar), hechos con React, TypeScript y Vite. El código usa la API de React, pero el bundle lleva Preact con `preact/compat` (`@preact/preset-vite`), mucho más liviano; no uses APIs exclusivas de React 19 (`use`, `useActionState`, `<form action>`, `ref` como prop de componentes). Consumen la API REST del backend (repositorio `Trekkingbackend`).

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
- Panel: http://localhost:5173/admin (también enlazado en el pie del sitio, «Administración»).

`VITE_API_URL` (en `frontend/.env`) es la dirección de la API; en desarrollo es `http://localhost:8080` si no se define. La API debe tener el origen del front en `CORS_ORIGIN`. El acceso al panel usa el correo y la contraseña del administrador que crea el backend (`ADMIN_EMAIL` y `ADMIN_PASSWORD`).

El sitio y el panel son dos páginas: `frontend/index.html` y `frontend/admin.html`. Al publicar, el hosting debe responder `admin.html` para `/admin`; la configuración de nginx de este repositorio ya lo hace (y `vite`/`vite preview` también).

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
2. Paga por llave Bre-B. En el panel, la organización verifica que el dinero llegó y aprueba o rechaza ese pago. No hay comprobantes: la decisión del panel es la única fuente de verdad. Al aprobar o rechazar, el backend avisa a la persona por correo (Brevo). Una decisión equivocada se corrige con «Deshacer» en el aviso que aparece justo después; un pago ya decidido no se devuelve a «Por revisar» desde el panel. Si una reserva rechazada sí pagó, se registra un pago manual en su detalle.
3. Los cupos se apartan al registrar la reserva, aunque el pago siga «Por revisar», y se liberan si se rechaza (a mano o por caducidad a las 12 horas). Hay dos contadores: la carrera (60 por defecto, uno por reserva, con o sin acompañante) y el páramo (30 cupos por defecto, uno por persona que se queda allá). Hotel en Manaure y regreso a casa no gastan cupo del páramo. Si se agotan los cupos del páramo, el formulario deshabilita esa estadía; si se agota la carrera, el formulario desaparece con un aviso. Los dos se cambian en «Gestión de cupos».
4. Los saldos se registran desde el detalle de cada participante. Los cupos de la carrera, los cupos del páramo y la fecha de cierre solo cambian desde «Gestión de cupos».

## Libro de Excel

En el panel, «Exportar información» descarga un libro de Excel (`admin/src/utils/exportar/`, sin dependencias) con las reservas del servidor y las mismas reglas del panel escritas como fórmulas:

- **Resumen**: indicadores (recaudado, por cobrar, pagos por revisar, cupos libres de la carrera, cupos libres del páramo, kits), estados, ingresos por concepto, tallas, estadías, próximos cobros y gráficos. Ingresos, tallas, estadías y kits cuentan solo las reservas activas (no rechazadas).
- **Cómo usar**: pasos para registrar a mano, enlaces a la siguiente fila libre de cada tabla y contadores de avisos.
- **Buscar**: ficha completa y pagos de una inscripción por código o documento.
- **Inscripciones**, **Pagos** y **Corredores**: tablas con filtros y, al final, filas amarillas libres para agregar registros a mano. Tienen listas desplegables con los catálogos de la página, mensajes de ayuda al seleccionar cada celda, validación de fechas y montos, y una columna que dice qué falta (o «✓ Completo»). Una inscripción agregada a mano toma el código `MAN-` y su documento; total, saldo, estado y cupos se calculan solos.
- **Configuración**: fechas, precios, cupos y contacto vigentes de la página, y una comparación de lo calculado en el libro con lo que reporta la página al descargar.

Lo que se agrega en el libro no cambia la página: las inscripciones se hacen en el formulario y los pagos se aprueban o registran en el panel.

La configuración de referencia del evento está en `shared/config/index.ts`. Las imágenes viven en Cloudinary (carpeta `trekking-manaure/`) y se entregan optimizadas; el catálogo compartido es `shared/data/imagenes.ts`.
