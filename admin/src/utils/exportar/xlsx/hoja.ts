import { cellRef, columnName, escapeXml, rangeRef } from './referencias';

export type CellValue = string | number | boolean | null;

// f: fórmula sin el signo igual. s: nombre del estilo.
export type Cell = { v?: CellValue; f?: string; s?: string };

export type TableColumn = {
  name: string;
  width?: number;
  style?: string;
  formula?: string;
  total?: 'sum' | 'count';
  hidden?: boolean;
};

export type Table = {
  name: string;
  row: number;
  column: number;
  columns: TableColumn[];
  rowCount: number;
  totals: boolean;
  style: string;
};

/**
 * Validación de datos de Excel. `list` es una lista ("A,B") o un nombre/rango; si no hay lista, `type`
 * con `formula1`/`formula2` (sin el signo igual). `prompt` es la ayuda que aparece al seleccionar la
 * celda y `error` el aviso al escribir algo inválido: [título de hasta 32 caracteres, texto de hasta
 * 255]. `soloAviso` deja guardar el valor tras avisar (para listas que admiten otros textos).
 */
export type Validation = {
  range: string;
  list?: string;
  type?: 'whole' | 'decimal' | 'date' | 'textLength' | 'custom';
  operator?: 'between' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThanOrEqual';
  formula1?: string;
  formula2?: string;
  prompt?: [string, string];
  error?: [string, string];
  soloAviso?: boolean;
};

export type Conditional =
  | { range: string; type: 'expression'; formula: string; dxf: string }
  | { range: string; type: 'dataBar'; color: string };

export type ChartSeries = {
  name: string;
  categories: string;
  values: string;
  color?: string;
  categoryCache: string[];
  valueCache: number[];
};

export type Chart = {
  kind: 'doughnut' | 'pie' | 'column' | 'bar';
  title: string;
  series: ChartSeries[];
  pointColors?: string[];
  stacked?: boolean;
  numFmt?: string;
  from: [number, number];
  to: [number, number];
};

export type Sheet = {
  name: string;
  cells: Map<number, Map<number, Cell>>;
  widths: Record<number, number>;
  heights: Record<number, number>;
  hidden: number[];
  merges: string[];
  freeze?: { row: number; column: number };
  tables: Table[];
  validations: Validation[];
  conditionals: Conditional[];
  charts: Chart[];
  gridLines: boolean;
  tabColor?: string;
  /** Hoja auxiliar que no se muestra (por ejemplo, las listas de los desplegables). */
  oculta?: boolean;
};

export function createSheet(
  name: string,
  options: { gridLines?: boolean; tabColor?: string; oculta?: boolean } = {},
): Sheet {
  return {
    name,
    cells: new Map(),
    widths: {},
    heights: {},
    hidden: [],
    merges: [],
    tables: [],
    validations: [],
    conditionals: [],
    charts: [],
    gridLines: options.gridLines ?? true,
    tabColor: options.tabColor,
    oculta: options.oculta,
  };
}

export function setCell(sheet: Sheet, row: number, column: number, cell: Cell) {
  if (!sheet.cells.has(row)) sheet.cells.set(row, new Map());
  sheet.cells.get(row)!.set(column, cell);
}

export function setRow(sheet: Sheet, row: number, column: number, cells: Cell[]) {
  cells.forEach((cell, offset) => setCell(sheet, row, column + offset, cell));
}

export function merge(
  sheet: Sheet,
  row: number,
  column: number,
  lastRow: number,
  lastColumn: number,
  cell: Cell,
) {
  for (let r = row; r <= lastRow; r++) {
    for (let c = column; c <= lastColumn; c++) setCell(sheet, r, c, { s: cell.s });
  }
  setCell(sheet, row, column, cell);
  sheet.merges.push(rangeRef(row, column, lastRow, lastColumn));
}

// Referencia estructurada a la fila actual de una tabla.
export function thisRow(table: string, column: string) {
  return table + '[[#This Row],[' + column + ']]';
}

const esCelda = (value: CellValue | Cell | undefined): value is Cell =>
  typeof value === 'object' && value !== null;

/**
 * Escribe encabezado, filas y totales de una tabla de Excel y la registra en la hoja. Una fila puede
 * traer valores o celdas completas (una fórmula propia o una celda vacía con otro estilo); las columnas
 * con fórmula de tabla la usan siempre.
 */
