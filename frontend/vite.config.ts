import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite';
import preact from '@preact/preset-vite';

// Dos páginas: el sitio (index.html) y el panel (admin.html). Cada una trae solo su JavaScript y su
// CSS. En producción nginx entrega admin.html para /admin; este plugin hace lo mismo en `vite` y en
// `vite preview`.
const RUTA_PANEL = /^\/admin(?:[/?#]|$)/;

function rutaDelPanel(): Plugin {
  // El proyecto no trae los tipos de Node: basta con saber que la petición tiene `url`.
  const reescribir = (req: { url?: string }, _res: unknown, next: () => void) => {
    if (req.url && RUTA_PANEL.test(req.url)) req.url = '/admin.html';
    next();
  };
  return {
    name: 'ruta-del-panel',
    configureServer: (server) => void server.middlewares.use(reescribir),
    configurePreviewServer: (server) => void server.middlewares.use(reescribir),
  };
}

// CSS del sitio en dos partes:
// - El de la primera pantalla va dentro del HTML (<style>): se pinta sin esperar otra solicitud.
// - El de las secciones de abajo (styles/diferido.css, entrada propia del build) se enlaza al final
//   del <body>, después del contenido pre-renderizado: no bloquea el primer pintado.
// Solo en index.html; el panel conserva su hoja. La CSP de Caddy ya permite estilos en línea.
const CSS_DIFERIDO = 'src/styles/diferido.css';

function cssDelSitio(): Plugin {
  return {
    name: 'css-del-sitio',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.filename.endsWith('index.html')) return html;
        const enlace = (href: string): HtmlTagDescriptor => ({
          tag: 'link',
          attrs: { rel: 'stylesheet', href },
          injectTo: 'body',
        });
        // En desarrollo Vite sirve el archivo tal cual.
        if (!ctx.bundle) return { html, tags: [enlace('/' + CSS_DIFERIDO)] };
        const bundle = ctx.bundle;
        const finHead = html.indexOf('</head>');
        const head = html
          .slice(0, finHead)
          .replace(
            /<link rel="stylesheet"[^>]*href="\/([^"]+\.css)"[^>]*>/g,
            (etiqueta, archivo: string) => {
              const css = bundle[archivo];
              if (css?.type !== 'asset') return etiqueta;
              return `<style>${String(css.source).replace(/<\/style/gi, '<\\/style')}</style>`;
            },
          );
        const diferido = Object.values(bundle).find(
          (salida) => salida.type === 'asset' && salida.names.includes('diferido.css'),
        );
        const tags = diferido ? [enlace('/' + diferido.fileName)] : [];
        return { html: head + html.slice(finHead), tags };
      },
    },
  };
}

// El HTML del sitio se genera al compilar con src/prerender.tsx (aparte de main.tsx para que el panel
// no comparta la entrada del sitio). El plugin pide ruta absoluta; el build corre en frontend/.
declare const process: { cwd(): string };
const RUTA_PRERENDER = process.cwd().replace(/\\/g, '/') + '/src/prerender.tsx';

export default defineConfig({
  // Preact con su capa de compatibilidad: el código sigue importando 'react' y 'react-dom', pero el
  // bundle lleva Preact (unos 45 KB comprimidos menos que react-dom).
  plugins: [
    preact({
      prerender: { enabled: true, renderTarget: '#root', prerenderScript: RUTA_PRERENDER },
    }),
    rutaDelPanel(),
    cssDelSitio(),
  ],
  // shared/ y admin/ viven fuera de frontend/: que resuelvan el mismo Preact de frontend/node_modules.
  resolve: { dedupe: ['preact'] },
  server: { port: 5173, strictPort: true, fs: { allow: ['..'] } },
  // Rutas relativas a frontend/, desde donde corre `npm run build` (también en el Dockerfile).
  // Sin sourcemaps en producción (el pre-renderizado los activa por defecto y quedarían públicos).
  // Sin el polyfill de modulepreload: todos los navegadores actuales lo soportan y era otra solicitud.
  build: {
    sourcemap: false,
    modulePreload: { polyfill: false },
    rolldownOptions: {
      input: { sitio: 'index.html', panel: 'admin.html', diferido: CSS_DIFERIDO },
    },
  },
});
