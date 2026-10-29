import type { Cotizacion, Extra, PaymentPlan, Stay } from '../../../shared/reservas';

// Tipos de presentación del formulario. El modelo de la reserva que se guarda y comparte con
// el panel está en shared/reservas/tipos.ts.

export type { Cotizacion, Extra };

/** Estadía elegida en el formulario; '' mientras no se elige. */
export type Estadia = '' | Stay;

/**
 * Forma de pago de toda la reserva: 'total' paga todo ahora; 'apartado' paga la inscripción
 * ahora y elige una sola fecha para pagar el restante.
 */
export type PlanPago = PaymentPlan;

/** Hotel antes del evento tal como se llena en el formulario; las fechas '' sin elegir. */
export type HotelFormulario = {
  activo: boolean;
  checkIn: string;
  checkOut: string;
  conAcompanante: boolean;
};

/** Lo que el formulario guarda en estado de React; el resto vive en los campos y se guarda por nombre. */
export type EstadoBorrador = {
  stay: Estadia;
  plan: PlanPago | null;
  planDate: string;
  companion: boolean;
  companionKit: boolean | null;
  extras: Extra[];
  hotel: HotelFormulario;
};

/** Formulario a medias guardado en el navegador. */
export type BorradorReserva = {
  guardadoEn: number;
  /** Valor de cada campo por su name; las respuestas con opción solo guardan la elegida. */
  campos: Record<string, string>;
  estado: EstadoBorrador;
};

/** Una fila etiqueta/valor de la ventana de resumen y del mensaje de WhatsApp. */
export type FilaResumen = { label: string; value: string };

/**
 * La reserva lista para mostrar y enviar. Se arma a partir de la reserva que se guarda, así el
 * resumen y el mensaje de WhatsApp muestran exactamente lo mismo que queda registrado.
 */
export type ResumenReservaTexto = {
  /** Código asignado al registrar la reserva; null mientras se revisa antes de confirmar. */
  codigo: string | null;
  participante: FilaResumen[];
  reserva: FilaResumen[];
  acompanante: FilaResumen[] | null;
  pagos: FilaResumen[];
  /** Lo que se paga al reservar, ya formateado. */
  ahora: string;
  /** El titular es menor: debe enviar la autorización de su responsable. */
  menor: boolean;
  versionTerminos: string;
};
