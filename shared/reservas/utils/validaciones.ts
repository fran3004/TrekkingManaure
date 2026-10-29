import { formatDate } from '../../utils/format';
import {
  EDAD_MAXIMA,
  EPS_OTRA,
  dominiosCorreoErrados,
  eps,
  estadias,
  extras,
  generos,
  limites,
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
import { getAvailability } from './cupos';
import { countParamoPeople, getStatus } from './estado';
import { firstPaymentDay, getAge, isIsoDate, isMinor } from './fechas';
import { countHotelNights, hotelWindow } from './hotel';
import { phoneKey, validatePhone } from './telefono';

// Reglas de negocio de la reserva. El formulario ayuda con validaciones HTML; estas son las que
// deciden y el backend debe repetirlas. Cada función devuelve el primer error o null.

// Los textos llegan ya normalizados (normalizacion.ts): nombres en MAYÚSCULAS y sin tildes, y lugares
// sin tildes. La Ñ es una letra aparte y se conserva.
/** Palabras de letras separadas por un espacio, guion o apóstrofe: MARIA JOSE, D'ANGELO. */
const NOMBRE = /^[A-ZÑ]+(?:[ '-][A-ZÑ]+)*$/;
/** Una palabra de un lugar: admite abreviaturas con punto (Sta., D.C.). */
const PALABRA_LUGAR = '[A-Za-zÑñ]+(?:\\.[A-Za-zÑñ]+)*\\.?';
/** Como el nombre, pero con las mayúsculas escritas y abreviaturas con punto: Sta. Marta, Bogota D.C. */
const LUGAR = new RegExp('^' + PALABRA_LUGAR + "(?:[ '-]{1,2}" + PALABRA_LUGAR + ')*$');
/** Nombre de la EPS «Otra»: solo letras y espacios simples. */
const EPS_OTRA_TEXTO = /^[A-Za-zÑñ]+(?: [A-Za-zÑñ]+)*$/;
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

/**
 * Nombre comparable: en minúsculas y con espacios simples. Se compara el nombre ya normalizado, así
 * que la Ñ se respeta: PEÑA no es lo mismo que PENA.
 */
function comparableName(value: string) {
  return value.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
}

function fullNameKey(person: Pick<Person, 'firstName' | 'lastName'>) {
  return comparableName(person.firstName + ' ' + person.lastName);
}

function validName(value: string, min: number, max: number) {
  return value.length >= min && value.length <= max && NOMBRE.test(value);
}

// Validadores de un solo campo: los usa validatePerson y el formulario (aviso al salir del campo),
// así el mensaje es el mismo en los dos sitios y el mismo que da el backend. `de` es
// «del participante» o «del acompañante».

/** Nombres o apellidos, ya normalizados. */
export function validateNameField(value: string, de: string): string | null {
  const { min, max } = limites.nombre;
  return validName(value, min, max)
    ? null
    : 'Escribe nombres y apellidos ' +
        de +
        ' solo con letras (' +
        min +
        ' a ' +
        max +
        ' caracteres).';
}

/** Ciudad, ya normalizada. */
export function validateCityField(value: string, de: string): string | null {
  const { min, max } = limites.ciudad;
  return value.length >= min && value.length <= max && LUGAR.test(value)
    ? null
    : 'Escribe la ciudad ' + de + ' solo con letras.';
}

/** Nombre de la EPS «Otra», ya normalizado. */
export function validateEpsOtherField(value: string, de: string): string | null {
  const { min, max } = limites.epsOtra;
  return value.length >= min && value.length <= max && EPS_OTRA_TEXTO.test(value)
    ? null
    : 'Escribe el nombre de la EPS ' + de + '.';
}

/** Nombre y apellido del contacto de emergencia, ya normalizado. */
export function validateContactNameField(value: string, de: string): string | null {
  const { min, max } = limites.contacto;
  return validName(value, min, max) && value.split(' ').length >= 2
    ? null
    : 'Escribe nombre y apellido del contacto de emergencia ' + de + '.';
}

/** Formato del número de documento según su tipo (sin mirar la edad), ya normalizado. */
export function validateDocumentFormat(
  type: DocumentType,
  value: string,
  de: string,
): string | null {
  const rule = reglasDocumento[type];
  return new RegExp('^(?:' + rule.patron + ')$').test(value)
    ? null
    : 'El documento ' + de + ' no es válido: ' + rule.ayuda.toLowerCase() + '.';
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
  if (email.length > limites.correo.max || email.includes('..') || !CORREO.test(email)) {
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
  const formatError = validateDocumentFormat(person.documentType, person.document, quien.de);
  if (formatError) return formatError;

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
  const nameError =
    validateNameField(person.firstName, quien.de) ?? validateNameField(person.lastName, quien.de);
  if (nameError) return nameError;
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
  const cityError = validateCityField(person.city, quien.de);
  if (cityError) return cityError;

  if (!includes(eps, person.eps.entity)) return 'Elige la EPS ' + quien.de + '.';
  if (person.eps.entity === EPS_OTRA) {
    const otherError = validateEpsOtherField(person.eps.other ?? '', quien.de);
    if (otherError) return otherError;
  } else if (person.eps.other !== null) {
    return 'Revisa la EPS ' + quien.de + '.';
  }

  const contact = person.emergencyContact;
  const contactNameError = validateContactNameField(contact.name, quien.de);
  if (contactNameError) return contactNameError;
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

function validatePreEventHotel(
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
function validateCierre(today: string, fechaCierre: string): string | null {
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
