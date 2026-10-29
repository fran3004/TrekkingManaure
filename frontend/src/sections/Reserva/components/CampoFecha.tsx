import type { ReactNode } from 'react';
import Icon from '../../../../../shared/components/Icon';
import { useCampoFecha } from '../../../hooks';

type Props = {
  id: string;
  name: string;
  etiqueta: ReactNode;
  valor?: string;
  min?: string;
  max?: string;
  inicio?: string;
  onCambio?: (iso: string) => void;
};

/** Fecha del formulario: se escribe dd/mm/aaaa o se elige en un calendario (ver useCampoFecha). */
export default function CampoFecha({
  id,
  name,
  etiqueta,
  valor,
  min,
  max,
  inicio,
  onCambio,
}: Props) {
  const view = useCampoFecha({ name, valor, min, max, inicio, onCambio });
  const calendario = view.calendario;

  return (
    <div className="field">
      <label htmlFor={id}>
        {etiqueta} <span className="req">*</span>
      </label>
      <div className="fecha" ref={view.contenedorRef}>
        <input type="hidden" name={view.name} value={view.iso} ref={view.ocultoRef} />
        <input
          id={id}
          ref={view.inputRef}
          type="text"
          inputMode="numeric"
          required
          placeholder="dd/mm/aaaa"
          autoComplete="off"
          maxLength={10}
          value={view.texto}
          onChange={view.escribir}
          onBlur={view.marcarTocado}
        />
        <button
          type="button"
          className="fecha__boton"
          aria-haspopup="dialog"
          aria-expanded={view.boton.abierto}
          aria-controls={view.popupId}
          aria-label={view.boton.ariaLabel}
          onClick={view.boton.alternar}
        >
          <Icon name="calendar" />
        </button>
        {view.boton.abierto && (
          <div className="fecha__popup" id={view.popupId} role="dialog" aria-label="Calendario">
            <div className="fecha__cabecera">
              <button
                type="button"
                className="fecha__nav fecha__nav--anterior"
                aria-label="Mes anterior"
                disabled={calendario.anterior.deshabilitado}
                onClick={calendario.anterior.ir}
              />
              <select
                aria-label="Mes"
                value={calendario.month}
                onChange={calendario.cambiarMes}
                className="fecha__mes"
              >
                {calendario.meses.map((mes) => (
                  <option key={mes.value} value={mes.value}>
                    {mes.label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Año"
                value={calendario.year}
                onChange={calendario.cambiarAnio}
                className="fecha__anio"
              >
                {calendario.anios.map((anio) => (
                  <option key={anio} value={anio}>
                    {anio}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="fecha__nav fecha__nav--siguiente"
                aria-label="Mes siguiente"
                disabled={calendario.siguiente.deshabilitado}
                onClick={calendario.siguiente.ir}
              />
            </div>
            <div className="fecha__grid" role="group" aria-label="Días del mes">
              {calendario.diasSemana.map((dia) => (
                <div className="fecha__dow" key={dia}>
                  {dia}
                </div>
              ))}
              {calendario.slots.map((slot) => (
                // Celda de alineación: ocupa su columna pero no se ve.
                <div className="fecha__slot" key={slot} aria-hidden="true" />
              ))}
              {calendario.dias.map((dia) => (
                <button
                  key={dia.iso}
                  type="button"
                  className={dia.className}
                  disabled={dia.deshabilitado}
                  aria-pressed={dia.pressed}
                  aria-label={dia.ariaLabel}
                  onClick={dia.elegir}
                >
                  {dia.numero}
                </button>
              ))}
            </div>
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
