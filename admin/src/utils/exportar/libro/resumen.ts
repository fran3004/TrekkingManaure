import { evento, precios } from '../../../../../shared/config';
import { formatDate } from '../../../../../shared/utils/format';
import { colores, coloresEstado, dxfEstado, hojas } from '../../../data/exportar/libro';
import {
  countHotelNights,
  countHotelPeople,
  estadias,
  getRunners,
  statusOrder,
  tallas,
  type Summary,
} from '../../../../../shared/reservas';
import { merge, setCell, setRow, type Cell, type Chart, type Sheet } from '../xlsx/hoja';
import { absoluteRange, columnName } from '../xlsx/referencias';
import { hojaConTitulo, nota, seccion, type LibroContexto } from './comun';

const ULTIMA = 16;
const GRAFICO = { desde: 9, hasta: 17 };
const MONEDA = '"$"#,##0;-"$"#,##0;;';
const CANTIDAD = '#,##0;-#,##0;;';

type Kpi = { label: string; value: string; valueStyle: string; note: string; noteStyle: string };

// Solo cuentan las reservas activas (no Rechazadas): son las que apartan cupo y se cobran.
const ACTIVA = 'Inscripciones[Activa],"Sí"';
const RESERVAS_ACTIVAS = 'COUNTIF(' + ACTIVA + ')';
const CUPOS_PARAMO = 'SUMIFS(Inscripciones[Personas en páramo],' + ACTIVA + ')';
const FACTURADO = 'SUMIFS(Inscripciones[Total],' + ACTIVA + ')';
const conAcompanante = 'Inscripciones[Acompañante],"Sí"';
const conKit = conAcompanante + ',Inscripciones[Kit del acompañante],"Sí"';
/** Kits de las reservas activas: el del titular siempre y el del acompañante si lo compró. */
const kits = (criterio = '') =>
  'COUNTIFS(' + ACTIVA + criterio + ')+COUNTIFS(' + ACTIVA + criterio + ',' + conKit + ')';

const kpis: Kpi[] = [
  {
    label: 'INSCRIPCIONES',
    value: 'COUNTIF(Inscripciones[Código],"?*")',
    valueStyle: 'kpiValor',
    note: 'SUM(Inscripciones[Personas])',
    noteStyle: 'notaCorredores',
  },
  {
    label: 'FACTURADO',
    value: FACTURADO,
    valueStyle: 'kpiMoneda',
    note: 'IFERROR(' + FACTURADO + '/' + RESERVAS_ACTIVAS + ',0)',
    noteStyle: 'notaPromedio',
  },
  {
    label: 'RECAUDADO',
    value: 'SUM(Inscripciones[Pagado])',
    valueStyle: 'kpiMoneda',
    note: 'IFERROR(SUM(Inscripciones[Pagado])/' + FACTURADO + ',0)',
    noteStyle: 'notaPorcentaje',
  },
  {
    // Igual que el panel: saldos de las inscripciones con algo pagado (Saldo pendiente y Vencido).
    label: 'POR COBRAR',
    value: 'SUMIFS(Inscripciones[Saldo],Inscripciones[Pagado],">0")',
    valueStyle: 'kpiMoneda',
    note: 'SUMIFS(Inscripciones[Saldo],Inscripciones[Estado],"Vencido")',
    noteStyle: 'notaVencidos',
  },
  {
    label: 'PAGOS POR REVISAR',
    value: 'COUNTIF(Pagos[Revisión],"Por revisar")',
    valueStyle: 'kpiValorAlerta',
    note: 'SUMIFS(Pagos[Monto],Pagos[Revisión],"Por revisar")',
    noteStyle: 'notaDeclarados',
  },
  {
    label: 'CUPOS LIBRES · CARRERA',
    value: 'MAX(0,CuposCarrera-' + RESERVAS_ACTIVAS + ')',
    valueStyle: 'kpiValor',
    note: RESERVAS_ACTIVAS,
    noteStyle: 'notaReservas',
  },
  {
    label: 'CUPOS LIBRES · PÁRAMO',
    value: 'MAX(0,CuposParamo-' + CUPOS_PARAMO + ')',
    valueStyle: 'kpiValor',
    note: CUPOS_PARAMO,
    noteStyle: 'notaCuposParamo',
  },
  {
    label: 'KITS A PRODUCIR',
    value: kits(),
    valueStyle: 'kpiValor',
    note: kits(',Inscripciones[Estado],"Vencido"'),
    noteStyle: 'notaRiesgo',
  },
];

