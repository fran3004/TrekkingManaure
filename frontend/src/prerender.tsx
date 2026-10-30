// Solo se usa al compilar (vite.config.ts → prerenderScript): genera el HTML del sitio que va dentro
// de #root en index.html. Vive aparte de main.tsx para que la entrada del navegador no exporte nada
// y el código compartido con el panel quede en su propio chunk.
import App from './App';

export async function prerender() {
  const { renderToStringAsync } = await import('preact-render-to-string');
  return { html: await renderToStringAsync(<App />) };
}
