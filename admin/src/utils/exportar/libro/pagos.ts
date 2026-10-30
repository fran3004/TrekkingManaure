import { dxfEstado, filasLibres, hojas } from '../../../data/exportar/libro';
import { metodoPago, type Payment, type Registration } from '../../../../../shared/reservas';
import { addTable, tableColumnRange, thisRow } from '../xlsx/hoja';
import { columnName, excelDate } from '../xlsx/referencias';
import {
  filaTabla,
  filasDeTabla,
  hojaConTitulo,
  revision,
  validarColumnas,
  type Columna,
  type LibroContexto,
} from './comun';

const T = 'Pagos';
const r = (column: string) => thisRow(T, column);
const vacio = (column: string) => r(column) + '=""';
const posicion = 'MATCH(' + r('Código') + ',Inscripciones[Código],0)';
const buscar = (column: string) => 'INDEX(Inscripciones[' + column + '],' + posicion + ')';
const conCodigo = (formula: string) => 'IF(' + vacio('Código') + ',"",' + formula + ')';

export const pagoCorrecto = '✓ Correcto';

type Fila = { registration: Registration; payment: Payment };

const avisos: [string, string][] = [
  [vacio('Código'), 'Elige el código de la inscripción.'],
  ['AND(' + r('Código') + '<>"",ISNA(' + posicion + '))', 'Ese código no está en Inscripciones.'],
  [vacio('Concepto'), 'Falta el concepto.'],
  ['NOT(ISNUMBER(' + r('Fecha') + '))', 'Falta la fecha.'],
  ['NOT(ISNUMBER(' + r('Monto') + '))', 'Falta el monto.'],
  [vacio('Revisión'), 'Elige la revisión.'],
  [
    'AND(' + r('Revisión') + '="Rechazado",' + vacio('Motivo del rechazo') + ')',
    'Falta el motivo del rechazo.',
  ],
  [
    'AND(' + r('Revisión') + '<>"Rechazado",' + r('Motivo del rechazo') + '<>"")',
    'Solo un pago rechazado lleva motivo.',
  ],
  [
    'AND(' +
      r('Revisión') +
      '="Aprobado",IFERROR(' +
      buscar('Pagado') +
      '>' +
      buscar('Total') +
      ',FALSE))',
    'Lo aprobado supera el total de la inscripción.',
  ],
];

const columnas: Columna<Fila>[] = [
  {
    name: 'Pago',
    width: 11,
    style: 'centro',
    value: ({ payment }) => payment.id,
    manual: { f: 'IF(' + vacio('Código') + ',"","Manual")', s: 'entradaCentro' },
  },
  {
    name: 'Código',
    width: 16,
    value: ({ registration }) => registration.id,
    ayuda: {
      list: 'ListaCodigos',
      prompt: [
        'Código de la inscripción',
        'Elige de la lista el código de quien pagó (PER- o MAN-).',
      ],
      error: [
        'Código no encontrado',
        'Elige un código de la lista; primero agrega la inscripción.',
      ],
    },
  },
  {
    name: 'Revisar',
    width: 28,
    style: 'revisar',
    formula: revision(
      'AND(' + vacio('Código') + ',NOT(ISNUMBER(' + r('Monto') + ')))',
      avisos,
      pagoCorrecto,
    ),
  },
  {
    name: 'Titular',
    width: 26,
    formula: conCodigo('IFERROR(' + buscar('Nombres') + '&" "&' + buscar('Apellidos') + ',"")'),
  },
  {
    name: 'Concepto',
    width: 18,
    value: ({ payment }) => payment.concept,
    ayuda: {
      list: 'ListaConceptos',
      prompt: [
        'Concepto del pago',
        'Separación de cupo: primer pago al apartar. Pago total: todo de una vez. Pago de saldo: lo que falta.',
      ],
      error: ['Concepto no válido', 'Elige un concepto de la lista.'],
    },
  },
  {
    name: 'Fecha',
    width: 12,
    style: 'fecha',
    value: ({ payment }) => excelDate(payment.date),
    ayuda: {
      type: 'date',
      operator: 'between',
      formula1: 'FechaApertura',
      formula2: 'FechaEvento',
      prompt: ['Fecha del pago', 'Día en que llegó el dinero a la llave Bre-B.'],
      error: ['Fecha fuera de rango', 'Debe estar entre la apertura de inscripciones y el evento.'],
    },
  },
  {
    name: 'Monto',
    width: 14,
    style: 'moneda',
    total: 'sum',
    value: ({ payment }) => payment.amount,
    ayuda: {
      type: 'whole',
      operator: 'greaterThan',
      formula1: '0',
      prompt: ['Monto en pesos', 'Solo el número, sin puntos ni signo: 50000.'],
      error: ['Monto no válido', 'Escribe un número entero mayor que cero.'],
    },
  },
  {
    name: 'Revisión',
    width: 13,
    style: 'centro',
    value: ({ payment }) => payment.review,
    manual: { v: 'Aprobado', s: 'entradaCentro' },
    ayuda: {
      list: 'ListaRevisiones',
      prompt: [
        'Revisión del pago',
        'Aprobado solo si viste el dinero en la llave Bre-B. Solo los aprobados suman a lo pagado.',
      ],
      error: ['Revisión no válida', 'Elige Por revisar, Aprobado o Rechazado.'],
    },
  },
  {
    name: 'Motivo del rechazo',
    width: 34,
    value: ({ payment }) => payment.rejectionReason ?? '',
    ayuda: {
      list: 'ListaMotivos',
      soloAviso: true,
      prompt: ['Motivo del rechazo', 'Solo si lo rechazas. Elige uno o escribe otro.'],
      error: ['Otro motivo', 'No está en la lista; acepta para guardarlo tal cual.'],
    },
  },
  {
    name: 'Saldo de la inscripción',
    width: 14,
    style: 'moneda',
    formula: conCodigo('IFERROR(' + buscar('Saldo') + ',"")'),
  },
  {
    name: 'Estado de la inscripción',
    width: 16,
    style: 'centro',
    formula: conCodigo('IFERROR(' + buscar('Estado') + ',"")'),
  },
  {
    // Código y número del pago dentro de su inscripción (PER-0001|2); la hoja Buscar lista los pagos con ella.
    name: 'Clave',
    width: 10,
    hidden: true,
    formula: conCodigo(
      r('Código') + '&"|"&COUNTIF(INDEX(Pagos[Código],1):' + r('Código') + ',' + r('Código') + ')',
    ),
  },
];

