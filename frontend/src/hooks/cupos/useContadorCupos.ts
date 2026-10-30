import { useDisponibilidad } from '../../../../shared/reservas';

/** Tarjeta de cupos de la portada: cupos libres reales, al día con lo que aprueba el panel. */
export function useContadorCupos() {
  const { available, capacity, occupied, percentage, soldOut } = useDisponibilidad();

  return {
    available,
    capacity,
    occupied,
    barStyle: { width: percentage + '%' },
    status: soldOut ? 'Cupos agotados' : 'Cupo limitado',
    nota: soldOut
      ? 'Ya no hay cupos para la carrera. Será en una siguiente oportunidad.'
      : 'Cada inscripción gasta un cupo, con o sin acompañante.',
  };
}
