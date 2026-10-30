import { Navbar, Footer } from './components';
import { Home } from './pages';
import Modal from '../../shared/components/Modal';
import Icon from '../../shared/components/Icon';
import { useAnclas, useContacto, useSmoothScroll } from './hooks';

export default function App() {
  const contact = useContacto();
  useSmoothScroll();
  useAnclas();

  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <Navbar />
      <Home />
      <Footer />
      {contact.whatsappHref ? (
        <a
          className="wa-float"
          href={contact.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribir por WhatsApp"
        >
          <Icon name="whatsapp" />
        </a>
      ) : (
        <button
          type="button"
          className="wa-float"
          onClick={contact.openModal}
          aria-label="Información de contacto"
        >
          <Icon name="whatsapp" />
        </button>
      )}
      <Modal open={contact.open} title="Reservar con Asesor" onClose={contact.close}>
        <p>
          El canal de WhatsApp de reservas se habilitará con la apertura de inscripciones, el{' '}
          {contact.apertura}.
        </p>
        <p>
          Mientras tanto, explora la información del evento y prepara tu reserva en el formulario.
        </p>
        <a href="#reserva" className="btn btn--primary" onClick={contact.close}>
          Ver formulario <Icon name="arrow" />
        </a>
      </Modal>
    </>
  );
}
