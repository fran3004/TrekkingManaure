// Entrada del panel (admin.html, servida en /admin). Trae su propio CSS, separado del sitio.
import { createRoot } from 'react-dom/client';
import AdminApp from '../../admin/src/AdminApp';

createRoot(document.getElementById('root')!).render(<AdminApp />);
