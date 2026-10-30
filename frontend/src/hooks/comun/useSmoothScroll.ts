import { useEffect } from 'react';
import 'lenis/dist/lenis.css';

// Lenis (desplazamiento suave) no hace falta para pintar la página: se descarga aparte cuando el
// navegador queda libre, así no compite con la portada en la primera carga.
// Safari aún no tiene requestIdleCallback: ahí se espera un poco con setTimeout.
const esperarReposo = (hacer: () => void) => {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(hacer, { timeout: 2500 });
  else setTimeout(hacer, 1200);
};

export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let destruir: (() => void) | undefined;
    let cancelado = false;
    esperarReposo(async () => {
      const { default: Lenis } = await import('lenis');
      if (cancelado) return;
      const lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        autoRaf: true,
        anchors: { offset: -72 },
      });
      destruir = () => lenis.destroy();
    });

    return () => {
      cancelado = true;
      destruir?.();
    };
  }, []);
}
