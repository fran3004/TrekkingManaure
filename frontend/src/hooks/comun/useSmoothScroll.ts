import { useEffect } from 'react';
import 'lenis/dist/lenis.css';
import { usarLenis } from '../../utils/comun/desplazamiento';

// Lenis suaviza la rueda del ratón; en pantallas táctiles no cambia nada, así que solo se carga en
// equipos con ratón y recién con la primera interacción: nunca compite con la carga de la página.
const CON_RATON = '(hover: hover) and (pointer: fine)';
const PRIMER_USO = ['pointermove', 'wheel', 'keydown', 'pointerdown'] as const;

export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia(CON_RATON).matches) return;

    let destruir: (() => void) | undefined;
    let cancelado = false;

    const cargar = async () => {
      PRIMER_USO.forEach((evento) => window.removeEventListener(evento, cargar));
      const { default: Lenis } = await import('lenis');
      if (cancelado) return;
      // Las anclas las maneja useAnclas, que corrige la posición al terminar.
      const lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        autoRaf: true,
      });
      usarLenis(lenis);
      destruir = () => {
        usarLenis(null);
        lenis.destroy();
      };
    };

    PRIMER_USO.forEach((evento) => window.addEventListener(evento, cargar, { passive: true }));
    return () => {
      cancelado = true;
      PRIMER_USO.forEach((evento) => window.removeEventListener(evento, cargar));
      destruir?.();
    };
  }, []);
}
