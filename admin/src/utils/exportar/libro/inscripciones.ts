import { formatDateTime } from '../../../../../shared/utils/format';
import {
  dxfEstado,
  filasLibres,
  hojas,
  prefijoManual,
  textoCompleto,
} from '../../../data/exportar/libro';
import {
  ESTADIA_CON_CUPO,
  epsLabel,
  etiquetasPlan,
  formatPhone,
  fullName,
  isMinor,
  statusOrder,
  versionTerminos,
  type Summary,
} from '../../../../../shared/reservas';
import { addTable, tableColumnRange, thisRow } from '../xlsx/hoja';
import { columnName, excelDate } from '../xlsx/referencias';
import {
  filaTabla,
  filasDeTabla,
  hojaConTitulo,
  revision,
  siNo,
  validarColumnas,
  type Columna,
  type LibroContexto,
} from './comun';

const T = 'Inscripciones';
const r = (column: string) => thisRow(T, column);
const vacio = (column: string) => r(column) + '=""';
const si = (column: string) => r(column) + '="Sí"';
const fecha = (column: string) => 'ISNUMBER(' + r(column) + ')';
/** Las fórmulas de una fila sin código (fila libre aún sin documento) quedan vacías. */
const conCodigo = (formula: string) => 'IF(' + vacio('Código') + ',"",' + formula + ')';

const PLAN_APARTADO = etiquetasPlan.apartado;
const PLAN_TOTAL = etiquetasPlan.total;

/** Fila de la página: su resumen y si el titular es menor de edad hoy. */
type Fila = Summary & { menor: boolean };

const siNoLista = (titulo: string, texto: string): Columna<Fila>['ayuda'] => ({
  list: 'ListaSiNo',
  prompt: [titulo, texto],
  error: ['Elige Sí o No', 'Usa la lista desplegable.'],
});
const lista = (nombre: string, titulo: string, texto: string): Columna<Fila>['ayuda'] => ({
  list: nombre,
  prompt: [titulo, texto],
  error: ['Valor no válido', 'Elige una opción de la lista desplegable.'],
});
const entreFechas = (
  desde: string,
  hasta: string,
  titulo: string,
  texto: string,
  error: string,
) => ({
  type: 'date' as const,
  operator: 'between' as const,
  formula1: desde,
  formula2: hasta,
  prompt: [titulo, texto] as [string, string],
  error: ['Fecha fuera de rango', error] as [string, string],
});
const texto = (titulo: string, ayuda: string): Columna<Fila>['ayuda'] => ({
  type: 'textLength',
  operator: 'lessThanOrEqual',
  formula1: '120',
  prompt: [titulo, ayuda],
});

const datosTitular = [
  'Nombres',
  'Apellidos',
  'Tipo de documento',
  'Documento',
  'Teléfono',
  'Correo',
  'Género',
  'Ciudad',
  'Talla',
  'EPS',
  'Estadía',
];
const datosContacto = ['Contacto de emergencia', 'Parentesco', 'Teléfono de emergencia'];

