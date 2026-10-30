import {
  createSheet,
  merge,
  setCell,
  tableColumnRange,
  type Cell,
  type CellValue,
  type Sheet,
  type TableColumn,
  type Validation,
} from '../xlsx/hoja';
import type { Summary } from '../../../../../shared/reservas';

type Cupos = { capacity: number; occupied: number };

export type LibroContexto = {
  summaries: Summary[];
  today: string;
  /** Último día para inscribirse y para pagar el restante (lo fija la organización). */
  fechaCierre: string;
  filterLabel: string;
  /** Cupos de la carrera (uno por reserva activa) y cupos del páramo, tal como los da la página. */
  carrera: Cupos;
  paramo: Cupos;
  /** Totales de la página al descargar, con todas las reservas sin importar el filtro. */
  pagina: { inscripciones: number; recaudado: number; pagosPorRevisar: number };
};

/**
 * Columna de una tabla del libro. `value` llena las filas que vienen de la página; `manual` es la
 * celda de una fila libre (una fórmula propia o un valor sugerido) y, si falta, la fila libre
 * queda en blanco con fondo amarillo para escribir. `ayuda` es la validación y el mensaje que
 * aparece al seleccionar la celda.
 */
export type Columna<T = Summary> = TableColumn & {
  value?: (fila: T) => CellValue;
  manual?: Cell;
  ayuda?: Omit<Validation, 'range'>;
};

// Fila (desde 0) donde empieza el encabezado de las tablas de datos.
export const filaTabla = 3;

export const siNo = (value: boolean) => (value ? 'Sí' : 'No');

const estilosEntrada: Record<string, string> = {
  fecha: 'entradaFecha',
  centro: 'entradaCentro',
  entero: 'entradaEntero',
  moneda: 'entradaMoneda',
};

/** Filas de una tabla: las de la página y, al final, `libres` filas en blanco para escribir. */
export function filasDeTabla<T>(columns: Columna<T>[], filas: T[], libres: number) {
  const llenas = filas.map((fila) => columns.map((col) => col.value?.(fila) ?? null));
  const libre = columns.map(
    (col): Cell => col.manual ?? { s: estilosEntrada[col.style ?? ''] ?? 'entradaTexto' },
  );
  return [...llenas, ...Array.from({ length: libres }, () => libre)];
}

/** Agrega a la hoja la validación y la ayuda de cada columna que las tenga. */
export function validarColumnas<T>(sheet: Sheet, columns: Columna<T>[]) {
  const table = sheet.tables[sheet.tables.length - 1];
  for (const col of columns) {
    if (col.ayuda)
      sheet.validations.push({ ...col.ayuda, range: tableColumnRange(table, col.name) });
  }
}

/**
 * Fórmula de la columna de revisión: vacía si la fila no tiene datos (`vacia`), el texto `ok` si
 * todo está bien o la lista de avisos de las condiciones que se cumplen.
 */
export function revision(vacia: string, avisos: [condicion: string, texto: string][], ok: string) {
  return (
    'IF(' +
    vacia +
    ',"",IF(OR(' +
    avisos.map(([condicion]) => condicion).join(',') +
    '),TRIM(' +
    avisos.map(([condicion, texto]) => 'IF(' + condicion + ',"' + texto + ' ","")').join('&') +
    '),"' +
    ok +
    '"))'
  );
}

/** Lista de validación de Excel a partir de un catálogo corto: "A,B,C". */
export const listaExcel = (values: readonly string[]) => '"' + values.join(',') + '"';

export function hojaConTitulo(
  name: string,
  title: string,
  subtitle: string,
  lastColumn: number,
  options: { gridLines?: boolean; tabColor?: string } = {},
): Sheet {
  const sheet = createSheet(name, options);
  sheet.heights[0] = 34;
  sheet.heights[1] = 20;
  merge(sheet, 0, 0, 0, lastColumn, { v: title, s: 'titulo' });
  merge(sheet, 1, 0, 1, lastColumn, { v: subtitle, s: 'subtitulo' });
  return sheet;
}

export function seccion(
  sheet: Sheet,
  row: number,
  column: number,
  lastColumn: number,
  title: string,
) {
  merge(sheet, row, column, row, lastColumn, { v: title, s: 'seccion' });
  sheet.heights[row] = 22;
}

export function nota(sheet: Sheet, row: number, column: number, lastColumn: number, text: string) {
  merge(sheet, row, column, row, lastColumn, { v: text, s: 'nota' });
  sheet.heights[row] = 30;
}

export function encabezado(sheet: Sheet, row: number, column: number, titles: string[]) {
  titles.forEach((title, index) =>
    setCell(sheet, row, column + index, { v: title, s: 'tablaEncabezado' }),
  );
}
