import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
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
import { contacto } from '../../../../shared/config';
import { irASeccion } from '../../utils/comun/irASeccion';
import { buildMessage, whatsappLink } from '../../utils/reserva/mensaje';
import { ESTADO_VACIO, leerBorrador } from '../../utils/reserva/borrador';
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
import { useBorradorReserva } from './useBorradorReserva';

/** Pasos del envío: revisar el resumen, registrar y confirmar. */
type Envio = {
  resumen: ResumenReservaTexto;
  reserva: NewRegistration;
  estado: 'revision' | 'enviando' | 'registrada';
  error: string;
  /** Tras registrar: WhatsApp ya se abrió solo; si no, el resumen muestra el enlace. */
  whatsappAbierto?: boolean;
};

const HOTEL_VACIO = ESTADO_VACIO.hotel;

/** Hotel listo para cotizar: activo y con fechas válidas en orden; si no, null. */
function hotelCotizable(hotel: HotelFormulario, companion: boolean): PreEventHotel | null {
  if (!hotel.activo || !isIsoDate(hotel.checkIn) || !isIsoDate(hotel.checkOut)) return null;
  const listo = { checkIn: hotel.checkIn, checkOut: hotel.checkOut };
  return countHotelNights(listo) > 0
    ? { ...listo, withCompanion: companion && hotel.conAcompanante }
    : null;
}

export function useReserva(stay: Estadia, onStay: (value: Estadia) => void) {
  // El borrador de una visita anterior (si lo hay) da el punto de partida de todo el formulario.
  const [inicial] = useState(leerBorrador);
  const guardado = inicial?.estado ?? ESTADO_VACIO;
  // null = todavía no elegido: la persona debe marcarlo, no viene preseleccionado.
  const [plan, setPlan] = useState<PlanPago | null>(guardado.plan);
  const [planDate, setPlanDate] = useState(guardado.planDate);
  const [companion, setCompanionState] = useState(guardado.companion);
  const [companionKit, setCompanionKit] = useState<boolean | null>(guardado.companionKit);
  const [extras, setExtras] = useState<Extra[]>(guardado.extras);
  const [hotel, setHotel] = useState<HotelFormulario>(guardado.hotel);
  const [birthDate, setBirthDate] = useState(inicial?.campos.nacimiento ?? '');
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
  const estado = useMemo(
    () => ({ stay, plan, planDate, companion, companionKit, extras, hotel }),
    [stay, plan, planDate, companion, companionKit, extras, hotel],
  );
  const borrador = useBorradorReserva(formRef, estado, inicial);

  // La estadía vive en la página (también se elige desde la sección de alojamiento): se devuelve
  // una sola vez al abrir.
  const estadiaRestaurada = useRef(false);
  useEffect(() => {
    if (estadiaRestaurada.current) return;
    estadiaRestaurada.current = true;
    if (inicial?.estado.stay) onStay(inicial.estado.stay);
  }, [inicial, onStay]);

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

  /**
   * Registra la reserva y abre WhatsApp con sus datos en un solo paso. La pestaña se abre en el
   * clic, antes de esperar al servidor: abierta después, el navegador la bloquearía como ventana
   * emergente. Si aun así no se pudo abrir, el resumen ofrece el enlace.
   */
  async function confirm() {
    if (!envio || envio.estado !== 'revision') return;
    const ventana = window.open('', '_blank');
    if (ventana) ventana.opener = null;
    setEnvio({ ...envio, estado: 'enviando', error: '' });
    const result = await reservasApi.crearReserva(envio.reserva);
    if (!result.ok) {
      ventana?.close();
      setEnvio({ ...envio, estado: 'revision', error: result.error });
      return;
    }
    // Ya quedó registrada: el borrador no se necesita más y no puede reaparecer al volver.
    borrador.descartar();
    // El resumen final sale de lo que quedó registrado: código y hora de aceptación incluidos.
    const resumen = describirReserva(result.data, quote, today);
    const enlace = whatsappLink(contacto.whatsapp, buildMessage(resumen));
    if (ventana && enlace) ventana.location.href = enlace;
    else ventana?.close();
    setEnvio({
      ...envio,
      estado: 'registrada',
      resumen,
      whatsappAbierto: Boolean(ventana && enlace),
    });
  }

  /** Deja el formulario vacío y vuelve a empezar a guardar desde cero. */
  function reiniciarFormulario() {
    setPlan(null);
    setPlanDate('');
    setCompanionState(false);
    setCompanionKit(null);
    setExtras([]);
    setHotel(HOTEL_VACIO);
    setBirthDate('');
    setError('');
    onStay('');
    reiniciar();
    borrador.reanudar();
    setFormKey((key) => key + 1);
  }

  /**
   * Tras registrar, cerrar el resumen deja el formulario listo para otra reserva y lo muestra
   * desde su inicio: el formulario vacío es mucho más corto y la vista no debe quedar en el vacío.
   * Si todavía no se registró, lo escrito se guarda como borrador para no tener que repetirlo.
   */
  function closePreview() {
    if (envio?.estado === 'registrada') {
      reiniciarFormulario();
      window.requestAnimationFrame(() => irASeccion('reserva'));
    } else if (envio?.estado === 'revision') {
      borrador.guardarAhora();
    }
    if (envio?.estado !== 'enviando') setEnvio(null);
  }

  return {
    formRef,
    formKey,
    /** Revisa qué bloques mostrar y guarda el borrador tras cada cambio del formulario. */
    alCambiar: () => {
      revisar();
      borrador.programar();
    },
    borradorCampos: borrador.campos,
    borradorRecuperado: borrador.recuperado,
    empezarDeNuevo: reiniciarFormulario,
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
    whatsappAbierto: envio?.whatsappAbierto ?? false,
    confirm,
    closePreview,
    conditionsOpen,
    openConditions: () => setConditionsOpen(true),
    closeConditions: () => setConditionsOpen(false),
    quote,
    submit,
  };
}
