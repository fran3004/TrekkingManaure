import { defineConfig, type Plugin } from 'vite';
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

// El sitio lo pinta el JavaScript, que no corre hasta que llega el CSS: con el CSS dentro del HTML
// (unos 13 KB comprimidos) se ahorra una solicitud que bloquea la carga. Solo en index.html; el
// panel conserva su hoja aparte. La CSP de Caddy ya permite estilos en línea.
function cssEnLineaDelSitio(): Plugin {
  return {
    name: 'css-en-linea-del-sitio',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.filename.endsWith('index.html') || !ctx.bundle) return html;
        const bundle = ctx.bundle;
        return html.replace(
          /<link rel="stylesheet"[^>]*href="\/([^"]+\.css)"[^>]*>/g,
          (etiqueta, archivo: string) => {
            const css = bundle[archivo];
            if (css?.type !== 'asset') return etiqueta;
            return `<style>${String(css.source).replace(/<\/style/gi, '<\\/style')}</style>`;
          },
        );
      },
    },
  };
}

export default defineConfig({
  // Preact con su capa de compatibilidad: el código sigue importando 'react' y 'react-dom', pero el
  // bundle lleva Preact (unos 45 KB comprimidos menos que react-dom).
  plugins: [preact(), rutaDelPanel(), cssEnLineaDelSitio()],
  // shared/ y admin/ viven fuera de frontend/: que resuelvan el mismo Preact de frontend/node_modules.
  resolve: { dedupe: ['preact'] },
  server: { port: 5173, strictPort: true, fs: { allow: ['..'] } },
  // Rutas relativas a frontend/, desde donde corre `npm run build` (también en el Dockerfile).
  build: { rolldownOptions: { input: { sitio: 'index.html', panel: 'admin.html' } } },
});
