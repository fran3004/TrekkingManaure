import { EDAD_MAXIMA } from '../../../../shared/reservas';

/** Nombre del campo de formulario; prefijo '' = titular, 'acomp' = acompañante. */
export function fieldName(prefix: string, base: string): string {
  return prefix ? prefix + base.charAt(0).toUpperCase() + base.slice(1) : base;
}

/** Año que muestra el calendario de nacimiento al abrirlo vacío: hace tantos años. */
const EDAD_VISTA_NACIMIENTO = 30;

/**
 * Rango de fechas de nacimiento según la fecha actual: desde hace EDAD_MAXIMA años hasta hoy.
 * Se calcula cada vez que se muestra el formulario, así no queda fijo en un año. `inicio` es el
 * mes en que se abre el calendario mientras no hay fecha elegida.
 */
export function fechasNacimientoPermitidas(hoy: string): {
  min: string;
  max: string;
  inicio: string;
} {
  const [year, month, day] = hoy.split('-').map(Number);
  const min = new Date(Date.UTC(year - EDAD_MAXIMA - 1, month - 1, day + 1));
  const inicio = new Date(Date.UTC(year - EDAD_VISTA_NACIMIENTO, month - 1, 1));
  return {
    min: min.toISOString().slice(0, 10),
    max: hoy,
    inicio: inicio.toISOString().slice(0, 10),
  };
}

/** Convierte AAAA-MM-DD a DD/MM/AAAA para el resumen. */
export function formatBirth(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? match[3] + '/' + match[2] + '/' + match[1] : value;
}
