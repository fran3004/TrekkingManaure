// Entrada del sitio público (index.html). El panel tiene la suya (admin.tsx, servida en /admin), así
// que aquí todo se importa directo: el CSS va como <link> en el HTML y no hay cadenas de import().
// Mismo orden que antes: primero la aplicación (con el CSS de sus secciones), luego el global.
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(<App />);
