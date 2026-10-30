import { useState, type ChangeEvent, type FormEvent } from 'react';
import { evento } from '../../../../shared/config';
import { formatLongDate } from '../../../../shared/utils/format';
import { classNames } from '../../utils/comun/classNames';
import { plural } from '../../utils/comun/texto';
import {
  capacityRange,
  etiquetasExtra,
  extras,
  estadias,
  getAvailability,
  getRunners,
  reservasApi,
  summarize,
  tallas,
  useReservas,
  type Extra,
} from '../../../../shared/reservas';

export function useCupos() {
  const { registrations, today, capacity, occupied, paramo, fechaCierre } = useReservas();
  const [value, setValue] = useState<number | ''>(capacity);
  const [paramoValue, setParamoValue] = useState<number | ''>(paramo.capacity);
  const [fecha, setFecha] = useState(fechaCierre);
  const [fechaFeedback, setFechaFeedback] = useState('');
  const [fechaError, setFechaError] = useState('');
  const [fechaSaving, setFechaSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const secured = registrations
    .map((registration) => summarize(registration, today))
    .filter((summary) => summary.paid > 0);
  const runners = secured.flatMap((summary) =>
    getRunners(summary.registration).map((runner) => ({ ...runner, status: summary.status })),
  );
  const availability = getAvailability(capacity, occupied);
  const paramoAvailability = getAvailability(paramo.capacity, paramo.occupied);
  const range = capacityRange(availability.occupied);
  const paramoRange = capacityRange(paramoAvailability.occupied);
  const kits = runners.filter((runner) => runner.kit);
  const atRisk = kits.filter((runner) => runner.status === 'Vencido').length;
  const countRunners = (match: (runner: (typeof runners)[number]) => boolean) =>
    runners.filter(match).length;
  const countExtras = (extra: Extra) =>
    secured.filter((summary) => summary.registration.extras.includes(extra)).length;

  async function applyCapacity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (value === '' || paramoValue === '' || saving) return;
    setSaving(true);
    setFeedback('');
    setError('');
    const result = await reservasApi.fijarCapacidad(value, paramoValue);
    setSaving(false);
    if (result.ok)
      setFeedback(
        'Cupos actualizados: ' +
          plural(result.data.capacity, 'cupo', 'cupos') +
          ' en la carrera y ' +
          plural(result.data.paramo, 'cupo', 'cupos') +
          ' en el páramo.',
      );
    else setError(result.error);
  }

  async function applyFecha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fecha || fechaSaving) return;
    setFechaSaving(true);
    setFechaFeedback('');
    setFechaError('');
    const result = await reservasApi.fijarFechaCierre(fecha);
    setFechaSaving(false);
    if (result.ok) {
      setFechaFeedback(
        'Inscripciones y pagos del restante abiertos hasta el ' + formatLongDate(result.data) + '.',
      );
    } else setFechaError(result.error);
  }

  return {
    availability,
    barStyle: { width: availability.percentage + '%' },
    paramoAvailability,
    paramoBarStyle: { width: paramoAvailability.percentage + '%' },
    value,
    range,
    paramoValue,
    paramoRange,
    limitText: 'Mínimo ' + range.min + ' (reservas activas). Sin tope máximo.',
    paramoLimitText:
      'Mínimo ' + paramoRange.min + ' (cupos del páramo ya ocupados). Sin tope máximo.',
    policyText:
      'Hay ' +
      capacity +
      ' cupos para la carrera: cada reserva gasta uno, con o sin acompañante. Al agotarse, el formulario del sitio desaparece. En el páramo hay ' +
      paramo.capacity +
      ' cupos: cada persona que duerme allá (titular o acompañante) ocupa uno. Al agotarse, el sitio deshabilita esa opción y la inscripción sigue abierta. Los cupos se apartan al registrar la reserva y se liberan si queda rechazada o vence.',
    cierre: {
      value: fecha,
      actual: formatLongDate(fechaCierre),
      cerrado: today > fechaCierre,
      change: (event: ChangeEvent<HTMLInputElement>) => setFecha(event.target.value),
      apply: applyFecha,
      saving: fechaSaving,
      saveLabel: fechaSaving ? 'Guardando…' : 'Guardar fecha',
      limitText:
        'Entre la apertura de inscripciones (' +
        formatLongDate(evento.fechaAperturaInscripciones) +
        ') y la víspera del evento.',
      estadoClass: classNames('admin-pill', today > fechaCierre && 'admin-pill--warm'),
      feedback: fechaFeedback,
      error: fechaError,
      estado:
        today > fechaCierre
          ? 'Inscripciones cerradas desde el ' + formatLongDate(fechaCierre) + '.'
          : 'Inscripciones abiertas hasta el ' + formatLongDate(fechaCierre) + '.',
    },
    feedback,
    error,
    saving,
    saveLabel: saving ? 'Guardando…' : 'Guardar cupos',
    changeValue: (event: ChangeEvent<HTMLInputElement>) =>
      setValue(event.target.value === '' ? '' : Number(event.target.value)),
    changeParamoValue: (event: ChangeEvent<HTMLInputElement>) =>
      setParamoValue(event.target.value === '' ? '' : Number(event.target.value)),
    applyCapacity,
    kitsLabel: kits.length + ' kits',
    sizes: tallas.map((size) => ({
      size,
      count: kits.filter((runner) => runner.shirtSize === size).length,
    })),
    riskText: atRisk
      ? atRisk +
        (atRisk === 1 ? ' kit pertenece' : ' kits pertenecen') +
        ' a inscripciones con saldo vencido y puede liberarse.'
      : 'Ningún kit está en riesgo por saldo vencido.',
    logistics: [
      {
        title: 'Estadía',
        icon: 'hotel' as const,
        rows: estadias.map((stay) => ({
          label: stay,
          total: countRunners((runner) => runner.stay === stay),
        })),
      },
      {
        title: 'Experiencias',
        icon: 'flag' as const,
        rows: [
          ...extras.map((extra) => ({ label: etiquetasExtra[extra], total: countExtras(extra) })),
          {
            label: 'Reservas con hotel antes del evento',
            total: secured.filter((summary) => summary.registration.preEventHotel).length,
          },
        ],
      },
      {
        title: 'Corredores',
        icon: 'users' as const,
        rows: [
          { label: 'Titulares', total: countRunners((runner) => runner.role === 'Titular') },
          {
            label: 'Acompañantes',
            total: countRunners((runner) => runner.role === 'Acompañante'),
          },
        ],
      },
    ],
  };
}
