import Icon from '../../../../shared/components/Icon';
import { abrigoNecesario, medidasSeguridad } from '../../data/seguridad/medidas';
import PerfilTemperatura from './PerfilTemperatura';
import './Seguridad.css';

export default function Seguridad() {
  return (
    <section className="section" id="seguridad">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Antes de ir</span>
          <h2 className="section-title">
            Seguridad y <em>preparación</em>
          </h2>
          <p className="section-sub">
            La montaña se respeta. Estas son las medidas del evento y lo que debes llevar para
            disfrutarlo sin riesgos.
          </p>
        </div>

        <div className="safety-grid">
          <div className="safety-main">
            <div className="cold reveal">
              <div className="cold__head">
                <span className="cold__icon">
                  <Icon name="snow" />
                </span>
                <h3>Hace frío en el páramo</h3>
              </div>
              <p>
                Arriba la temperatura baja y el clima cambia rápido. Lleva abrigo, ropa térmica,
                impermeable y calzado adecuado. No vayas improvisando.
              </p>
              <div className="cold__list">
                {abrigoNecesario.map((item) => (
                  <span className="chip" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <PerfilTemperatura />
          </div>

          <div className="safety-list reveal" data-delay="1">
            {medidasSeguridad.map((item) => (
              <div className="safety-item" key={item.title}>
                <Icon name={item.icon} />
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.text}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
