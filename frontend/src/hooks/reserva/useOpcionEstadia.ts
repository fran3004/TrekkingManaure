import { useDisponibilidad } from '../../../../shared/reservas';
import { AVISO_PARAMO_AGOTADO } from '../../data/reserva/opciones';
import { opcionDesmarcable } from '../../utils/comun/opcionDesmarcable';
import { opcionesEstadia } from '../../utils/reserva/estadias';
import type { Estadia } from '../../types/reserva';

type Options = {
  stay: Estadia;
  onStay: (value: Estadia) => void;
  /** Sin cupos en el páramo, esa estadía no se puede elegir. */
  paramoAgotado: boolean;
};

export function useOpcionEstadia({ stay, onStay, paramoAgotado }: Options) {
  const { paramo } = useDisponibilidad();

  return {
    /** Visible siempre: el páramo tiene un cupo por persona y no crece con las reservas. */
    cupoParamo:
      'En el páramo solo hay cupo para ' +
      paramo.capacity +
      ' personas (cada persona, titular o acompañante, ocupa un cupo). ' +
      (paramo.available === 0
        ? 'Ya no quedan.'
        : 'Quedan ' + paramo.available + (paramo.available === 1 ? ' cupo.' : ' cupos.')),
    stays: opcionesEstadia(paramoAgotado).map((option) => ({
      ...option,
      input: opcionDesmarcable<Estadia>(stay, option.value, onStay, ''),
    })),
    avisoParamo: paramoAgotado ? AVISO_PARAMO_AGOTADO : null,
  };
}
