import Icon from '../../../../shared/components/Icon';
import CloudImage from '../../../../shared/components/CloudImage';
import { useExtras } from '../../hooks';

export default function Extras() {
  const { actividades, hotel } = useExtras();

  return (
    <div style={{ marginTop: '3rem' }}>
      <div className="section-head reveal" style={{ marginBottom: '1.2rem' }}>
        <span className="eyebrow">Adicionales</span>
        <h2 className="section-title" style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)' }}>
          Súmale <em>más experiencia</em>
        </h2>
      </div>
      <div className="extras">
        {actividades.map((extra) => (
          <article className="extra reveal" data-delay={extra.delay} key={extra.title}>
            <CloudImage
              className="extra__foto"
              publicId={extra.publicId}
              preset={extra.preset}
              alt={extra.alt}
              loading="lazy"
            />
            <Icon name={extra.icon} />
            <h3>{extra.title}</h3>
            <strong>
              {extra.price}
              {extra.aprox && (
                <>
                  {' '}
                  <small style={{ fontFamily: 'var(--textos)', fontSize: '.5em' }}>aprox.</small>
                </>
              )}
            </strong>
            <small>{extra.text}</small>
            {extra.chips && (
              <div className="extra__chips">
                {extra.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
      <article className="extra extra--hotel reveal" data-delay="1">
        <Icon name={hotel.icon} />
        <div className="extra--hotel__texto">
          <h3>{hotel.title}</h3>
          <small>{hotel.text}</small>
          <div className="extra__chips">
            {hotel.chips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        </div>
        <div className="extra--hotel__precio">
          <strong>{hotel.price}</strong>
          <small>{hotel.unidad}</small>
          <small>{hotel.ejemplo}</small>
          <a href="#reserva" className="btn btn--ghost">
            Elegir al reservar
          </a>
        </div>
      </article>
      <p className="note" style={{ marginTop: '.9rem' }}>
        Las actividades adicionales y el hotel previo se eligen al reservar y se suman al total de
        tu inscripción.
      </p>
    </div>
  );
}
