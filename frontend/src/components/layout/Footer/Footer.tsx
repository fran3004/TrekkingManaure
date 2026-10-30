import Brand from '../../../../../shared/components/Brand';
import Icon from '../../../../../shared/components/Icon';
import { evento } from '../../../../../shared/config';
import { useFooter } from '../../../hooks';
import './Footer.css';

export default function Footer() {
  const footer = useFooter();

  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div>
            <a href="#inicio" aria-label="Volver al inicio">
              <Brand />
            </a>
            <p>
              {evento.nombre}. Un recorrido de {evento.distanciaKm} km del pueblo al páramo, con
              guías locales, apoyo médico y cupos limitados.
            </p>
          </div>
          <div className="footer-col">
            <h2>Evento</h2>
            <ul>
              {footer.eventLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h2>Participa</h2>
            <ul>
              {footer.joinLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h2>El recorrido</h2>
            <ul>
              <li>{evento.fechasTexto}</li>
              <li>{evento.lugar}</li>
              <li>Encuentro: {evento.encuentro}</li>
              <li>Meta: {evento.llegada}</li>
              <li className="footer-aviso">
                <Icon name="info" /> En el páramo no hay conectividad a internet
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 {evento.nombre}. Todos los derechos reservados.</span>
          <span>
            Reservas gestionadas por el equipo organizador ·{' '}
            <a className="footer-admin" href="/admin">
              <Icon name="lock" /> Administración
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
