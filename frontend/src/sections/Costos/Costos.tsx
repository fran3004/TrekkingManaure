import Extras from '../Extras';
import Icon from '../../../../shared/components/Icon';
import { useCostos } from '../../hooks';
import './Costos.css';

export default function Costos() {
  const costs = useCostos();

  return (
    <section className="section" id="costos">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Costos y pagos</span>
          <h2 className="section-title">
            Claro, sin <em>sorpresas</em>
          </h2>
          <p className="section-sub">
            El valor total es obligatorio. Se paga en dos partes: una para apartar el cupo y otra
            para el kit completo.
          </p>
        </div>

        <div className="costos-grid">
          <div className="price-card reveal">
            <span className="eyebrow" style={{ marginBottom: '.4rem' }}>
              Valor total obligatorio
            </span>
            <div className="price-card__total">
              {costs.total} <span>COP</span>
            </div>
            <p className="price-card__desc">
              Debe pagarse la totalidad. La inscripción aparta el cupo y el saldo cubre el kit
              completo del evento.
            </p>

            <div className="split">
              <div className="split__item">
                <small>1 · Inscripción</small>
                <strong>{costs.inscripcion}</strong>
                <span>Aparta tu cupo</span>
              </div>
              <div className="split__item">
                <small>2 · Saldo del kit</small>
                <strong>{costs.kit}</strong>
                <span>Kit completo</span>
              </div>
            </div>

            <div className="deadline">
              <Icon name="calendar" />
              <div>
                <strong>Plazo hasta el {costs.plazo}.</strong> Al reservar eliges el día exacto en
                que pagarás los {costs.kit} restantes, dentro de ese plazo.
              </div>
            </div>
          </div>

          <div className="steps reveal" data-delay="1">
            {costs.steps.map((step) => (
              <div className="step" key={step.n}>
                <span className="step__n">{step.n}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
            <p className="note">
              La reserva no queda confirmada hasta validar el pago de inscripción.
            </p>
          </div>
        </div>

        <Extras />
      </div>
    </section>
  );
}
