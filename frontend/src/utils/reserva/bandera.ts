import type { CountryCode } from '../../../../shared/reservas';
import { BANDERA_TAMANO, BANDERAS_CDN } from '../../data/reserva/banderas';

/**
 * Atributos de <img> para la bandera de un país desde flagcdn.com. Las banderas viven en el
 * formulario, lejos de la portada: se cargan en diferido para no abrir una conexión a otro dominio
 * durante la carga inicial.
 */
export function bandera(iso: CountryCode) {
  const code = iso.toLowerCase();
  const { ancho, alto, x2, x3 } = BANDERA_TAMANO;
  const url = (size: string) => BANDERAS_CDN + '/' + size + '/' + code + '.png';

  return {
    src: url(ancho + 'x' + alto),
    srcSet: url(x2) + ' 2x, ' + url(x3) + ' 3x',
    width: ancho,
    height: alto,
    loading: 'lazy' as const,
    decoding: 'async' as const,
  };
}
