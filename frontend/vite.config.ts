import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// main.tsx carga el sitio con import() para que su CSS no se mezcle con el del panel. Sin ayuda,
// el navegador solo descubre esos archivos cuando index.js termina de bajar y ejecutarse; este
// plugin los anuncia desde el HTML (modulepreload y preload) para pedirlos en paralelo.
const MODULOS_DEL_SITIO = [/[\\/]src[\\/]App\.tsx$/, /[\\/]src[\\/]styles[\\/]global\.css$/];

function precargarSitio(): Plugin {
  return {
    name: 'precargar-sitio',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const chunks = Object.values(ctx.bundle ?? {}).flatMap((salida) =>
          salida.type === 'chunk' ? [salida] : [],
        );
        const scripts = new Set<string>();
        const estilos = new Set<string>();
        for (const chunk of chunks) {
          const id = chunk.facadeModuleId ?? '';
          if (!MODULOS_DEL_SITIO.some((patron) => patron.test(id))) continue;
          scripts.add(chunk.fileName);
          for (const importado of chunk.imports) {
            if (!chunks.find((otro) => otro.fileName === importado)?.isEntry)
              scripts.add(importado);
          }
          chunk.viteMetadata?.importedCss.forEach((css) => estilos.add(css));
        }
        // Un import() de solo CSS (styles/global.css) no deja chunk de JavaScript: queda como asset.
        for (const salida of Object.values(ctx.bundle ?? {})) {
          if (salida.type === 'asset' && salida.names.includes('global.css'))
            estilos.add(salida.fileName);
        }
        const tags: HtmlTagDescriptor[] = [];
        estilos.forEach((href) =>
          tags.push({ tag: 'link', attrs: { rel: 'preload', as: 'style', href: '/' + href } }),
        );
        scripts.forEach((href) =>
          tags.push({
            tag: 'link',
            attrs: { rel: 'modulepreload', crossorigin: true, href: '/' + href },
          }),
        );
        return tags;
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), precargarSitio()],
  resolve: { dedupe: ['react', 'react-dom'] },
  server: { port: 5173, strictPort: true, fs: { allow: ['..'] } },
});
