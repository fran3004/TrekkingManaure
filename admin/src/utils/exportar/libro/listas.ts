import { hojas } from '../../../data/exportar/libro';
import { motivosRechazo } from '../../../data/pagos/motivos';
import {
  eps,
  estadias,
  etiquetasPlan,
  generos,
  parentescos,
  tallas,
  tiposDocumento,
  type PaymentConcept,
  type PaymentReview,
} from '../../../../../shared/reservas';
import { createSheet, setCell } from '../xlsx/hoja';
import type { DefinedName } from '../xlsx/paquete';
import { absoluteRange } from '../xlsx/referencias';

const conceptos: PaymentConcept[] = ['Separación de cupo', 'Pago total', 'Pago de saldo'];
const revisiones: PaymentReview[] = ['Por revisar', 'Aprobado', 'Rechazado'];

/** Catálogos de la página que alimentan los desplegables; cada uno queda con un nombre de Excel. */
export const listas = {
  ListaSiNo: ['Sí', 'No'],
  ListaTiposDocumento: [...tiposDocumento],
  ListaGeneros: [...generos],
  ListaTallas: [...tallas],
  ListaEstadias: [...estadias],
  ListaEPS: [...eps],
  ListaParentescos: [...parentescos],
  ListaPlanes: Object.values(etiquetasPlan),
  ListaConceptos: conceptos,
  ListaRevisiones: revisiones,
  ListaRoles: ['Titular', 'Acompañante'],
  ListaAutorizacion: ['Sí', 'No', 'No aplica'],
  ListaMotivos: [...motivosRechazo],
} satisfies Record<string, readonly string[]>;

export type NombreLista = keyof typeof listas;

/** Hoja oculta con una columna por catálogo. */
export function crearListas() {
  const sheet = createSheet(hojas.listas, { oculta: true });
  const names: DefinedName[] = Object.entries(listas).map(([name, values], column) => {
    setCell(sheet, 0, column, { v: name });
    values.forEach((value, index) => setCell(sheet, 1 + index, column, { v: value }));
    sheet.widths[column] = 24;
    return { name, ref: absoluteRange(hojas.listas, 1, column, values.length, column) };
  });
  return { sheet, names };
}
