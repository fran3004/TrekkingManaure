import type { Estadia } from '../../types/reserva';
import Icon from '../../../../shared/components/Icon';
import { useAlojamiento } from '../../hooks';
import './Alojamiento.css';

export default function Alojamiento({ onSelect }: { onSelect: (value: Estadia) => void }) {
  const estadias = useAlojamiento(onSelect);

  return (
    <section className="section" id="estadia">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Tú eliges</span>
          <h2 className="section-title">
            ¿Dónde quieres <em>amanecer</em>?
          </h2>
          <p className="section-sub">
            Todos suben al páramo. La diferencia está en dónde pasas la noche al terminar el
            recorrido. Los cupos son solo para quienes se quedan en el páramo: hotel en Manaure y
            regreso a casa no ocupan cupo.
          </p>
        </div>

        <div className="stay-grid">
          {estadias.map((stay) => (
            <article key={stay.value} className={stay.className} data-delay={stay.delay}>
              <span className="stay__tag">{stay.tag}</span>
              <span className="stay__icon">
                <Icon name={stay.icon} />
              </span>
              <h3>{stay.title}</h3>
              <p>{stay.text}</p>
              <ul>
                {stay.items.map((item) => (
                  <li key={item}>
                    <Icon name="check" /> {item}
                  </li>
                ))}
              </ul>
              {stay.sinCupo && (
                <span className="stay__agotado" role="status">
                  <Icon name="info" /> {stay.aviso}
                </span>
              )}
              {!stay.sinCupo && (
                <a href="#reserva" className="btn btn--ghost" onClick={stay.select}>
                  {stay.action} <Icon name="arrow" />
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
