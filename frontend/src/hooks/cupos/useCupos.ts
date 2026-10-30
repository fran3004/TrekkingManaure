import { precios } from '../../../../shared/config';
import { useCierre, useDisponibilidad } from '../../../../shared/reservas';
import { formatMoney } from '../../../../shared/utils/format';

/** Sección "Así funciona el cupo", con la capacidad y ocupación vigentes. */
export function useCupos() {
  const inscripcion = formatMoney(precios.inscripcion);
  const { capacity, occupied, available, percentage, soldOut } = useDisponibilidad();
  const { plazoTexto, cerrado } = useCierre();

  return {
    capacity,
    available,
    occupied,
    ocupacion: Math.round(percentage),
    barStyle: { width: percentage + '%' },
    agotado: soldOut,
    legend: available
      ? available + (available === 1 ? ' cupo libre' : ' cupos libres')
      : 'Cupos de la carrera agotados',
    estado: soldOut
      ? 'Cupos completos'
      : cerrado
        ? 'Inscripciones cerradas'
        : 'Inscripciones abiertas',
    plazo: cerrado
      ? 'Las inscripciones cerraron el ' + plazoTexto
      : 'Inscríbete hasta el ' + plazoTexto,
    rules: [
      {
        icon: 'sheet' as const,
        title: 'Apártalo con los ' + inscripcion,
        text: 'Tu cupo se aparta al registrar la reserva y pagas por llave Bre-B.',
      },
      {
        icon: 'clock' as const,
        title: 'Págalo a tiempo',
        text: 'Si el pago no llega a tiempo o se rechaza, el cupo se libera para otra persona.',
      },
      {
        icon: 'flag' as const,
        title: 'Cuando se completan',
        text: 'El formulario se cierra hasta una siguiente oportunidad.',
      },
    ].map((rule, index) => ({ ...rule, n: index + 1 })),
  };
}