export function addTable(
  sheet: Sheet,
  spec: Omit<Table, 'rowCount'>,
  rows: (CellValue | Cell | undefined)[][],
) {
  const data = rows.length ? rows : [spec.columns.map(() => null)];
  const { row, column, columns, name } = spec;
  sheet.heights[row] = 32;

  columns.forEach((col, index) => {
    setCell(sheet, row, column + index, { v: col.name, s: 'tablaEncabezado' });
    if (col.width) sheet.widths[column + index] = col.width;
    if (col.hidden) sheet.hidden.push(column + index);
  });

  data.forEach((values, offset) => {
    columns.forEach((col, index) => {
      const value = values[index];
      setCell(
        sheet,
        row + 1 + offset,
        column + index,
        col.formula
          ? { f: col.formula, s: col.style }
          : esCelda(value)
            ? { ...value, s: value.s ?? col.style }
            : { v: value ?? null, s: col.style },
      );
    });
  });

  if (spec.totals) {
    const totalRow = row + 1 + data.length;
    columns.forEach((col, index) => {
      const code = col.total === 'sum' ? 109 : col.total === 'count' ? 103 : null;
      setCell(
        sheet,
        totalRow,
        column + index,
        index === 0
          ? { v: 'Total', s: 'tablaTotal' }
          : code
            ? {
                f: 'SUBTOTAL(' + code + ',' + name + '[' + col.name + '])',
                s: col.style ? col.style + 'Total' : 'tablaTotal',
              }
            : { s: 'tablaTotal' },
      );
    });
  }

  sheet.tables.push({ ...spec, rowCount: data.length });
}

function tableRange(table: Table) {
  return rangeRef(
    table.row,
    table.column,
    table.row + table.rowCount + (table.totals ? 1 : 0),
    table.column + table.columns.length - 1,
  );
}

// Rango de una columna de datos de la tabla, en notación A1 de la hoja.
export function tableColumnRange(table: Table, columnName: string) {
  const index = table.columns.findIndex((col) => col.name === columnName);
  return rangeRef(
    table.row + 1,
    table.column + index,
    table.row + table.rowCount,
    table.column + index,
  );
}

function cellXml(ref: string, cell: Cell, style: Record<string, number>) {
  const s = cell.s && style[cell.s] ? ' s="' + style[cell.s] + '"' : '';
  if (cell.f) return '<c r="' + ref + '"' + s + '><f>' + escapeXml(cell.f) + '</f></c>';
  if (typeof cell.v === 'number') return '<c r="' + ref + '"' + s + '><v>' + cell.v + '</v></c>';
  if (typeof cell.v === 'boolean')
    return '<c r="' + ref + '"' + s + ' t="b"><v>' + (cell.v ? 1 : 0) + '</v></c>';
  if (typeof cell.v === 'string' && cell.v !== '')
    return (
      '<c r="' +
      ref +
      '"' +
      s +
      ' t="inlineStr"><is><t xml:space="preserve">' +
      escapeXml(cell.v) +
      '</t></is></c>'
    );
  return '<c r="' + ref + '"' + s + '/>';
}

function viewXml(sheet: Sheet, selected: boolean) {
  const attributes =
    'workbookViewId="0"' +
    (sheet.gridLines ? '' : ' showGridLines="0"') +
    (selected ? ' tabSelected="1"' : '');
  if (!sheet.freeze) return '<sheetViews><sheetView ' + attributes + '/></sheetViews>';

  const { row, column } = sheet.freeze;
  const pane = row && column ? 'bottomRight' : row ? 'bottomLeft' : 'topRight';
  return (
    '<sheetViews><sheetView ' +
    attributes +
    '><pane' +
    (column ? ' xSplit="' + column + '"' : '') +
    (row ? ' ySplit="' + row + '"' : '') +
    ' topLeftCell="' +
    cellRef(row, column) +
    '" activePane="' +
    pane +
    '" state="frozen"/><selection pane="' +
    pane +
    '"/></sheetView></sheetViews>'
  );
}

function colsXml(sheet: Sheet) {
  const indexes = [...new Set([...Object.keys(sheet.widths).map(Number), ...sheet.hidden])].sort(
    (a, b) => a - b,
  );
  if (!indexes.length) return '';
  return (
    '<cols>' +
    indexes
      .map(
        (index) =>
          '<col min="' +
          (index + 1) +
          '" max="' +
          (index + 1) +
          '" width="' +
          (sheet.widths[index] ?? 10) +
          '" customWidth="1"' +
          (sheet.hidden.includes(index) ? ' hidden="1"' : '') +
          '/>',
      )
      .join('') +
    '</cols>'
  );
}

function conditionalXml(sheet: Sheet, dxf: Record<string, number>) {
  return sheet.conditionals
    .map((rule, index) => {
      const priority = index + 1;
      const body =
        rule.type === 'expression'
          ? '<cfRule type="expression" dxfId="' +
            dxf[rule.dxf] +
            '" priority="' +
            priority +
            '"><formula>' +
            escapeXml(rule.formula) +
            '</formula></cfRule>'
          : '<cfRule type="dataBar" priority="' +
            priority +
            '"><dataBar><cfvo type="min"/><cfvo type="max"/><color rgb="FF' +
            rule.color +
            '"/></dataBar></cfRule>';
      return (
        '<conditionalFormatting sqref="' + rule.range + '">' + body + '</conditionalFormatting>'
      );
    })
    .join('');
}

