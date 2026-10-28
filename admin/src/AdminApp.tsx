import './App.css';
import { Dashboard, Login, Participantes, Pagos, Cupos, Exportar } from './pages';
import Brand from '../../shared/components/Brand';
import Icon from '../../shared/components/Icon';
import { evento } from '../../shared/config';
import { AdminUiProvider } from './context/AdminUiContext';
import { useAdminNavigation, useSesion } from './hooks';
import type { Sesion } from './services';
// Como en el arranque anterior, los estilos comunes del panel se cargan después de los de cada página.
import './styles/global.css';

const pages = {
  resumen: Dashboard,
  participantes: Participantes,
  pagos: Pagos,
  cupos: Cupos,
  exportar: Exportar,
};

function AdminShell({ sesion, cerrarSesion }: { sesion: Sesion; cerrarSesion: () => void }) {
  const navigation = useAdminNavigation(sesion, cerrarSesion);
  const Page = pages[navigation.route];

  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-content" onClick={navigation.skipToContent}>
        Saltar al contenido
      </a>
      {navigation.menuOpen && (
        <button
          className="admin-sidebar-backdrop"
          aria-label="Cerrar navegación"
          onClick={navigation.closeMenu}
        />
      )}
      <aside className={navigation.sidebarClass}>
        <a href="#/resumen" aria-label="Perijá, vista general">
          <Brand />
        </a>
        <span className="admin-nav-label">ESPACIO DE ORGANIZACIÓN</span>
        <nav aria-label="Navegación administrativa">
          {navigation.links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              onClick={navigation.closeMenu}
              aria-current={link.current}
            >
              <Icon name={link.icon} />
              <span>{link.label}</span>
              {link.badge && <small>{link.badge}</small>}
            </a>
          ))}
        </nav>
        <div className="admin-sidebar-event">
          <Icon name="mountain" />
          <small>EL PRÓXIMO DESAFÍO</small>
          <strong>Perijá {evento.distanciaKm}K</strong>
          <span>{evento.fechasTexto}</span>
          <a href={navigation.publicUrl}>
            Ver página del evento <Icon name="arrow" />
          </a>
        </div>
        <div className="admin-sidebar-bottom">
          <button type="button" onClick={navigation.logout}>
            <Icon name="lock" /> Cerrar sesión
          </button>
          <span>
            <i className="dot-live" /> SINCRONIZADO
          </span>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-header">
          <div>
            <button
              type="button"
              className="admin-menu-toggle"
              aria-label="Abrir navegación"
              aria-expanded={navigation.menuOpen}
              onClick={navigation.toggleMenu}
            >
              <span />
              <span />
              <span />
            </button>
            <span className="admin-breadcrumb">
              Administración <span>/</span> <strong>{navigation.title}</strong>
            </span>
          </div>
          <div>
            <a href={navigation.publicUrl} className="admin-public-link">
              Ver sitio público <Icon name="arrow" />
            </a>
            <span className="admin-user-avatar" aria-hidden="true">
              {navigation.user.initial}
            </span>
            <span className="admin-user">
              <strong>{navigation.user.name}</strong>
              <small>{navigation.user.email}</small>
            </span>
          </div>
        </header>
        <div className="admin-preview-banner">
          <span>
            <Icon name="info" />
            <strong>Modo local.</strong> Las reservas del sitio y los cambios del panel se guardan
            en este navegador y se sincronizan al instante.
          </span>
          <span>Sin servidor conectado</span>
        </div>
        <main id="admin-content" className="admin-content" tabIndex={-1}>
          <Page />
        </main>
      </div>
    </div>
  );
}

/** Panel de administración: sin sesión vigente solo se muestra el acceso. */
export default function AdminApp() {
  const { sesion, restaurando, cerrarSesion } = useSesion();

  // Mientras se restaura la sesión no se muestra el acceso, para que no parpadee.
  if (restaurando && !sesion) return null;
  if (!sesion) return <Login />;

  return (
    <AdminUiProvider>
      <AdminShell key={sesion.iniciadaEn} sesion={sesion} cerrarSesion={cerrarSesion} />
    </AdminUiProvider>
  );
}
