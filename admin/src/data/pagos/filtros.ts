import type { PaymentReview } from '../../../../shared/reservas';

// Filtros de la cola de pagos, en el orden de los botones.
export type FiltroPago = PaymentReview | 'Todos';

export const filtrosPago: FiltroPago[] = ['Por revisar', 'Aprobado', 'Rechazado', 'Todos'];

export const etiquetasFiltroPago: Record<FiltroPago, string> = {
  'Por revisar': 'Por revisar',
  Aprobado: 'Aprobados',
  Rechazado: 'Rechazados',
  Todos: 'Todos',
};
