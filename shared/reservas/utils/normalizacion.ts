// Normalización de los textos del formulario. Es la misma que aplica el backend (Normalizador.java) antes
// de validar y guardar, así el resumen que ve la persona coincide con lo que queda registrado. Las
// longitudes y los caracteres permitidos se miden sobre el resultado.
//
// Las tildes se aceptan al escribir y se quitan al guardar: cualquier marca latina (Á, è, ã, ç, ü...)
// se elimina, salvo la tilde de la Ñ, que es otra letra (PEÑA no es lo mismo que PENA). Los detalles de
// salud no se normalizan.

const ESPACIOS = /\s+/g;
/** Apóstrofes curvos (el teclado del celular los pone solos) que pasan a «'». */
const APOSTROFES = /[‘’ʼ]/g;
/** Guiones tipográficos que pasan a «-». */
const GUIONES = /[‐‑]/g;
const MARCA = /\p{M}/u;
const TILDE_COMBINANTE = '̃';

/** Todo texto: sin espacios al inicio y al final, espacios dobles a uno y Unicode NFC. */
function normalizarTexto(valor: string): string {
  return valor.normalize('NFC').replace(ESPACIOS, ' ').trim();
}

/** Quita las marcas de acento y conserva la tilde de la Ñ. */
function quitarTildes(valor: string): string {
  let salida = '';
  for (const caracter of valor.normalize('NFD')) {
    const esTildeDeN = caracter === TILDE_COMBINANTE && /[Nn]$/.test(salida);
    if (MARCA.test(caracter) && !esTildeDeN) continue;
    salida += caracter;
  }
  return salida.normalize('NFC');
}

/** Ciudad y nombre de la EPS «Otra»: sin tildes (la Ñ se conserva) y con las mayúsculas escritas. */
export function normalizarLugar(valor: string): string {
  return quitarTildes(normalizarTexto(valor).replace(APOSTROFES, "'").replace(GUIONES, '-'));
}

/** Nombres, apellidos y nombre del contacto: MAYÚSCULAS y sin tildes (la Ñ se conserva). */
export function normalizarNombre(valor: string): string {
  return normalizarLugar(valor).toUpperCase();
}

/** Documento: sin puntos, espacios ni guiones y en MAYÚSCULAS (1.098.726.541 pasa a 1098726541). */
export function normalizarDocumento(valor: string): string {
  return valor.replace(/[.\-\s]+/g, '').toUpperCase();
}

/** Correo: en minúsculas y sin espacios. */
export function normalizarCorreo(valor: string): string {
  return valor.normalize('NFC').replace(ESPACIOS, '').toLowerCase();
}
