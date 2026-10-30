import Icon from '../../../../shared/components/Icon';
import { elementosKit } from '../../data/kit/incluye';

export default function Kit() {
  return (
    <section className="section" id="incluye">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Tu kit</span>
          <h2 className="section-title">
            Todo lo que <em>incluye</em>
          </h2>
          <p className="section-sub">
            El valor de la carrera cubre el kit completo, la alimentación y el acompañamiento en
            ruta.
          </p>
        </div>

        <div className="kit-grid">
          {elementosKit.map((item) => (
            <article className="kit reveal" data-delay={item.delay} key={item.title}>
              <Icon name={item.icon} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="note" style={{ marginTop: '1rem' }}>
          Los desayunos y las meriendas están incluidos en el kit. El hospedaje depende de la opción
          de estadía que elijas.
        </p>
      </div>
    </section>
  );
}