// Avisos de la columna Revisar datos: las mismas reglas que valida la página al reservar.
const avisos: [string, string][] = [
  ['NOT(' + fecha('Registro') + ')', 'Falta la fecha de registro.'],
  ['OR(' + datosTitular.map(vacio).join(',') + ')', 'Faltan datos del titular.'],
  ['NOT(' + fecha('Nacimiento') + ')', 'Falta la fecha de nacimiento.'],
  ['OR(' + datosContacto.map(vacio).join(',') + ')', 'Falta el contacto de emergencia.'],
  [
    'AND(' +
      r('Activa') +
      '="Sí",COUNTIFS(Inscripciones[Documento],' +
      r('Documento') +
      ',Inscripciones[Activa],"Sí")>1)',
    'El documento está en otra inscripción activa.',
  ],
  [
    'AND(' + r('Menor de edad') + '="Sí",' + r('Autorización del responsable') + '<>"Sí")',
    'Falta la autorización firmada del responsable.',
  ],
  [vacio('Plan'), 'Falta el plan de pago.'],
  [
    'AND(' + r('Plan') + '="' + PLAN_APARTADO + '",NOT(' + fecha('Compromiso') + '))',
    'Falta la fecha de compromiso.',
  ],
  [
    'AND(' + r('Plan') + '="' + PLAN_TOTAL + '",' + fecha('Compromiso') + ')',
    'El pago total no lleva fecha de compromiso.',
  ],
  [
    'AND(' + fecha('Compromiso') + ',' + r('Compromiso') + '>FechaCierre)',
    'La fecha de compromiso pasa del cierre.',
  ],
  [
    'AND(' +
      si('Acompañante') +
      ',OR(' +
      [
        'Nombre del acompañante',
        'Documento del acompañante',
        'Estadía del acompañante',
        'Kit del acompañante',
      ]
        .map(vacio)
        .join(',') +
      '))',
    'Faltan datos del acompañante.',
  ],
  [
    'AND(NOT(' +
      si('Acompañante') +
      '),OR(' +
      r('Nombre del acompañante') +
      '<>"",' +
      r('Estadía del acompañante') +
      '<>"",' +
      si('Kit del acompañante') +
      ',' +
      si('Parapente del acompañante') +
      ',' +
      si('Acompañante en hotel') +
      '))',
    'Hay datos de acompañante pero Acompañante dice No.',
  ],
  [
    'AND(' + si('Kit del acompañante') + ',' + vacio('Talla del acompañante') + ')',
    'Falta la talla del acompañante.',
  ],
  [
    'AND(NOT(' + si('Kit del acompañante') + '),' + r('Talla del acompañante') + '<>"")',
    'El acompañante sin kit no lleva talla.',
  ],
  [
    'OR(' +
      fecha('Llegada al hotel') +
      '<>' +
      fecha('Salida del hotel') +
      ',AND(' +
      fecha('Llegada al hotel') +
      ',' +
      fecha('Salida del hotel') +
      ',' +
      r('Salida del hotel') +
      '<=' +
      r('Llegada al hotel') +
      '))',
    'Revisa las fechas del hotel.',
  ],
  [
    'AND(' + fecha('Salida del hotel') + ',' + r('Salida del hotel') + '>FechaEvento)',
    'La salida del hotel pasa del día del evento.',
  ],
  [
    'AND(ISNUMBER(' + r('Pagado') + '),' + r('Pagado') + '>' + r('Total') + ')',
    'Lo aprobado supera el total.',
  ],
];

