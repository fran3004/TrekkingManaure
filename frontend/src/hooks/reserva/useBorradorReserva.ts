import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { BORRADOR_ESPERA_MS } from '../../data/reserva/borrador';
import {
  borradorVacio,
  borrarBorrador,
  capturarCampos,
  guardarBorrador,
} from '../../utils/reserva/borrador';
import type { BorradorReserva, EstadoBorrador } from '../../types/reserva';

const SIN_CAMPOS: Record<string, string> = {};

/**
 * Guarda el formulario en el navegador mientras se llena, para no perderlo si se cierra el
 * resumen o la página antes de registrar. `inicial` es el borrador leído al abrir la página: los
 * campos lo leen al montarse y después el formulario manda. Tras registrar la reserva se borra y
 * se deja de guardar hasta que el formulario se reinicia.
 */
export function useBorradorReserva(
  formRef: RefObject<HTMLFormElement | null>,
  estado: EstadoBorrador,
  inicial: BorradorReserva | null,
) {
  const [campos, setCampos] = useState(inicial?.campos ?? SIN_CAMPOS);
  const [recuperado, setRecuperado] = useState(inicial !== null);
  const estadoRef = useRef(estado);
  const temporizador = useRef(0);
  const modificado = useRef(false);
  const pausado = useRef(false);

  useEffect(() => {
    estadoRef.current = estado;
  });

  const guardarAhora = useCallback(() => {
    window.clearTimeout(temporizador.current);
    const form = formRef.current;
    if (pausado.current || !modificado.current || !form) return;
    const borrador = {
      guardadoEn: Date.now(),
      campos: capturarCampos(form),
      estado: estadoRef.current,
    };
    if (borradorVacio(borrador)) borrarBorrador();
    else guardarBorrador(borrador);
  }, [formRef]);

  /** Anota un cambio y guarda cuando la persona deja de escribir. */
  const programar = useCallback(() => {
    if (pausado.current) return;
    modificado.current = true;
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(guardarAhora, BORRADOR_ESPERA_MS);
  }, [guardarAhora]);

  // Los cambios de estado que no pasan por un campo (fecha de pago, extras, hotel) también guardan.
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    programar();
  }, [estado, programar]);

  // Al cerrar o esconder la página, lo pendiente se guarda ya.
  useEffect(() => {
    const esconder = () => {
      if (document.visibilityState === 'hidden') guardarAhora();
    };
    window.addEventListener('pagehide', guardarAhora);
    document.addEventListener('visibilitychange', esconder);
    return () => {
      window.removeEventListener('pagehide', guardarAhora);
      document.removeEventListener('visibilitychange', esconder);
      window.clearTimeout(temporizador.current);
    };
  }, [guardarAhora]);

  return {
    /** Valores por campo para que cada uno arranque con lo ya escrito. */
    campos,
    recuperado,
    programar,
    guardarAhora,
    /** La reserva ya quedó registrada: se borra el borrador y no se vuelve a guardar. */
    descartar: () => {
      window.clearTimeout(temporizador.current);
      pausado.current = true;
      borrarBorrador();
    },
    /** El formulario volvió a empezar: se guarda de nuevo desde cero. */
    reanudar: () => {
      pausado.current = false;
      modificado.current = false;
      borrarBorrador();
      setCampos(SIN_CAMPOS);
      setRecuperado(false);
    },
  };
}
