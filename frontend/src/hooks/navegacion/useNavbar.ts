import { useEffect, useState } from 'react';
import { navLinks } from '../../data/navegacion/enlaces';
import { classNames } from '../../utils/comun/classNames';

export function useNavbar() {
  const [open, setOpen] = useState(false);
  // Al pre-renderizar no hay ventana: la barra empieza sin scroll.
  const [scrolled, setScrolled] = useState(
    () => typeof window !== 'undefined' && window.scrollY > 20,
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return {
    open,
    headerClass: classNames('nav', (scrolled || open) && 'is-scrolled'),
    linksClass: classNames('nav__links', open && 'is-open'),
    links: navLinks.map((link) => ({ ...link, href: '#' + link.id })),
    toggleLabel: open ? 'Cerrar menú' : 'Abrir menú',
    toggle: () => setOpen(!open),
    close: () => setOpen(false),
  };
}
