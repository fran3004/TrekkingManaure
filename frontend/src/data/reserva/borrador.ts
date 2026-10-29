import { CASILLAS_TERMINOS } from './formulario';

// Borrador del formulario: lo escrito se guarda en el navegador para no perderlo si se cierra
// el resumen o la página antes de registrar la reserva.

export const BORRADOR_CLAVE = 'trekking-manaure:borrador-reserva';

/** El borrador caduca solo: pasado este tiempo se descarta al abrir la página. */
export const BORRADOR_VIGENCIA_MS = 48 * 60 * 60 * 1000;

/** Espera tras el último cambio antes de guardar, para no escribir en cada tecla. */
export const BORRADOR_ESPERA_MS = 500;

/** La aceptación de términos y de imagen nunca se guarda: se da de nuevo en cada envío. */
export const CAMPOS_SIN_GUARDAR: readonly string[] = [
  ...CASILLAS_TERMINOS.titular,
  ...CASILLAS_TERMINOS.acompanante,
].map((casilla) => casilla.name);
