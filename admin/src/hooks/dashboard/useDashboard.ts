import { evento } from '../../../../shared/config';
import {
  countRunners,
  fullName,
  getAvailability,
  statusOrder,
  summarize,
  useReservas,
  type RegistrationStatus,
} from '../../../../shared/reservas';
import { formatDate, formatMoney } from '../../../../shared/utils/format';
import { useAdminUi } from '../../context/AdminUiContext';
import { classNames } from '../../utils/comun/classNames';
import { statusClass } from '../../utils/comun/estados';
import { daysBetween, describeDeadline } from '../../utils/comun/fechas';
import { padCount, plural } from '../../utils/comun/texto';

export function useDashboard() {
  const { registrations, today, capacity, occupied, paramo, fechaCierre } = useReservas();
  const { setFocusPaymentId } = useAdminUi();
  const summaries = registrations.map((registration) => summarize(registration, today));
  const count = (status: RegistrationStatus) =>
    summaries.filter((summary) => summary.status === status).length;
  const availability = getAvailability(capacity, occupied);
  const paramoAvailability = getAvailability(paramo.capacity, paramo.occupied);
  const reviews = summaries
    .flatMap((summary) => summary.pending.map((payment) => ({ summary, payment })))
    .sort((a, b) => a.payment.date.localeCompare(b.payment.date));
  const debts = summaries
    .filter((summary) => summary.status === 'Saldo pendiente' || summary.status === 'Vencido')
    .sort((a, b) =>
      (a.registration.commitmentDate || '').localeCompare(b.registration.commitmentDate || ''),
    );
  const receivable = debts.reduce((sum, summary) => sum + summary.balance, 0);
  const collected = summaries.reduce((sum, summary) => sum + summary.paid, 0);
  const declared = reviews.reduce((sum, item) => sum + item.payment.amount, 0);

  const metrics = [
    {
      title: 'Inscripciones',
      value: padCount(registrations.length),
      note:
        countRunners(registrations) +
        ' corredores · ' +
        availability.available +
        ' cupos libres · ' +
        paramoAvailability.available +
        ' cupos libres en el páramo',
      icon: 'users' as const,
    },
    {
      title: 'Pagos por revisar',
      value: padCount(reviews.length),
      note: formatMoney(declared) + ' declarados',
      icon: 'sheet' as const,
    },
    {
      title: 'Por cobrar',
      value: formatMoney(receivable),
      note:
        plural(count('Saldo pendiente'), 'saldo pendiente', 'saldos pendientes') +
        ' · ' +
        plural(count('Vencido'), 'vencido', 'vencidos'),
      icon: 'clock' as const,
    },
    {
      title: 'Recaudado',
      value: formatMoney(collected),
      note: 'Pagos aprobados por llave Bre-B · COP',
      icon: 'check' as const,
    },
  ].map((metric, index) => ({
    ...metric,
    className: classNames('admin-metric', index === 1 && 'admin-metric--warm'),
  }));

  let accumulated = 0;
  const segments = statusOrder.map((status) => {
    const start = accumulated;
    accumulated += (count(status) / Math.max(1, summaries.length)) * 100;
    return 'var(--estado-' + statusClass(status) + ') ' + start + '% ' + accumulated + '%';
  });

  return {
    metrics,
    donutStyle: { background: 'conic-gradient(' + segments.join(', ') + ')' },
    donutLabel: statusOrder.map((status) => count(status) + ' ' + status.toLowerCase()).join(', '),
    totalLabel: padCount(summaries.length),
    legend: statusOrder.map((status) => ({
      status,
      count: count(status),
      dotClass: 'legend-dot legend-dot--' + statusClass(status),
    })),
    deadlineLabel: formatDate(fechaCierre),
    isEmpty: registrations.length === 0,
    startTime: new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(evento.largada)),
    reviews: reviews.slice(0, 5).map(({ summary, payment }) => ({
      id: payment.id,
      name: fullName(summary.registration),
      detail: payment.concept + ' · ' + formatDate(payment.date),
      amount: formatMoney(payment.amount),
      ariaLabel: 'Revisar pago de ' + fullName(summary.registration),
    })),
    hasReviews: reviews.length > 0,
    debts: debts.slice(0, 5).map((summary) => ({
      id: summary.registration.id,
      name: fullName(summary.registration),
      detail:
        formatDate(summary.registration.commitmentDate || today) +
        ' · ' +
        describeDeadline(daysBetween(today, summary.registration.commitmentDate || today)),
      amount: formatMoney(summary.balance),
      status: summary.status,
    })),
    hasDebts: debts.length > 0,
    focusPayment: setFocusPaymentId,
  };
}
