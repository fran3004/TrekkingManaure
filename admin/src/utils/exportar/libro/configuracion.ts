import { contacto, evento, precios } from '../../../../../shared/config';
import { formatPhone, metodoPago, versionTerminos } from '../../../../../shared/reservas';
import { hojas } from '../../../data/exportar/libro';
import { merge, setRow, type Cell, type Sheet } from '../xlsx/hoja';
import type { DefinedName } from '../xlsx/paquete';
import { excelDate } from '../xlsx/referencias';
import { encabezado, hojaConTitulo, nota, seccion, type LibroContexto } from './comun';

type Dato = { label: string; cell: Cell; help: string; name?: string };

const ULTIMA = 6;

function filasDeDatos(sheet: Sheet, start: number, datos: Dato[], names: DefinedName[]) {
  datos.forEach((dato, index) => {
    const row = start + index;
    setRow(sheet, row, 1, [{ v: dato.label, s: 'etiqueta' }, dato.cell]);
    merge(sheet, row, 3, row, ULTIMA, { v: dato.help, s: 'ayuda' });
    sheet.heights[row] = 20;
    if (dato.name)
      names.push({ name: dato.name, ref: "'" + hojas.configuracion + "'!$C$" + (row + 1) });
  });
  return start + datos.length;
}

export function crearConfiguracion(contexto: LibroContexto) {
  const sheet = hojaConTitulo(
    hojas.configuracion,
    'Configuración de la página',
    'Fechas, precios y cupos vigentes al descargar. Las fórmulas del libro usan estos valores.',
    ULTIMA,
    { gridLines: false, tabColor: 'A08C6A' },
  );
  sheet.widths = { 0: 2, 1: 40, 2: 20, 3: 20, 4: 20, 5: 16, 6: 34 };
  const names: DefinedName[] = [];

  seccion(sheet, 3, 1, ULTIMA, 'Evento');
  const texto = (v: string): Cell => ({ v, s: 'configTexto' });
  const dia = (iso: string): Cell => ({ v: excelDate(iso), s: 'configFecha' });
  let row = filasDeDatos(
    sheet,
    4,
    [
      { label: 'Evento', cell: texto(evento.nombre), help: 'Nombre que aparece en la página.' },
      { label: 'Lugar', cell: texto(evento.lugar), help: '' },
      {
        label: 'Primer día del evento',
        cell: dia(evento.fechas[0]),
        name: 'FechaEvento',
        help: 'Día de la largada. El hotel previo puede reservarse hasta la noche anterior.',
      },
      {
        label: 'Último día del evento',
        cell: dia(evento.fechas[evento.fechas.length - 1]),
        name: 'FechaEventoFin',
        help: '',
      },
      { label: 'Hora de salida', cell: texto(evento.horaSalidaTexto), help: '' },
      { label: 'Distancia', cell: texto(evento.distanciaKm + ' km'), help: '' },
      { label: 'Punto de encuentro', cell: texto(evento.encuentro), help: '' },
      { label: 'Llegada', cell: texto(evento.llegada), help: '' },
      {
        label: 'Apertura de inscripciones',
        cell: dia(evento.fechaAperturaInscripciones),
        name: 'FechaApertura',
        help: 'Desde este día se puede reservar y pagar.',
      },
      {
        label: 'Cierre de inscripciones y límite de pago',
        cell: dia(contexto.fechaCierre),
        name: 'FechaCierre',
        help: 'Último día para inscribirse y para pagar el saldo. Se cambia en Gestión de cupos del panel.',
      },
      {
        label: 'Versión de términos y condiciones',
        cell: texto(versionTerminos),
        help: 'La que acepta cada persona al reservar.',
      },
      {
        label: 'Vía de pago',
        cell: texto(metodoPago.label),
        help: 'Única vía de pago; sin pasarela.',
      },
      {
        label: 'Encargada',
        cell: texto(
          contacto.encargada +
            (contacto.whatsappConfigurado
              ? ' · ' + formatPhone({ country: 'CO', number: contacto.whatsapp.slice(2) })
              : ''),
        ),
        help: 'Contacto por WhatsApp que muestra la página.',
      },
    ],
    names,
  );

  seccion(sheet, row + 1, 1, ULTIMA, 'Precios vigentes');
  const moneda = (v: number): Cell => ({ v, s: 'configMoneda' });
  row = filasDeDatos(
    sheet,
    row + 2,
    [
      {
        label: 'Inscripción y kit del titular',
        cell: moneda(precios.total),
        name: 'PrecioTitular',
        help: 'El kit es obligatorio para el titular.',
      },
      {
        label: 'Separación del cupo (primer pago al apartar)',
        cell: moneda(precios.inscripcion),
        name: 'PrecioSeparacion',
        help: 'Con el plan de apartar se paga esto al reservar y el resto en la fecha de compromiso.',
      },
      {
        label: 'Kit completo',
        cell: { f: 'PrecioTitular-PrecioSeparacion', s: 'configMoneda' },
        help: 'Lo que falta al titular después de la separación.',
      },
      {
        label: 'Acompañante sin kit',
        cell: moneda(precios.acompanante),
        name: 'PrecioAcompSinKit',
        help: 'Corre el recorrido sin camisa ni kit.',
      },
      {
        label: 'Acompañante con kit',
        cell: moneda(precios.acompananteConKit),
        name: 'PrecioAcompConKit',
        help: 'Se le pide talla de camisa.',
      },
      {
        label: 'Paseo en cuatrimoto',
        cell: moneda(precios.cuatrimoto),
        name: 'PrecioCuatrimoto',
        help: 'Mismo valor con o sin acompañante.',
      },
      {
        label: 'Vuelo en parapente (por persona)',
        cell: moneda(precios.parapente),
        name: 'PrecioParapente',
        help: 'Se cobra al titular y al acompañante que lo elijan.',
      },
      {
        label: 'Hotel antes del evento (noche por persona)',
        cell: moneda(precios.hotelNoche),
        name: 'PrecioHotelNoche',
        help: 'Noches × personas que llegan antes × este valor.',
      },
    ],
    names,
  );

  seccion(sheet, row + 1, 1, ULTIMA, 'Cupos');
  const cupos = row + 2;
  encabezado(sheet, cupos, 1, ['Contador', 'Tope', 'Ocupados', 'Libres']);
  merge(sheet, cupos, 5, cupos, ULTIMA, { v: 'Cómo se gasta', s: 'tablaEncabezado' });
  sheet.heights[cupos] = 30;
  const activas = 'COUNTIF(Inscripciones[Activa],"Sí")';
  const cuposParamo = 'SUMIFS(Inscripciones[Personas en páramo],Inscripciones[Activa],"Sí")';
  [
    {
      label: 'Cupos de la carrera',
      tope: contexto.carrera.capacity,
      name: 'CuposCarrera',
      ocupados: activas,
      help: 'Uno por reserva activa, con o sin acompañante.',
    },
    {
      label: 'Cupos del páramo',
      tope: contexto.paramo.capacity,
      name: 'CuposParamo',
      ocupados: cuposParamo,
      help: 'Una por persona que duerme en el páramo.',
    },
  ].forEach((cupo, index) => {
    const r = cupos + 1 + index;
    setRow(sheet, r, 1, [
      { v: cupo.label, s: 'etiqueta' },
      { v: cupo.tope, s: 'configEntero' },
      { f: cupo.ocupados, s: 'celdaEntero' },
      { f: 'MAX(0,C' + (r + 1) + '-D' + (r + 1) + ')', s: 'celdaEntero' },
    ]);
    merge(sheet, r, 5, r, ULTIMA, { v: cupo.help, s: 'ayuda' });
    names.push({ name: cupo.name, ref: "'" + hojas.configuracion + "'!$C$" + (r + 1) });
  });
  nota(
    sheet,
    cupos + 3,
    1,
    ULTIMA,
    'Los cupos de la carrera y del páramo se apartan al reservar, aunque el pago siga por revisar, y se liberan si la inscripción queda Rechazada. Hotel en Manaure y regreso a casa no gastan cupo del páramo.',
  );

  const control = cupos + 5;
  seccion(sheet, control, 1, ULTIMA, 'Comparación con la página');
  encabezado(sheet, control + 1, 1, ['Dato', 'Página al descargar', 'Este libro', '¿Coincide?']);
  sheet.heights[control + 1] = 30;
  const comparaciones = [
    {
      label: 'Inscripciones',
      pagina: contexto.pagina.inscripciones,
      libro: 'COUNTIF(Inscripciones[Código],"?*")',
      style: 'celdaEntero',
    },
    {
      label: 'Cupos de la carrera ocupados',
      pagina: contexto.carrera.occupied,
      libro: activas,
      style: 'celdaEntero',
    },
    {
      label: 'Cupos del páramo ocupados',
      pagina: contexto.paramo.occupied,
      libro: cuposParamo,
      style: 'celdaEntero',
    },
    {
      label: 'Recaudado',
      pagina: contexto.pagina.recaudado,
      libro: 'SUM(Inscripciones[Pagado])',
      style: 'celdaMoneda',
    },
    {
      label: 'Pagos por revisar',
      pagina: contexto.pagina.pagosPorRevisar,
      libro: 'COUNTIF(Pagos[Revisión],"Por revisar")',
      style: 'celdaEntero',
    },
  ];
  const primera = control + 2;
  comparaciones.forEach((item, index) => {
    const r = primera + index;
    setRow(sheet, r, 1, [
      { v: item.label, s: 'etiqueta' },
      { v: item.pagina, s: item.style },
      { f: item.libro, s: item.style },
      { f: 'IF(C' + (r + 1) + '=D' + (r + 1) + ',"✓ Sí","No")', s: 'celdaCentro' },
    ]);
  });
  const ultima = primera + comparaciones.length - 1;
  const coincide = 'COUNTIF(E' + (primera + 1) + ':E' + (ultima + 1) + ',"No")=0';
  const filtrado = contexto.filterLabel !== 'Todos';
  merge(sheet, ultima + 1, 1, ultima + 1, ULTIMA, {
    f:
      'IF(' +
      coincide +
      ',"✓ El libro coincide con la página.","' +
      (filtrado
        ? 'Difiere porque el libro solo incluye las inscripciones «' +
          contexto.filterLabel +
          '»; descarga «Todos» para comparar.'
        : 'Difiere porque se agregaron o cambiaron datos en el libro; la página no cambia con ellos.') +
      '")',
    s: 'mensaje',
  });
  sheet.conditionals.push(
    {
      range: 'E' + (primera + 1) + ':E' + (ultima + 1),
      type: 'expression',
      formula: '$E' + (primera + 1) + '="No"',
      dxf: 'pendiente',
    },
    {
      range: 'E' + (primera + 1) + ':E' + (ultima + 1),
      type: 'expression',
      formula: '$E' + (primera + 1) + '<>"No"',
      dxf: 'completo',
    },
  );

  nota(
    sheet,
    ultima + 3,
    1,
    ULTIMA,
    'Estos valores son los de la página al descargar. Cambiarlos aquí solo sirve para simular: la página no cambia. Los cupos y la fecha de cierre se cambian en Gestión de cupos del panel.',
  );

  return { sheet, names };
}