export function crearPagos(contexto: LibroContexto) {
  const sheet = hojaConTitulo(
    hojas.pagos,
    'Pagos por ' + metodoPago.label,
    'Para registrar un pago, llena una fila amarilla del final: elige el código, el concepto, la fecha y el monto. Solo los pagos Aprobados suman a lo pagado.',
    columnas.length - 1,
    { tabColor: 'E8581C' },
  );
  sheet.freeze = { row: filaTabla + 1, column: 3 };

  const filas: Fila[] = contexto.summaries
    .flatMap(({ registration }) =>
      registration.payments.map((payment) => ({ registration, payment })),
    )
    .sort(
      (a, b) =>
        a.payment.date.localeCompare(b.payment.date) || a.payment.id.localeCompare(b.payment.id),
    );

  addTable(
    sheet,
    {
      name: T,
      row: filaTabla,
      column: 0,
      columns: columnas,
      totals: true,
      style: 'TableStyleLight15',
    },
    filasDeTabla(columnas, filas, filasLibres.pagos),
  );
  validarColumnas(sheet, columnas);

  const table = sheet.tables[0];
  const first = filaTabla + 2;
  const range = (name: string) => tableColumnRange(table, name);
  const celda = (name: string) =>
    '$' + columnName(columnas.findIndex((col) => col.name === name)) + first;

  const review = celda('Revisión');
  const revisar = celda('Revisar');
  sheet.conditionals.push(
    {
      range: range('Revisión'),
      type: 'expression',
      formula: review + '="Aprobado"',
      dxf: 'pagado',
    },
    {
      range: range('Revisión'),
      type: 'expression',
      formula: review + '="Por revisar"',
      dxf: 'verificar',
    },
    {
      range: range('Revisión'),
      type: 'expression',
      formula: review + '="Rechazado"',
      dxf: 'rechazado',
    },
    {
      range: range('Revisar'),
      type: 'expression',
      formula: revisar + '="' + pagoCorrecto + '"',
      dxf: 'completo',
    },
    {
      range: range('Revisar'),
      type: 'expression',
      formula: 'AND(' + revisar + '<>"",' + revisar + '<>"' + pagoCorrecto + '")',
      dxf: 'pendiente',
    },
    { range: range('Monto'), type: 'dataBar', color: 'E8581C' },
  );
  const status = celda('Estado de la inscripción');
  for (const [name, dxf] of Object.entries(dxfEstado)) {
    sheet.conditionals.push({
      range: range('Estado de la inscripción'),
      type: 'expression',
      formula: status + '="' + name + '"',
      dxf,
    });
  }

  return { sheet };
}
