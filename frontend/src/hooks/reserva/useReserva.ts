import { useRef, useState, type FormEvent } from 'react';
import {
  cotizar,
  countHotelNights,
  isIsoDate,
  isMinor,
  reservasApi,
  useCierre,
  useDisponibilidad,
  useReservas,
  validateNewRegistration,
  type NewRegistration,
  type PreEventHotel,
} from '../../../../shared/reservas';
import { buildNewRegistration } from '../../utils/reserva/nuevaReserva';
import { describirReserva } from '../../utils/reserva/resumen';
import type {
  Estadia,
  Extra,
  HotelFormulario,
  PlanPago,
  ResumenReservaTexto,
} from '../../types/reserva';
import { useBloquesProgresivos } from './useBloquesProgresivos';

/** Pasos del envío: revisar el resumen, registrar y confirmar. */
type Envio = {
  resumen: ResumenReservaTexto;
  reserva: NewRegistration;
  estado: 'revision' | 'enviando' | 'registrada';
  error: string;
};

const HOTEL_VACIO: HotelFormulario = {
  activo: false,
  checkIn: '',
  checkOut: '',
  conAcompanante: true,
};

/** Hotel listo para cotizar: activo y con fechas válidas en orden; si no, null. */
function hotelCotizable(hotel: HotelFormulario, companion: boolean): PreEventHotel | null {
  if (!hotel.activo || !isIsoDate(hotel.checkIn) || !isIsoDate(hotel.checkOut)) return null;
  const listo = { checkIn: hotel.checkIn, checkOut: hotel.checkOut };
  return countHotelNights(listo) > 0
    ? { ...listo, withCompanion: companion && hotel.conAcompanante }
    : null;
}

export function useReserva(stay: Estadia, onStay: (value: Estadia) => void) {
  // null = todavía no elegido: la persona debe marcarlo, no viene preseleccionado.
  const [plan, setPlan] = useState<PlanPago | null>(null);
  const [planDate, setPlanDate] = useState('');
  const [companion, setCompanionState] = useState(false);
  const [companionKit, setCompanionKit] = useState<boolean | null>(null);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [hotel, setHotel] = useState<HotelFormulario>(HOTEL_VACIO);
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [envio, setEnvio] = useState<Envio | null>(null);
  const [conditionsOpen, setConditionsOpen] = useState(false);
  // Cambiar la clave vuelve a montar el formulario vacío después de registrar una reserva.
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const { visibles, revisar, reiniciar } = useBloquesProgresivos(formRef);
  const { registrations, capacity, today } = useReservas();
  const availability = useDisponibilidad();
  const cierre = useCierre();

  const preEventHotel = hotelCotizable(hotel, companion);
  const quote = cotizar({
    plan,
    companion: companion ? { kit: companionKit === true } : null,
    extras,
    preEventHotel,
  });
  const needsDate = plan === 'apartado';

  function toggleExtra(extra: Extra) {
    setExtras((current) =>
      current.includes(extra) ? current.filter((item) => item !== extra) : [...current, extra],
    );
  }

  /** Sin acompañante no queda elegido su parapente. */
  function setCompanion(value: boolean) {
    setCompanionState(value);
    if (!value) setExtras((current) => current.filter((item) => item !== 'parapenteAcompanante'));
  }

  function updateHotel(cambios: Partial<HotelFormulario>) {
    setHotel((current) => ({ ...current, ...cambios }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = event.currentTarget;

    if (cierre.cerrado) {
      setError('Las inscripciones cerraron el ' + cierre.plazoTexto + '.');
      return;
    }
    if (!form.reportValidity()) return;
    if (!stay) {
      setError('Elige tu estadía.');
      return;
    }
    if (!plan) {
      setError('Elige la forma de pago.');
      return;
    }
    if (needsDate && !planDate) {
      setError('Elige la fecha en que pagarás el restante.');
      return;
    }

    const reserva = buildNewRegistration(new FormData(form), {
      stay,
      plan,
      planDate,
      companion,
      companionKit,
      extras,
      hotel,
    });
    // Las mismas reglas que aplica el servicio: se avisan antes de abrir el resumen.
    const invalid = validateNewRegistration(
      reserva,
      registrations,
      capacity,
      today,
      cierre.fechaCierre,
      availability.occupied,
    );
    if (invalid) {
      setError(invalid);
      return;
    }

    setEnvio({
      reserva,
      estado: 'revision',
      error: '',
      resumen: describirReserva(reserva, quote, today),
    });
  }

  async function confirm() {
    if (!envio || envio.estado !== 'revision') return;
    setEnvio({ ...envio, estado: 'enviando', error: '' });
    const result = await reservasApi.crearReserva(envio.reserva);
    if (!result.ok) {
      setEnvio({ ...envio, estado: 'revision', error: result.error });
      return;
    }
    // El resumen final sale de lo que quedó registrado: código y hora de aceptación incluidos.
    setEnvio({
      ...envio,
      estado: 'registrada',
      resumen: describirReserva(result.data, quote, today),
    });
  }

  /** Tras registrar, cerrar el resumen deja el formulario listo para otra reserva. */
  function closePreview() {
    if (envio?.estado === 'registrada') {
      setPlan(null);
      setPlanDate('');
      setCompanionState(false);
      setCompanionKit(null);
      setExtras([]);
      setHotel(HOTEL_VACIO);
      setBirthDate('');
      onStay('');
      reiniciar();
      setFormKey((key) => key + 1);
    }
    if (envio?.estado !== 'enviando') setEnvio(null);
  }

  return {
    formRef,
    formKey,
    revisar,
    /** Los bloques del formulario aparecen uno a uno; el índice empieza en 0. */
    isHidden: (bloque: number) => visibles <= bloque,
    today,
    setBirthDate,
    esMenor: isMinor(birthDate, today),
    plan,
    setPlan,
    planDate,
    setPlanDate,
    companion,
    setCompanion,
    companionKit,
    setCompanionKit,
    extras,
    toggleExtra,
    hotel,
    updateHotel,
    preEventHotel,
    error,
    // Sin cupos en el páramo solo se deshabilita esa estadía; hotel y regreso a casa siguen.
    paramoAgotado: availability.soldOut,
    // Pasada la fecha de cierre ya no se reciben inscripciones.
    cerrado: cierre.cerrado,
    cerradoText:
      'Las inscripciones cerraron el ' +
      cierre.plazoTexto +
      '. Escríbenos por WhatsApp si tienes dudas.',
    preview: envio?.resumen ?? null,
    previewState: envio?.estado ?? null,
    previewError: envio?.error ?? '',
    confirm,
    closePreview,
    conditionsOpen,
    openConditions: () => setConditionsOpen(true),
    closeConditions: () => setConditionsOpen(false),
    quote,
    submit,
  };
}
