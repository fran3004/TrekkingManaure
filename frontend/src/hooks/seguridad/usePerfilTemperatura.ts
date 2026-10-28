import { useCallback, useMemo, useState, type PointerEvent } from 'react';
import { paradasRecorrido, perfilRecorrido } from '../../data/seguridad/temperatura';
import {
  ANCHO,
  construirPerfil,
  kmDesdeX,
  puntoEnKm,
} from '../../utils/seguridad/perfilTemperatura';

export function usePerfilTemperatura() {
  const perfil = useMemo(() => construirPerfil(), []);
  const paradas = useMemo(
    () => paradasRecorrido.map((parada) => ({ ...parada, punto: puntoEnKm(parada.km) })),
    [],
  );
  const [kmActivo, setKmActivo] = useState<number | null>(null);

  const alMover = useCallback((e: PointerEvent<SVGSVGElement>) => {
    const caja = e.currentTarget.getBoundingClientRect();
    setKmActivo(kmDesdeX(((e.clientX - caja.left) / caja.width) * ANCHO));
  }, []);
  const alSalir = useCallback(() => setKmActivo(null), []);

  return {
    perfil,
    paradas,
    activo: kmActivo === null ? null : puntoEnKm(kmActivo),
    alMover,
    alSalir,
    distanciaKm: perfilRecorrido.distanciaKm,
    inicio: perfilRecorrido.inicio,
    paramo: perfilRecorrido.paramo,
    fuente: perfilRecorrido.fuente,
  };
}
