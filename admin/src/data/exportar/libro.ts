import type { DxfDef, StyleDef } from '../../utils/exportar/xlsx/estilos';
import type { RegistrationStatus } from '../../../../shared/reservas';

export const hojas = {
  resumen: 'Resumen',
  guia: 'Cómo usar',
  buscar: 'Buscar',
  inscripciones: 'Inscripciones',
  pagos: 'Pagos',
  corredores: 'Corredores',
  configuracion: 'Configuración',
  listas: 'Listas',
} as const;

/** Filas amarillas en blanco al final de cada tabla para registrar datos a mano. */
export const filasLibres = { inscripciones: 40, pagos: 60, corredores: 40 } as const;

/** Prefijo del código de una inscripción agregada a mano en el libro: MAN- y su documento. */
export const prefijoManual = 'MAN-';

export const textoCompleto = '✓ Completo';

export const contenidoLibro = [
  {
    hoja: hojas.resumen,
    descripcion:
      'Indicadores, cupos de la carrera y cupos del páramo, gráficos, ingresos, tallas y cobros.',
  },
  {
    hoja: hojas.guia,
    descripcion: 'Pasos para agregar inscripciones, pagos y salud a mano, y el control de datos.',
  },
  {
    hoja: hojas.buscar,
    descripcion: 'Ficha completa y sus pagos al escribir un código o documento.',
  },
  {
    hoja: hojas.inscripciones,
    descripcion:
      'Una fila por reserva y filas amarillas libres; total, saldo y estado se calculan solos.',
  },
  {
    hoja: hojas.pagos,
    descripcion:
      'Pagos por llave Bre-B y filas libres para registrar más; cada uno se revisa solo.',
  },
  {
    hoja: hojas.corredores,
    descripcion: 'Una fila por persona: estadía, kit, talla y salud, con filas libres.',
  },
  {
    hoja: hojas.configuracion,
    descripcion: 'Fechas, precios y cupos vigentes de la página, comparados con el libro.',
  },
];

export const colores = {
  verde: '0B2E26',
  dorado: 'F2C14E',
  crema: 'F7F1DE',
  arena: 'FFF6D9',
  texto: '1F2A24',
  gris: '6B6250',
  naranja: 'E8581C',
  rojo: 'D3290F',
  musgo: '3E7A2B',
  tierra: 'A08C6A',
};

export const coloresEstado: Record<RegistrationStatus, string> = {
  'Por verificar': colores.dorado,
  'Saldo pendiente': colores.naranja,
  Vencido: colores.rojo,
  Pagado: colores.musgo,
  Rechazado: colores.tierra,
};

export const dxfEstado: Record<RegistrationStatus, string> = {
  'Por verificar': 'verificar',
  'Saldo pendiente': 'saldo',
  Vencido: 'vencido',
  Pagado: 'pagado',
  Rechazado: 'rechazado',
};

const moneda = '"$"#,##0';
const fecha = 'dd/mm/yyyy';
const DIAS = '0" días";[Red]"vencido "0" d";"hoy"';
const banda = { fill: colores.verde };
const tarjeta = { fill: colores.crema, border: 'tarjeta' as const };
const tarjetaTexto = { horizontal: 'left' as const, vertical: 'center' as const, indent: 1 };

