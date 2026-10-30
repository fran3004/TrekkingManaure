import { cupos, evento } from '../../config';
import type { CuposServidor, Registration, ReservasState } from '../tipos';
import { alCambiarSesion, haySesion, solicitar } from './http';

/**
 * Dónde viven las reservas: la API. Con sesión de administrador se pide la lista completa
 * (GET /admin/reservas); en el sitio público solo la disponibilidad (GET /disponibilidad). El
 * estado se vuelve a pedir al montar, al volver a la pestaña, cada 5 s y tras cada escritura.
 */
export type RepositorioReservas = {
  /** Instantánea actual; devuelve el mismo objeto mientras nada cambie. */
  read: () => ReservasState;
  /** Avisa de cambios; devuelve la función para dejar de oír. */
  subscribe: (listener: () => void) => () => void;
  /** Vuelve a pedir el estado a la API y avisa si cambió. Ante un error conserva el anterior. */
  refrescar: () => Promise<void>;
};

const REFRESCO_MS = 5 * 1000;

/** Estado mientras carga o si la API no responde: valores de la configuración local. */
function estadoInicial(): ReservasState {
  return {
    registrations: [],
    capacity: cupos.iniciales,
    occupied: 0,
    paramo: { capacity: cupos.paramo, occupied: 0 },
    fechaCierre: evento.fechaLimitePago,
  };
}

type RespuestaPublica = {
  capacity: number;
  occupied: number;
  paramo: CuposServidor;
  fechaCierre: string;
};
type RespuestaAdmin = RespuestaPublica & { registrations: Registration[] };

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function esCupos(valor: unknown): valor is CuposServidor {
  return (
    esObjeto(valor) && typeof valor.capacity === 'number' && typeof valor.occupied === 'number'
  );
}

function esRespuestaPublica(valor: unknown): valor is RespuestaPublica {
  return (
    esObjeto(valor) &&
    typeof valor.capacity === 'number' &&
    typeof valor.occupied === 'number' &&
    esCupos(valor.paramo) &&
    typeof valor.fechaCierre === 'string'
  );
}

function esRespuestaAdmin(valor: unknown): valor is RespuestaAdmin {
  return (
    esRespuestaPublica(valor) && Array.isArray((valor as { registrations?: unknown }).registrations)
  );
}

function crearRepositorio(): RepositorioReservas {
  const listeners = new Set<() => void>();
  let actual = estadoInicial();
  let firma = JSON.stringify(actual);
  // Cada petición lleva un número: solo la última puede cambiar el estado.
  let ultima = 0;
  let modoAdmin = false;
  let temporizador: number | undefined;
  let dejarDeOirSesion: (() => void) | undefined;

  function notificar() {
    listeners.forEach((listener) => listener());
  }

  function aplicar(siguiente: ReservasState) {
    const nuevaFirma = JSON.stringify(siguiente);
    if (nuevaFirma === firma) return;
    firma = nuevaFirma;
    actual = siguiente;
    notificar();
  }

  async function refrescar() {
    const numero = ++ultima;
    const admin = haySesion();
    const respuesta = admin
      ? await solicitar<unknown>({ metodo: 'GET', ruta: '/api/v1/admin/reservas', admin: true })
      : await solicitar<unknown>({ metodo: 'GET', ruta: '/api/v1/disponibilidad' });
    // Una petición más nueva, o un cambio de sesión, deja esta respuesta sin efecto.
    if (numero !== ultima || admin !== haySesion() || !respuesta.ok) return;

    if (admin && esRespuestaAdmin(respuesta.data)) {
      const { registrations, capacity, occupied, paramo, fechaCierre } = respuesta.data;
      aplicar({ registrations, capacity, occupied, paramo, fechaCierre });
    } else if (!admin && esRespuestaPublica(respuesta.data)) {
      const { capacity, occupied, paramo, fechaCierre } = respuesta.data;
      aplicar({ registrations: [], capacity, occupied, paramo, fechaCierre });
    }
  }

  function refrescarSiVisible() {
    if (!document.hidden) void refrescar();
  }

  /** Al abrir o cerrar la sesión cambia la fuente: se descarta la lista anterior y se vuelve a pedir. */
  function alCambiarModo() {
    if (haySesion() === modoAdmin) return;
    modoAdmin = haySesion();
    aplicar({ ...actual, registrations: [] });
    void refrescar();
  }

  return {
    read: () => actual,
    refrescar,
    subscribe(listener) {
      if (!listeners.size) {
        modoAdmin = haySesion();
        window.addEventListener('focus', refrescarSiVisible);
        document.addEventListener('visibilitychange', refrescarSiVisible);
        temporizador = window.setInterval(refrescarSiVisible, REFRESCO_MS);
        dejarDeOirSesion = alCambiarSesion(alCambiarModo);
        void refrescar();
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size) return;
        window.removeEventListener('focus', refrescarSiVisible);
        document.removeEventListener('visibilitychange', refrescarSiVisible);
        window.clearInterval(temporizador);
        dejarDeOirSesion?.();
      };
    },
  };
}

export const repositorio = crearRepositorio();
