import { formatDateTime } from '../../../../../shared/utils/format';
import { dxfEstado, filasLibres, hojas } from '../../../data/exportar/libro';
import { epsLabel, formatPhone, getRunners, type Runner } from '../../../../../shared/reservas';
import { addTable, tableColumnRange, thisRow } from '../xlsx/hoja';
import { columnName, rangeRef } from '../xlsx/referencias';
import {
  filaTabla,
  filasDeTabla,
  hojaConTitulo,
  siNo,
  validarColumnas,
  type Columna,
  type LibroContexto,
} from './comun';

const T = 'Corredores';
const r = (column: string) => thisRow(T, column);
const buscar = (column: string) =>
  'INDEX(Inscripciones[' + column + '],MATCH(' + r('Código') + ',Inscripciones[Código],0))';
const conCodigo = (formula: string) => 'IF(' + r('Código') + '="","",' + formula + ')';
/** Una respuesta de salud cuenta como alerta si dice algo distinto de "No". */
const alerta = (column: string) => 'AND(' + r(column) + '<>"",' + r(column) + '<>"No")';

type Fila = { code: string; runner: Runner };

const lista = (nombre: string, titulo: string, texto: string): Columna<Fila>['ayuda'] => ({
  list: nombre,
  prompt: [titulo, texto],
  error: ['Valor no válido', 'Elige una opción de la lista desplegable.'],
});
const libre = (titulo: string, texto: string): Columna<Fila>['ayuda'] => ({
  type: 'textLength',
  operator: 'lessThanOrEqual',
  formula1: '160',
  prompt: [titulo, texto],
});
const salud = (titulo: string): Columna<Fila>['ayuda'] =>
  libre(titulo, 'Escribe No si no tiene, o descríbela brevemente.');

const columnas: Columna<Fila>[] = [
  {
    name: 'Código',
    width: 16,
    value: ({ code }) => code,
    ayuda: lista(
      'ListaCodigos',
      'Código de la inscripción',
      'Elige la inscripción de este corredor.',
    ),
  },
  {
    name: 'Rol',
    width: 13,
    value: ({ runner }) => runner.role,
    ayuda: lista('ListaRoles', 'Rol', 'Titular o Acompañante.'),
  },
  {
    name: 'Nombre',
    width: 24,
    value: ({ runner }) => runner.name,
    ayuda: libre('Nombre', 'Nombres y apellidos.'),
  },
  {
    name: 'Documento',
    width: 20,
    value: ({ runner }) => runner.document,
    ayuda: libre('Documento', 'Tipo y número, por ejemplo CC 1065123456.'),
  },
  { name: 'Celular', width: 17, value: ({ runner }) => formatPhone(runner.person.phone) },
  { name: 'Correo', width: 24, value: ({ runner }) => runner.person.email },
  { name: 'Ciudad', width: 16, value: ({ runner }) => runner.city },
  {
    name: 'EPS',
    width: 18,
    value: ({ runner }) => epsLabel(runner.person.eps),
    ayuda: {
      list: 'ListaEPS',
      soloAviso: true,
      prompt: ['EPS', 'Elige de la lista. Si no está, escribe: Otra: nombre de la EPS.'],
      error: ['EPS fuera de la lista', 'No está en la lista. Acepta si escribiste Otra: nombre.'],
    },
  },
  {
    name: 'Contacto de emergencia',
    width: 22,
    value: ({ runner }) => runner.person.emergencyContact.name,
  },
  {
    name: 'Parentesco',
    width: 16,
    value: ({ runner }) => runner.person.emergencyContact.relationship,
    ayuda: lista('ListaParentescos', 'Parentesco', 'Relación del contacto con el corredor.'),
  },
  {
    name: 'Teléfono de emergencia',
    width: 17,
    value: ({ runner }) => formatPhone(runner.person.emergencyContact.phone),
  },
  {
    name: 'Estadía',
    width: 17,
    value: ({ runner }) => runner.stay,
    ayuda: lista('ListaEstadias', 'Dónde duerme', 'Páramo, hotel en Manaure o regreso a casa.'),
  },
  {
    name: 'Kit',
    width: 8,
    style: 'centro',
    value: ({ runner }) => siNo(runner.kit),
    ayuda: lista('ListaSiNo', 'Kit', 'El titular siempre lleva kit.'),
  },
  {
    name: 'Talla',
    width: 9,
    style: 'centro',
    value: ({ runner }) => runner.shirtSize ?? '',
    ayuda: lista('ListaTallas', 'Talla', 'Solo si lleva kit.'),
  },
  {
    name: 'Enfermedad',
    width: 22,
    value: ({ runner }) => runner.health.illness ?? 'No',
    ayuda: salud('Enfermedad'),
  },
  {
    name: 'Alergias',
    width: 20,
    value: ({ runner }) => runner.health.allergies ?? 'No',
    ayuda: salud('Alergias'),
  },
  {
    name: 'Discapacidad',
    width: 20,
    value: ({ runner }) => runner.health.disability ?? 'No',
    ayuda: salud('Discapacidad'),
  },
  {
    name: 'Practica deporte',
    width: 12,
    style: 'centro',
    value: ({ runner }) => siNo(runner.health.exercises),
    ayuda: lista('ListaSiNo', 'Practica deporte', 'No cuenta como alerta de salud.'),
  },
  {
    name: 'Alertas',
    width: 9,
    style: 'entero',
    total: 'sum',
    formula: conCodigo(
      alerta('Enfermedad') +
        '+' +
        alerta('Alergias') +
        '+' +
        alerta('Discapacidad') +
        '+(' +
        r('Practica deporte') +
        '="No")',
    ),
  },
  {
    name: 'Parapente',
    width: 10,
    style: 'centro',
    value: ({ runner }) => siNo(runner.paragliding),
    ayuda: lista('ListaSiNo', 'Parapente', 'Si vuela en parapente.'),
  },
  {
    name: 'Áreas protegidas',
    width: 11,
    style: 'centro',
    value: ({ runner }) => siNo(runner.person.commitments.protectedAreas),
  },
  {
    name: 'Medio ambiente',
    width: 11,
    style: 'centro',
    value: ({ runner }) => siNo(runner.person.commitments.environment),
  },
  {
    name: 'Términos aceptados',
    width: 19,
    value: ({ runner }) =>
      runner.person.consent.acceptedAt ? formatDateTime(runner.person.consent.acceptedAt) : '',
  },
  {
    name: 'Uso de imagen',
    width: 10,
    style: 'centro',
    value: ({ runner }) => siNo(runner.person.consent.imageUse),
  },
  {
    // El cupo se aparta al reservar y se libera si la inscripción queda Rechazada.
    name: 'Cupo apartado',
    width: 11,
    style: 'centro',
    formula: conCodigo('IFERROR(' + buscar('Activa') + ',"")'),
  },
  {
    name: 'Pago aprobado',
    width: 11,
    style: 'centro',
    formula: conCodigo('IF(IFERROR(' + buscar('Pagado') + ',0)>0,"Sí","No")'),
  },
  {
    name: 'Estado',
    width: 15,
    style: 'centro',
    formula: conCodigo('IFERROR(' + buscar('Estado') + ',"")'),
  },
];

