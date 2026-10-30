// El nombre de la nube es público (aparece en cada URL); nunca va aquí la API key ni el secret.
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'meoo7p5s';
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

export type ImagePreset = {
  // Anchos que se generan para el srcset; el navegador elige según pantalla y densidad.
  widths: number[];
  sizes?: string;
  // limit: reduce sin recortar ni ampliar. fill: recorta a `aspectRatio` centrando lo importante.
  crop?: 'limit' | 'fill';
  aspectRatio?: string;
  quality?: 'auto' | 'auto:best' | 'auto:eco' | 'auto:low';
};

export function cloudinaryUrl(publicId: string, width: number, preset: ImagePreset): string {
  const resize =
    preset.crop === 'fill'
      ? `ar_${preset.aspectRatio ?? '1:1'},c_fill,g_auto,w_${width}`
      : `c_limit,w_${width}`;
  // f_auto y q_auto van en componentes separados: formato (avif/webp/jpg) y calidad automáticos.
  return `${BASE_URL}/${resize}/f_auto/q_${preset.quality ?? 'auto'}/${publicId}`;
}

export function cloudinarySrcSet(publicId: string, preset: ImagePreset): string {
  return preset.widths
    .map((width) => `${cloudinaryUrl(publicId, width, preset)} ${width}w`)
    .join(', ');
}

// src de respaldo para navegadores sin srcset: el ancho intermedio del preset.
export function cloudinarySrc(publicId: string, preset: ImagePreset): string {
  return cloudinaryUrl(publicId, preset.widths[Math.floor(preset.widths.length / 2)], preset);
}
