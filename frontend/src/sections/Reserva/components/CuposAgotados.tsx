import Icon from '../../../../../shared/components/Icon';
import { contacto, evento } from '../../../../../shared/config';
import { whatsappLink } from '../../../utils/reserva/mensaje';

/** Aviso que reemplaza al formulario cuando se completan los cupos de la carrera. */
export default function CuposAgotados({ capacidad }: { capacidad: number }) {
  const enlace = whatsappLink(
    contacto.whatsapp,
    'Hola, me interesa el ' + evento.nombre + '. ¿Me avisan cuando haya una nueva oportunidad?',
  );

  return (
    <div className="agotado" role="status">
      <span className="agotado__icon">
        <Icon name="mountain" />
      </span>
      <span className="agotado__tag">Cupos completos</span>
      <h3 className="agotado__title">
        Se llenaron los <em>{capacidad} cupos</em> de la carrera
      </h3>
      <p className="agotado__text">
        Gracias por tu interés en el {evento.nombre}. Las inscripciones se cerraron porque todos los
        cupos ya fueron reservados. Será en una siguiente oportunidad.
      </p>
      <div className="agotado__bar" aria-hidden="true">
        <i />
      </div>
      <ul className="agotado__datos">
        <li>
          <Icon name="calendar" /> {evento.fechasTexto}
        </li>
        <li>
          <Icon name="pin" /> {evento.lugar}
        </li>
      </ul>
      {enlace && (
        <a className="btn btn--primary" href={enlace} target="_blank" rel="noopener noreferrer">
          <Icon name="whatsapp" /> Avísame de la próxima
        </a>
      )}
    </div>
  );
}
