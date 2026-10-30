import { dxfEstado, hojas, textoCompleto } from '../../../data/exportar/libro';
import { merge, setCell, setRow } from '../xlsx/hoja';
import { encabezado, hojaConTitulo, nota, seccion, type LibroContexto } from './comun';

const POS = '$H$5';
const campo = (column: string) => 'INDEX(Inscripciones[' + column + '],' + POS + ')';
const si = (formula: string) => 'IF(' + POS + '="","",' + formula + ')';
const PAGOS_EN_FICHA = 8;

type Campo = { label: string; formula: string; style: string };

const titular: Campo[] = [
  {
    label: 'Titular',
    formula: si(campo('Nombres') + '&" "&' + campo('Apellidos')),
    style: 'fichaValor',
  },
  {
    label: 'Documento',
    formula: si(campo('Tipo de documento') + '&" "&' + campo('Documento')),
    style: 'fichaValor',
  },
  { label: 'Teléfono', formula: si(campo('Teléfono')), style: 'fichaValor' },
  { label: 'Correo', formula: si(campo('Correo')), style: 'fichaValor' },
  {
    label: 'Edad',
    formula: si(
      campo('Edad') +
        '&IF(' +
        campo('Menor de edad') +
        '="Sí"," años · menor, autorización: "&' +
        campo('Autorización del responsable') +
        '," años")',
    ),
    style: 'fichaValor',
  },
  { label: 'Talla del kit', formula: si(campo('Talla')), style: 'fichaValor' },
  { label: 'Estadía', formula: si(campo('Estadía')), style: 'fichaValor' },
  {
    label: 'Acompañante',
    formula: si(
      'IF(' +
        campo('Acompañante') +
        '="Sí",' +
        campo('Nombre del acompañante') +
        '&IF(' +
        campo('Kit del acompañante') +
        '="Sí"," · con kit talla "&' +
        campo('Talla del acompañante') +
        '," · sin kit")&" · "&' +
        campo('Estadía del acompañante') +
        ',"Sin acompañante")',
    ),
    style: 'fichaValor',
  },
  {
    label: 'Experiencias',
    formula: si(
      'IF(AND(' +
        campo('Cuatrimoto') +
        '="No",' +
        campo('Parapente') +
        '="No",' +
        campo('Parapente del acompañante') +
        '="No",' +
        campo('Noches de hotel') +
        // Cada experiencia empieza con " · " y MID quita el primero.
        '=0),"Ninguna",MID(IF(' +
        campo('Cuatrimoto') +
        '="Sí"," · Cuatrimoto","")&IF(' +
        campo('Parapente') +
        '="Sí"," · Parapente","")&IF(' +
        campo('Parapente del acompañante') +
        '="Sí"," · Parapente del acompañante","")&IF(' +
        campo('Noches de hotel') +
        '>0," · Hotel "&' +
        campo('Noches de hotel') +
        '&" noches × "&' +
        campo('Personas en hotel') +
        '&" persona(s)",""),4,300))',
    ),
    style: 'fichaValor',
  },
  { label: 'Alertas de salud', formula: si(campo('Alertas de salud')), style: 'fichaEntero' },
  { label: 'Revisar datos', formula: si(campo('Revisar datos')), style: 'fichaValor' },
];

const pagos: Campo[] = [
  { label: 'Estado', formula: si(campo('Estado')), style: 'fichaValor' },
  { label: 'Plan de pago', formula: si(campo('Plan')), style: 'fichaValor' },
  {
    label: 'Fecha de compromiso',
    formula: si(
      'IF(ISNUMBER(' + campo('Compromiso') + '),' + campo('Compromiso') + ',"No aplica")',
    ),
    style: 'fichaFecha',
  },
  { label: 'Días al compromiso', formula: si(campo('Días al compromiso')), style: 'fichaDias' },
  { label: 'Total a pagar', formula: si(campo('Total')), style: 'fichaMoneda' },
  { label: 'Pagado', formula: si(campo('Pagado')), style: 'fichaMoneda' },
  { label: 'Saldo', formula: si(campo('Saldo')), style: 'fichaMoneda' },
  { label: 'Por revisar', formula: si(campo('Por revisar')), style: 'fichaMoneda' },
  {
    label: 'Cupo de la carrera',
    formula: si('IF(' + campo('Activa') + '="Sí","Apartado","Liberado: inscripción rechazada")'),
    style: 'fichaValor',
  },
  {
    label: 'Cupos en el páramo',
    formula: si('IF(' + campo('Activa') + '="Sí",' + campo('Personas en páramo') + ',0)'),
    style: 'fichaEntero',
  },
];

