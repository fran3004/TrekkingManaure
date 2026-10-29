import { precios } from '../../config';
import { EPS_OTRA, ESTADIA_CON_CUPO } from '../data/catalogos';
import type {
  Eps,
  Health,
  Payment,
  Person,
  Registration,
  RegistrationStatus,
  ShirtSize,
  Stay,
} from '../tipos';
import { getTotal } from './cotizacion';

export type Runner = {
  role: 'Titular' | 'Acompañante';
  name: string;
  document: string;
  city: string;
  stay: Stay;
  health: Health;
  kit: boolean;
  shirtSize: ShirtSize | null;
  /** Vuela en parapente: el titular con 'parapente' y el acompañante con 'parapenteAcompanante'. */
  paragliding: boolean;
  /** Todos los datos de la persona: contacto, EPS, emergencia, compromisos y consentimiento. */
  person: Person;
};

export type Summary = {
  registration: Registration;
  status: RegistrationStatus;
  total: number;
  paid: number;
  balance: number;
  pending: Payment[];
};

export const statusOrder: RegistrationStatus[] = [
  'Por verificar',
  'Saldo pendiente',
  'Vencido',
  'Pagado',
  'Rechazado',
];

export function fullName(person: Pick<Person, 'firstName' | 'lastName'>) {
  return person.firstName + ' ' + person.lastName;
}

export function documentLabel(person: Pick<Person, 'documentType' | 'document'>) {
  return person.documentType + ' ' + person.document;
}

/** Nombre de la EPS: la de la lista o la que escribió la persona en "Otra". */
export function epsLabel(eps: Eps) {
  return eps.entity === EPS_OTRA ? 'Otra: ' + (eps.other ?? '') : eps.entity;
}

/** Solo cuentan los pagos que la organización aprobó tras verificar que llegaron. */
function getPaid(registration: Registration) {
  return registration.payments
    .filter((payment) => payment.review === 'Aprobado')
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export function getBalance(registration: Registration) {
  return Math.max(0, getTotal(registration) - getPaid(registration));
}

function getPendingPayments(registration: Registration) {
  return registration.payments.filter((payment) => payment.review === 'Por revisar');
}

export function getStatus(registration: Registration, today: string): RegistrationStatus {
  const paid = getPaid(registration);

  if (paid > 0 && paid >= getTotal(registration)) return 'Pagado';
  if (paid > 0) {
    return registration.commitmentDate && registration.commitmentDate < today
      ? 'Vencido'
      : 'Saldo pendiente';
  }
  if (
    !registration.payments.length ||
    registration.payments.some((payment) => payment.review === 'Por revisar')
  ) {
    return 'Por verificar';
  }
  return 'Rechazado';
}

export function summarize(registration: Registration, today: string): Summary {
  return {
    registration,
    status: getStatus(registration, today),
    total: getTotal(registration),
    paid: getPaid(registration),
    balance: getBalance(registration),
    pending: getPendingPayments(registration),
  };
}

/** Una inscripción ocupa cupo desde que tiene al menos un pago aprobado. */
export function holdsSpot(registration: Registration) {
  return getPaid(registration) > 0;
}

/** Monto que debería llegar según el concepto del pago y lo ya aprobado. */
export function getExpectedAmount(registration: Registration, payment: Payment) {
  if (payment.concept === 'Separación de cupo') return precios.inscripcion;
  if (payment.concept === 'Pago total') return getTotal(registration);

  const paidBefore = registration.payments
    .filter((item) => item.id !== payment.id && item.review === 'Aprobado')
    .reduce((sum, item) => sum + item.amount, 0);
  return Math.max(0, getTotal(registration) - paidBefore);
}

export function withReview(
  registration: Registration,
  paymentId: string,
  review: Payment['review'],
): Registration {
  return {
    ...registration,
    payments: registration.payments.map((payment) =>
      payment.id === paymentId ? { ...payment, review } : payment,
    ),
  };
}

export function getRunners(registration: Registration): Runner[] {
  const runners: Runner[] = [
    {
      role: 'Titular',
      name: fullName(registration),
      document: documentLabel(registration),
      city: registration.city,
      stay: registration.stay,
      health: registration.health,
      kit: true,
      shirtSize: registration.shirtSize,
      paragliding: registration.extras.includes('parapente'),
      person: registration,
    },
  ];
  const { companion } = registration;

  if (companion) {
    runners.push({
      role: 'Acompañante',
      name: fullName(companion),
      document: documentLabel(companion),
      city: companion.city,
      stay: companion.stay,
      health: companion.health,
      kit: companion.kit,
      shirtSize: companion.shirtSize,
      paragliding: registration.extras.includes('parapenteAcompanante'),
      person: companion,
    });
  }

  return runners;
}

export function getHealthAlerts(health: Health) {
  const alerts: string[] = [];

  if (health.illness) alerts.push('Enfermedad: ' + health.illness);
  if (health.allergies) alerts.push('Alergia: ' + health.allergies);
  if (health.disability) alerts.push('Discapacidad: ' + health.disability);
  if (!health.exercises) alerts.push('No practica deporte con regularidad');

  return alerts;
}

export function hasHealthAlerts(registration: Registration) {
  return getRunners(registration).some((runner) => getHealthAlerts(runner.health).length > 0);
}

function countPeople(registration: Pick<Registration, 'companion'>) {
  return registration.companion ? 2 : 1;
}

export function countRunners(registrations: Registration[]) {
  return registrations.reduce((sum, registration) => sum + countPeople(registration), 0);
}

/** Corredores de una reserva que se quedan en el páramo: son los únicos que gastan cupo. */
export function countParamoPeople(
  registration: Pick<Registration, 'stay'> & { companion: Pick<Person, 'stay'> | null },
) {
  return [registration.stay, registration.companion?.stay].filter(
    (stay) => stay === ESTADIA_CON_CUPO,
  ).length;
}

export function countParamoRunners(registrations: Registration[]) {
  return registrations.reduce((sum, registration) => sum + countParamoPeople(registration), 0);
}

export function countPendingReviews(registrations: Registration[]) {
  return registrations.reduce(
    (sum, registration) => sum + getPendingPayments(registration).length,
    0,
  );
}