const experiencias = [
  {
    label: 'Paseo en cuatrimoto',
    count: 'COUNTIFS(' + ACTIVA + ',Inscripciones[Cuatrimoto],"Sí")',
    price: 'PrecioCuatrimoto',
  },
  {
    label: 'Parapente del titular',
    count: 'COUNTIFS(' + ACTIVA + ',Inscripciones[Parapente],"Sí")',
    price: 'PrecioParapente',
  },
  {
    label: 'Parapente del acompañante',
    count: 'COUNTIFS(' + ACTIVA + ',Inscripciones[Parapente del acompañante],"Sí")',
    price: 'PrecioParapente',
  },
  {
    label: 'Hotel antes del evento (noches por persona)',
    count: 'SUMIFS(Inscripciones[Noches-persona de hotel],' + ACTIVA + ')',
    price: 'PrecioHotelNoche',
  },
];

// Mismo cálculo que la columna Total: cada reserva activa suma estos conceptos.
const conceptos = [
  { label: 'Inscripción y kit del titular', count: RESERVAS_ACTIVAS, price: 'PrecioTitular' },
  {
    label: 'Acompañante con kit',
    count: 'COUNTIFS(' + ACTIVA + ',' + conKit + ')',
    price: 'PrecioAcompConKit',
  },
  {
    label: 'Acompañante sin kit',
    count:
      'COUNTIFS(' + ACTIVA + ',' + conAcompanante + ')-COUNTIFS(' + ACTIVA + ',' + conKit + ')',
    price: 'PrecioAcompSinKit',
  },
  ...experiencias,
];

/** Precio de cada concepto, en el mismo orden, para los valores en caché de los gráficos. */
const preciosConceptos = [
  precios.total,
  precios.acompananteConKit,
  precios.acompanante,
  precios.cuatrimoto,
  precios.parapente,
  precios.parapente,
  precios.hotelNoche,
];

const activos = (summaries: Summary[]) =>
  summaries.filter((summary) => summary.status !== 'Rechazado');

const COBROS = 8;

function encabezadoBloque(sheet: Sheet, row: number, headers: string[]) {
  merge(sheet, row, 1, row, 2, { v: headers[0], s: 'tablaEncabezado' });
  headers
    .slice(1)
    .forEach((header, index) =>
      setCell(sheet, row, 3 + index, { v: header, s: 'tablaEncabezado' }),
    );
  sheet.heights[row] = 30;
}

function filaBloque(sheet: Sheet, row: number, label: Cell, cells: Cell[]) {
  merge(sheet, row, 1, row, 2, label);
  setRow(sheet, row, 3, cells);
}

const ref = (row: number, column: number) => columnName(column) + (row + 1);
const sumColumn = (column: number, first: number, last: number) =>
  'SUM(' + ref(first, column) + ':' + ref(last, column) + ')';

function chartRange(row: number, column: number, lastRow: number) {
  return absoluteRange(hojas.resumen, row, column, lastRow, column);
}

function anchor(row: number): Pick<Chart, 'from' | 'to'> {
  return { from: [row, GRAFICO.desde], to: [row + 15, GRAFICO.hasta] };
}

