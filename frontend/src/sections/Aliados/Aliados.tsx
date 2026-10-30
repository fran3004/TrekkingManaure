import CloudImage from '../../../../shared/components/CloudImage';
import { presets } from '../../../../shared/data/imagenes';
import { useMarquesinaAliados } from '../../hooks';

export default function Aliados() {
  const marquee = useMarquesinaAliados();

  return (
    <section className="section aliados" id="aliados">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Con el apoyo de</span>
          <h2 className="section-title">
            Aliados del <em>Perijá</em>
          </h2>
        </div>
      </div>
      <div className="logo-marquee reveal" ref={marquee.cajaRef}>
        <div className="logo-marquee__track" ref={marquee.pistaRef}>
          {marquee.logos.map((logo) => {
            const image = (
              <CloudImage
                publicId={logo.publicId}
                preset={presets.aliado}
                alt={logo.alt}
                loading="lazy"
                draggable={false}
              />
            );
            return logo.instagram ? (
              <a
                key={logo.key}
                className="logo-card"
                href={logo.instagram.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={logo.instagram.ariaLabel}
                aria-hidden={logo.ariaHidden}
                tabIndex={logo.tabIndex}
                draggable={false}
              >
                {image}
              </a>
            ) : (
              <div key={logo.key} className="logo-card" aria-hidden={logo.ariaHidden}>
                {image}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