const columnas: Columna<Fila>[] = [
  {
    name: 'Código',
    width: 15,
    value: ({ registration }) => registration.id,
    // A mano: MAN- y el documento del titular; así el código no cambia al ordenar la tabla.
    manual: {
      f: 'IF(' + vacio('Documento') + ',"","' + prefijoManual + '"&' + r('Documento') + ')',
      s: 'entradaCentro',
    },
  },
  {
    name: 'Revisar datos',
    width: 30,
    style: 'revisar',
    formula: revision(
      'AND(' + vacio('Nombres') + ',' + vacio('Documento') + ')',
      avisos,
      textoCompleto,
    ),
  },
  {
    name: 'Registro',
    width: 12,
    style: 'fecha',
    value: ({ registration }) => excelDate(registration.createdAt),
    ayuda: entreFechas(
      'FechaApertura',
      'FechaEvento',
      'Fecha de registro',
      'Día en que recibiste la inscripción, por ejemplo 29/10/2026.',
      'Debe estar entre la apertura de inscripciones y el día del evento.',
    ),
  },
  {
    name: 'Nombres',
    width: 16,
    value: ({ registration }) => registration.firstName,
    ayuda: texto('Nombres del titular', 'Como aparecen en su documento.'),
  },
  {
    name: 'Apellidos',
    width: 18,
    value: ({ registration }) => registration.lastName,
    ayuda: texto('Apellidos del titular', 'Como aparecen en su documento.'),
  },
  {
    name: 'Tipo de documento',
    width: 14,
    style: 'centro',
    value: ({ registration }) => registration.documentType,
    ayuda: lista('ListaTiposDocumento', 'Tipo de documento', 'CC, TI, CE, RC, Pasaporte o PPT.'),
  },
  {
    name: 'Documento',
    width: 14,
    value: ({ registration }) => registration.document,
    // La validación se completa en crearInscripciones: necesita la celda de la primera fila.
  },
  {
    name: 'Teléfono',
    width: 17,
    value: ({ registration }) => formatPhone(registration.phone),
    ayuda: texto('Celular del titular', 'Con WhatsApp, por ejemplo 300 123 4567.'),
  },
  {
    name: 'Correo',
    width: 26,
    value: ({ registration }) => registration.email,
    ayuda: texto('Correo del titular', 'Allí le llegan los avisos de sus pagos.'),
  },
  {
    name: 'Género',
    width: 12,
    value: ({ registration }) => registration.gender,
    ayuda: lista('ListaGeneros', 'Género', 'Elige una opción de la lista.'),
  },
  {
    name: 'Ciudad',
    width: 16,
    value: ({ registration }) => registration.city,
    ayuda: texto('Ciudad', 'Ciudad donde vive el titular.'),
  },
  {
    name: 'Nacimiento',
    width: 12,
    style: 'fecha',
    value: ({ registration }) => excelDate(registration.birthDate),
    ayuda: entreFechas(
      'DATE(1910,1,1)',
      'TODAY()',
      'Fecha de nacimiento',
      'La edad y si es menor de edad se calculan solas.',
      'Escribe una fecha de nacimiento válida.',
    ),
  },
  {
    name: 'Edad',
    width: 8,
    style: 'entero',
    formula: 'IF(' + fecha('Nacimiento') + ',DATEDIF(' + r('Nacimiento') + ',TODAY(),"y"),"")',
  },
  {
    name: 'Menor de edad',
    width: 10,
    style: 'centro',
    formula: 'IF(' + vacio('Edad') + ',"",IF(' + r('Edad') + '<18,"Sí","No"))',
  },
  {
    name: 'Autorización del responsable',
    width: 15,
    style: 'centro',
    value: ({ registration, menor }) =>
      menor ? siNo(registration.guardianAuthorized) : 'No aplica',
    ayuda: lista(
      'ListaAutorizacion',
      'Autorización del menor',
      'Sí cuando recibas la autorización firmada de su madre, padre o tutor. Sin ella no se aprueban pagos. No aplica si es mayor de edad.',
    ),
  },
  {
    name: 'Talla',
    width: 8,
    style: 'centro',
    value: ({ registration }) => registration.shirtSize,
    ayuda: lista('ListaTallas', 'Talla de camisa del titular', 'El titular siempre lleva kit.'),
  },
  {
    name: 'EPS',
    width: 20,
    value: ({ registration }) => epsLabel(registration.eps),
    ayuda: {
      list: 'ListaEPS',
      soloAviso: true,
      prompt: [
        'EPS del titular',
        'Elige de la lista. Si no está, escribe: Otra: nombre de la EPS.',
      ],
      error: ['EPS fuera de la lista', 'No está en la lista. Acepta si escribiste Otra: nombre.'],
    },
  },
  {
    name: 'Contacto de emergencia',
    width: 22,
    value: ({ registration }) => registration.emergencyContact.name,
    ayuda: texto(
      'Contacto de emergencia',
      'Nombre y apellido. Si es menor, su madre, padre o tutor.',
    ),
  },
  {
    name: 'Parentesco',
    width: 16,
    value: ({ registration }) => registration.emergencyContact.relationship,
    ayuda: lista('ListaParentescos', 'Parentesco', 'Relación del contacto con el titular.'),
  },
  {
    name: 'Teléfono de emergencia',
    width: 17,
    value: ({ registration }) => formatPhone(registration.emergencyContact.phone),
    ayuda: texto('Teléfono de emergencia', 'Distinto al celular del titular.'),
  },
  {
    name: 'Términos aceptados',
    width: 19,
    value: ({ registration }) =>
      registration.consent.acceptedAt ? formatDateTime(registration.consent.acceptedAt) : '',
    ayuda: texto('Términos aceptados', 'Fecha y hora en que aceptó los términos. Opcional a mano.'),
  },
  {
    name: 'Versión de términos',
    width: 16,
    value: ({ registration }) => registration.consent.version,
    manual: { v: versionTerminos, s: 'entradaTexto' },
  },
  {
    name: 'Uso de imagen',
    width: 10,
    style: 'centro',
    value: ({ registration }) => siNo(registration.consent.imageUse),
    ayuda: siNoLista('Uso de imagen', 'Si autorizó el uso de su imagen en fotos y videos.'),
  },
  {
    name: 'Estadía',
    width: 17,
    value: ({ registration }) => registration.stay,
    ayuda: lista(
      'ListaEstadias',
      'Dónde duerme el titular',
      'Páramo gasta un cupo del páramo; hotel en Manaure y regreso a casa no.',
    ),
  },
  {
    name: 'Acompañante',
    width: 12,
    style: 'centro',
    value: ({ registration }) => siNo(registration.companion !== null),
    manual: { v: 'No', s: 'entradaCentro' },
    ayuda: siNoLista('Acompañante', 'Sí si corre con un acompañante; llena sus columnas.'),
  },
  {
    name: 'Nombre del acompañante',
    width: 22,
    value: ({ registration }) => (registration.companion ? fullName(registration.companion) : ''),
    ayuda: texto('Nombre del acompañante', 'Nombres y apellidos. Solo si lleva acompañante.'),
  },
  {
    name: 'Documento del acompañante',
    width: 20,
    value: ({ registration }) =>
      registration.companion
        ? registration.companion.documentType + ' ' + registration.companion.document
        : '',
    ayuda: texto('Documento del acompañante', 'Tipo y número, por ejemplo CC 1065123456.'),
  },
  {
    name: 'Teléfono del acompañante',
    width: 17,
    value: ({ registration }) =>
      registration.companion ? formatPhone(registration.companion.phone) : '',
    ayuda: texto('Celular del acompañante', 'Distinto al del titular.'),
  },
  {
    name: 'Correo del acompañante',
    width: 24,
    value: ({ registration }) => registration.companion?.email ?? '',
    ayuda: texto('Correo del acompañante', 'Distinto al del titular.'),
  },
  {
    name: 'Estadía del acompañante',
    width: 17,
    value: ({ registration }) => registration.companion?.stay ?? '',
    ayuda: lista('ListaEstadias', 'Dónde duerme el acompañante', 'Páramo gasta otro cupo.'),
  },
  {
    name: 'Kit del acompañante',
    width: 12,
    style: 'centro',
    value: ({ registration }) => (registration.companion ? siNo(registration.companion.kit) : ''),
    ayuda: siNoLista('Kit del acompañante', 'Con kit cuesta igual que el titular y lleva talla.'),
  },
  {
    name: 'Talla del acompañante',
    width: 12,
    style: 'centro',
    value: ({ registration }) => registration.companion?.shirtSize ?? '',
    ayuda: lista('ListaTallas', 'Talla del acompañante', 'Solo si el acompañante lleva kit.'),
  },
  {
    name: 'Cuatrimoto',
    width: 11,
    style: 'centro',
    value: ({ registration }) => siNo(registration.extras.includes('cuatrimoto')),
    manual: { v: 'No', s: 'entradaCentro' },
    ayuda: siNoLista('Paseo en cuatrimoto', 'Mismo valor con o sin acompañante.'),
  },
  {
    name: 'Parapente',
    width: 11,
    style: 'centro',
    value: ({ registration }) => siNo(registration.extras.includes('parapente')),
    manual: { v: 'No', s: 'entradaCentro' },
    ayuda: siNoLista('Parapente del titular', 'Vuelo en parapente del titular.'),
  },
  {
    name: 'Parapente del acompañante',
    width: 13,
    style: 'centro',
    value: ({ registration }) => siNo(registration.extras.includes('parapenteAcompanante')),
    manual: { v: 'No', s: 'entradaCentro' },
    ayuda: siNoLista('Parapente del acompañante', 'Solo si lleva acompañante.'),
  },
  {
    name: 'Llegada al hotel',
    width: 12,
    style: 'fecha',
    value: ({ registration }) =>
      registration.preEventHotel ? excelDate(registration.preEventHotel.checkIn) : null,
    ayuda: entreFechas(
      'FechaApertura',
      'FechaEvento-1',
      'Llegada al hotel',
      'Solo si llega antes del evento. A más tardar la noche anterior.',
      'La llegada va desde la apertura hasta la noche anterior al evento.',
    ),
  },
  {
    name: 'Salida del hotel',
    width: 12,
    style: 'fecha',
    value: ({ registration }) =>
      registration.preEventHotel ? excelDate(registration.preEventHotel.checkOut) : null,
    ayuda: entreFechas(
      'FechaApertura',
      'FechaEvento',
      'Salida del hotel',
      'Después de la llegada y a más tardar el primer día del evento.',
      'La salida no puede pasar del primer día del evento.',
    ),
  },
  {
    name: 'Acompañante en hotel',
    width: 12,
    style: 'centro',
    value: ({ registration }) =>
      siNo(Boolean(registration.preEventHotel?.withCompanion && registration.companion)),
    manual: { v: 'No', s: 'entradaCentro' },
    ayuda: siNoLista('Acompañante en el hotel', 'Sí si el acompañante también llega antes.'),
  },
  {
    name: 'Noches de hotel',
    width: 9,
    style: 'entero',
    total: 'sum',
    formula: conCodigo(
      'IF(AND(' +
        fecha('Llegada al hotel') +
        ',' +
        fecha('Salida del hotel') +
        ',' +
        r('Salida del hotel') +
        '>' +
        r('Llegada al hotel') +
        '),' +
        r('Salida del hotel') +
        '-' +
        r('Llegada al hotel') +
        ',0)',
    ),
  },
  {
    name: 'Personas en hotel',
    width: 9,
    style: 'entero',
    formula: conCodigo(
      'IF(' +
        r('Noches de hotel') +
        '>0,1+AND(' +
        si('Acompañante') +
        ',' +
        si('Acompañante en hotel') +
        '),0)',
    ),
  },
  {
    name: 'Noches-persona de hotel',
    width: 11,
    style: 'entero',
    total: 'sum',
    formula: conCodigo(r('Noches de hotel') + '*' + r('Personas en hotel')),
  },
  {
    name: 'Plan',
    width: 22,
    value: ({ registration }) => etiquetasPlan[registration.plan],
    ayuda: lista(
      'ListaPlanes',
      'Plan de pago',
      'Pago total, o Aparta con la inscripción: paga la separación y el resto en la fecha de compromiso.',
    ),
  },
  {
    name: 'Compromiso',
    width: 12,
    style: 'fecha',
    value: ({ registration }) =>
      registration.commitmentDate ? excelDate(registration.commitmentDate) : null,
    ayuda: entreFechas(
      'FechaApertura',
      'FechaCierre',
      'Fecha de compromiso',
      'Solo con el plan de apartar: día en que pagará el resto, hasta el cierre.',
      'Debe estar entre la apertura y el cierre de inscripciones.',
    ),
  },
  {
    name: 'Total',
    width: 13,
    style: 'moneda',
    total: 'sum',
    formula: conCodigo(
      'PrecioTitular+IF(' +
        si('Acompañante') +
        ',IF(' +
        si('Kit del acompañante') +
        ',PrecioAcompConKit,PrecioAcompSinKit),0)+IF(' +
        si('Cuatrimoto') +
        ',PrecioCuatrimoto,0)+IF(' +
        si('Parapente') +
        ',PrecioParapente,0)+IF(' +
        si('Parapente del acompañante') +
        ',PrecioParapente,0)+' +
        r('Noches-persona de hotel') +
        '*PrecioHotelNoche',
    ),
  },
  {
    name: 'Pagado',
    width: 13,
    style: 'moneda',
    total: 'sum',
    formula: conCodigo(
      'SUMIFS(Pagos[Monto],Pagos[Código],' + r('Código') + ',Pagos[Revisión],"Aprobado")',
    ),
  },
  {
    name: 'Saldo',
    width: 13,
    style: 'moneda',
    total: 'sum',
    formula: conCodigo('MAX(0,' + r('Total') + '-' + r('Pagado') + ')'),
  },
  {
    name: 'Por revisar',
    width: 13,
    style: 'moneda',
    total: 'sum',
    formula: conCodigo(
      'SUMIFS(Pagos[Monto],Pagos[Código],' + r('Código') + ',Pagos[Revisión],"Por revisar")',
    ),
  },
  {
    name: 'Días al compromiso',
    width: 14,
    style: 'dias',
    formula: conCodigo(
      'IF(AND(' +
        r('Saldo') +
        '>0,' +
        fecha('Compromiso') +
        '),' +
        r('Compromiso') +
        '-TODAY(),"")',
    ),
  },
  {
    // El mismo orden de reglas que el panel (getStatus).
    name: 'Estado',
    width: 15,
    style: 'centro',
    formula: conCodigo(
      'IF(AND(' +
        r('Pagado') +
        '>0,' +
        r('Pagado') +
        '>=' +
        r('Total') +
        '),"Pagado",IF(' +
        r('Pagado') +
        '>0,IF(AND(' +
        fecha('Compromiso') +
        ',' +
        r('Compromiso') +
        '<TODAY()),"Vencido","Saldo pendiente"),IF(OR(COUNTIF(Pagos[Código],' +
        r('Código') +
        ')=0,COUNTIFS(Pagos[Código],' +
        r('Código') +
        ',Pagos[Revisión],"Por revisar")>0),"Por verificar","Rechazado")))',
    ),
  },
  {
    // Activa = no Rechazada: aparta su cupo de la carrera y sus cupos del páramo.
    name: 'Activa',
    width: 9,
    style: 'centro',
    formula: conCodigo('IF(' + r('Estado') + '="Rechazado","No","Sí")'),
  },
  {
    name: 'Personas',
    width: 9,
    style: 'entero',
    total: 'sum',
    formula: conCodigo('IF(' + si('Acompañante') + ',2,1)'),
  },
  {
    // Solo quienes duermen en el páramo gastan cupo.
    name: 'Personas en páramo',
    width: 10,
    style: 'entero',
    total: 'sum',
    formula: conCodigo(
      '(' +
        r('Estadía') +
        '="' +
        ESTADIA_CON_CUPO +
        '")+AND(' +
        si('Acompañante') +
        ',' +
        r('Estadía del acompañante') +
        '="' +
        ESTADIA_CON_CUPO +
        '")',
    ),
  },
  {
    name: 'Alertas de salud',
    width: 10,
    style: 'entero',
    total: 'sum',
    formula: conCodigo('SUMIFS(Corredores[Alertas],Corredores[Código],' + r('Código') + ')'),
  },
  {
    // Clave única para ordenar los cobros por fecha de compromiso en el Resumen.
    name: 'Clave de cobro',
    width: 10,
    hidden: true,
    formula: conCodigo(
      'IF(AND(' +
        r('Saldo') +
        '>0,' +
        r('Pagado') +
        '>0,' +
        fecha('Compromiso') +
        '),' +
        r('Compromiso') +
        '+ROW()/100000,"")',
    ),
  },
];

