import { precios } from '../../config';
import { etiquetasExtra } from '../data/catalogos';
import type { Extra, PaymentPlan, PreEventHotel } from '../tipos';
import { countHotelNights, countHotelPeople } from './hotel';

export type Charge = { label: string; amount: number };

/** Lo que define el precio: acompañante (con o sin kit), actividades extra y hotel previo. */
export type Seleccion = {
  companion: { kit: boolean } | null;
  extras: readonly Extra[];
  preEventHotel: PreEventHotel | null;
};

export type Cotizacion = {
  titular: number;
  acompanante: number;
  extras: number;
  hotel: number;
  total: number;
  /** Lo que se paga al reservar: todo, o solo la inscripción si aparta. */
  ahora: number;
  /** Lo que queda para la fecha elegida; 0 si paga completo. */
  saldo: number;
};

function companionPrice(kit: boolean) {
  return kit ? precios.acompananteConKit : precios.acompanante;
}

/** La cuatrimoto vale lo mismo con o sin acompañante; el parapente se cobra por persona. */
export function extraPrice(extra: Extra) {
  return extra === 'cuatrimoto' ? precios.cuatrimoto : precios.parapente;
}

/** Hotel previo: noches × personas × tarifa por noche; 0 si no lo pidió. */
export function hotelCharge(seleccion: Seleccion): Charge | null {
  const hotel = seleccion.preEventHotel;
  if (!hotel) return null;

  const nights = countHotelNights(hotel);
  const people = countHotelPeople(hotel, seleccion.companion !== null);
  return {
    label:
      'Hotel antes del evento · ' +
      nights +
      (nights === 1 ? ' noche' : ' noches') +
      ' × ' +
      people +
      (people === 1 ? ' persona' : ' personas'),
    amount: nights * people * precios.hotelNoche,
  };
}

/**
 * Cargos de una reserva. Titular: inscripción + kit obligatorio. Acompañante: precio sin kit o
 * con kit. Extras: precio por actividad. Hotel: por noche y persona. Es el único cálculo de
 * precios del sistema.
 */
export function getCharges(seleccion: Seleccion): Charge[] {
  const charges: Charge[] = [{ label: 'Inscripción y kit del titular', amount: precios.total }];
  const { companion } = seleccion;

  if (companion) {
    charges.push({
      label: companion.kit ? 'Acompañante con kit' : 'Acompañante sin kit',
      amount: companionPrice(companion.kit),
    });
  }
  for (const extra of seleccion.extras) {
    charges.push({ label: etiquetasExtra[extra], amount: extraPrice(extra) });
  }
  const hotel = hotelCharge(seleccion);
  if (hotel) charges.push(hotel);

  return charges;
}

export function getTotal(seleccion: Seleccion) {
  return getCharges(seleccion).reduce((sum, charge) => sum + charge.amount, 0);
}

/** Lo que se paga al reservar según el plan; sin plan elegido se muestra el total. */
function getUpfront(plan: PaymentPlan | null, total: number) {
  return plan === 'apartado' ? Math.min(precios.inscripcion, total) : total;
}

/** Cotización del formulario y del resumen: total, lo que se paga ahora y el restante. */
export function cotizar(seleccion: Seleccion & { plan: PaymentPlan | null }): Cotizacion {
  const total = getTotal(seleccion);
  const acompanante = seleccion.companion ? companionPrice(seleccion.companion.kit) : 0;
  const hotel = hotelCharge(seleccion)?.amount ?? 0;
  const ahora = getUpfront(seleccion.plan, total);

  return {
    titular: precios.total,
    acompanante,
    extras: total - precios.total - acompanante - hotel,
    hotel,
    total,
    ahora,
    saldo: total - ahora,
  };
}
