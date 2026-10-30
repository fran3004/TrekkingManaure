export const evento = {
  nombre: 'Trekking Desafío Perijá 13K',
  lugar: 'Manaure, Cesar, Colombia',
  fechas: ['2026-11-28', '2026-11-29'],
  largada: '2026-11-28T04:00:00-05:00',
  horaSalidaTexto: '4:00 a.m.',
  distanciaKm: 13,
  encuentro: 'Restaurante El Sabor, Villa Adelaida',
  llegada: 'Páramo',
  // Fecha de cierre por defecto: último día para inscribirse y para pagar saldos. La
  // organización la cambia desde el panel (Gestión de cupos); esta es solo la inicial.
  fechaLimitePago: '2026-11-09',
  fechaAperturaInscripciones: '2026-10-28',
  fechasTexto: '28 y 29 de noviembre',
} as const;

export const precios = {
  moneda: 'COP',
  total: 350000,
  inscripcion: 50000,
  kitCompleto: 300000,
  acompanante: 150000,
  cuatrimoto: 150000,
  parapente: 200000,
  /** Acompañante que también compra kit. */
  acompananteConKit: 350000,
  /** Hotel para llegar antes del evento: por noche y por persona. */
  hotelNoche: 45000,
} as const;

// Cupos del páramo: solo los ocupan quienes se quedan a dormir allá. La organización cambia
// la cantidad desde el panel; este es el valor inicial.
export const cupos = {
  iniciales: 60,
} as const;

export const contacto = {
  encargada: 'Sandra',
  whatsapp: '573216889096',
  whatsappConfigurado: true,
} as const;