export const estilosLibro: Record<string, StyleDef> = {
  banda,
  titulo: {
    ...banda,
    font: { bold: true, size: 20, color: colores.dorado },
    align: { vertical: 'center', indent: 1 },
  },
  subtitulo: {
    ...banda,
    font: { size: 10, color: 'FDF8DF' },
    align: { vertical: 'center', indent: 1 },
  },
  seccion: { font: { bold: true, size: 13, color: colores.verde }, border: 'inferior' },
  nota: {
    font: { italic: true, size: 9, color: colores.gris },
    align: { wrap: true, vertical: 'top' },
  },
  ayuda: {
    font: { italic: true, size: 9, color: colores.gris },
    align: { vertical: 'center', indent: 1 },
  },
  tablaEncabezado: {
    fill: colores.verde,
    font: { bold: true, color: 'FFFFFF' },
    align: { horizontal: 'center', vertical: 'center', wrap: true },
  },
  tablaTotal: { fill: 'EFE6C8', font: { bold: true }, border: 'superior' },
  moneda: { numFmt: moneda },
  monedaTotal: { numFmt: moneda, fill: 'EFE6C8', font: { bold: true }, border: 'superior' },
  entero: { numFmt: '0', align: { horizontal: 'center' } },
  enteroTotal: {
    numFmt: '0',
    fill: 'EFE6C8',
    font: { bold: true },
    border: 'superior',
    align: { horizontal: 'center' },
  },
  porcentajeTotal: {
    numFmt: '0%',
    fill: 'EFE6C8',
    font: { bold: true },
    border: 'superior',
    align: { horizontal: 'center' },
  },
  fecha: { numFmt: fecha, align: { horizontal: 'center' } },
  centro: { align: { horizontal: 'center' } },
  dias: {
    numFmt: DIAS,
    align: { horizontal: 'center' },
  },
  etiqueta: { border: 'fina', align: { indent: 1, vertical: 'center' } },
  celdaTexto: { border: 'fina', align: { indent: 1, vertical: 'center' } },
  celdaEntero: { border: 'fina', numFmt: '0', align: { horizontal: 'center' } },
  celdaMoneda: { border: 'fina', numFmt: moneda },
  celdaPorcentaje: { border: 'fina', numFmt: '0%', align: { horizontal: 'center' } },
  celdaFecha: { border: 'fina', numFmt: fecha, align: { horizontal: 'center' } },
  celdaDias: {
    border: 'fina',
    numFmt: DIAS,
    align: { horizontal: 'center' },
  },
  celdaCentro: { border: 'fina', align: { horizontal: 'center' } },
  kpiEtiqueta: {
    ...tarjeta,
    font: { bold: true, size: 9, color: colores.gris },
    align: tarjetaTexto,
  },
  kpiValor: {
    ...tarjeta,
    numFmt: '0',
    font: { bold: true, size: 22, color: colores.verde },
    align: tarjetaTexto,
  },
  kpiMoneda: {
    ...tarjeta,
    numFmt: moneda,
    font: { bold: true, size: 20, color: colores.verde },
    align: tarjetaTexto,
  },
  kpiValorAlerta: {
    ...tarjeta,
    numFmt: '0',
    font: { bold: true, size: 22, color: colores.rojo },
    align: tarjetaTexto,
  },
  notaCorredores: {
    ...tarjeta,
    numFmt: '[=1]0" corredor";0" corredores"',
    font: { size: 9, color: colores.gris },
    align: tarjetaTexto,
  },
  notaPromedio: {
    ...tarjeta,
    numFmt: moneda + '" en promedio"',
    font: { size: 9, color: colores.gris },
    align: tarjetaTexto,
  },
  notaPorcentaje: {
    ...tarjeta,
    numFmt: '0%" del facturado"',
    font: { size: 9, color: colores.gris },
    align: tarjetaTexto,
  },
  notaVencidos: {
    ...tarjeta,
    numFmt: moneda + '" en saldos vencidos"',
    font: { size: 9, color: colores.gris },
    align: tarjetaTexto,
  },
  notaDeclarados: {
    ...tarjeta,
    numFmt: moneda + '" declarados"',
    font: { size: 9, color: colores.gris },
    align: tarjetaTexto,
  },
  notaReservas: {
    ...tarjeta,
    numFmt: '[=1]0" reserva activa";0" reservas activas"',
    font: { size: 9, color: colores.gris },
    align: tarjetaTexto,
  },
  notaCuposParamo: {
    ...tarjeta,
    numFmt: '[=1]0" cupo ocupado";0" cupos ocupados"',
    font: { size: 9, color: colores.gris },
    align: tarjetaTexto,
  },
  notaRiesgo: {
    ...tarjeta,
    numFmt: '0" en riesgo por vencimiento"',
    font: { size: 9, color: colores.gris },
    align: tarjetaTexto,
  },
  entrada: {
    fill: colores.arena,
    border: 'entrada',
    font: { bold: true, size: 13, color: colores.verde },
    align: { indent: 1, vertical: 'center' },
  },
  mensaje: { font: { italic: true, color: colores.gris }, align: { indent: 1 } },
  fichaEtiqueta: {
    fill: colores.crema,
    border: 'fina',
    font: { color: colores.gris },
    align: { indent: 1, vertical: 'center' },
  },
  fichaValor: { border: 'fina', font: { bold: true }, align: { indent: 1, vertical: 'center' } },
  fichaMoneda: {
    border: 'fina',
    numFmt: moneda,
    font: { bold: true },
    align: { indent: 1, vertical: 'center' },
  },
  fichaFecha: {
    border: 'fina',
    numFmt: fecha,
    font: { bold: true },
    align: { indent: 1, vertical: 'center' },
  },
  fichaDias: {
    border: 'fina',
    numFmt: DIAS,
    font: { bold: true },
    align: { indent: 1, vertical: 'center' },
  },
  fichaEntero: {
    border: 'fina',
    numFmt: '0',
    font: { bold: true },
    align: { horizontal: 'left', indent: 1, vertical: 'center' },
  },
  // Celdas de las filas libres: el amarillo indica dónde escribir.
  entradaTexto: { fill: colores.arena, border: 'fina' },
  entradaCentro: { fill: colores.arena, border: 'fina', align: { horizontal: 'center' } },
  entradaFecha: {
    fill: colores.arena,
    border: 'fina',
    numFmt: fecha,
    align: { horizontal: 'center' },
  },
  entradaEntero: {
    fill: colores.arena,
    border: 'fina',
    numFmt: '0',
    align: { horizontal: 'center' },
  },
  entradaMoneda: { fill: colores.arena, border: 'fina', numFmt: moneda },
  // Valores vigentes de la página: no se escriben, solo se consultan.
  configTexto: { fill: colores.crema, border: 'fina', font: { bold: true }, align: { indent: 1 } },
  configFecha: { fill: colores.crema, border: 'fina', numFmt: fecha, font: { bold: true } },
  configMoneda: { fill: colores.crema, border: 'fina', numFmt: moneda, font: { bold: true } },
  configEntero: {
    fill: colores.crema,
    border: 'fina',
    numFmt: '0',
    font: { bold: true },
    align: { horizontal: 'center' },
  },
  revisar: { font: { size: 9 }, align: { vertical: 'center' } },
  enlace: { font: { bold: true, underline: true, color: '1155CC' }, align: { indent: 1 } },
  pasoNumero: {
    fill: colores.verde,
    font: { bold: true, size: 14, color: colores.dorado },
    align: { horizontal: 'center', vertical: 'center' },
  },
  pasoTitulo: {
    font: { bold: true, size: 12, color: colores.verde },
    align: { vertical: 'center' },
  },
  pasoTexto: { align: { wrap: true, vertical: 'top', indent: 1 } },
  aviso: {
    fill: 'FCE4D6',
    font: { bold: true, color: '9C4A06' },
    align: { wrap: true, vertical: 'center', indent: 1 },
  },
  contador: {
    fill: colores.crema,
    border: 'fina',
    numFmt: '0',
    font: { bold: true, size: 13, color: colores.verde },
    align: { horizontal: 'center', vertical: 'center' },
  },
};

export const dxfLibro: Record<string, DxfDef> = {
  pagado: { fill: 'C6EFCE', color: '006100', bold: true },
  saldo: { fill: 'FCE4D6', color: '9C4A06', bold: true },
  vencido: { fill: 'FFC7CE', color: '9C0006', bold: true },
  verificar: { fill: 'FFF2CC', color: '7F6000', bold: true },
  rechazado: { fill: 'EDEDED', color: '595959', bold: true },
  alerta: { fill: 'FDE9E7', color: '9C0006' },
  saldoTexto: { color: 'C65911', bold: true },
  completo: { color: '006100' },
  pendiente: { fill: 'FCE4D6', color: '9C4A06', bold: true },
};
