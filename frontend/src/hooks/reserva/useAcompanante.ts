import type { ChangeEvent } from 'react';
import { precios } from '../../../../shared/config';
import { formatMoney } from '../../../../shared/utils/format';
import { opcionesEstadia } from '../../utils/reserva/estadias';
import { opcionDesmarcable } from '../../utils/comun/opcionDesmarcable';
import { opcionGuardada, useValorGuardado } from './useValorGuardado';

type Options = {
  companion: boolean;
  onCompanion: (value: boolean) => void;
  kit: boolean | null;
  onKit: (value: boolean | null) => void;
  /** Sin cupos en el páramo, esa estadía no se puede elegir. */
  paramoAgotado: boolean;
};

export function useAcompanante({ companion, onCompanion, kit, onKit, paramoAgotado }: Options) {
  const sinKit = formatMoney(precios.acompanante);
  const conKit = formatMoney(precios.acompananteConKit);
  const stays = opcionesEstadia(paramoAgotado);
  const stayGuardada = opcionGuardada(
    stays.filter((option) => !option.disabled).map((option) => option.value),
    useValorGuardado('acompEstadia'),
  );

  return {
    companion,
    priceText: sinKit + ' sin kit · ' + conKit + ' con kit.',
    toggleCompanion: (event: ChangeEvent<HTMLInputElement>) => onCompanion(event.target.checked),
    kitOptions: [
      { value: false, title: 'No', text: 'Sin kit, no se pide talla.' },
      { value: true, title: 'Sí', text: 'Valor total ' + conKit + '.' },
    ].map((option) => ({
      ...option,
      input: opcionDesmarcable<boolean | null>(kit, option.value, onKit, null),
    })),
    // Los datos del acompañante salen cuando se responde si comprará kit.
    showPerson: kit !== null,
    withSize: kit === true,
    stays,
    stayGuardada,
  };
}