/** Columnas que no pueden quedar vacías en una fila con datos; se resaltan si faltan. */
const obligatorias = ['Registro', ...datosTitular, 'Nacimiento', ...datosContacto, 'Plan'];

export function crearInscripciones(contexto: LibroContexto) {
  const sheet = hojaConTitulo(
    hojas.inscripciones,
    'Inscripciones',
    'Una fila por reserva. Para agregar una a mano, llena una fila amarilla del final: código, total, saldo y estado se calculan solos y la columna Revisar datos te dice qué falta.',
    columnas.length - 1,
    { tabColor: '0B2E26' },
  );
  sheet.freeze = { row: filaTabla + 1, column: 2 };

  const filas: Fila[] = contexto.summaries.map((summary) => ({
    ...summary,
    menor: isMinor(summary.registration.birthDate, contexto.today),
  }));

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
    filasDeTabla(columnas, filas, filasLibres.inscripciones),
  );
  validarColumnas(sheet, columnas);

  const table = sheet.tables[0];
  const first = filaTabla + 2;
  const letter = (name: string) => columnName(columnas.findIndex((col) => col.name === name));
  const range = (name: string) => tableColumnRange(table, name);
  const celda = (name: string) => '$' + letter(name) + first;

  sheet.validations.push({
    range: range('Documento'),
    type: 'custom',
    formula1: 'COUNTIF(DocumentosInscripciones,' + letter('Documento') + first + ')<=1',
    soloAviso: true,
    prompt: [
      'Documento del titular',
      'Solo números, sin puntos ni espacios. El código será ' + prefijoManual + ' y este número.',
    ],
    error: [
      'Documento repetido',
      'Ya hay una inscripción con este documento. Continúa solo si la anterior quedó Rechazada.',
    ],
  });

  for (const status of statusOrder) {
    sheet.conditionals.push({
      range: range('Estado'),
      type: 'expression',
      formula: celda('Estado') + '="' + status + '"',
      dxf: dxfEstado[status],
    });
  }
  const revisar = celda('Revisar datos');
  const hayDatos = 'OR(' + celda('Nombres') + '<>"",' + celda('Documento') + '<>"")';
  const days = celda('Días al compromiso');
  sheet.conditionals.push(
    {
      range: range('Revisar datos'),
      type: 'expression',
      formula: revisar + '="' + textoCompleto + '"',
      dxf: 'completo',
    },
    {
      range: range('Revisar datos'),
      type: 'expression',
      formula: 'AND(' + revisar + '<>"",' + revisar + '<>"' + textoCompleto + '")',
      dxf: 'pendiente',
    },
    ...obligatorias.map((name) => ({
      range: range(name),
      type: 'expression' as const,
      formula: 'AND(' + hayDatos + ',' + letter(name) + first + '="")',
      dxf: 'pendiente',
    })),
    {
      range: range('Días al compromiso'),
      type: 'expression',
      formula: 'AND(ISNUMBER(' + days + '),' + days + '<0)',
      dxf: 'vencido',
    },
    {
      range: range('Días al compromiso'),
      type: 'expression',
      formula: 'AND(ISNUMBER(' + days + '),' + days + '<=3)',
      dxf: 'verificar',
    },
    {
      range: range('Saldo'),
      type: 'expression',
      formula: 'AND(ISNUMBER(' + celda('Saldo') + '),' + celda('Saldo') + '>0)',
      dxf: 'saldoTexto',
    },
    {
      range: range('Alertas de salud'),
      type: 'expression',
      formula:
        'AND(ISNUMBER(' + celda('Alertas de salud') + '),' + celda('Alertas de salud') + '>0)',
      dxf: 'alerta',
    },
    {
      range: range('Activa'),
      type: 'expression',
      formula: celda('Activa') + '="No"',
      dxf: 'rechazado',
    },
    { range: range('Pagado'), type: 'dataBar', color: 'F2C14E' },
  );

  return { sheet };
}
