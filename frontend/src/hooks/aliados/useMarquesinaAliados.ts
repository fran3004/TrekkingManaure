import { useEffect, useRef } from 'react';
import { aliados } from '../../../../shared/data/aliados';
import { UMBRAL_ARRASTRE, VELOCIDAD_BASE, VELOCIDAD_MAXIMA } from '../../data/aliados/marquesina';

/**
 * Cinta de logos que avanza sola y se puede arrastrar o girar con la rueda horizontal.
 * La lista va duplicada para que el bucle no tenga cortes; la copia queda oculta a lectores.
 */
export function useMarquesinaAliados() {
  const cajaRef = useRef<HTMLDivElement>(null);
  const pistaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const caja = cajaRef.current;
    const pista = pistaRef.current;
    if (!caja || !pista) return;

    let x = 0;
    let velocidad = 0;
    let mitad = 0;
    let arrastrando = false;
    let ultimoX = 0;
    let ultimoT = 0;
    let inicioX = 0;
    let movido = false; // true si el gesto fue un arrastre y no un toque sobre un logo
    let cuadroId = 0;
    let previo = performance.now();
    let visible = false;

    const limitar = (valor: number) =>
      Math.max(-VELOCIDAD_MAXIMA, Math.min(VELOCIDAD_MAXIMA, valor));

    // Solo dentro del callback del ResizeObserver: ahí el diseño ya está calculado y leer offsetLeft
    // no obliga al navegador a recalcular la página (antes se medía al montar y costaba ~50 ms).
    const medir = () => {
      const tarjetas = pista.children;
      const primera = tarjetas[0] as HTMLElement | undefined;
      const copia = tarjetas[aliados.length] as HTMLElement | undefined;
      if (primera && copia) mitad = copia.offsetLeft - primera.offsetLeft;
    };

    const cuadro = (ahora: number) => {
      if (!visible) {
        cuadroId = 0;
        return;
      }
      const dt = Math.min((ahora - previo) / 1000, 0.05);
      previo = ahora;
      if (!arrastrando) {
        x += (-VELOCIDAD_BASE + velocidad) * dt;
        velocidad *= Math.exp(-3 * dt);
      }
      if (mitad > 0) {
        while (x <= -mitad) x += mitad;
        while (x > 0) x -= mitad;
      }
      pista.style.transform = `translate3d(${x}px, 0, 0)`;
      cuadroId = requestAnimationFrame(cuadro);
    };

    const alBajar = (evento: PointerEvent) => {
      arrastrando = true;
      velocidad = 0;
      ultimoX = evento.clientX;
      ultimoT = performance.now();
      inicioX = evento.clientX;
      movido = false;
      caja.classList.add('is-arrastrando');
    };
    const alMover = (evento: PointerEvent) => {
      if (!arrastrando) return;
      if (!movido && Math.abs(evento.clientX - inicioX) > UMBRAL_ARRASTRE) {
        movido = true;
        try {
          caja.setPointerCapture(evento.pointerId);
        } catch {
          // sin captura el arrastre funciona igual mientras el puntero siga encima
        }
      }
      const ahora = performance.now();
      const dx = evento.clientX - ultimoX;
      x += dx;
      velocidad = limitar(0.6 * velocidad + 0.4 * (dx / (Math.max(ahora - ultimoT, 1) / 1000)));
      ultimoX = evento.clientX;
      ultimoT = ahora;
    };
    const alSoltar = () => {
      if (!arrastrando) return;
      arrastrando = false;
      if (performance.now() - ultimoT > 90) velocidad = 0;
      caja.classList.remove('is-arrastrando');
    };
    const alHacerClic = (evento: MouseEvent) => {
      if (!movido) return;
      movido = false;
      evento.preventDefault();
      evento.stopPropagation();
    };
    const alRodar = (evento: WheelEvent) => {
      if (Math.abs(evento.deltaX) <= Math.abs(evento.deltaY)) return;
      evento.preventDefault();
      velocidad = limitar(velocidad - evento.deltaX * 5);
    };

    const observador = new ResizeObserver(medir);
    observador.observe(caja);
    // La cinta está lejos de la portada: solo se anima mientras se ve.
    const vigia = new IntersectionObserver(([entrada]) => {
      visible = entrada.isIntersecting;
      if (visible && !cuadroId) {
        previo = performance.now();
        cuadroId = requestAnimationFrame(cuadro);
      }
    });
    vigia.observe(caja);
    caja.addEventListener('pointerdown', alBajar);
    caja.addEventListener('pointermove', alMover);
    caja.addEventListener('pointerup', alSoltar);
    caja.addEventListener('pointercancel', alSoltar);
    caja.addEventListener('click', alHacerClic, true);
    caja.addEventListener('wheel', alRodar, { passive: false });

    return () => {
      cancelAnimationFrame(cuadroId);
      observador.disconnect();
      vigia.disconnect();
      caja.removeEventListener('pointerdown', alBajar);
      caja.removeEventListener('pointermove', alMover);
      caja.removeEventListener('pointerup', alSoltar);
      caja.removeEventListener('pointercancel', alSoltar);
      caja.removeEventListener('click', alHacerClic, true);
      caja.removeEventListener('wheel', alRodar);
      pista.style.transform = '';
    };
  }, []);

  return {
    cajaRef,
    pistaRef,
    logos: [...aliados, ...aliados].map((aliado, indice) => {
      const copia = indice >= aliados.length;
      return {
        key: indice,
        publicId: aliado.publicId,
        alt: copia ? '' : aliado.name,
        instagram: aliado.instagram
          ? {
              href: `https://www.instagram.com/${aliado.instagram}/`,
              ariaLabel: `${aliado.name} en Instagram`,
            }
          : null,
        ariaHidden: copia ? true : undefined,
        tabIndex: copia ? -1 : undefined,
      };
    }),
  };
}
