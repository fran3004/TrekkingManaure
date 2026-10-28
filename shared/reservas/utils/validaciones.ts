import { evento } from '../../config';
import { formatDate } from '../../utils/format';
import {
  EDAD_MAXIMA,
  EPS_OTRA,
  dominiosCorreoErrados,
  eps,
  estadias,
  extras,
  generos,
  parentescos,
  parentescosResponsable,
  planesPago,
  reglasDocumento,
  tallas,
  tiposDocumento,
  versionTerminos,
} from '../data/catalogos';
import type {
  Companion,
  DocumentType,
  NewRegistration,
  Person,
  PreEventHotel,
  Registration,
} from '../tipos';
import { getAvailability, capacityRange } from './cupos';
import { countParamoPeople, getBalance, getStatus, holdsSpot } from './estado';
import { firstPaymentDay, getAge, isIsoDate, isMinor } from './fechas';
import { countHotelNights, hotelWindow } from './hotel';
import { phoneKey, validatePhone } from './telefono';

// Reglas de negocio de la reserva. El formulario ayuda con validaciones HTML; estas son las que
// deciden y el backend debe repetirlas. Cada función devuelve el primer error o null.

const LETRAS = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ';
/** Palabras de letras separadas por un espacio, guion o apóstrofe: María José, D'Angelo. */
const NOMBRE = new RegExp('^[' + LETRAS + "]+(?:[ '\\-][" + LETRAS + ']+)*$');
/** Como el nombre, pero admite abreviaturas con punto: Sta. Marta. */
const LUGAR = new RegExp('^[' + LETRAS + "]+\\.?(?:[ '\\-]{1,2}[" + LETRAS + ']+\\.?)*$');
const CORREO =
  /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;

/** Cómo se nombra a cada persona en los mensajes. */
type Quien = { de: string; sujeto: string };
const TITULAR: Quien = { de: 'del participante', sujeto: 'El participante' };
const ACOMPANANTE: Quien = { de: 'del acompañante', sujeto: 'El acompañante' };

function includes<T extends string>(list: readonly T[], value: string): value is T {
  return (list as readonly string[]).includes(value);
}

function normalizeDocument(value: string) {
  return value.replace(/\s+/g, '').toUpperCase();
}