export function crearCorredores(contexto: LibroContexto) {
  const sheet = hojaConTitulo(
    hojas.corredores,
    'Corredores',
    'Una fila por persona que corre. Las filas rojas tienen alertas de salud. Para agregar la salud de alguien inscrito a mano, llena una fila amarilla del final.',
    columnas.length - 1,
    { tabColor: '3E7A2B' },
  );
  sheet.freeze = { row: filaTabla + 1, column: 3 };

  const filas: Fila[] = contexto.summaries.flatMap(({ registration }) =>
    getRunners(registration).map((runner) => ({ code: registration.id, runner })),
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
    filasDeTabla(columnas, filas, filasLibres.corredores),
  );
  validarColumnas(sheet, columnas);

  const table = sheet.tables[0];
  const first = filaTabla + 2;
  const range = (name: string) => tableColumnRange(table, name);
  const letter = (name: string) => columnName(columnas.findIndex((col) => col.name === name));
  const allRows = rangeRef(first - 1, 0, filaTabla + table.rowCount, columnas.length - 1);
  const alertas = '$' + letter('Alertas') + first;

  for (const [name, dxf] of Object.entries(dxfEstado)) {
    sheet.conditionals.push({
      range: range('Estado'),
      type: 'expression',
      formula: '$' + letter('Estado') + first + '="' + name + '"',
      dxf,
    });
  }
  sheet.conditionals.push(
    {
      range: range('Cupo apartado'),
      type: 'expression',
      formula: '$' + letter('Cupo apartado') + first + '="No"',
      dxf: 'rechazado',
    },
    {
      range: range('Pago aprobado'),
      type: 'expression',
      formula: '$' + letter('Pago aprobado') + first + '="No"',
      dxf: 'verificar',
    },
    {
      range: allRows,
      type: 'expression',
      formula: 'AND(ISNUMBER(' + alertas + '),' + alertas + '>0)',
      dxf: 'alerta',
    },
  );

  return { sheet };
}