function bloqueEstados(sheet: Sheet, summaries: Summary[], start: number) {
  const first = start + 2;
  const last = first + statusOrder.length - 1;
  seccion(sheet, start, 1, 7, 'Estado de las inscripciones');
  encabezadoBloque(sheet, start + 1, [
    'Estado',
    'Inscripciones',
    'Total',
    'Pagado',
    'Saldo',
    '% recaudo',
  ]);

  statusOrder.forEach((status, index) => {
    const row = first + index;
    const label = '$B' + (row + 1);
    const sum = (column: string) =>
      'SUMIFS(Inscripciones[' + column + '],Inscripciones[Estado],' + label + ')';
    filaBloque(sheet, row, { v: status, s: 'celdaTexto' }, [
      { f: 'COUNTIF(Inscripciones[Estado],' + label + ')', s: 'celdaEntero' },
      { f: sum('Total'), s: 'celdaMoneda' },
      { f: sum('Pagado'), s: 'celdaMoneda' },
      // Una inscripción rechazada liberó su cupo: no queda nada por cobrarle.
      { f: status === 'Rechazado' ? '0' : sum('Saldo'), s: 'celdaMoneda' },
      { f: 'IFERROR(' + ref(row, 5) + '/' + ref(row, 4) + ',0)', s: 'celdaPorcentaje' },
    ]);
    sheet.conditionals.push({
      range: 'B' + (row + 1) + ':C' + (row + 1),
      type: 'expression',
      formula: label + '="' + status + '"',
      dxf: dxfEstado[status],
    });
  });
  // Rechazado es el último estado: el total cuenta solo las activas y cuadra con el FACTURADO.
  const total = last + 1;
  const activas = last - 1;
  filaBloque(sheet, total, { v: 'Total sin rechazadas', s: 'tablaTotal' }, [
    { f: sumColumn(3, first, activas), s: 'enteroTotal' },
    { f: sumColumn(4, first, activas), s: 'monedaTotal' },
    { f: sumColumn(5, first, activas), s: 'monedaTotal' },
    { f: sumColumn(6, first, activas), s: 'monedaTotal' },
    { f: 'IFERROR(' + ref(total, 5) + '/' + ref(total, 4) + ',0)', s: 'porcentajeTotal' },
  ]);

  const of = (status: string) => summaries.filter((summary) => summary.status === status);
  const categories = { categories: chartRange(first, 1, last), categoryCache: [...statusOrder] };
  sheet.charts.push({
    kind: 'doughnut',
    title: 'Inscripciones por estado',
    pointColors: statusOrder.map((status) => coloresEstado[status]),
    series: [
      {
        name: 'Inscripciones',
        ...categories,
        values: chartRange(first, 3, last),
        valueCache: statusOrder.map((status) => of(status).length),
      },
    ],
    ...anchor(start),
  });

  // Gráfico de recaudo por estado; se ubica junto al bloque de cobranza.
  const cobranza: Omit<Chart, 'from' | 'to'> = {
    kind: 'bar',
    stacked: true,
    title: 'Recaudado y por cobrar según estado',
    numFmt: MONEDA,
    series: [
      {
        name: 'Pagado',
        color: colores.musgo,
        ...categories,
        values: chartRange(first, 5, last),
        valueCache: statusOrder.map((status) =>
          of(status).reduce((sum, item) => sum + item.paid, 0),
        ),
      },
      {
        name: 'Saldo',
        color: colores.naranja,
        ...categories,
        values: chartRange(first, 6, last),
        valueCache: statusOrder.map((status) =>
          status === 'Rechazado' ? 0 : of(status).reduce((sum, item) => sum + item.balance, 0),
        ),
      },
    ],
  };
  return cobranza;
}

