import { useEffect, useState, useSyncExternalStore } from 'react';
import { formatLongDate, todayInColombia } from '../../utils/format';
import { repositorio } from '../servicios/repositorio';
import { getAvailability } from '../utils/cupos';

/** Fecha de hoy en Colombia; se actualiza al volver a la pestaña y cada minuto. */
export function useHoy() {
  const [today, setToday] = useState(todayInColombia);

  useEffect(() => {
    const refresh = () => setToday(todayInColombia());
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return today;
}

/** Reservas y capacidad vigentes según la API; se re-renderiza con cada cambio que llegue. */
export function useReservas() {
  const state = useSyncExternalStore(repositorio.subscribe, repositorio.read);
  const today = useHoy();

  return {
    registrations: state.registrations,
    capacity: state.capacity,
    fechaCierre: state.fechaCierre,
    occupied: state.occupied,
    today,
  };
}

/** Fecha de cierre vigente: último día para inscribirse y para pagar el restante. */
export function useCierre() {
  const { fechaCierre, today } = useReservas();
  return { fechaCierre, cerrado: today > fechaCierre, plazoTexto: formatLongDate(fechaCierre) };
}

export function useDisponibilidad() {
  const { registrations, capacity, occupied } = useReservas();
  // Sin lista de reservas (sitio público) los ocupados vienen del servidor.
  return getAvailability(registrations, capacity, registrations.length ? undefined : occupied);
}
