import { formatDate } from '../../../../../shared/utils/format';
import { hojas, prefijoManual, textoCompleto } from '../../../data/exportar/libro';
import { merge, setCell, type Sheet } from '../xlsx/hoja';
import { hojaConTitulo, seccion, type LibroContexto } from './comun';
import { pagoCorrecto } from './pagos';

const ULTIMA = 4;

type Paso = { titulo: string; lineas: string[]; enlace?: string };

/** Enlace a la primera fila libre de una tabla, o el aviso de que no quedan. */
function enlaceFilaLibre(hoja: string, tabla: string, columna: string, vacia: string) {
  const posicion = 'MATCH(1,INDEX(' + vacia + ',0),0)';
  const fila = 'ROW(' + tabla + '[#Headers])+' + posicion;
  return (
    'IFERROR(HYPERLINK("#\'' +
    hoja +
    "'!" +
    columna +
    '"&(' +
    fila +
    '),"Ir a la primera fila libre de ' +
    hoja +
    ' (fila "&(' +
    fila +
    ')&") →"),"No quedan filas libres en ' +
    hoja +
    ': mira el paso 4.")'
  );
}

const pasos: Paso[] = [
  {
    titulo: 'Agregar una inscripción',
    lineas: [
      'Ve a la primera fila amarilla de Inscripciones con el enlace de abajo.',
      'Escribe el documento del titular: el código se crea solo (' +
        prefijoManual +
        ' y el documento). Al seleccionar cada celda aparece qué escribir, y las listas desplegables evitan errores.',
      'Llena las celdas hasta que la columna Revisar datos diga ' +
        textoCompleto +
        '. Las celdas obligatorias vacías se ponen naranjas.',
      'Si corre con acompañante, pon Acompañante en Sí y llena sus columnas. Total, saldo, estado y cupos se calculan solos.',
    ],
    enlace: enlaceFilaLibre(
      hojas.inscripciones,
      'Inscripciones',
      'C',
      '(Inscripciones[Nombres]="")*(Inscripciones[Documento]="")',
    ),
  },
  {
    titulo: 'Registrar un pago',
    lineas: [
      'En la primera fila amarilla de Pagos elige el código de la inscripción: verás su titular y su saldo.',
      'Elige el concepto y escribe la fecha y el monto (solo números, sin puntos). La revisión viene en Aprobado: cámbiala a Por revisar si aún no ves el dinero en la llave Bre-B.',
      'Si lo rechazas, elige o escribe el motivo. La columna Revisar debe decir ' +
        pagoCorrecto +
        '. Solo los pagos aprobados suman a lo pagado.',
    ],
    enlace: enlaceFilaLibre(hojas.pagos, 'Pagos', 'B', '--(Pagos[Código]="")'),
  },
  {
    titulo: 'Salud y contacto de un corredor (opcional)',
    lineas: [
      'Para una inscripción agregada a mano, registra en Corredores a cada persona (titular y acompañante) con su código, para que sus alertas de salud cuenten.',
      'En Enfermedad, Alergias y Discapacidad escribe No si no tiene. Practica deporte = No cuenta como alerta.',
    ],
    enlace: enlaceFilaLibre(hojas.corredores, 'Corredores', 'A', '--(Corredores[Código]="")'),
  },
  {
    titulo: '¿Se acabaron las filas amarillas?',
    lineas: [
      'Haz clic derecho sobre la última fila de la tabla y elige Insertar > Filas de la tabla encima, o presiona Tab en la última celda de la última fila. Las fórmulas, listas y ayudas se copian solas.',
    ],
  },
  {
    titulo: 'Buscar a una persona',
    lineas: [
      'En la hoja Buscar elige un código o escribe un documento: verás su ficha completa y sus pagos.',
    ],
  },
];

function escribirPaso(sheet: Sheet, row: number, numero: number, paso: Paso) {
  setCell(sheet, row, 1, { v: numero, s: 'pasoNumero' });
  merge(sheet, row, 2, row, ULTIMA, { v: paso.titulo, s: 'pasoTitulo' });
  sheet.heights[row] = 26;
  let fila = row + 1;
  for (const linea of paso.lineas) {
    merge(sheet, fila, 2, fila, ULTIMA, { v: '•  ' + linea, s: 'pasoTexto' });
    sheet.heights[fila] = linea.length > 110 ? 32 : 18;
    fila++;
  }
  if (paso.enlace) {
    merge(sheet, fila, 2, fila, ULTIMA, { f: paso.enlace, s: 'enlace' });
    sheet.heights[fila] = 20;
    fila++;
  }
  return fila + 1;
}

