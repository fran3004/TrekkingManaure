import { dxfEstado, hojas } from '../../../data/exportar/libro';
import { merge, setCell, setRow } from '../xlsx/hoja';
import { hojaConTitulo, nota, seccion, type LibroContexto } from './comun';

const POS = '$H$5';
const campo = (column: string) => 'INDEX(Inscripciones[' + column + '],' + POS + ')';
const si = (formula: string) => 'IF(' + POS + '="","",' + formula + ')';

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
  { label: 'Edad', formula: si(campo('Edad')), style: 'fichaEntero' },
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
        '="Sí"," · con kit"," · sin kit"),"Sin acompañante")',
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
        '=0),"Ninguna",TRIM(IF(' +
        campo('Cuatrimoto') +
        '="Sí","Cuatrimoto ","")&IF(' +
        campo('Parapente') +
        '="Sí","Parapente ","")&IF(' +
        campo('Parapente del acompañante') +
        '="Sí","Parapente del acompañante ","")&IF(' +
        campo('Noches de hotel') +
        '>0,"Hotel previo "&' +
        campo('Noches de hotel') +
        '&" noches","")))',
    ),
    style: 'fichaValor',
  },
  { label: 'Alertas de salud', formula: si(campo('Alertas de salud')), style: 'fichaEntero' },
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
    label: 'Pagos aprobados',
    formula: si('COUNTIFS(Pagos[Código],' + campo('Código') + ',Pagos[Revisión],"Aprobado")'),
    style: 'fichaEntero',
  },
  {
    label: 'Pagos rechazados',
    formula: si('COUNTIFS(Pagos[Código],' + campo('Código') + ',Pagos[Revisión],"Rechazado")'),
    style: 'fichaEntero',
  },
];

export function crearBuscar(contexto: LibroContexto) {
  const sheet = hojaConTitulo(
    hojas.buscar,
    'Buscar inscripción',
    'Escribe un código (PER-0001) o un número de documento en la celda amarilla.',
    5,
    { gridLines: false, tabColor: 'F2C14E' },
  );
  sheet.widths = { 0: 2, 1: 22, 2: 34, 3: 3, 4: 22, 5: 26, 7: 6 };
  sheet.hidden.push(7);

  setCell(sheet, 3, 1, { v: 'Código o documento', s: 'fichaEtiqueta' });
  setCell(sheet, 3, 2, { v: contexto.summaries[0]?.registration.id ?? '', s: 'entrada' });
  sheet.heights[3] = 28;

  // Posición de la inscripción encontrada; columna oculta.
  setCell(sheet, 4, 7, {
    f: 'IF(TRIM($C$4)="","",IFERROR(MATCH(TRIM($C$4),Inscripciones[Código],0),IFERROR(MATCH(TRIM($C$4),Inscripciones[Documento],0),"")))',
  });
  merge(sheet, 4, 1, 4, 5, {
    f:
      'IF(TRIM($C$4)="","Escribe un código o un documento para ver la ficha.",IF(' +
      POS +
      '="","No hay ninguna inscripción con ese código o documento.","Inscripción encontrada: "&' +
      campo('Código') +
      '))',
    s: 'mensaje',
  });

  seccion(sheet, 6, 1, 2, 'Datos del titular');
  seccion(sheet, 6, 4, 5, 'Pagos y saldo');
  titular.forEach((item, index) => {
    setRow(sheet, 7 + index, 1, [
      { v: item.label, s: 'fichaEtiqueta' },
      { f: item.formula, s: item.style },
    ]);
    sheet.heights[7 + index] = 20;
  });
  pagos.forEach((item, index) => {
    setRow(sheet, 7 + index, 4, [
      { v: item.label, s: 'fichaEtiqueta' },
      { f: item.formula, s: item.style },
    ]);
  });

  for (const [name, dxf] of Object.entries(dxfEstado)) {
    sheet.conditionals.push({
      range: 'F8',
      type: 'expression',
      formula: '$F$8="' + name + '"',
      dxf,
    });
  }
  sheet.conditionals.push({
    range: 'C17',
    type: 'expression',
    formula: 'AND(ISNUMBER($C$17),$C$17>0)',
    dxf: 'alerta',
  });

  nota(
    sheet,
    8 + titular.length,
    1,
    5,
    'La ficha lee la hoja Inscripciones con INDEX y MATCH, por lo que funciona en cualquier versión de Excel. Para ver todos los pagos de la persona, filtra la hoja Pagos por su código.',
  );

  return { sheet };
}
