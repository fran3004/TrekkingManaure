/** Qué se permite escribir en cada campo de texto del formulario. */
export type TipoEntrada =
  'nombre' | 'lugar' | 'epsOtra' | 'correo' | 'documentoNumerico' | 'documentoAlfanumerico';

function espaciosSimples(valor: string): string {
  return valor.replace(/\s+/g, ' ').replace(/^ /, '');
}

/**
 * Limpia lo que la persona escribe o pega, mientras escribe: quita los caracteres que el campo no
 * admite y aplica mayúsculas o minúsculas. Las tildes se dejan: se aceptan al escribir y se quitan al
 * guardar (normalizacion.ts). La validación completa se hace después, sobre el texto normalizado.
 */
export function limpiarEntrada(tipo: TipoEntrada, valor: string): string {
  switch (tipo) {
    case 'nombre':
      return espaciosSimples(valor.replace(/[^\p{L}\p{M}'’\-\s]/gu, '')).toUpperCase();
    case 'lugar':
      return espaciosSimples(valor.replace(/[^\p{L}\p{M}'’.\-\s]/gu, ''));
    case 'epsOtra':
      return espaciosSimples(valor.replace(/[^\p{L}\p{M}\s]/gu, ''));
    case 'correo':
      return valor.replace(/\s/g, '').toLowerCase();
    // Los documentos numéricos admiten solo dígitos: al pegar 1.098.726.541 queda 1098726541.
    case 'documentoNumerico':
      return valor.replace(/\D/g, '');
    case 'documentoAlfanumerico':
      return valor.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }
}
