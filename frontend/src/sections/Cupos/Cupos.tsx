import Icon from '../../../../shared/components/Icon';
import { useCupos } from '../../hooks';

export default function Cupos() {
  const view = useCupos();

  return (
    <section className="section section--tight" id="cupos">
      <div className="container cupos-wrap">
        <div className="cupos-big reveal">
          <div className="cupos-big__top">
            <span className="cupos-big__cap">Cupos de la carrera</span>
            <span
              className={'cupos-big__estado' + (view.agotado ? ' cupos-big__estado--agotado' : '')}
            >
              <i className="dot-live" /> {view.estado}
            </span>
          </div>
          <div className="cupos-big__num">
            <span>{view.available}</span> <small>DE {view.capacity} LIBRES</small>
          </div>
          <div
            className="bar"
            role="progressbar"
            aria-label="Cupos confirmados"
            aria-valuemin={0}
            aria-valuemax={view.capacity}
            aria-valuenow={view.occupied}
          >
            <div className="bar__fill" style={view.barStyle} />
          </div>
          <div className="cupos-big__legend">
            <span>0</span>
            <span>{view.legend}</span>
            <span>{view.capacity}</span>
          </div>
          <dl className="cupos-big__stats">
            <div>
              <dd>{view.occupied}</dd>
              <dt>Reservados</dt>
            </div>
            <div>
              <dd>{view.available}</dd>
              <dt>Libres</dt>
            </div>
            <div>
              <dd>{view.ocupacion}%</dd>
              <dt>Ocupación</dt>
            </div>
          </dl>
          <p className="cupos-big__plazo">
            <Icon name="calendar" /> {view.plazo}
          </p>
        </div>
        <div className="reveal" data-delay="1">
          <span className="eyebrow">Así funciona el cupo</span>
          <h2 className="section-title cupos-title">
            Cupo limitado,
            <br />
            <em>una gran experiencia</em>
          </h2>
          <div className="rules">
            {view.rules.map((rule) => (
              <div className="rule" key={rule.n}>
                <span className="rule__icon">
                  <Icon name={rule.icon} />
                </span>
                <div>
                  <strong>{rule.title}</strong>
                  <p>{rule.text}</p>
                </div>
                <span className="rule__n">{rule.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
