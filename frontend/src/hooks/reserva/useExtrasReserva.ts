import type { ChangeEvent } from 'react';
import { precios } from '../../../../shared/config';
import {
  addDays,
  extraPrice,
  hotelCharge,
  hotelWindow,
  type PreEventHotel,
} from '../../../../shared/reservas';
import { formatMoney } from '../../../../shared/utils/format';
import { OPCIONES_EXTRA } from '../../data/reserva/opciones';
import type { Extra, HotelFormulario } from '../../types/reserva';

type Options = {
  extras: Extra[];
  onExtras: (value: Extra) => void;
  companion: boolean;
  hotel: HotelFormulario;
  onHotel: (cambios: Partial<HotelFormulario>) => void;
  /** Hotel con fechas válidas para cotizar; null si falta algo. */
  hotelCotizable: PreEventHotel | null;
  today: string;
};

export function useExtrasReserva({
  extras,
  onExtras,
  companion,
  hotel,
  onHotel,
  hotelCotizable,
  today,
}: Options) {
  const ventana = hotelWindow(today);
  const cargo = hotelCharge({
    companion: companion ? { kit: false } : null,
    extras: [],
    preEventHotel: hotelCotizable,
  });
  const noche = formatMoney(precios.hotelNoche);

  return {
    // El parapente del acompañante solo aparece si hay acompañante.
    extras: OPCIONES_EXTRA.filter((extra) => companion || !extra.conAcompanante).map((extra) => ({
      ...extra,
      checked: extras.includes(extra.id),
      toggle: () => onExtras(extra.id),
      price: formatMoney(extraPrice(extra.id)),
    })),
    hotel: {
      disponible: ventana.available,
      activo: hotel.activo,
      alternar: (event: ChangeEvent<HTMLInputElement>) => onHotel({ activo: event.target.checked }),
      precio: noche,
      texto: companion
        ? noche +
          ' por noche y por persona: si tu acompañante también llega, son ' +
          formatMoney(precios.hotelNoche * 2) +
          ' por noche.'
        : noche + ' por noche y por persona.',
      llegada: {
        valor: hotel.checkIn,
        min: ventana.firstCheckIn,
        max: ventana.lastCheckIn,
        onCambio: (value: string) => onHotel({ checkIn: value }),
      },
      salida: {
        valor: hotel.checkOut,
        min: hotel.checkIn ? addDays(hotel.checkIn, 1) : ventana.firstCheckOut,
        max: ventana.lastCheckOut,
        onCambio: (value: string) => onHotel({ checkOut: value }),
      },
      conAcompanante: companion
        ? {
            checked: hotel.conAcompanante,
            onChange: (event: ChangeEvent<HTMLInputElement>) =>
              onHotel({ conAcompanante: event.target.checked }),
          }
        : null,
      calculo: cargo
        ? cargo.label.replace('Hotel antes del evento · ', '') + ' = ' + formatMoney(cargo.amount)
        : 'Elige la llegada y la salida para calcular el valor.',
    },
  };
}
