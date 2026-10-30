import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

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

export default defineConfig({
  plugins: [react(), rutaDelPanel()],
  resolve: { dedupe: ['react', 'react-dom'] },
  server: { port: 5173, strictPort: true, fs: { allow: ['..'] } },
  // Rutas relativas a frontend/, desde donde corre `npm run build` (también en el Dockerfile).
  build: { rolldownOptions: { input: { sitio: 'index.html', panel: 'admin.html' } } },
});
