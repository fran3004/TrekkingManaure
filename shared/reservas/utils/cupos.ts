export type Availability = {
  occupied: number;
  capacity: number;
  available: number;
  percentage: number;
  soldOut: boolean;
};

/**
 * Cupos disponibles de un contador. Los números los calcula el servidor al apartar el cupo en cada
 * reserva (nada se cuenta en el navegador): la carrera gasta uno por reserva y el páramo un cupo
 * por persona que duerme allá. Hotel en Manaure y regreso a casa no gastan cupo del páramo.
 */
export function getAvailability(capacity: number, occupied: number): Availability {
  const available = Math.max(0, capacity - occupied);

  return {
    occupied,
    capacity,
    available,
    percentage: capacity > 0 ? Math.min(100, (occupied / capacity) * 100) : 0,
    soldOut: available === 0,
  };
}

/** Mínimo permitido al ajustar un tope de cupos: no menos que lo ocupado. */
export function capacityRange(occupied: number) {
  return { min: Math.max(1, occupied) };
}
