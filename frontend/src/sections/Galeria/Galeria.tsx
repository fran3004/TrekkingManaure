import CloudImage from '../../../../shared/components/CloudImage';
import Icon from '../../../../shared/components/Icon';
import Modal from '../../../../shared/components/Modal';
import { presets } from '../../../../shared/data/imagenes';
import { useGaleria } from '../../hooks';

export default function Galeria() {
  const gallery = useGaleria();
  const visor = gallery.visor;

  return (
    <section className="section gallery" id="galeria">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">El camino en imágenes</span>
          <h2 className="section-title">
            El Perijá se <em>vive y se recuerda</em>
          </h2>
          <p className="section-sub">
            Los paisajes, los lugares y los momentos que vas a encontrar en el Desafío Perijá.
          </p>
        </div>
        <div className="gallery-grid">
          {gallery.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.className}
              data-delay={item.delay}
              onClick={item.open}
              aria-label={item.ariaLabel}
            >
              <CloudImage
                publicId={item.publicId}
                preset={presets.galeriaMiniatura}
                alt={item.alt}
                loading="lazy"
                width={item.width}
                height={item.height}
              />
              <span className="gallery-item__zoom">
                <Icon name="camera" />
              </span>
              <span className="gallery-item__caption">
                <small>{item.kicker}</small>
                <strong>{item.title}</strong>
                <span>
                  Ver imagen <Icon name="arrow" />
                </span>
              </span>
            </button>
          ))}
        </div>
        <p className="note gallery-note">Imágenes de Manaure y de la Serranía del Perijá.</p>
      </div>
      <Modal
        open={gallery.modal.open}
        title={gallery.modal.title}
        onClose={gallery.modal.close}
        className="gallery-modal"
      >
        {visor && (
          <div className="visor">
            <div className="visor__escenario">
              <div
                className="visor__foto"
                onTouchStart={visor.onTouchStart}
                onTouchEnd={visor.onTouchEnd}
              >
                <div className="visor__pista">
                  {visor.slides.map((slide) => (
                    <div
                      key={slide.id}
                      className={slide.className}
                      style={slide.style}
                      aria-hidden={slide.hidden}
                    >
                      {slide.failed ? (
                        <p className="visor__error">No se pudo cargar esta imagen.</p>
                      ) : (
                        <CloudImage
                          className="visor__img"
                          publicId={slide.publicId}
                          preset={presets.galeriaVisor}
                          alt={slide.alt}
                          draggable={false}
                          onError={slide.onError}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {visor.minis && (
              <div className="visor__tira" ref={visor.stripRef}>
                {visor.minis.map((mini) => (
                  <button
                    key={mini.id}
                    type="button"
                    className={mini.className}
                    aria-label={mini.ariaLabel}
                    aria-current={mini.current}
                    onClick={mini.select}
                  >
                    <CloudImage
                      publicId={mini.publicId}
                      preset={presets.galeriaMini}
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            )}
            <p className="visor__pie">
              <span>{visor.description}</span>
              {visor.counter && <strong className="visor__cuenta">{visor.counter}</strong>}
            </p>
          </div>
        )}
      </Modal>
    </section>
  );
}
