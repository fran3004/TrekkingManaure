import {
  EPS_OTRA,
  normalizarCorreo,
  normalizarDocumento,
  normalizarLugar,
  normalizarNombre,
  normalizeNumber,
  versionTerminos,
  type Companion,
  type CountryCode,
  type DocumentType,
  type EpsEntity,
  type Extra,
  type Gender,
  type Health,
  type NewRegistration,
  type PaymentPlan,
  type Person,
  type Phone,
  type PreEventHotel,
  type Relationship,
  type ShirtSize,
  type Stay,
} from '../../../../shared/reservas';
import type { HotelFormulario } from '../../types/reserva';
import { fieldName } from './formulario';

type Seleccion = {
  stay: Stay;
  plan: PaymentPlan;
  planDate: string;
  companion: boolean;
  companionKit: boolean | null;
  extras: Extra[];
  hotel: HotelFormulario;
};

type Lector = (base: string) => string;

// Los valores de los desplegables salen de los catálogos compartidos; si llega algo distinto,
// la validación de shared/reservas lo rechaza antes de guardar. El lector devuelve el texto tal como
// está en el formulario (sin espacios en los extremos); cada campo de texto aplica después su
// normalización compartida (shared/reservas/utils/normalizacion.ts), la misma que hace el backend.
function reader(data: FormData, prefix: string): Lector {
  return (base: string) => String(data.get(fieldName(prefix, base)) || '').trim();
}

/** Respuesta Sí/No con detalle: el detalle se guarda solo si respondió Sí. */
function detail(read: Lector, base: string) {
  return read(base) === 'Sí' ? read(base + 'Cual') : null;
}

function readHealth(read: Lector): Health {
  return {
    illness: detail(read, 'enfermedad'),
    allergies: detail(read, 'alergia'),
    disability: detail(read, 'discapacidad'),
    exercises: read('deporte') === 'Sí',
  };
}

function readPhone(read: Lector, base: string): Phone {
  const country = read(base + 'Pais') as CountryCode;
  return { country, number: normalizeNumber(country, read(base)) };
}

function readPerson(data: FormData, prefix: string, stay: Stay): Person {
  const read = reader(data, prefix);
  const entity = read('eps') as EpsEntity;
  return {
    firstName: normalizarNombre(read('nombres')),
    lastName: normalizarNombre(read('apellidos')),
    documentType: read('tipoDocumento') as DocumentType,
    document: normalizarDocumento(read('documento')),
    birthDate: read('nacimiento'),
    gender: read('genero') as Gender,
    phone: readPhone(read, 'telefono'),
    email: normalizarCorreo(read('correo')),
    city: normalizarLugar(read('ciudad')),
    eps: { entity, other: entity === EPS_OTRA ? normalizarLugar(read('epsOtra')) : null },
    emergencyContact: {
      name: normalizarNombre(read('emergenciaNombre')),
      phone: readPhone(read, 'emergenciaTelefono'),
      relationship: read('emergenciaParentesco') as Relationship,
    },
    health: readHealth(read),
    commitments: {
      protectedAreas: read('areasProtegidas') === 'Sí',
      environment: read('medioAmbiente') === 'Sí',
    },
    // Sin la casilla marcada no hay fecha de aceptación y la validación lo rechaza. La fecha
    // definitiva la pone el sistema al registrar la reserva.
    consent: {
      version: versionTerminos,
      acceptedAt: read('terminos') === 'on' ? new Date().toISOString() : '',
      imageUse: read('imagen') === 'on',
    },
    stay,
  };
}

function readHotel(hotel: HotelFormulario, companion: boolean): PreEventHotel | null {
  return hotel.activo
    ? {
        checkIn: hotel.checkIn,
        checkOut: hotel.checkOut,
        withCompanion: companion && hotel.conAcompanante,
      }
    : null;
}

/** Convierte el formulario en la reserva que recibe reservasApi.crearReserva. */
export function buildNewRegistration(data: FormData, seleccion: Seleccion): NewRegistration {
  const read = reader(data, '');
  const companionRead = reader(data, 'acomp');
  const companion: Companion | null = seleccion.companion
    ? {
        ...readPerson(data, 'acomp', companionRead('estadia') as Stay),
        kit: seleccion.companionKit === true,
        shirtSize: seleccion.companionKit ? (companionRead('talla') as ShirtSize) : null,
      }
    : null;

  return {
    ...readPerson(data, '', seleccion.stay),
    shirtSize: read('talla') as ShirtSize,
    companion,
    extras: seleccion.extras,
    preEventHotel: readHotel(seleccion.hotel, seleccion.companion),
    plan: seleccion.plan,
    commitmentDate: seleccion.plan === 'apartado' ? seleccion.planDate : null,
  };
}
