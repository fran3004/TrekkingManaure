// Reglas del acceso al panel. La duración y el formato de la sesión los decide el servidor;
// las reglas de los campos se mantienen como ayuda en el formulario.

// Cada cuánto se comprueba si la sesión venció mientras el panel está abierto.
export const REVISION_SESION_MS = 30 * 1000;

export const CLAVE_MIN = 8;
export const CLAVE_MAX = 128;
export const CORREO_MAX = 254;
