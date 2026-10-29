import { CLAVE_MAX, CLAVE_MIN, CORREO_MAX } from '../../data/auth/sesion';

export type Credenciales = { correo: string; clave: string };

export type ErroresAcceso = Partial<Record<keyof Credenciales, string>>;

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validarCorreo(value: string) {
  const correo = value.trim();
  if (!correo) return 'Escribe tu correo.';
  if (correo.length > CORREO_MAX || !CORREO.test(correo)) {
    return 'Escribe un correo válido, por ejemplo nombre@dominio.com.';
  }
  return undefined;
}

function validarClave(value: string) {
  if (!value) return 'Escribe tu contraseña.';
  if (value.trim() !== value) return 'La contraseña no puede empezar ni terminar con espacios.';
  if (value.length < CLAVE_MIN) {
    return 'La contraseña debe tener al menos ' + CLAVE_MIN + ' caracteres.';
  }
  if (value.length > CLAVE_MAX) {
    return 'La contraseña no puede superar ' + CLAVE_MAX + ' caracteres.';
  }
  return undefined;
}

/** Errores por campo; un objeto vacío significa que las credenciales tienen formato válido. */
export function validarCredenciales({ correo, clave }: Credenciales): ErroresAcceso {
  const errores: ErroresAcceso = {};
  const errorCorreo = validarCorreo(correo);
  const errorClave = validarClave(clave);
  if (errorCorreo) errores.correo = errorCorreo;
  if (errorClave) errores.clave = errorClave;
  return errores;
}

/** Nombre visible a partir del correo: "maria.perez@..." pasa a "Maria Perez". */
export function nombreDesdeCorreo(correo: string) {
  return correo
    .trim()
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