export function crearBuscar(contexto: LibroContexto) {
  const sheet = hojaConTitulo(
    hojas.buscar,
    'Buscar inscripción',
    'Elige un código de la lista o escribe un número de documento en la celda amarilla.',
    6,
    { gridLines: false, tabColor: 'F2C14E' },
  );
  sheet.widths = { 0: 2, 1: 22, 2: 34, 3: 14, 4: 22, 5: 26, 6: 30, 7: 6, 8: 6 };
  sheet.hidden.push(7, 8);

  setCell(sheet, 3, 1, { v: 'Código o documento', s: 'fichaEtiqueta' });
  setCell(sheet, 3, 2, { v: contexto.summaries[0]?.registration.id ?? '', s: 'entrada' });
  sheet.heights[3] = 28;
  sheet.validations.push({
    range: 'C4',
    list: 'ListaCodigos',
    soloAviso: true,
    prompt: ['Buscar', 'Elige un código de la lista o escribe el documento del titular.'],
    error: ['Búsqueda', 'No está en la lista de códigos; se buscará como documento.'],
  });

  // Posición de la inscripción encontrada; columna oculta.
  setCell(sheet, 4, 7, {
    f: 'IF(TRIM($C$4)="","",IFERROR(MATCH(TRIM($C$4),Inscripciones[Código],0),IFERROR(MATCH(TRIM($C$4),Inscripciones[Documento],0),"")))',
  });
  merge(sheet, 4, 1, 4, 6, {
    f:
      'IF(TRIM($C$4)="","Escribe un código o un documento para ver la ficha.",IF(' +
      POS +
      '="","No hay ninguna inscripción con ese código o documento.","Inscripción encontrada: "&' +
      campo('Código') +
      '))',
    s: 'mensaje',
  });

  seccion(sheet, 6, 1, 2, 'Datos del titular');
  seccion(sheet, 6, 4, 6, 'Pagos y cupo');
  titular.forEach((item, index) => {
    setRow(sheet, 7 + index, 1, [
      { v: item.label, s: 'fichaEtiqueta' },
      { f: item.formula, s: item.style },
    ]);
    sheet.heights[7 + index] = 20;
  });
  pagos.forEach((item, index) => {
    setCell(sheet, 7 + index, 4, { v: item.label, s: 'fichaEtiqueta' });
    merge(sheet, 7 + index, 5, 7 + index, 6, { f: item.formula, s: item.style });
  });

  const fila = (lista: Campo[], label: string) =>
    8 + lista.findIndex((item) => item.label === label);
  const estado = 'F' + fila(pagos, 'Estado');
  for (const [name, dxf] of Object.entries(dxfEstado)) {
    sheet.conditionals.push({
      range: estado,
      type: 'expression',
      formula: '$' + estado.replace(/(\d+)/, '$$$1') + '="' + name + '"',
      dxf,
    });
  }
  const alertas = 'C' + fila(titular, 'Alertas de salud');
  const datos = 'C' + fila(titular, 'Revisar datos');
  sheet.conditionals.push(
    {
      range: alertas,
      type: 'expression',
      formula: 'AND(ISNUMBER(' + alertas + '),' + alertas + '>0)',
      dxf: 'alerta',
    },
    {
      range: datos,
      type: 'expression',
      formula: datos + '="' + textoCompleto + '"',
      dxf: 'completo',
    },
    {
      range: datos,
      type: 'expression',
      formula: 'AND(' + datos + '<>"",' + datos + '<>"' + textoCompleto + '")',
      dxf: 'pendiente',
    },
  );

  // Pagos de la inscripción: el k-ésimo pago se encuentra por la clave código|k de la hoja Pagos.
  const inicio = 8 + Math.max(titular.length, pagos.length);
  seccion(sheet, inicio, 1, 6, 'Pagos registrados de esta inscripción');
  encabezado(sheet, inicio + 1, 1, ['Pago', 'Concepto', 'Fecha', 'Monto', 'Revisión', 'Motivo']);
  sheet.heights[inicio + 1] = 24;
  for (let k = 1; k <= PAGOS_EN_FICHA; k++) {
    const row = inicio + 1 + k;
    const pos = '$I' + (row + 1);
    const pick = (column: string) =>
      'IF(' + pos + '="","",INDEX(Pagos[' + column + '],' + pos + '))';
    setCell(sheet, row, 8, {
      f: si('IFERROR(MATCH(' + campo('Código') + '&"|' + k + '",Pagos[Clave],0),"")'),
    });
    setRow(sheet, row, 1, [
      { f: pick('Pago'), s: 'celdaCentro' },
      { f: pick('Concepto'), s: 'celdaTexto' },
      { f: pick('Fecha'), s: 'celdaFecha' },
      { f: pick('Monto'), s: 'celdaMoneda' },
      { f: pick('Revisión'), s: 'celdaCentro' },
      { f: pick('Motivo del rechazo'), s: 'celdaTexto' },
    ]);
  }
  const ultimo = inicio + 1 + PAGOS_EN_FICHA;
  const revisiones = 'F' + (inicio + 3) + ':F' + (ultimo + 1);
  for (const [review, dxf] of [
    ['Aprobado', 'pagado'],
    ['Por revisar', 'verificar'],
    ['Rechazado', 'rechazado'],
  ]) {
    sheet.conditionals.push({
      range: revisiones,
      type: 'expression',
      formula: '$F' + (inicio + 3) + '="' + review + '"',
      dxf,
    });
  }
  merge(sheet, ultimo + 1, 1, ultimo + 1, 6, {
    f: si(
      'COUNTIF(Pagos[Código],' +
        campo('Código') +
        ')&" pago(s) registrados"&IF(COUNTIF(Pagos[Código],' +
        campo('Código') +
        ')>' +
        PAGOS_EN_FICHA +
        '," · filtra la hoja Pagos por su código para ver todos.",".")',
    ),
    s: 'mensaje',
  });

  nota(
    sheet,
    ultimo + 3,
    1,
    6,
    'La ficha lee las hojas Inscripciones y Pagos con INDEX y MATCH, así que funciona en cualquier versión de Excel e incluye lo que agregues a mano.',
  );

  return { sheet };
}
