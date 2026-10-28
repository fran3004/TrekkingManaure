/**
 * Cliente HTTP de la API. Lo usan el sitio público y el panel, por eso vive en shared. Nunca
 * lanza: devuelve siempre una respuesta tipada, con el `detail` del ProblemDetail como error.
 */

const URL_POR_DEFECTO = 'http://localhost:8080';
const variableUrl: unknown = import.meta.env.VITE_API_URL;
const URL_BASE = (
  typeof variableUrl === 'string' && variableUrl.trim() ? variableUrl.trim() : URL_POR_DEFECTO
).replace(/\/+$/, '');

export const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
const MENSAJE_GENERICO = 'No se pudo completar la solicitud. Inténtalo de nuevo.';

export type RespuestaHttp<T> =
  | { ok: true; status: number; data: T }
  | {
      ok: false;
      /** 0 cuando no hubo respuesta del servidor (sin conexión). */
      status: number;
      error: string;
      code?: string;
      /** Errores por campo (login con datos inválidos). */
      campos?: Record<string, string>;
    };

export type OpcionesHttp = {
  metodo: 'GET' | 'POST' | 'PUT';
  /** Ruta absoluta de la API, por ejemplo /api/v1/disponibilidad. */
  ruta: string;
  cuerpo?: unknown;
  /** Ruta de administración: lleva el access token y reintenta una vez tras renovarlo. */
  admin?: boolean;
  /** Rutas que usan la cookie de refresh: exigen la cabecera X-Requested-With. */
  csrf?: boolean;
  /** Deja terminar la petición aunque la página se cierre (cierre de sesión). */
  keepalive?: boolean;
};

/**
 * Sesión en memoria que registra el panel. Así shared no importa nada de admin: el cliente solo
 * pide el token vigente y, ante un 401, que se renueve.
 */
export type ProveedorSesion = {
  token: () => string | null;
  /** Renueva el access token (un solo refresh a la vez); false si no se pudo. */
  renovar: () => Promise<boolean>;
};

let proveedor: ProveedorSesion | null = null;
const oyentesSesion = new Set<() => void>();

export function registrarProveedorSesion(valor: ProveedorSesion) {
  proveedor = valor;
}

/** El panel avisa aquí cada vez que se abre, se renueva o se cierra la sesión. */
export function avisarCambioSesion() {
  oyentesSesion.forEach((oyente) => oyente());
}

export function alCambiarSesion(oyente: () => void) {
  oyentesSesion.add(oyente);
  return () => {
    oyentesSesion.delete(oyente);
  };
}

/** Hay una sesión de administrador con access token en memoria. */
export function haySesion() {
  return Boolean(proveedor?.token());
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

/** Lee un ProblemDetail: `detail` es el mensaje para la persona; `campos` solo viene en el login. */
function leerProblema(cuerpo: unknown) {
  if (!esObjeto(cuerpo)) return { error: MENSAJE_GENERICO };
  const detail = typeof cuerpo.detail === 'string' && cuerpo.detail ? cuerpo.detail : null;
  const code = typeof cuerpo.code === 'string' ? cuerpo.code : undefined;
  let campos: Record<string, string> | undefined;
  if (esObjeto(cuerpo.campos)) {
    campos = {};
    for (const [clave, valor] of Object.entries(cuerpo.campos)) {
      if (typeof valor === 'string') campos[clave] = valor;
    }
  }
  return { error: detail ?? MENSAJE_GENERICO, code, campos };
}

async function enviar<T>(opciones: OpcionesHttp, token: string | null): Promise<RespuestaHttp<T>> {
  const cabeceras: Record<string, string> = { Accept: 'application/json' };
  if (opciones.cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  if (opciones.admin && token) cabeceras.Authorization = 'Bearer ' + token;
  if (opciones.csrf) cabeceras['X-Requested-With'] = 'XMLHttpRequest';

  let respuesta: Response;
  try {
    respuesta = await fetch(URL_BASE + opciones.ruta, {
      method: opciones.metodo,
      headers: cabeceras,
      credentials: 'include',
      cache: 'no-store',
      keepalive: opciones.keepalive,
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
    });
  } catch {
    return { ok: false, status: 0, error: MENSAJE_SIN_CONEXION };
  }

  let cuerpo: unknown = null;
  try {
    const texto = await respuesta.text();
    cuerpo = texto ? JSON.parse(texto) : null;
  } catch {
    // Cuerpo vacío o que no es JSON: se trata como sin detalle.
  }

  if (respuesta.ok) return { ok: true, status: respuesta.status, data: cuerpo as T };
  return { ok: false, status: respuesta.status, ...leerProblema(cuerpo) };
}

/**
 * Hace la petición. En rutas de administración, un 401 provoca UN reintento tras renovar el
 * access token; si la renovación falla, el proveedor ya cerró la sesión local.
 */
export async function solicitar<T>(opciones: OpcionesHttp): Promise<RespuestaHttp<T>> {
  const usado = opciones.admin ? (proveedor?.token() ?? null) : null;
  const respuesta = await enviar<T>(opciones, usado);
  if (respuesta.ok || respuesta.status !== 401 || !opciones.admin || !proveedor) return respuesta;

  // Si otra petición ya renovó el token mientras tanto, basta con reintentar con el nuevo.
  const actual = proveedor.token();
  if (actual && actual !== usado) return enviar<T>(opciones, actual);
  if (!(await proveedor.renovar())) return respuesta;
  return enviar<T>(opciones, proveedor.token());
}