/** Nombre comparable: sin tildes, en minúsculas y con espacios simples. */
function comparableName(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function fullNameKey(person: Pick<Person, 'firstName' | 'lastName'>) {
  return comparableName(person.firstName + ' ' + person.lastName);
}

function validName(value: string, min = 2, max = 60) {
  return value.length >= min && value.length <= max && NOMBRE.test(value);
}

/** Detalle opcional (enfermedad, alergia, discapacidad): null, o de 2 a 200 caracteres. */
function validDetail(value: string | null) {
  return value === null || (value.trim() === value && value.length >= 2 && value.length <= 200);
}

export function documentRule(type: DocumentType) {
  return reglasDocumento[type];
}

export function validateEmail(email: string, quien: string): string | null {
  if (!email) return 'Escribe el correo electrónico ' + quien + '.';
  if (email.length > 254 || email.includes('..') || !CORREO.test(email)) {
    return 'Revisa el correo electrónico ' + quien + '.';
  }
  const domain = email.slice(email.indexOf('@') + 1);
  const suggestion = dominiosCorreoErrados[domain];
  return suggestion
    ? 'El correo ' + quien + ' parece mal escrito: ¿quisiste decir @' + suggestion + '?'
    : null;
}

function validateDocument(person: Person, quien: Quien, today: string): string | null {
  if (!includes(tiposDocumento, person.documentType)) {
    return 'Elige un tipo de documento válido ' + quien.de + '.';
  }
  const rule = documentRule(person.documentType);
  if (!new RegExp('^(?:' + rule.patron + ')$').test(person.document)) {
    return 'El documento ' + quien.de + ' no es válido: ' + rule.ayuda.toLowerCase() + '.';
  }

  const age = getAge(person.birthDate, today);
  if (rule.edadMin !== null && age < rule.edadMin) {
    return (
      'La ' +
      person.documentType +
      ' es para personas de ' +
      rule.edadMin +
      ' años o más: revisa el tipo de documento o la fecha de nacimiento ' +
      quien.de +
      '.'
    );
  }
  if (rule.edadMax !== null && age > rule.edadMax) {
    return (
      'El ' +
      person.documentType +
      ' es para personas de hasta ' +
      rule.edadMax +
      ' años: revisa el tipo de documento o la fecha de nacimiento ' +
      quien.de +
      '.'
    );
  }
  return null;
}

function validatePerson(person: Person, quien: Quien, today: string): string | null {
  if (!validName(person.firstName) || !validName(person.lastName)) {
    return 'Escribe nombres y apellidos ' + quien.de + ' solo con letras (2 a 60 caracteres).';
  }
  if (
    !isIsoDate(person.birthDate) ||
    person.birthDate > today ||
    getAge(person.birthDate, today) > EDAD_MAXIMA
  ) {
    return 'Revisa la fecha de nacimiento ' + quien.de + '.';
  }
  const documentError = validateDocument(person, quien, today);
  if (documentError) return documentError;
  if (!includes(generos, person.gender)) return 'Elige el género ' + quien.de + '.';

  const phoneError = validatePhone(person.phone, 'movil', quien.de);
  if (phoneError) return phoneError;
  const emailError = validateEmail(person.email, quien.de);
  if (emailError) return emailError;
  if (!LUGAR.test(person.city) || person.city.length < 3 || person.city.length > 60) {
    return 'Escribe la ciudad ' + quien.de + ' solo con letras.';
  }

  if (!includes(eps, person.eps.entity)) return 'Elige la EPS ' + quien.de + '.';
  if (person.eps.entity === EPS_OTRA) {
    const other = person.eps.other ?? '';
    if (other.length < 3 || other.length > 60 || !LUGAR.test(other)) {
      return 'Escribe el nombre de la EPS ' + quien.de + '.';
    }
  } else if (person.eps.other !== null) {
    return 'Revisa la EPS ' + quien.de + '.';
  }

  const contact = person.emergencyContact;
  if (!validName(contact.name, 5, 120) || contact.name.split(' ').length < 2) {
    return 'Escribe nombre y apellido del contacto de emergencia ' + quien.de + '.';
  }
  if (fullNameKey(person) === comparableName(contact.name)) {
    return 'El contacto de emergencia ' + quien.de + ' debe ser otra persona.';
  }
  const contactPhoneError = validatePhone(
    contact.phone,
    'cualquiera',
    'del contacto de emergencia ' + quien.de,
  );
  if (contactPhoneError) return contactPhoneError;
  if (phoneKey(contact.phone) === phoneKey(person.phone)) {
    return (
      'El teléfono del contacto de emergencia ' + quien.de + ' debe ser distinto al suyo propio.'
    );
  }
  if (!includes(parentescos, contact.relationship)) {
    return 'Elige el parentesco del contacto de emergencia ' + quien.de + '.';
  }

  const { health } = person;
  if (!validDetail(health.illness)) return 'Describe la enfermedad ' + quien.de + '.';
  if (!validDetail(health.allergies)) return 'Describe la alergia ' + quien.de + '.';
  if (!validDetail(health.disability)) return 'Describe la discapacidad ' + quien.de + '.';
  if (typeof health.exercises !== 'boolean') {
    return 'Indica si ' + quien.sujeto.toLowerCase() + ' practica deporte.';
  }

  if (person.commitments.protectedAreas !== true) {
    return (
      quien.sujeto +
      ' debe comprometerse a respetar las indicaciones y normas de las áreas protegidas.'
    );
  }
  if (person.commitments.environment !== true) {
    return quien.sujeto + ' debe comprometerse a contribuir con el cuidado del medio ambiente.';
  }

  if (!person.consent.acceptedAt || Number.isNaN(Date.parse(person.consent.acceptedAt))) {
    return 'Falta la aceptación de los términos y condiciones ' + quien.de + '.';
  }
  if (person.consent.version !== versionTerminos) {
    return 'Los términos cambiaron: vuelve a leerlos y acéptalos ' + quien.de + '.';
  }
  if (typeof person.consent.imageUse !== 'boolean') {
    return 'Revisa la autorización de uso de imagen ' + quien.de + '.';
  }

  if (!includes(estadias, person.stay)) return 'Elige la estadía ' + quien.de + '.';
  return null;
}

function validateCompanion(companion: Companion, today: string) {
  const error = validatePerson(companion, ACOMPANANTE, today);
  if (error) return error;
  if (companion.kit && !(companion.shirtSize && includes(tallas, companion.shirtSize))) {
    return 'Elige la talla de camisa del acompañante.';
  }
  if (!companion.kit && companion.shirtSize !== null) {
    return 'El acompañante sin kit no lleva talla de camisa.';
  }
  return null;
}

/** Datos que no pueden repetirse entre el titular y su acompañante. */
function validateDistinct(titular: Person, companion: Companion): string | null {
  if (normalizeDocument(companion.document) === normalizeDocument(titular.document)) {
    return 'El acompañante no puede tener el mismo documento que el participante.';
  }
  if (companion.email === titular.email) {
    return 'El acompañante debe tener un correo distinto al del participante.';
  }
  const titularPhone = phoneKey(titular.phone);
  const companionPhone = phoneKey(companion.phone);
  if (companionPhone === titularPhone) {
    return 'El acompañante debe tener un celular distinto al del participante.';
  }
  // El contacto de emergencia debe quedarse en casa: no puede ser alguien que va al evento.
  if (phoneKey(titular.emergencyContact.phone) === companionPhone) {
    return 'El contacto de emergencia del participante no puede ser el acompañante.';
  }
  if (phoneKey(companion.emergencyContact.phone) === titularPhone) {
    return 'El contacto de emergencia del acompañante no puede ser el participante.';
  }
  if (comparableName(titular.emergencyContact.name) === fullNameKey(companion)) {
    return 'El contacto de emergencia del participante no puede ser el acompañante.';
  }
  if (comparableName(companion.emergencyContact.name) === fullNameKey(titular)) {
    return 'El contacto de emergencia del acompañante no puede ser el participante.';
  }
  return null;
}

export function validatePreEventHotel(
  hotel: PreEventHotel,
  hasCompanion: boolean,
  today: string,
): string | null {
  const window = hotelWindow(today);
  if (!window.available) return 'Ya no se puede reservar hotel antes del evento.';
  if (!isIsoDate(hotel.checkIn) || !isIsoDate(hotel.checkOut)) {
    return 'Elige las fechas de llegada y salida del hotel.';
  }
  if (hotel.checkIn < window.firstCheckIn || hotel.checkIn > window.lastCheckIn) {
    return (
      'La llegada al hotel debe estar entre el ' +
      formatDate(window.firstCheckIn) +
      ' y el ' +
      formatDate(window.lastCheckIn) +
      '.'
    );
  }
  if (hotel.checkOut <= hotel.checkIn) return 'La salida del hotel debe ser después de la llegada.';
  if (hotel.checkOut > window.lastCheckOut) {
    return 'La salida del hotel no puede ser después del ' + formatDate(window.lastCheckOut) + '.';
  }
  if (countHotelNights(hotel) < 1) return 'El hotel previo debe tener al menos una noche.';
  if (hotel.withCompanion && !hasCompanion) {
    return 'Solo puedes sumar al acompañante al hotel si llevas acompañante.';
  }
  return null;
}

/** Documentos de las inscripciones activas (no rechazadas), titulares y acompañantes. */
function activeDocuments(registrations: Registration[], today: string) {
  return new Set(
    registrations
      .filter((registration) => getStatus(registration, today) !== 'Rechazado')
      .flatMap((registration) => [registration.document, registration.companion?.document])
      .filter((document): document is string => Boolean(document))
      .map(normalizeDocument),
  );
}

/** Las inscripciones y los pagos del restante se cierran después de la fecha de cierre. */
export function validateCierre(today: string, fechaCierre: string): string | null {
  return today > fechaCierre
    ? 'Las inscripciones cerraron el ' + formatDate(fechaCierre) + '.'
    : null;
}

/**
 * Cupos del páramo que necesita una reserva frente a los libres. Hotel en Manaure y regreso a
 * casa no gastan cupo, así que solo falla si alguien elige el páramo y no cabe.
 */
function validateParamo(people: number, available: number): string | null {
  if (people === 0 || available >= people) return null;
  return available === 0
    ? 'Los cupos del páramo están agotados: elige hotel en Manaure o regreso a casa.'
    : 'Solo queda ' +
        available +
        ' cupo en el páramo y tu reserva necesita ' +
        people +
        '. Elige otra estadía para alguno de los dos.';
}

export function validateNewRegistration(
  input: NewRegistration,
  registrations: Registration[],
  capacity: number,
  today: string,
  fechaCierre: string,
  occupied?: number,
): string | null {
  const closedError = validateCierre(today, fechaCierre);
  if (closedError) return closedError;
  const personError = validatePerson(input, TITULAR, today);
  if (personError) return personError;
  if (
    isMinor(input.birthDate, today) &&
    !includes(parentescosResponsable, input.emergencyContact.relationship)
  ) {
    return 'El participante es menor de edad: su contacto debe ser su madre, padre o tutor legal.';
  }
  if (!includes(tallas, input.shirtSize)) return 'Elige tu talla de camisa.';

  if (!input.extras.every((extra) => includes(extras, extra))) {
    return 'Hay una actividad extra que no existe.';
  }
  if (new Set(input.extras).size !== input.extras.length) {
    return 'Cada actividad extra se elige una sola vez.';
  }
  if (input.extras.includes('parapenteAcompanante') && !input.companion) {
    return 'El parapente del acompañante solo se elige si llevas acompañante.';
  }
  if (input.preEventHotel) {
    const hotelError = validatePreEventHotel(input.preEventHotel, input.companion !== null, today);
    if (hotelError) return hotelError;
  }

  if (input.companion) {
    const companionError = validateCompanion(input.companion, today);
    if (companionError) return companionError;
    const distinctError = validateDistinct(input, input.companion);
    if (distinctError) return distinctError;
  }

  if (!includes(planesPago, input.plan)) return 'Elige la forma de pago.';
  if (input.plan === 'apartado') {
    const first = firstPaymentDay(today);
    if (first > fechaCierre) {
      return 'Ya pasó la fecha límite para apartar; elige pagar el total.';
    }
    if (
      !input.commitmentDate ||
      input.commitmentDate < first ||
      input.commitmentDate > fechaCierre
    ) {
      return 'Elige la fecha en que pagarás el restante.';
    }
  } else if (input.commitmentDate !== null) {
    return 'El pago total no lleva fecha para el restante.';
  }

  const taken = activeDocuments(registrations, today);
  const repeated = [input.document, input.companion?.document].find(
    (document) => document && taken.has(normalizeDocument(document)),
  );
  if (repeated) return 'El documento ' + repeated + ' ya tiene una reserva registrada.';

  const { available } = getAvailability(registrations, capacity, occupied);
  return validateParamo(countParamoPeople(input), available);
}

/** El titular es menor y la organización aún no recibe la autorización de su responsable. */
export function needsGuardianAuthorization(registration: Registration, today: string) {
  return isMinor(registration.birthDate, today) && !registration.guardianAuthorized;
}

/**
 * Aprobar un pago exige la autorización del responsable si el titular es menor. Aprobar el
 * primer pago le asigna sus cupos del páramo: solo se permite si caben. Quien va a hotel o
 * regresa a casa no necesita cupo. Rechazar o devolver a revisión siempre se permite.
 */
export function validateApproval(
  registration: Registration,
  registrations: Registration[],
  capacity: number,
  today: string,
): string | null {
  if (needsGuardianAuthorization(registration, today)) {
    return 'El titular es menor de edad: falta la autorización firmada por su responsable.';
  }
  if (holdsSpot(registration)) return null;
  const others = registrations.filter((item) => item.id !== registration.id);
  const { available } = getAvailability(others, capacity);
  const people = countParamoPeople(registration);
  return available < people
    ? 'No hay cupos en el páramo para confirmar esta inscripción (' +
        people +
        ' en páramo, ' +
        available +
        ' libres). Cambia los cupos del páramo en Gestión de cupos.'
    : null;
}

export function validateRejection(reason: string | null) {
  return reason && reason.trim() ? null : 'Indica el motivo del rechazo.';
}

/** Pago que registra la organización: entero, positivo y sin superar el saldo. */
export function validateManualPayment(registration: Registration, amount: number) {
  const balance = getBalance(registration);
  if (!Number.isInteger(amount) || amount <= 0) return 'Escribe un monto válido.';
  if (amount > balance) return 'El monto supera el saldo pendiente.';
  return null;
}

export function validateCapacity(value: number, registrations: Registration[]) {
  const { occupied } = getAvailability(registrations, value);
  const { min } = capacityRange(occupied);
  if (!Number.isInteger(value)) return 'Los cupos del páramo deben ser un número entero.';
  if (value < min) {
    return occupied > 0
      ? 'Los cupos del páramo no pueden ser menos que los ' + occupied + ' ya ocupados.'
      : 'Debe haber al menos 1 cupo en el páramo.';
  }
  return null;
}

/**
 * Fecha de cierre que fija la organización: entre la apertura de inscripciones y la víspera del
 * evento. Puede quedar en el pasado para cerrar antes.
 */
export function validateFechaCierre(value: string): string | null {
  if (!isIsoDate(value)) return 'Elige una fecha de cierre válida.';
  if (value < evento.fechaAperturaInscripciones) {
    return 'La fecha de cierre no puede ser anterior a la apertura de inscripciones.';
  }
  if (value >= evento.fechas[0]) return 'La fecha de cierre debe ser antes del evento.';
  return null;
}
