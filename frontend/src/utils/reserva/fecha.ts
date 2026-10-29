import { isIsoDate } from '../../../../shared/reservas';
import { formatBirth } from './formulario';

// Utilidades del campo de fecha del formulario: texto dd/mm/aaaa, validación contra el rango y
// armado del mes que muestra el calendario. Las fechas viajan como AAAA-MM-DD.

const FECHA_MINIMA = '1900-01-01';
const FECHA_MAXIMA = '2100-12-31';

export const NOMBRES_MES = Array.from({ length: 12 }, (_, indice) =>
  new Intl.DateTimeFormat('es-CO', { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2024, indice, 1)),
  ),
);

export type VistaMes = { year: number; month: number };

/** Texto dd/mm/aaaa mientras se escribe: solo dígitos y las barras se ponen solas. */
export function mascaraFecha(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return digitos.slice(0, 2) + '/' + digitos.slice(2);
  return digitos.slice(0, 2) + '/' + digitos.slice(2, 4) + '/' + digitos.slice(4);
}

/** AAAA-MM-DD de un texto dd/mm/aaaa completo y real; '' si no lo es. */
export function textoAIso(texto: string): string {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!partes) return '';
  const iso = partes[3] + '-' + partes[2] + '-' + partes[1];
  return isIsoDate(iso) ? iso : '';
}

export function isoATexto(iso: string): string {
  return isIsoDate(iso) ? formatBirth(iso) : '';
}

/** Primer problema de la fecha escrita o null. Vacío no es un error: lo pide `required`. */
export function errorFecha(texto: string, iso: string, min: string, max: string): string | null {
  if (!texto) return null;
  if (!iso) {
    return texto.length < 10
      ? 'Escribe la fecha completa: día/mes/año.'
      : 'Esa fecha no existe en el calendario.';
  }
  if (min && iso < min) return 'La fecha no puede ser anterior al ' + formatBirth(min) + '.';
  if (max && iso > max) return 'La fecha no puede ser posterior al ' + formatBirth(max) + '.';
  return null;
}

function indiceMes(year: number, month: number) {
  return year * 12 + month - 1;
}

/** Acerca el mes mostrado al rango permitido. */
export function limitarVista(vista: VistaMes, min: string, max: string): VistaMes {
  const primero = indiceMes(Number(min.slice(0, 4)), Number(min.slice(5, 7)));
  const ultimo = indiceMes(Number(max.slice(0, 4)), Number(max.slice(5, 7)));
  const indice = Math.min(Math.max(indiceMes(vista.year, vista.month), primero), ultimo);
  return { year: Math.floor(indice / 12), month: (indice % 12) + 1 };
}

export function desplazarMes(vista: VistaMes, meses: number): VistaMes {
  const indice = indiceMes(vista.year, vista.month) + meses;
  return { year: Math.floor(indice / 12), month: (indice % 12) + 1 };
}

/** Mes que se abre al desplegar el calendario: el de la fecha elegida o el de `inicial`. */
export function vistaDe(iso: string, inicial: string, min: string, max: string): VistaMes {
  const base = isIsoDate(iso) ? iso : isIsoDate(inicial) ? inicial : min || max;
  return limitarVista(
    { year: Number(base.slice(0, 4)), month: Number(base.slice(5, 7)) },
    min,
    max,
  );
}

/** Años con al menos un día permitido, del más reciente al más antiguo. */
export function aniosPermitidos(min: string, max: string): number[] {
  const desde = Number(min.slice(0, 4));
  const hasta = Number(max.slice(0, 4));
  return Array.from({ length: Math.max(0, hasta - desde + 1) }, (_, indice) => hasta - indice);
}

/** Meses (1-12) del año que tienen algún día permitido. */
export function mesesPermitidos(year: number, min: string, max: string): number[] {
  return Array.from({ length: 12 }, (_, indice) => indice + 1).filter((month) => {
    const indice = indiceMes(year, month);
    return (
      indice >= indiceMes(Number(min.slice(0, 4)), Number(min.slice(5, 7))) &&
      indice <= indiceMes(Number(max.slice(0, 4)), Number(max.slice(5, 7)))
    );
  });
}

type DiaDelMes = { iso: string; day: number; fuera: boolean };

/** Días del mes con las celdas vacías previas para alinear el primero con su día de la semana. */
export function construirMes(
  vista: VistaMes,
  min: string,
  max: string,
): { slots: string[]; days: DiaDelMes[] } {
  const { year, month } = vista;
  const diasDelMes = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const primerDia = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const prefijo = year + '-' + String(month).padStart(2, '0') + '-';

  return {
    slots: Array.from({ length: primerDia }, (_, slot) => 'slot-' + slot),
    days: Array.from({ length: diasDelMes }, (_, indice) => {
      const iso = prefijo + String(indice + 1).padStart(2, '0');
      return { iso, day: indice + 1, fuera: iso < min || iso > max };
    }),
  };
}

export const RANGO_FECHAS = { min: FECHA_MINIMA, max: FECHA_MAXIMA };
