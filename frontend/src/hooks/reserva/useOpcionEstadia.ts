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
  return {
    stays: opcionesEstadia(paramoAgotado).map((option) => ({
      ...option,
      input: opcionDesmarcable<Estadia>(stay, option.value, onStay, ''),
    })),
    avisoParamo: paramoAgotado ? AVISO_PARAMO_AGOTADO : null,
  };
}
