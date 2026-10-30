// Entrada del sitio público (index.html). El panel tiene la suya (admin.tsx, servida en /admin), así
// que aquí todo se importa directo: el CSS de la primera pantalla va dentro del HTML.
// Mismo orden que antes: primero la aplicación (con el CSS de sus secciones), luego el global.
import { render, type ComponentChild } from 'preact';
import App from './App';
import './styles/global.css';

// Al compilar, src/prerender.tsx deja el HTML del sitio dentro de #root: la página se ve completa
// antes de que llegue el JavaScript. Aquí se usa `render` del núcleo de Preact (no el de
// react-dom/preact/compat, que vacía el contenedor): reutiliza ese HTML nodo por nodo y solo cambia
// lo que difiera (cupos, cuenta regresiva, borrador del formulario). Reemplazarlo todo volvería a
// maquetar la página y descargaría de inmediato las imágenes diferidas.
render((<App />) as unknown as ComponentChild, document.getElementById('root')!);
