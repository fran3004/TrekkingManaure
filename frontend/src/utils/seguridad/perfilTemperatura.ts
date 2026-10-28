import { perfilRecorrido } from '../../data/seguridad/temperatura';

export const ANCHO = 680;
export const ALTO = 220;

const MARGEN = { izq: 58, der: 24, arriba: 34, abajo: 34 };
const ALTURA_MIN = 1500;
const ALTURA_MAX = 3200;
const PASO_KM = 0.25;
const BASE = ALTO - MARGEN.abajo;
const MARCAS_ALTURA = [2000, 2500, 3000];

const { distanciaKm, inicio, paramo } = perfilRecorrido;

// Frío → calor: azul hielo, dorado, naranja.
const ESCALA_COLOR: { temp: number; rgb: [number, number, number] }[] = [
  { temp: -1, rgb: [120, 190, 255] },
  { temp: 7, rgb: [242, 193, 78] },
  { temp: 15, rgb: [235, 104, 52] },
];

export interface PuntoPerfil {
  km: number;
  x: number;
  y: number;
  alturaM: number;
  tempC: number;
  color: string;
}

export function formatearTemp(temp: number) {
  return `${temp.toFixed(1).replace('.', ',')} °C`;
}

export function formatearAltura(alturaM: number) {
  return `${Math.round(alturaM).toLocaleString('es-CO')} m`;
}

export function xDeKm(km: number) {
  return MARGEN.izq + (km / distanciaKm) * (ANCHO - MARGEN.izq - MARGEN.der);
}

export function yDeAltura(alturaM: number) {
  return BASE - ((alturaM - ALTURA_MIN) / (ALTURA_MAX - ALTURA_MIN)) * (BASE - MARGEN.arriba);
}

export function kmDesdeX(x: number) {
  const km = ((x - MARGEN.izq) / (ANCHO - MARGEN.izq - MARGEN.der)) * distanciaKm;
  return Math.min(distanciaKm, Math.max(0, km));
}

// Subida suave: mezcla lineal y curva en S, sin datos GPS del trazado.
function alturaEnKm(km: number) {
  const t = km / distanciaKm;
  const suave = t * t * (3 - 2 * t);
  return inicio.alturaM + (paramo.alturaM - inicio.alturaM) * (0.5 * t + 0.5 * suave);
}

// La temperatura baja de forma lineal con la altura entre los dos puntos medidos.
function tempEnAltura(alturaM: number) {
  const avance = (alturaM - inicio.alturaM) / (paramo.alturaM - inicio.alturaM);
  return inicio.tempC + (paramo.tempC - inicio.tempC) * avance;
}

function colorDeTemp(temp: number) {
  const limitada = Math.min(15, Math.max(-1, temp));
  const hasta = ESCALA_COLOR.findIndex((punto) => punto.temp >= limitada);
  const b = ESCALA_COLOR[Math.max(1, hasta)];
  const a = ESCALA_COLOR[Math.max(1, hasta) - 1];
  const k = (limitada - a.temp) / (b.temp - a.temp);
  const canal = a.rgb.map((v, i) => Math.round(v + (b.rgb[i] - v) * k));
  return `rgb(${canal.join(',')})`;
}

export function puntoEnKm(km: number): PuntoPerfil {
  const alturaM = alturaEnKm(km);
  const tempC = tempEnAltura(alturaM);
  return { km, x: xDeKm(km), y: yDeAltura(alturaM), alturaM, tempC, color: colorDeTemp(tempC) };
}

export function construirPerfil() {
  const pasos = Math.round(distanciaKm / PASO_KM);
  const puntos = Array.from({ length: pasos + 1 }, (_, i) => puntoEnKm(i * PASO_KM));

  const segmentos = puntos.slice(0, -1).map((a, i) => {
    const b = puntos[i + 1];
    const medio = tempEnAltura((a.alturaM + b.alturaM) / 2);
    return {
      d: `M${a.x} ${a.y}L${b.x} ${b.y}L${b.x} ${BASE}L${a.x} ${BASE}Z`,
      color: colorDeTemp(medio),
    };
  });

  return {
    base: BASE,
    segmentos,
    linea: puntos.map((p) => `${p.x} ${p.y}`).join('L'),
    ejeKm: Array.from({ length: distanciaKm + 1 }, (_, km) => ({ km, x: xDeKm(km) })),
    ejeAlturas: MARCAS_ALTURA.map((alturaM) => ({ alturaM, y: yDeAltura(alturaM) })),
    xIzq: MARGEN.izq,
    xDer: ANCHO - MARGEN.der,
  };
}
