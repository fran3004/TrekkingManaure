import type { Registration } from '../tipos';
import { countParamoRunners, holdsSpot } from './estado';

export type Availability = {
  occupied: number;
  capacity: number;
  available: number;
  percentage: number;
  soldOut: boolean;
};

/**
 * Cupos del páramo. Ocupa cupo cada corredor (titular o acompañante) que se queda en el páramo,
 * de una inscripción con algún pago aprobado. Hotel en Manaure y regreso a casa no gastan cupo.
 * La capacidad la fija la organización desde el panel (60 al inicio). Si se da `occupiedOverride`
 * (el sitio público no descarga las reservas), se usa en lugar de contarlas.
 */
export function getAvailability(
  registrations: Registration[],
  capacity: number,
  occupiedOverride?: number,
): Availability {
  const occupied = occupiedOverride ?? countParamoRunners(registrations.filter(holdsSpot));
  const available = Math.max(0, capacity - occupied);

  return {
    occupied,
    capacity,
    available,
    percentage: capacity > 0 ? Math.min(100, (occupied / capacity) * 100) : 0,
    soldOut: available === 0,
  };
}

/** Mínimo permitido al ajustar los cupos del páramo: no menos que lo ocupado. */
export function capacityRange(occupied: number) {
  return { min: Math.max(1, occupied) };
}
