import type { ImagePreset } from '../utils/cloudinary';

// Todas las imágenes del sitio viven en Cloudinary bajo esta carpeta.
const RAIZ = 'trekking-manaure';

export const imagenes = {
  portada: `${RAIZ}/portada/portada-fondo`,
  logo: `${RAIZ}/marca/logo-trekking-perija`,
  extras: {
    acompanante: `${RAIZ}/experiencias/acompanante-mochilas`,
    cuatrimoto: `${RAIZ}/experiencias/cuatrimoto-montana`,
    parapente: `${RAIZ}/experiencias/parapente-biplaza`,
  },
};

export const galeriaId = (nombre: string) => `${RAIZ}/galeria/${nombre}`;
export const aliadoId = (nombre: string) => `${RAIZ}/aliados/${nombre}`;

// Anchos pensados para el tamaño real en pantalla (móvil y PC) y pantallas de alta densidad.
export const presets = {
  // Precargada desde frontend/index.html: si cambian anchos, calidad o sizes, actualizar allí también.
  portada: {
    widths: [480, 640, 750, 960, 1280, 1776],
    // Va detrás de degradados y máscara: eco ahorra ~15-30 KB por tamaño sin diferencia visible.
    quality: 'auto:eco',
    sizes: '(max-width: 1024px) 100vw, 68vw',
  },
  galeriaMiniatura: {
    widths: [320, 480, 640, 800],
    sizes: '(max-width: 600px) calc(100vw - 2.5rem), (max-width: 900px) 50vw, 380px',
  },
  galeriaVisor: {
    widths: [640, 960, 1280, 1600],
    sizes: '(max-width: 1100px) 100vw, 1040px',
  },
  galeriaMini: { widths: [80, 160], sizes: '72px' },
  galeriaFondo: { widths: [96], quality: 'auto:low' },
  aliado: {
    widths: [120, 240],
    sizes: '110px',
    crop: 'fill',
    aspectRatio: '1:1',
  },
  extra: {
    widths: [480, 720, 960, 1200],
    sizes: '(max-width: 720px) calc(100vw - 1rem), 380px',
  },
  logo: { widths: [104, 208], sizes: '52px', quality: 'auto:best' },
} satisfies Record<string, ImagePreset>;
