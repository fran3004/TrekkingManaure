import { useEffect } from 'react';
import { deslizarASeccion } from '../../utils/comun/desplazamiento';

/**
 * Enlaces internos (href="#seccion"): desliza hasta la sección y corrige la posición al final (ver
 * utils/comun/desplazamiento). El enlace para saltar al contenido conserva el comportamiento nativo,
 * que además mueve el foco.
 */
export function useAnclas() {
  useEffect(() => {
    const alHacerClic = (evento: MouseEvent) => {
      if (evento.defaultPrevented || evento.button !== 0) return;
      if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
      const enlace =
        evento.target instanceof Element ? evento.target.closest('a[href^="#"]') : null;
      if (!(enlace instanceof HTMLAnchorElement)) return;
      const id = decodeURIComponent(enlace.hash.slice(1));
      const destino = id && id !== 'contenido' ? document.getElementById(id) : null;
      if (!destino) return;
      evento.preventDefault();
      if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
      void deslizarASeccion(destino);
    };
    document.addEventListener('click', alHacerClic);
    return () => document.removeEventListener('click', alHacerClic);
  }, []);
}
