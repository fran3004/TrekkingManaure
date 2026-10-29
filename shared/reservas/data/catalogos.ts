// Catálogos únicos de la reserva. El formulario público, el panel y la exportación leen de
// aquí, y el backend debe aceptar exactamente estos valores.

export const tiposDocumento = ['CC', 'CE', 'TI', 'RC', 'Pasaporte', 'PPT'] as const;

/**
 * Formato de cada tipo de documento, tope de caracteres al escribir y edades que admite. Todos son
 * numéricos salvo el pasaporte. Los patrones y las ayudas son los mismos del catálogo del backend
 * (tabla tipo_documento): los mensajes de error deben coincidir.
 * CC de 8 a 10 dígitos sin cero inicial y solo para mayores de edad; TI de 7 a 18 años (quien acaba de
 * cumplir 18 puede tenerla todavía); RC para menores de 7 años.
 */
export const reglasDocumento = {
  CC: {
    patron: '[1-9][0-9]{7,9}',
    ayuda: 'Entre 8 y 10 dígitos',
    tope: 10,
    soloDigitos: true,
    edadMin: 18,
    edadMax: null,
  },
  CE: {
    patron: '[0-9]{6,10}',
    ayuda: 'Entre 6 y 10 dígitos',
    tope: 10,
    soloDigitos: true,
    edadMin: null,
    edadMax: null,
  },
  TI: {
    patron: '[0-9]{10,11}',
    ayuda: '10 u 11 dígitos',
    tope: 11,
    soloDigitos: true,
    edadMin: 7,
    edadMax: 18,
  },
  RC: {
    patron: '[0-9]{10}',
    ayuda: '10 dígitos',
    tope: 10,
    soloDigitos: true,
    edadMin: null,
    edadMax: 7,
  },
  Pasaporte: {
    patron: '[A-Za-z0-9]{6,12}',
    ayuda: 'Entre 6 y 12 letras o números',
    tope: 12,
    soloDigitos: false,
    edadMin: null,
    edadMax: null,
  },
  PPT: {
    patron: '[0-9]{5,8}',
    ayuda: 'Entre 5 y 8 dígitos',
    tope: 8,
    soloDigitos: true,
    edadMin: null,
    edadMax: null,
  },
} as const;

export const generos = ['Femenino', 'Masculino', 'Otro', 'Prefiero no decirlo'] as const;

export const tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;

/** Dónde pasa la noche cada corredor. Solo "Páramo" ocupa cupo. */
export const estadias = ['Páramo', 'Hotel en Manaure', 'Regreso a casa'] as const;

/** La única estadía que gasta cupo: los cupos son la capacidad del páramo. */
export const ESTADIA_CON_CUPO = 'Páramo';

/** Edad desde la que una persona es mayor de edad en Colombia. */
export const MAYORIA_EDAD = 18;

/** Edad máxima que se acepta en una fecha de nacimiento. */
export const EDAD_MAXIMA = 110;

/**
 * Actividades extra. La cuatrimoto vale lo mismo con o sin acompañante; el parapente es por
 * persona, por eso el del acompañante es una opción aparte.
 */
export const extras = ['cuatrimoto', 'parapente', 'parapenteAcompanante'] as const;

export const etiquetasExtra = {
  cuatrimoto: 'Paseo en cuatrimoto',
  parapente: 'Vuelo en parapente del titular',
  parapenteAcompanante: 'Vuelo en parapente del acompañante',
} as const;

/** 'total' paga todo al reservar; 'apartado' paga la inscripción y el resto en una fecha. */
export const planesPago = ['total', 'apartado'] as const;

export const etiquetasPlan = {
  total: 'Pago total',
  apartado: 'Aparta con la inscripción',
} as const;

// Única vía de pago. Se cambia aquí si la organización cambia de vía.
export const metodoPago = { value: 'llave-bre-b', label: 'Llave Bre-B' } as const;

/**
 * EPS que se pueden elegir. "Otra" pide el nombre; "No tengo EPS" cubre a quien no está
 * afiliado (por ejemplo, visitantes extranjeros).
 */
export const eps = [
  'Nueva EPS',
  'EPS Sura',
  'EPS Sanitas',
  'Salud Total',
  'Compensar',
  'Famisanar',
  'Coosalud',
  'Mutual SER',
  'Cajacopi',
  'Asmet Salud',
  'Emssanar',
  'Savia Salud',
  'Capresoca',
  'Comfenalco Valle',
  'Capital Salud',
  'Aliansalud',
  'Dusakawi',
  'Anas Wayuu',
  'Pijaos Salud',
  'Mallamas',
  'Comfachocó',
  'Comfaoriente',
  'Salud Mía',
  'SOS (Servicio Occidental de Salud)',
  'EPS Familiar de Colombia',
  'AIC (Asociación Indígena del Cauca)',
  'Régimen especial o de excepción',
  'Otra',
  'No tengo EPS',
] as const;

export const EPS_OTRA = 'Otra';

/** Parentescos del contacto de emergencia. */
export const parentescos = [
  'Madre',
  'Padre',
  'Tutor legal o acudiente',
  'Cónyuge o pareja',
  'Hijo o hija',
  'Hermano o hermana',
  'Abuelo o abuela',
  'Tío o tía',
  'Primo o prima',
  'Otro familiar',
  'Amigo o amiga',
] as const;

