import {
  countHotelNights,
  countHotelPeople,
  epsLabel,
  etiquetasExtra,
  etiquetasPlan,
  formatPhone,
  getAge,
  isMinor,
  type Cotizacion,
  type NewRegistration,
  type Person,
  type Registration,
} from '../../../../shared/reservas';
import { formatDate, formatDateTime, formatMoney } from '../../../../shared/utils/format';
import type { FilaResumen, ResumenReservaTexto } from '../../types/reserva';
import { formatBirth } from './formulario';

const siNo = (value: boolean) => (value ? 'Sí' : 'No');

/**
 * Filas de una persona: las mismas para el titular y el acompañante. `responsable` cambia la
 * etiqueta del contacto cuando el titular es menor de edad.
 */
function filasPersona(
  person: Person,
  talla: string | null,
  today: string,
  responsable = false,
): FilaResumen[] {
  const contact = person.emergencyContact;
  return [
    { label: 'Nombre', value: person.firstName + ' ' + person.lastName },
    { label: 'Documento', value: person.documentType + ' ' + person.document },
    {
      label: 'Nacimiento',
      value: formatBirth(person.birthDate) + ' · ' + getAge(person.birthDate, today) + ' años',
    },
    { label: 'Género', value: person.gender },
    ...(talla ? [{ label: 'Talla de camisa', value: talla }] : []),
    { label: 'Celular / WhatsApp', value: formatPhone(person.phone) },
    { label: 'Correo', value: person.email },
    { label: 'Ciudad', value: person.city },
    { label: 'EPS', value: epsLabel(person.eps) },
    {
      label: responsable ? 'Responsable legal' : 'Contacto de emergencia',
      value: contact.name + ' · ' + contact.relationship + ' · ' + formatPhone(contact.phone),
    },
    { label: 'Enfermedad', value: person.health.illness ?? 'No' },
    { label: 'Alergias', value: person.health.allergies ?? 'No' },
    { label: 'Discapacidad', value: person.health.disability ?? 'No' },
    { label: 'Practica deporte', value: siNo(person.health.exercises) },
    { label: 'Respeta las áreas protegidas', value: siNo(person.commitments.protectedAreas) },
    { label: 'Cuida el medio ambiente', value: siNo(person.commitments.environment) },
    {
      label: 'Términos y condiciones',
      value: person.consent.acceptedAt
        ? 'Aceptados el ' + formatDateTime(person.consent.acceptedAt)
        : 'Sin aceptar',
    },
    { label: 'Uso de imagen', value: person.consent.imageUse ? 'Autorizado' : 'No autorizado' },
  ];
}

function textoHotel(reserva: NewRegistration) {
  const hotel = reserva.preEventHotel;
  if (!hotel) return 'No';
  const nights = countHotelNights(hotel);
  const people = countHotelPeople(hotel, reserva.companion !== null);
  return (
    'Llega el ' +
    formatDate(hotel.checkIn) +
    ', sale el ' +
    formatDate(hotel.checkOut) +
    ' · ' +
    nights +
    (nights === 1 ? ' noche' : ' noches') +
    ' × ' +
    people +
    (people === 1 ? ' persona' : ' personas')
  );
}

/**
 * Resumen de una reserva a partir de lo que se guarda. Antes de confirmar recibe la reserva
 * nueva; después, la registrada, con su código y la hora de aceptación de los términos.
 */
export function describirReserva(
  reserva: NewRegistration | Registration,
  quote: Cotizacion,
  today: string,
): ResumenReservaTexto {
  const menor = isMinor(reserva.birthDate, today);
  const { companion } = reserva;

  return {
    codigo: 'id' in reserva ? reserva.id : null,
    participante: filasPersona(reserva, reserva.shirtSize, today, menor),
    reserva: [
      { label: 'Estadía', value: reserva.stay },
      { label: 'Modalidad', value: etiquetasPlan[reserva.plan] },
      ...(reserva.commitmentDate
        ? [{ label: 'Pago del restante', value: formatDate(reserva.commitmentDate) }]
        : []),
      {
        label: 'Actividades extra',
        value: reserva.extras.length
          ? reserva.extras.map((extra) => etiquetasExtra[extra]).join(', ')
          : 'Ninguna',
      },
      { label: 'Hotel antes del evento', value: textoHotel(reserva) },
    ],
    acompanante: companion
      ? [
          ...filasPersona(companion, companion.shirtSize, today),
          { label: 'Estadía', value: companion.stay },
          { label: 'Kit', value: siNo(companion.kit) },
        ]
      : null,
    pagos: [
      { label: 'A pagar ahora', value: formatMoney(quote.ahora) },
      { label: 'Saldo pendiente', value: formatMoney(quote.saldo) },
      { label: 'Total', value: formatMoney(quote.total) },
    ],
    ahora: formatMoney(quote.ahora),
    menor,
    versionTerminos: reserva.consent.version,
  };
}
