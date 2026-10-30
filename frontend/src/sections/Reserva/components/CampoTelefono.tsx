import type { TipoTelefono } from '../../../../../shared/reservas';
import { useCampoTelefono } from '../../../hooks';

type Props = {
  prefijo: string;
  base: string;
  etiqueta: string;
  /** Texto añadido a la etiqueta, p. ej. ' del acompañante'. */
  sufijo?: string;
  tipo: TipoTelefono;
  quien: string;
  autoComplete?: string;
};

export default function CampoTelefono({
  prefijo,
  base,
  etiqueta,
  sufijo = '',
  tipo,
  quien,
  autoComplete = 'off',
}: Props) {
  const view = useCampoTelefono({ prefijo, base, tipo, quien });

  return (
    <div className="field">
      <label htmlFor={view.name}>
        {etiqueta}
        {sufijo} <span className="req">*</span>
      </label>
      <div className="tel" ref={view.contenedorRef}>
        <input type="hidden" name={view.paisName} value={view.pais} />
        <button
          type="button"
          className="tel__pais"
          aria-haspopup="listbox"
          aria-expanded={view.boton.abierto}
          aria-controls={view.listaId}
          aria-label={view.boton.ariaLabel}
          onClick={view.boton.alternar}
        >
          <img className="tel__bandera" alt="" {...view.boton.bandera} />
          <span>{view.boton.indicativo}</span>
          <span className="tel__flecha" aria-hidden="true" />
        </button>
        <input
          id={view.name}
          name={view.name}
          ref={view.inputRef}
          type="tel"
          inputMode="tel"
          required
          placeholder={view.placeholder}
          autoComplete={autoComplete}
          maxLength={16}
          value={view.valor}
          onChange={view.escribir}
          onBlur={view.marcarTocado}
        />
        {view.boton.abierto && (
          <div className="tel__lista" id={view.listaId} role="listbox" aria-label="Países">
            {view.opciones.map((opcion) => (
              <button
                type="button"
                role="option"
                key={opcion.iso}
                aria-selected={opcion.seleccionado}
                className="tel__opcion"
                onClick={opcion.elegir}
              >
                <img className="tel__bandera" alt="" {...opcion.bandera} />
                <span className="tel__nombre">{opcion.nombre}</span>
                <span className="tel__indicativo">{opcion.indicativo}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {view.error && (
        <small className="field-error" role="alert">
          {view.error}
        </small>
      )}
    </div>
  );
}
