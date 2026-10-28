import type { Result } from '../../../shared/reservas';
import {
  avisarCambioSesion,
  registrarProveedorSesion,
  solicitar,
} from '../../../shared/reservas/servicios/http';
import {
  nombreDesdeCorreo,
  validarCredenciales,
  type Credenciales,
  type ErroresAcceso,
} from '../utils/auth/validaciones';

/**
 * Acceso al panel contra la API. El access token vive solo en memoria; el refresh token va en
 * una cookie HttpOnly que el navegador envía a /auth. Al cargar la página la sesión se restaura
 * con POST /auth/refresh. `expiraEn` es el vencimiento de la sesión (el del refresh); el del
 * access token es interno y se renueva solo antes de vencer.
 */
export type Sesion = {
  token: string;
  correo: string;
  nombre: string;
  iniciadaEn: number;
  expiraEn: number;
  recordada: boolean;
};

export type ResultadoAcceso = Result<Sesion> & { campos?: ErroresAcceso };

const RUTA_LOGIN = '/api/v1/auth/login';
const RUTA_REFRESH = '/api/v1/auth/refresh';
const RUTA_LOGOUT = '/api/v1/auth/logout';
// El access dura 15 min: se renueva al llegar al 80 % de su vida.
const FRACCION_RENOVACION = 0.8;
const ESPERA_MINIMA_MS = 5 * 1000;
const REINTENTO_MS = 30 * 1000;
const NOMBRE_LOCK = 'perija.admin.refresh';
const CANAL = 'perija.admin.sesion';

const listeners = new Set<() => void>();
let sesion: Sesion | null = null;
let accesoExpiraEn = 0;
let restaurando = typeof window !== 'undefined';
let temporizador: number | undefined;
let enVuelo: Promise<boolean> | null = null;

const canal = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CANAL);

function notificar() {
  listeners.forEach((listener) => listener());
  avisarCambioSesion();
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

/** Convierte la SesionResponse del servidor; null si le falta algo. */
function leerRespuesta(valor: unknown): { sesion: Sesion; accesoExpiraEn: number } | null {
  if (!esObjeto(valor)) return null;
  const { token, correo, nombre, iniciadaEn, expiraEn, sesionExpiraEn, recordada } = valor;
  if (
    typeof token !== 'string' ||
    typeof correo !== 'string' ||
    typeof iniciadaEn !== 'number' ||
    typeof expiraEn !== 'number' ||
    typeof sesionExpiraEn !== 'number' ||
    typeof recordada !== 'boolean'
  ) {
    return null;
  }
  return {
    sesion: {
      token,
      correo,
      nombre: typeof nombre === 'string' && nombre ? nombre : nombreDesdeCorreo(correo) || correo,
      iniciadaEn,
      expiraEn: sesionExpiraEn,
      recordada,
    },
    accesoExpiraEn: expiraEn,
  };
}

function programarRenovacion(espera: number) {
  window.clearTimeout(temporizador);
  temporizador = window.setTimeout(() => {
    void renovar().then((renovada) => {
      // Sin conexión no se cierra la sesión: se vuelve a intentar.
      if (!renovada && sesion) programarRenovacion(REINTENTO_MS);
    });
  }, espera);
}

function fijar(datos: { sesion: Sesion; accesoExpiraEn: number }) {
  sesion = datos.sesion;
  accesoExpiraEn = datos.accesoExpiraEn;
  programarRenovacion(
    Math.max(ESPERA_MINIMA_MS, (accesoExpiraEn - Date.now()) * FRACCION_RENOVACION),
  );
  notificar();
}

/** Borra la sesión de la memoria de esta pestaña. */
function limpiar() {
  window.clearTimeout(temporizador);
  const habia = sesion !== null;
  sesion = null;
  accesoExpiraEn = 0;
  if (habia || restaurando) notificar();
}

async function pedirRefresh(): Promise<boolean> {
  const respuesta = await solicitar<unknown>({ metodo: 'POST', ruta: RUTA_REFRESH, csrf: true });
  if (respuesta.ok) {
    const datos = leerRespuesta(respuesta.data);
    if (datos) {
      fijar(datos);
      return true;
    }
    limpiar();
    return false;
  }
  // Solo si el servidor rechaza la sesión se cierra; un corte de red no debe sacar a nadie.
  if (respuesta.status === 401 || respuesta.status === 403) limpiar();
  return false;
}

/**
 * Renueva el access token. Un solo refresh en vuelo por pestaña y, entre pestañas, uno a la vez
 * (el refresh token rota y reutilizarlo revocaría la sesión).
 */
function renovar(): Promise<boolean> {
  if (!enVuelo) {
    const tarea =
      typeof navigator !== 'undefined' && navigator.locks
        ? navigator.locks.request(NOMBRE_LOCK, pedirRefresh)
        : pedirRefresh();
    enVuelo = tarea.finally(() => {
      enVuelo = null;
    });
  }
  return enVuelo;
}

registrarProveedorSesion({ token: () => sesion?.token ?? null, renovar });

if (typeof window !== 'undefined') {
  // Al cargar la página se intenta restaurar la sesión con la cookie de refresh.
  void renovar().finally(() => {
    restaurando = false;
    notificar();
  });
  // Cerrar la sesión en una pestaña la cierra en las demás.
  if (canal) canal.onmessage = () => limpiar();
}

export const autenticacion = {
  /** Sesión vigente, o null si no hay o ya venció. */
  leerSesion(): Sesion | null {
    return sesion && sesion.expiraEn > Date.now() ? sesion : null;
  },

  /** true mientras se intenta restaurar la sesión al cargar la página. */
  estaRestaurando(): boolean {
    return restaurando;
  },

  async iniciarSesion(credenciales: Credenciales, recordar: boolean): Promise<ResultadoAcceso> {
    const campos = validarCredenciales(credenciales);
    if (Object.keys(campos).length) {
      return { ok: false, error: 'Revisa los datos marcados.', campos };
    }

    const respuesta = await solicitar<unknown>({
      metodo: 'POST',
      ruta: RUTA_LOGIN,
      cuerpo: {
        correo: credenciales.correo.trim().toLowerCase(),
        clave: credenciales.clave,
        recordar,
      },
    });
    if (!respuesta.ok) {
      const errores: ErroresAcceso = {};
      if (respuesta.campos?.correo) errores.correo = respuesta.campos.correo;
      if (respuesta.campos?.clave) errores.clave = respuesta.campos.clave;
      return { ok: false, error: respuesta.error, campos: errores };
    }

    const datos = leerRespuesta(respuesta.data);
    if (!datos) return { ok: false, error: 'No se pudo iniciar la sesión. Inténtalo de nuevo.' };
    fijar(datos);
    return { ok: true, data: datos.sesion };
  },

  /** Cierra la sesión aquí al instante y avisa al servidor; si la llamada falla, igual queda cerrada. */
  cerrarSesion() {
    limpiar();
    canal?.postMessage('cerrada');
    void solicitar<null>({ metodo: 'POST', ruta: RUTA_LOGOUT, csrf: true, keepalive: true });
  },

  /** Avisa cuando la sesión cambia en esta pestaña o en otra (por ejemplo, al cerrarla). */
  suscribir(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Revisa si la sesión venció o si el access token está por vencer, y avisa del cambio. */
  revisar() {
    if (sesion && accesoExpiraEn - Date.now() < ESPERA_MINIMA_MS * 2) void renovar();
    notificar();
  },
};
