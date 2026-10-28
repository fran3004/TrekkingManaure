import type {
  eps,
  estadias,
  extras,
  generos,
  paises,
  parentescos,
  planesPago,
  tallas,
  tiposDocumento,
} from './data/catalogos';

// Modelo único de una reserva. Es el contrato que comparten el sitio público, el panel y
// el futuro backend. Fechas en AAAA-MM-DD (hora de Colombia) y montos en COP.

export type DocumentType = (typeof tiposDocumento)[number];
export type Gender = (typeof generos)[number];
export type ShirtSize = (typeof tallas)[number];
export type Stay = (typeof estadias)[number];
export type Extra = (typeof extras)[number];
export type PaymentPlan = (typeof planesPago)[number];
export type CountryCode = (typeof paises)[number]['iso'];
export type EpsEntity = (typeof eps)[number];
export type Relationship = (typeof parentescos)[number];

/** Teléfono: país del catálogo y número nacional, solo dígitos y sin indicativo. */
export type Phone = { country: CountryCode; number: string };

/** EPS elegida; `other` lleva el nombre solo cuando la entidad es "Otra". */
export type Eps = { entity: EpsEntity; other: string | null };

/** Contacto de emergencia; si el titular es menor de edad, es su responsable legal. */
export type EmergencyContact = { name: string; phone: Phone; relationship: Relationship };

export type Health = {
  illness: string | null;
  allergies: string | null;
  /** Discapacidad que declara la persona; null si no tiene. */
  disability: string | null;
  exercises: boolean;
};

/** Compromisos que cada persona debe aceptar para inscribirse. */
export type Commitments = { protectedAreas: boolean; environment: boolean };

/**
 * Aceptación de los términos. La reserva no se registra sin ella. `acceptedAt` es la fecha y
 * hora ISO en que el sistema registró la reserva; `imageUse` es la autorización opcional de uso
 * de imagen.
 */
export type Consent = { version: string; acceptedAt: string; imageUse: boolean };

/** Datos que se piden a cada corredor, titular o acompañante: son los mismos para ambos. */
export type Person = {
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  document: string;
  birthDate: string;
  gender: Gender;
  phone: Phone;
  email: string;
  city: string;
  eps: Eps;
  emergencyContact: EmergencyContact;
  health: Health;
  commitments: Commitments;
  consent: Consent;
  stay: Stay;
};

/** El acompañante puede comprar kit; solo entonces tiene talla. */
export type Companion = Person & { kit: boolean; shirtSize: ShirtSize | null };

/** Noches de hotel antes del evento. Cada noche se cobra por persona. */
export type PreEventHotel = {
  checkIn: string;
  checkOut: string;
  /** El acompañante también llega antes (solo si hay acompañante). */
  withCompanion: boolean;
};

export type PaymentConcept = 'Separación de cupo' | 'Pago total' | 'Pago de saldo';

/** La organización aprueba un pago cuando verifica que llegó a la llave Bre-B. */
export type PaymentReview = 'Por revisar' | 'Aprobado' | 'Rechazado';

export type Payment = {
  id: string;
  concept: PaymentConcept;
  amount: number;
  date: string;
  review: PaymentReview;
  rejectionReason: string | null;
};

/** El titular siempre compra kit. */
export type Registration = Person & {
  id: string;
  createdAt: string;
  shirtSize: ShirtSize;
  companion: Companion | null;
  extras: Extra[];
  preEventHotel: PreEventHotel | null;
  plan: PaymentPlan;
  /** Fecha elegida para pagar todo el restante; null si paga el total al reservar. */
  commitmentDate: string | null;
  /**
   * Si el titular es menor de edad, la organización marca aquí que recibió la autorización
   * firmada por su responsable. Sin ella no se aprueba ningún pago.
   */
  guardianAuthorized: boolean;
  payments: Payment[];
};

/** Lo que envía el sitio público; el servicio asigna id, fecha, pago esperado y autorización. */
export type NewRegistration = Omit<
  Registration,
  'id' | 'createdAt' | 'payments' | 'guardianAuthorized'
>;

/** El estado de una inscripción no se guarda: se deriva de sus pagos. */
export type RegistrationStatus =
  'Por verificar' | 'Saldo pendiente' | 'Vencido' | 'Pagado' | 'Rechazado';

/**
 * Lo que el sistema de reservas obtiene de la API. En el panel llega la lista completa; en el
 * sitio público solo `occupied`, porque la lista de reservas no se descarga.
 */
export type ReservasState = {
  registrations: Registration[];
  /** Cupos del páramo: solo los ocupan los corredores que se quedan allá. */
  capacity: number;
  /**
   * Fecha de cierre (AAAA-MM-DD): último día para inscribirse y para pagar el restante. La
   * cambia la organización desde el panel.
   */
  fechaCierre: string;
  /** Cupos ocupados que informa el servidor; se usa cuando no hay lista de reservas. */
  occupied?: number;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
