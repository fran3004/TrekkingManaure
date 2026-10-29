/** Alto de la barra de navegación fija: la sección queda justo debajo de ella. */
const ALTO_NAVBAR = 72;

/** Lleva la vista al inicio de la sección (sin animación); no hace nada si no existe. */
export function irASeccion(id: string) {
  const seccion = document.getElementById(id);
  if (!seccion) return;
  window.scrollTo({
    top: seccion.getBoundingClientRect().top + window.scrollY - ALTO_NAVBAR,
    behavior: 'auto',
  });
}