/** Quien responde por un titular menor de edad: solo madre, padre o tutor legal. */
export const parentescosResponsable = ['Madre', 'Padre', 'Tutor legal o acudiente'] as const;

/**
 * Teléfonos de los países más comunes. `movil` son las reglas del celular (WhatsApp) y `fijo`
 * las del teléfono fijo, que solo se acepta para el contacto de emergencia. `largos` cuenta
 * los dígitos sin el indicativo e `inicios` son los prefijos con que puede empezar el número.
 * Estados Unidos y República Dominicana comparten el +1: se distinguen por el código de área.
 */
export const paises = [
  {
    iso: 'CO',
    nombre: 'Colombia',
    indicativo: '57',
    ejemplo: '300 123 4567',
    movil: { largos: [10], inicios: ['3'] },
    // Fijos: 60X + 7 dígitos, con X igual a 1, 2, 4, 5, 6, 7 u 8 (marcación única nacional de la CRC).
    fijo: { largos: [10], inicios: ['601', '602', '604', '605', '606', '607', '608'] },
  },
  {
    iso: 'VE',
    nombre: 'Venezuela',
    indicativo: '58',
    ejemplo: '412 123 4567',
    movil: { largos: [10], inicios: ['41', '42'] },
    fijo: { largos: [10], inicios: ['2'] },
  },
  {
    iso: 'EC',
    nombre: 'Ecuador',
    indicativo: '593',
    ejemplo: '99 123 4567',
    movil: { largos: [9], inicios: ['9'] },
    fijo: { largos: [8], inicios: ['2', '3', '4', '5', '6', '7'] },
  },
  {
    iso: 'PE',
    nombre: 'Perú',
    indicativo: '51',
    ejemplo: '912 345 678',
    movil: { largos: [9], inicios: ['9'] },
    fijo: { largos: [8], inicios: ['1', '4', '5', '6', '7', '8'] },
  },
  {
    iso: 'MX',
    nombre: 'México',
    indicativo: '52',
    ejemplo: '55 1234 5678',
    movil: { largos: [10], inicios: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
    fijo: null,
  },
  {
    iso: 'US',
    nombre: 'Estados Unidos',
    indicativo: '1',
    ejemplo: '212 555 0123',
    movil: { largos: [10], inicios: ['2', '3', '4', '5', '6', '7', '8', '9'] },
    fijo: null,
  },
  {
    iso: 'ES',
    nombre: 'España',
    indicativo: '34',
    ejemplo: '612 34 56 78',
    movil: { largos: [9], inicios: ['6', '7'] },
    fijo: { largos: [9], inicios: ['8', '9'] },
  },
  {
    iso: 'AR',
    nombre: 'Argentina',
    indicativo: '54',
    ejemplo: '9 11 1234 5678',
    movil: { largos: [10, 11], inicios: ['1', '2', '3', '9'] },
    fijo: null,
  },
  {
    iso: 'CL',
    nombre: 'Chile',
    indicativo: '56',
    ejemplo: '9 1234 5678',
    movil: { largos: [9], inicios: ['9'] },
    fijo: { largos: [9], inicios: ['2', '3', '4', '5', '6', '7'] },
  },
  {
    iso: 'BR',
    nombre: 'Brasil',
    indicativo: '55',
    ejemplo: '11 91234 5678',
    movil: { largos: [11], inicios: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
    fijo: { largos: [10], inicios: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
  },
  {
    iso: 'PA',
    nombre: 'Panamá',
    indicativo: '507',
    ejemplo: '6123 4567',
    movil: { largos: [8], inicios: ['6'] },
    fijo: { largos: [7], inicios: ['2', '3', '4', '5', '7', '8', '9'] },
  },
  {
    iso: 'CR',
    nombre: 'Costa Rica',
    indicativo: '506',
    ejemplo: '8312 3456',
    movil: { largos: [8], inicios: ['5', '6', '7', '8'] },
    fijo: { largos: [8], inicios: ['2', '4'] },
  },
  {
    iso: 'DO',
    nombre: 'República Dominicana',
    indicativo: '1',
    ejemplo: '809 123 4567',
    movil: { largos: [10], inicios: ['809', '829', '849'] },
    fijo: null,
  },
] as const;

/** Dominios de correo mal escritos que se detectan, con el dominio correcto. */
export const dominiosCorreoErrados: Readonly<Record<string, string>> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'yaho.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'outlok.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outlook.con': 'outlook.com',
};

/** País que se preselecciona en los teléfonos. */
export const PAIS_PREDETERMINADO = 'CO';

/**
 * Versión de los términos y condiciones. Cambiarla cuando cambie el texto: cada reserva guarda
 * la versión que aceptó cada persona.
 */
export const versionTerminos = 'TYC-2026-10-28';

/**
 * Largos de los textos del formulario, medidos sobre el texto ya normalizado. Son los mismos del
 * backend (Textos.java) y de la base de datos (restricciones CHECK de la migración V18). El tope al
 * escribir es el máximo.
 */
export const limites = {
  nombre: { min: 2, max: 40 },
  contacto: { min: 5, max: 80 },
  ciudad: { min: 3, max: 40 },
  epsOtra: { min: 3, max: 40 },
  correo: { max: 100 },
} as const;