function bloqueIngresos(sheet: Sheet, todos: Summary[], start: number) {
  const summaries = activos(todos);
  const first = start + 2;
  const last = first + conceptos.length - 1;
  const total = last + 1;
  seccion(sheet, start, 1, 7, 'Ingresos por concepto · reservas activas');
  encabezadoBloque(sheet, start + 1, ['Concepto', 'Cantidad', 'Precio', 'Importe', '% del total']);

  conceptos.forEach((concepto, index) => {
    const row = first + index;
    filaBloque(sheet, row, { v: concepto.label, s: 'celdaTexto' }, [
      { f: concepto.count, s: 'celdaEntero' },
      { f: concepto.price, s: 'celdaMoneda' },
      { f: ref(row, 3) + '*' + ref(row, 4), s: 'celdaMoneda' },
      {
        f: 'IFERROR(' + ref(row, 5) + '/$' + columnName(5) + '$' + (total + 1) + ',0)',
        s: 'celdaPorcentaje',
      },
    ]);
  });
  // La cantidad no se suma: mezcla personas, actividades y noches.
  filaBloque(sheet, total, { v: 'Total facturado', s: 'tablaTotal' }, [
    { s: 'tablaTotal' },
    { s: 'tablaTotal' },
    { f: sumColumn(5, first, last), s: 'monedaTotal' },
    { f: sumColumn(6, first, last), s: 'porcentajeTotal' },
  ]);
  merge(sheet, total + 1, 1, total + 1, 7, {
    f:
      'IF(' +
      ref(total, 5) +
      '=' +
      FACTURADO +
      ',"✓ El total por concepto cuadra con el facturado de las reservas activas.","Atención: el total por concepto no cuadra con Inscripciones; revisa la columna Revisar datos.")',
    s: 'mensaje',
  });

  const counts = [
    summaries.length,
    summaries.filter((item) => item.registration.companion?.kit).length,
    summaries.filter((item) => item.registration.companion && !item.registration.companion.kit)
      .length,
    summaries.filter((item) => item.registration.extras.includes('cuatrimoto')).length,
    summaries.filter((item) => item.registration.extras.includes('parapente')).length,
    summaries.filter((item) => item.registration.extras.includes('parapenteAcompanante')).length,
    summaries.reduce((sum, item) => {
      const hotel = item.registration.preEventHotel;
      return hotel
        ? sum +
            countHotelNights(hotel) * countHotelPeople(hotel, item.registration.companion !== null)
        : sum;
    }, 0),
  ];
  sheet.charts.push({
    kind: 'bar',
    title: 'Ingresos por concepto',
    numFmt: MONEDA,
    series: [
      {
        name: 'Importe',
        color: colores.dorado,
        categories: chartRange(first, 1, last),
        categoryCache: conceptos.map((concepto) => concepto.label),
        values: chartRange(first, 5, last),
        valueCache: counts.map((count, index) => count * preciosConceptos[index]),
      },
    ],
    ...anchor(start),
  });
}

function bloqueTallas(sheet: Sheet, todos: Summary[], start: number) {
  const summaries = activos(todos);
  const first = start + 2;
  const last = first + tallas.length - 1;
  seccion(sheet, start, 1, 7, 'Kits y camisas por talla · reservas activas');
  encabezadoBloque(sheet, start + 1, [
    'Talla',
    'Titulares',
    'Acompañantes',
    'Total',
    'Con pago aprobado',
    'Saldo vencido',
  ]);

  tallas.forEach((talla, index) => {
    const row = first + index;
    const celdaTalla = '$B' + (row + 1);
    const titulares = (extra: string) =>
      'COUNTIFS(' + ACTIVA + ',Inscripciones[Talla],' + celdaTalla + extra + ')';
    const acompanantes = (extra: string) =>
      'COUNTIFS(' +
      ACTIVA +
      ',' +
      conKit +
      ',Inscripciones[Talla del acompañante],' +
      celdaTalla +
      extra +
      ')';
    const ambos = (extra: string) => titulares(extra) + '+' + acompanantes(extra);
    filaBloque(sheet, row, { v: talla, s: 'celdaCentro' }, [
      { f: titulares(''), s: 'celdaEntero' },
      { f: acompanantes(''), s: 'celdaEntero' },
      { f: ref(row, 3) + '+' + ref(row, 4), s: 'celdaEntero' },
      { f: ambos(',Inscripciones[Pagado],">0"'), s: 'celdaEntero' },
      { f: ambos(',Inscripciones[Estado],"Vencido"'), s: 'celdaEntero' },
    ]);
  });
  const total = last + 1;
  filaBloque(
    sheet,
    total,
    { v: 'Total', s: 'tablaTotal' },
    [3, 4, 5, 6, 7].map((column) => ({ f: sumColumn(column, first, last), s: 'enteroTotal' })),
  );
  nota(
    sheet,
    total + 1,
    1,
    7,
    'Produce primero las camisas con pago aprobado. Las de saldo vencido pueden liberarse para otra persona. Las reservas rechazadas no cuentan.',
  );

  const runners = summaries.flatMap((summary) => getRunners(summary.registration));
  const count = (role: string) =>
    tallas.map(
      (talla) =>
        runners.filter((runner) => runner.kit && runner.role === role && runner.shirtSize === talla)
          .length,
    );
  const categories = { categories: chartRange(first, 1, last), categoryCache: [...tallas] };
  sheet.charts.push({
    kind: 'column',
    title: 'Camisas por talla',
    numFmt: CANTIDAD,
    series: [
      {
        name: 'Titulares',
        color: colores.verde,
        ...categories,
        values: chartRange(first, 3, last),
        valueCache: count('Titular'),
      },
      {
        name: 'Acompañantes',
        color: colores.dorado,
        ...categories,
        values: chartRange(first, 4, last),
        valueCache: count('Acompañante'),
      },
    ],
    ...anchor(start),
  });
}

