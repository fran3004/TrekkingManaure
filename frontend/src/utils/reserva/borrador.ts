import { isIsoDate } from '../../../../shared/reservas';
import {
  BORRADOR_CLAVE,
  BORRADOR_VIGENCIA_MS,
  CAMPOS_SIN_GUARDAR,
} from '../../data/reserva/borrador';
import { OPCIONES_ESTADIA, OPCIONES_EXTRA } from '../../data/reserva/opciones';
import type { BorradorReserva, EstadoBorrador } from '../../types/reserva';

export const ESTADO_VACIO: EstadoBorrador = {
  stay: '',
  plan: null,
  planDate: '',
  companion: false,
  companionKit: null,
  extras: [],
  hotel: { activo: false, checkIn: '', checkOut: '', conAcompanante: true },
};

// Todo el acceso al almacenamiento va con try/catch: en navegación privada o con el
// almacenamiento bloqueado lanza, y el formulario debe seguir funcionando sin borrador.

/** Valor de cada campo con name del formulario; no guarda términos ni campos sin valor. */
export function capturarCampos(form: HTMLFormElement): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const elemento of Array.from(form.elements)) {
    if (!(
      elemento instanceof HTMLInputElement ||
      elemento instanceof HTMLSelectElement ||
      elemento instanceof HTMLTextAreaElement
    )) {
      continue;
    }
    const { name } = elemento;
    if (!name || CAMPOS_SIN_GUARDAR.includes(name)) continue;
    if (elemento instanceof HTMLInputElement) {
      if (elemento.type === 'checkbox') continue;
      if (elemento.type === 'radio' && !elemento.checked) continue;
    }
    if (elemento.value) campos[name] = elemento.value;
  }
  return campos;
}

export function borradorVacio({ campos, estado }: Pick<BorradorReserva, 'campos' | 'estado'>) {
  return (
    // El país del teléfono siempre trae un valor por defecto: solo no cuenta como lo escrito.
    Object.keys(campos).every((nombre) => nombre.endsWith('Pais')) &&
    !estado.stay &&
    !estado.plan &&
    !estado.planDate &&
    !estado.companion &&
    estado.companionKit === null &&
    estado.extras.length === 0 &&
    !estado.hotel.activo
  );
}

export function guardarBorrador(borrador: BorradorReserva) {
  try {
    window.localStorage.setItem(BORRADOR_CLAVE, JSON.stringify(borrador));
  } catch {
    // Sin almacenamiento no hay borrador; el formulario sigue igual.
  }
}

export function borrarBorrador() {
  try {
    window.localStorage.removeItem(BORRADOR_CLAVE);
  } catch {
    // Nada que borrar si el almacenamiento no está disponible.
  }
}

const texto = (valor: unknown) => (typeof valor === 'string' ? valor : '');
const fecha = (valor: unknown) => (isIsoDate(texto(valor)) ? texto(valor) : '');

/** Lo guardado puede estar viejo o alterado: solo pasa lo que sigue siendo una opción válida. */
function sanear(crudo: unknown): BorradorReserva | null {
  if (typeof crudo !== 'object' || crudo === null) return null;
  const { guardadoEn, campos, estado } = crudo as Record<string, unknown>;
  if (typeof guardadoEn !== 'number' || typeof campos !== 'object' || !campos) return null;
  if (typeof estado !== 'object' || !estado) return null;

  const origen = estado as Record<string, unknown>;
  const hotel = (typeof origen.hotel === 'object' && origen.hotel) || {};
  const hotelOrigen = hotel as Record<string, unknown>;
  const stays: readonly string[] = OPCIONES_ESTADIA.map((opcion) => opcion.value);
  const extrasValidos: readonly string[] = OPCIONES_EXTRA.map((opcion) => opcion.id);

  const limpio: BorradorReserva = {
    guardadoEn,
    campos: Object.fromEntries(
      Object.entries(campos).filter((entrada): entrada is [string, string] => {
        return typeof entrada[1] === 'string' && !CAMPOS_SIN_GUARDAR.includes(entrada[0]);
      }),
    ),
    estado: {
      stay: stays.includes(texto(origen.stay))
        ? (texto(origen.stay) as EstadoBorrador['stay'])
        : '',
      plan: origen.plan === 'total' || origen.plan === 'apartado' ? origen.plan : null,
      planDate: fecha(origen.planDate),
      companion: origen.companion === true,
      companionKit: typeof origen.companionKit === 'boolean' ? origen.companionKit : null,
      extras: (Array.isArray(origen.extras) ? origen.extras : []).filter(
        (extra): extra is EstadoBorrador['extras'][number] =>
          typeof extra === 'string' && extrasValidos.includes(extra),
      ),
      hotel: {
        activo: hotelOrigen.activo === true,
        checkIn: fecha(hotelOrigen.checkIn),
        checkOut: fecha(hotelOrigen.checkOut),
        conAcompanante: hotelOrigen.conAcompanante !== false,
      },
    },
  };
  return borradorVacio(limpio) ? null : limpio;
}

/** El borrador guardado si existe, no caducó y es legible; si no, null (y lo borra). */
export function leerBorrador(ahora = Date.now()): BorradorReserva | null {
  try {
    const guardado = window.localStorage.getItem(BORRADOR_CLAVE);
    if (!guardado) return null;
    const borrador = sanear(JSON.parse(guardado));
    if (borrador && ahora - borrador.guardadoEn <= BORRADOR_VIGENCIA_MS) return borrador;
    window.localStorage.removeItem(BORRADOR_CLAVE);
  } catch {
    // Almacenamiento bloqueado o JSON dañado: se trabaja sin borrador.
  }
  return null;
}
