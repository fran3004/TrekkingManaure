import { ESTADIA_CON_CUPO, useDisponibilidad } from '../../../../shared/reservas';
import { estadias } from '../../data/alojamiento/estadias';
import { PARAMO_SIN_CUPO } from '../../data/reserva/opciones';
import type { Estadia } from '../../types/reserva';

/** Tarjetas de estadía; sin cupos en el páramo, esa tarjeta no se puede elegir. */
export function useAlojamiento(onSelect: (value: Estadia) => void) {
  const { paramo } = useDisponibilidad();

  return estadias.map((stay) => {
    const sinCupo = paramo.soldOut && stay.value === ESTADIA_CON_CUPO;
    return {
      ...stay,
      sinCupo,
      aviso: sinCupo ? PARAMO_SIN_CUPO : null,
      select: () => onSelect(stay.value),
    };
  });
}