function bloqueEstadia(sheet: Sheet, todos: Summary[], start: number) {
  const summaries = activos(todos);
  const first = start + 2;
  const stays = [...estadias];
  const last = first + stays.length - 1;
  seccion(sheet, start, 1, 7, 'Estadía y experiencias · reservas activas');
  encabezadoBloque(sheet, start + 1, ['Estadía', 'Corredores', '% del total']);

  stays.forEach((stay, index) => {
    const row = first + index;
    const estadia = '$B' + (row + 1);
    filaBloque(sheet, row, { v: stay, s: 'celdaTexto' }, [
      {
        f:
          'COUNTIFS(' +
          ACTIVA +
          ',Inscripciones[Estadía],' +
          estadia +
          ')+COUNTIFS(' +
          ACTIVA +
          ',' +
          conAcompanante +
          ',Inscripciones[Estadía del acompañante],' +
          estadia +
          ')',
        s: 'celdaEntero',
      },
      {
        f: 'IFERROR(' + ref(row, 3) + '/' + sumColumn(3, first, last) + ',0)',
        s: 'celdaPorcentaje',
      },
    ]);
  });
  filaBloque(sheet, last + 1, { v: 'Total', s: 'tablaTotal' }, [
    { f: sumColumn(3, first, last), s: 'enteroTotal' },
    { f: sumColumn(4, first, last), s: 'porcentajeTotal' },
  ]);

  const extras = start + 7;
  encabezadoBloque(sheet, extras, ['Experiencia', 'Reservas', 'Precio', 'Ingreso']);
  experiencias.forEach((item, index) => {
    const row = extras + 1 + index;
    filaBloque(sheet, row, { v: item.label, s: 'celdaTexto' }, [
      { f: item.count, s: 'celdaEntero' },
      { f: item.price, s: 'celdaMoneda' },
      { f: ref(row, 3) + '*' + ref(row, 4), s: 'celdaMoneda' },
    ]);
  });

  const runners = summaries.flatMap((summary) => getRunners(summary.registration));
  sheet.charts.push({
    kind: 'pie',
    title: 'Dónde duermen los corredores',
    pointColors: [colores.verde, colores.dorado, colores.tierra],
    series: [
      {
        name: 'Corredores',
        categories: chartRange(first, 1, last),
        categoryCache: stays,
        values: chartRange(first, 3, last),
        valueCache: stays.map((stay) => runners.filter((runner) => runner.stay === stay).length),
      },
    ],
    ...anchor(start),
  });
}