export function crearGuia(contexto: LibroContexto) {
  const sheet = hojaConTitulo(
    hojas.guia,
    'Cómo usar este libro',
    'Datos de la página al ' +
      formatDate(contexto.today) +
      ' de ' +
      contexto.today.slice(0, 4) +
      ' · las filas amarillas son para agregar registros a mano.',
    ULTIMA,
    { gridLines: false, tabColor: '3E7A2B' },
  );
  sheet.widths = { 0: 2, 1: 6, 2: 62, 3: 16, 4: 30 };

  merge(sheet, 3, 1, 3, ULTIMA, {
    v: 'Importante: este libro es una copia de trabajo. Lo que agregues aquí no cambia la página. Las inscripciones se hacen en el formulario de la página y los pagos se aprueban o registran en el panel; luego vuelve a descargar el libro.',
    s: 'aviso',
  });
  sheet.heights[3] = 46;

  seccion(sheet, 5, 1, ULTIMA, 'Estado de los datos');
  const contadores = [
    {
      label: 'Inscripciones con avisos (datos o pendientes)',
      f:
        'COUNTIFS(Inscripciones[Revisar datos],"?*",Inscripciones[Revisar datos],"<>' +
        textoCompleto +
        '")',
    },
    {
      label: 'Pagos con avisos',
      f: 'COUNTIFS(Pagos[Revisar],"?*",Pagos[Revisar],"<>' + pagoCorrecto + '")',
    },
    {
      label: 'Datos que no coinciden con la página',
      f: "COUNTIF('" + hojas.configuracion + '\'!E:E,"No")',
    },
    { label: 'Filas libres en Inscripciones', f: 'COUNTBLANK(Inscripciones[Documento])' },
    { label: 'Filas libres en Pagos', f: 'COUNTBLANK(Pagos[Código])' },
    { label: 'Filas libres en Corredores', f: 'COUNTBLANK(Corredores[Código])' },
  ];
  contadores.forEach((contador, index) => {
    const row = 6 + index;
    merge(sheet, row, 1, row, 2, { v: contador.label, s: 'etiqueta' });
    setCell(sheet, row, 3, { f: contador.f, s: 'contador' });
    sheet.heights[row] = 22;
  });
  const avisos = 'SUM(D7:D9)';
  const resumen = 6 + contadores.length;
  merge(sheet, resumen, 1, resumen, ULTIMA, {
    f:
      'IF(' +
      avisos +
      '=0,"' +
      textoCompleto +
      ': todos los datos cuadran.","Revisa las celdas naranjas de Inscripciones y Pagos, o la comparación en ' +
      hojas.configuracion +
      '.")',
    s: 'mensaje',
  });
  sheet.conditionals.push(
    { range: 'D7:D9', type: 'expression', formula: 'D7>0', dxf: 'pendiente' },
    { range: 'D7:D9', type: 'expression', formula: 'D7=0', dxf: 'completo' },
  );

  let row = resumen + 2;
  seccion(sheet, row, 1, ULTIMA, 'Paso a paso');
  row += 1;
  pasos.forEach((paso, index) => {
    row = escribirPaso(sheet, row, index + 1, paso);
  });

  seccion(sheet, row, 1, ULTIMA, 'Colores');
  [
    { s: 'entradaTexto', label: 'Celda para escribir o elegir de la lista.' },
    { s: 'aviso', label: 'Falta un dato obligatorio o hay un aviso por revisar.' },
    { s: 'configTexto', label: 'Valor de la página: solo para consultar.' },
  ].forEach((color, index) => {
    setCell(sheet, row + 1 + index, 1, { s: color.s });
    merge(sheet, row + 1 + index, 2, row + 1 + index, ULTIMA, { v: color.label, s: 'pasoTexto' });
    sheet.heights[row + 1 + index] = 18;
  });

  return { sheet };
}
