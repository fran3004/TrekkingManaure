import CloudImage from '../../../../shared/components/CloudImage';
import Icon from '../../../../shared/components/Icon';
import { evento } from '../../../../shared/config';
import { imagenes, presets } from '../../../../shared/data/imagenes';
import { ContadorCupos } from '../../components';
import './Inicio.css';

export default function Inicio() {
  return (
    <section className="hero" id="inicio">
      <CloudImage
        className="hero__bg"
        publicId={imagenes.portada}
        preset={presets.portada}
        aria-hidden="true"
        fetchPriority="high"
        draggable={false}
      />
      <svg
        className="hero__mountains"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="#05231C"
          d="M0 250l120-70 90 50 110-90 100 70 120-110 130 90 110-50 120 80 110-60 130 70 120-40 90 40v100H0z"
          opacity=".9"
        />
        <path
          fill="#031B16"
          d="M0 290l140-60 120 45 130-80 150 70 140-50 130 60 140-40 150 50 140-60 200 65v30H0z"
        />
      </svg>
      <div className="container hero__grid">
        <div>
          <span className="hero__kicker">
            <i className="dot-live" /> Inscripciones · Cupos limitados
          </span>
          <div className="hero__place">Manaure · Cesar · Colombia</div>
          <h1>
            <span className="line">Trekking</span>
            <span className="line">
              Desafío <span className="brush">Perijá</span>
            </span>
            <span className="line stroke">13K</span>
          </h1>
          <p className="hero__lead">
            Del pueblo al páramo. Dos días de recorrido, fogata y montaña, con guías, seguridad y
            cupos limitados en el páramo. Vive la experiencia completa, vuelve a dormir a Manaure o
            regresa a casa.
          </p>
          <div className="hero__facts">
            <span className="fact">
              <Icon name="calendar" /> {evento.fechasTexto}
            </span>
            <span className="fact">
              <Icon name="clock" /> Salida {evento.horaSalidaTexto}
            </span>
            <span className="fact">
              <Icon name="pin" /> Restaurante El Sabor · Villa Adelaida
            </span>
            <span className="fact">
              <Icon name="mountain" /> {evento.distanciaKm} km
            </span>
          </div>
          <div className="hero__actions">
            <a href="#reserva" className="btn btn--primary">
              Reservar mi cupo <Icon name="arrow" />
            </a>
          </div>
        </div>
        <ContadorCupos />
      </div>
    </section>
  );
}