function bloqueCobros(sheet: Sheet, start: number) {
  const first = start + 2;
  seccion(sheet, start, 1, 7, 'Próximos compromisos de pago');
  setCell(sheet, start + 1, 1, { v: 'Código', s: 'tablaEncabezado' });
  merge(sheet, start + 1, 2, start + 1, 3, { v: 'Titular', s: 'tablaEncabezado' });
  setRow(
    sheet,
    start + 1,
    4,
    ['Compromiso', 'Saldo', 'Días', 'Estado'].map((title) => ({ v: title, s: 'tablaEncabezado' })),
  );
  sheet.heights[start + 1] = 30;

  for (let index = 0; index < COBROS; index++) {
    const row = first + index;
    const key = '$S' + (row + 1);
    const position = '$T' + (row + 1);
    const pick = (column: string) =>
      'IF(' + position + '="","",INDEX(Inscripciones[' + column + '],' + position + '))';
    setCell(sheet, row, 18, {
      f: 'IFERROR(SMALL(Inscripciones[Clave de cobro],' + (index + 1) + '),"")',
    });
    setCell(sheet, row, 19, {
      f: 'IF(' + key + '="","",MATCH(' + key + ',Inscripciones[Clave de cobro],0))',
    });
    setCell(sheet, row, 1, { f: pick('Código'), s: 'celdaCentro' });
    merge(sheet, row, 2, row, 3, {
      f:
        'IF(' +
        position +
        '="","",INDEX(Inscripciones[Nombres],' +
        position +
        ')&" "&INDEX(Inscripciones[Apellidos],' +
        position +
        '))',
      s: 'celdaTexto',
    });
    setRow(sheet, row, 4, [
      { f: pick('Compromiso'), s: 'celdaFecha' },
      { f: pick('Saldo'), s: 'celdaMoneda' },
      { f: pick('Días al compromiso'), s: 'celdaDias' },
      { f: pick('Estado'), s: 'celdaCentro' },
    ]);
  }
  const last = first + COBROS - 1;
  for (const [status, dxf] of Object.entries(dxfEstado)) {
    sheet.conditionals.push({
      range: 'H' + (first + 1) + ':H' + (last + 1),
      type: 'expression',
      formula: '$H' + (first + 1) + '="' + status + '"',
      dxf,
    });
  }
  nota(
    sheet,
    last + 1,
    1,
    7,
    'Inscripciones con cupo separado y saldo pendiente, de la fecha más cercana a la más lejana. Se actualiza solo cada día.',
  );
}

export function crearResumen(contexto: LibroContexto) {
  const sheet = hojaConTitulo(
    hojas.resumen,
    'TREKKING DESAFÍO PERIJÁ 13K · TABLERO DE GESTIÓN',
    'Manaure, Cesar · ' +
      evento.fechasTexto +
      ' · Corte al ' +
      formatDate(contexto.today) +
      ' de ' +
      contexto.today.slice(0, 4) +
      ' · Inscripciones incluidas: ' +
      contexto.filterLabel,
    ULTIMA + 1,
    { gridLines: false, tabColor: 'F2C14E' },
  );
  sheet.widths[0] = 2;
  for (let column = 1; column <= ULTIMA; column++) sheet.widths[column] = 14;
  sheet.widths[ULTIMA + 1] = 2;
  sheet.hidden.push(18, 19);
  sheet.heights[2] = 10;

  kpis.forEach((kpi, index) => {
    const column = 1 + index * 2;
    merge(sheet, 3, column, 3, column + 1, { v: kpi.label, s: 'kpiEtiqueta' });
    merge(sheet, 4, column, 4, column + 1, { f: kpi.value, s: kpi.valueStyle });
    merge(sheet, 5, column, 5, column + 1, { f: kpi.note, s: kpi.noteStyle });
  });
  sheet.heights[3] = 22;
  sheet.heights[4] = 38;
  sheet.heights[5] = 20;

  const { summaries } = contexto;
  const cobranza = bloqueEstados(sheet, summaries, 7);
  bloqueIngresos(sheet, summaries, 24);
  bloqueTallas(sheet, summaries, 41);
  bloqueEstadia(sheet, summaries, 58);
  bloqueCobros(sheet, 75);
  sheet.charts.push({ ...cobranza, ...anchor(75) });

  return { sheet };
}
