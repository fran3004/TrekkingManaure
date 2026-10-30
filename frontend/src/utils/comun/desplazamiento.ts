import type Lenis from 'lenis';

/**
 * Desplazamiento hacia las secciones. Las secciones bajo la portada usan content-visibility: hasta
 * que se acercan a la pantalla miden una altura estimada, así que al cruzarlas en un deslizamiento
 * largo cambian de tamaño y el destino se mueve. Por eso, al terminar, se vuelve a medir y se corrige.
 */

/** Alto de la barra de navegación fija cuando Lenis maneja el scroll (sin él, manda scroll-padding). */
const ALTO_NAVBAR = 72;
/** Correcciones como máximo tras el primer deslizamiento. */
const INTENTOS = 3;

let lenis: Lenis | null = null;

/** Registra (o quita) la instancia de Lenis activa para deslizar con ella. */
export function usarLenis(instancia: Lenis | null) {
  lenis = instancia;
}

function margenSuperior() {
  if (lenis) return ALTO_NAVBAR;
  const margen = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
  return Number.isFinite(margen) ? margen : ALTO_NAVBAR;
}

function posicionDe(destino: HTMLElement) {
  const maximo = document.documentElement.scrollHeight - window.innerHeight;
  const top = destino.getBoundingClientRect().top + window.scrollY - margenSuperior();
  return Math.max(0, Math.min(top, maximo));
}

/** Espera a que el scroll quede quieto unos cuadros seguidos (Safari no tiene `scrollend`). */
function esperarQuieto(): Promise<void> {
  return new Promise((listo) => {
    let previo = -1;
    let quietos = 0;
    const limite = performance.now() + 3000;
    const vigilar = () => {
      const y = window.scrollY;
      quietos = Math.abs(y - previo) < 0.5 ? quietos + 1 : 0;
      previo = y;
      if (quietos >= 6 || performance.now() > limite) listo();
      else requestAnimationFrame(vigilar);
    };
    requestAnimationFrame(vigilar);
  });
}

function moverHasta(top: number, suave: boolean): Promise<void> {
  if (lenis) {
    const activo = lenis;
    return new Promise((listo) => {
      activo.scrollTo(top, { immediate: !suave, force: true, onComplete: () => listo() });
      if (!suave) listo();
    });
  }
  window.scrollTo({ top, behavior: suave ? 'smooth' : 'auto' });
  return esperarQuieto();
}

/** Desliza hasta la sección y corrige si su posición cambió mientras se pintaban las de en medio. */
export async function deslizarASeccion(destino: HTMLElement) {
  const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (let intento = 0; intento <= INTENTOS; intento += 1) {
    const top = posicionDe(destino);
    if (Math.abs(top - window.scrollY) < 2) return;
    await moverHasta(top, suave);
  }
}

/** Lleva la vista al inicio de la sección por su id; no hace nada si no existe. */
export function irASeccion(id: string) {
  const seccion = document.getElementById(id);
  if (seccion) void deslizarASeccion(seccion);
}
