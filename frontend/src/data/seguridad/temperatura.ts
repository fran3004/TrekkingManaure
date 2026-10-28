// Datos climáticos históricos de la zona y alturas de los dos puntos medidos.
export const perfilRecorrido = {
  distanciaKm: 13,
  inicio: {
    nombre: 'Villa Adelaida',
    alturaM: 1624,
    // Mínima promedio de mañana el 15 y 16 de noviembre (2022-2025).
    tempC: 14.7,
    rotulo: 'Mañana típica de noviembre',
  },
  paramo: {
    nombre: 'Páramo',
    alturaM: 3123,
    // Mínima diaria más baja registrada entre 2015 y 2025 (18-dic-2018).
    tempC: -0.9,
    rotulo: 'Mínima más baja registrada',
  },
  fuente: 'registros climáticos históricos, 2015-2025',
} as const;

// Paradas del recorrido con la capa de ropa recomendada.
export const paradasRecorrido = [
  { km: 0, nombre: 'Villa Adelaida', ropa: 'Ropa ligera, gorra y agua' },
  { km: 4, nombre: 'Primer tramo', ropa: 'Cortavientos liviano' },
  { km: 7, nombre: 'Mitad del camino', ropa: 'Camiseta térmica y buzo' },
  { km: 10, nombre: 'Subida final', ropa: 'Abrigo e impermeable' },
  { km: 13, nombre: 'Páramo', ropa: 'Todo el abrigo, guantes y gorro' },
] as const;