function validationXml(validation: Validation) {
  const attribute = (name: string, value: string | undefined) =>
    value === undefined ? '' : ' ' + name + '="' + escapeXml(value) + '"';
  const formula = (name: string, value: string | undefined) =>
    value === undefined ? '' : '<' + name + '>' + escapeXml(value) + '</' + name + '>';
  const [promptTitle, prompt] = validation.prompt ?? [];
  const [errorTitle, error] = validation.error ?? [];

  return (
    '<dataValidation' +
    attribute('type', validation.list ? 'list' : validation.type) +
    attribute('errorStyle', validation.soloAviso ? 'information' : undefined) +
    attribute('operator', validation.list ? undefined : validation.operator) +
    ' allowBlank="1"' +
    (prompt ? ' showInputMessage="1"' : '') +
    ' showErrorMessage="1"' +
    attribute('errorTitle', errorTitle) +
    attribute('error', error) +
    attribute('promptTitle', promptTitle) +
    attribute('prompt', prompt) +
    ' sqref="' +
    validation.range +
    '">' +
    formula('formula1', validation.list ?? validation.formula1) +
    formula('formula2', validation.list ? undefined : validation.formula2) +
    '</dataValidation>'
  );
}

function validationsXml(sheet: Sheet) {
  if (!sheet.validations.length) return '';
  return (
    '<dataValidations count="' +
    sheet.validations.length +
    '">' +
    sheet.validations.map(validationXml).join('') +
    '</dataValidations>'
  );
}

export function sheetXml(
  sheet: Sheet,
  style: Record<string, number>,
  dxf: Record<string, number>,
  selected: boolean,
  relations: { drawing: string | null; tables: string[] },
) {
  const rows = [...sheet.cells.keys()].sort((a, b) => a - b);
  const lastRow = rows.length ? rows[rows.length - 1] : 0;
  const lastColumn = Math.max(0, ...[...sheet.cells.values()].flatMap((row) => [...row.keys()]));

  const sheetData = rows
    .map((row) => {
      const cells = sheet.cells.get(row)!;
      const height = sheet.heights[row];
      return (
        '<row r="' +
        (row + 1) +
        '"' +
        (height ? ' ht="' + height + '" customHeight="1"' : '') +
        '>' +
        [...cells.keys()]
          .sort((a, b) => a - b)
          .map((column) => cellXml(cellRef(row, column), cells.get(column)!, style))
          .join('') +
        '</row>'
      );
    })
    .join('');

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    (sheet.tabColor ? '<sheetPr><tabColor rgb="FF' + sheet.tabColor + '"/></sheetPr>' : '') +
    '<dimension ref="A1:' +
    columnName(lastColumn) +
    (lastRow + 1) +
    '"/>' +
    viewXml(sheet, selected) +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    colsXml(sheet) +
    '<sheetData>' +
    sheetData +
    '</sheetData>' +
    (sheet.merges.length
      ? '<mergeCells count="' +
        sheet.merges.length +
        '">' +
        sheet.merges.map((ref) => '<mergeCell ref="' + ref + '"/>').join('') +
        '</mergeCells>'
      : '') +
    conditionalXml(sheet, dxf) +
    validationsXml(sheet) +
    '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>' +
    '<pageSetup orientation="landscape"/>' +
    (relations.drawing ? '<drawing r:id="' + relations.drawing + '"/>' : '') +
    (relations.tables.length
      ? '<tableParts count="' +
        relations.tables.length +
        '">' +
        relations.tables.map((id) => '<tablePart r:id="' + id + '"/>').join('') +
        '</tableParts>'
      : '') +
    '</worksheet>'
  );
}

export function tableXml(table: Table, id: number) {
  const ref = tableRange(table);
  const filterRef = rangeRef(
    table.row,
    table.column,
    table.row + table.rowCount,
    table.column + table.columns.length - 1,
  );

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" id="' +
    id +
    '" name="' +
    table.name +
    '" displayName="' +
    table.name +
    '" ref="' +
    ref +
    '"' +
    (table.totals ? ' totalsRowCount="1"' : '') +
    '><autoFilter ref="' +
    filterRef +
    '"/><tableColumns count="' +
    table.columns.length +
    '">' +
    table.columns
      .map((col, index) => {
        const totals =
          index === 0 && table.totals
            ? ' totalsRowLabel="Total"'
            : col.total && table.totals
              ? ' totalsRowFunction="' + col.total + '"'
              : '';
        const formula = col.formula
          ? '<calculatedColumnFormula>' + escapeXml(col.formula) + '</calculatedColumnFormula>'
          : '';
        return (
          '<tableColumn id="' +
          (index + 1) +
          '" name="' +
          escapeXml(col.name) +
          '"' +
          totals +
          (formula ? '>' + formula + '</tableColumn>' : '/>')
        );
      })
      .join('') +
    '</tableColumns><tableStyleInfo name="' +
    table.style +
    '" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/></table>'
  );
}
