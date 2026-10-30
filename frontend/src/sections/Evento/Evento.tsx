import Icon from '../../../../shared/components/Icon';
import { caracteristicas } from '../../data/evento/caracteristicas';

export default function Evento() {
  return (
    <section className="section" id="evento">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">La experiencia</span>
          <h2 className="section-title">
            No es solo una caminata,
            <br />
            es <em>el Perijá</em>
          </h2>
          <p className="section-sub">
            Un recorrido de 13 km que arranca en Villa Adelaida y termina en el páramo. Tú eliges
            cómo vivirlo: quedándote en la montaña o volviendo a Manaure.
          </p>
        </div>

        <div className="features">
          {caracteristicas.map((feature) => (
            <article className="feature reveal" data-delay={feature.delay} key={feature.title}>
              <span className="feature__icon">
                <Icon name={feature.icon} />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
