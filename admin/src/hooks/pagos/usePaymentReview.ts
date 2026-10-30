import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  formatPhone,
  fullName,
  getExpectedAmount,
  getStatus,
  metodoPago,
  needsGuardianAuthorization,
  reservasApi,
  summarize,
  useReservas,
  withReview,
  type Payment,
  type PaymentReview,
  type Registration,
} from '../../../../shared/reservas';
import { formatDate, formatMoney } from '../../../../shared/utils/format';
import { useAdminUi } from '../../context/AdminUiContext';
import { motivosRechazo, otroMotivo } from '../../data/pagos/motivos';
import { classNames } from '../../utils/comun/classNames';

type Filter = PaymentReview | 'Todos';

type Item = { registration: Registration; payment: Payment };

/** Lo que la encargada decide sobre un pago por revisar; solo "Deshacer" lo regresa a revisión. */
type Decision = Exclude<PaymentReview, 'Por revisar'>;

type LastAction = {
  registrationId: string;
  paymentId: string;
  review: PaymentReview;
  reason: string | null;
  message: string;
};

const filters: Filter[] = ['Por revisar', 'Aprobado', 'Rechazado', 'Todos'];

const filterLabels: Record<Filter, string> = {
  'Por revisar': 'Por revisar',
  Aprobado: 'Aprobados',
  Rechazado: 'Rechazados',
  Todos: 'Todos',
};

function byQueueOrder(a: Item, b: Item) {
  const pendingFirst =
    Number(b.payment.review === 'Por revisar') - Number(a.payment.review === 'Por revisar');
  if (pendingFirst) return pendingFirst;
  return a.payment.review === 'Por revisar'
    ? a.payment.date.localeCompare(b.payment.date)
    : b.payment.date.localeCompare(a.payment.date);
}

function decisionMessage(name: string, review: Decision, nextStatus: string) {
  if (review === 'Aprobado')
    return (
      'Pago de ' +
      name +
      ' aprobado. Inscripción: ' +
      nextStatus +
      '. Se le envía un aviso por correo.'
    );
  return 'Pago de ' + name + ' rechazado. Se le envía un aviso por correo.';
}

function amountCheck(registration: Registration, payment: Payment) {
  const expected = getExpectedAmount(registration, payment);
  const difference = payment.amount - expected;

  if (difference === 0) {
    return {
      ok: true,
      className: 'review-check is-ok',
      icon: 'check' as const,
      expected: formatMoney(expected),
      message: 'El monto esperado coincide con este concepto (' + formatMoney(expected) + ').',
    };
  }

  return {
    ok: false,
    className: 'review-check is-warn',
    icon: 'info' as const,
    expected: formatMoney(expected),
    message:
      'Este pago es de ' +
      formatMoney(Math.abs(difference)) +
      (difference < 0
        ? ' menos. Si lo apruebas, cuenta como abono y el resto queda pendiente.'
        : ' más.'),
  };
}

function panelView(item: Item, today: string) {
  const { registration, payment } = item;
  const summary = summarize(registration, today);
  const approved = summarize(withReview(registration, payment.id, 'Aprobado'), today);
  const paidBefore = summary.paid - (payment.review === 'Aprobado' ? payment.amount : 0);

  return {
    concept: payment.concept,
    amount: formatMoney(payment.amount),
    person: fullName(registration) + ' · ' + registration.id,
    review: payment.review,
    check: amountCheck(registration, payment),
    facts: [
      { label: 'Vía de pago', value: metodoPago.label },
      { label: 'Fecha del pago', value: formatDate(payment.date) },
      {
        label: 'Plan elegido',
        value:
          registration.plan === 'total'
            ? 'Pago total'
            : 'Separación · saldo el ' + formatDate(registration.commitmentDate || today),
      },
      { label: 'Celular', value: formatPhone(registration.phone) },
      { label: 'Total de la inscripción', value: formatMoney(summary.total) },
      { label: 'Aprobado antes de este pago', value: formatMoney(paidBefore) },
      {
        label: 'Grupo',
        value: registration.companion ? 'Titular + acompañante' : 'Solo titular',
      },
    ],
    // Titular menor sin autorización: el servicio no deja aprobar hasta marcarla en el detalle.
    guardianWarning: needsGuardianAuthorization(registration, today)
      ? 'El titular es menor de edad y falta la autorización firmada de su responsable. Márcala como recibida en el detalle de la inscripción antes de aprobar.'
      : null,
    approvedStatus: approved.status,
    approvedText:
      approved.balance > 0 ? 'Saldo ' + formatMoney(approved.balance) : 'Inscripción pagada',
    rejectedStatus: getStatus(withReview(registration, payment.id, 'Rechazado'), today),
    isPending: payment.review === 'Por revisar',
    decidedText:
      payment.review === 'Aprobado'
        ? 'Este pago ya se aprobó y cuenta en el saldo de la inscripción.'
        : // El motivo de caducidad del servidor y el texto libre pueden traer ya su punto final.
          'Motivo del rechazo: ' +
          (payment.rejectionReason || 'sin especificar').replace(/\.+$/, '') +
          '.',
  };
}

export function usePaymentReview() {
  const { registrations, today } = useReservas();
  const { focusPaymentId, setFocusPaymentId } = useAdminUi();
  const [filter, setFilter] = useState<Filter>('Por revisar');
  const [selectedId, setSelectedId] = useState<string | null>(focusPaymentId);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (focusPaymentId) setFocusPaymentId(null);
  }, [focusPaymentId, setFocusPaymentId]);

  const all: Item[] = registrations.flatMap((registration) =>
    registration.payments.map((payment) => ({ registration, payment })),
  );
  const count = (value: Filter) =>
    all.filter((item) => value === 'Todos' || item.payment.review === value).length;
  const items = all
    .filter((item) => filter === 'Todos' || item.payment.review === filter)
    .sort(byQueueOrder);
  const current = items.find((item) => item.payment.id === selectedId) || items[0];
  const pendingTotal = all
    .filter((item) => item.payment.review === 'Por revisar')
    .reduce((sum, item) => sum + item.payment.amount, 0);
  const rejection = reason === otroMotivo ? note.trim() : reason;

  function resetRejection() {
    setError('');
    setRejecting(false);
    setReason('');
    setNote('');
  }

  function selectFilter(value: Filter) {
    setFilter(value);
    setSelectedId(null);
    resetRejection();
  }

  function selectPayment(id: string) {
    setSelectedId(id);
    resetRejection();
    if (window.matchMedia('(max-width: 900px)').matches) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async function decide(review: Decision, rejectionReason: string | null = null) {
    if (!current || busy) return;
    const { registration, payment } = current;
    const next = getStatus(withReview(registration, payment.id, review), today);

    setBusy(true);
    const result = await reservasApi.revisarPago(
      registration.id,
      payment.id,
      review,
      rejectionReason,
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLastAction({
      registrationId: registration.id,
      paymentId: payment.id,
      review: payment.review,
      reason: payment.rejectionReason,
      message: decisionMessage(fullName(registration), review, next),
    });
    setSelectedId(null);
    resetRejection();
  }

  async function undo() {
    if (!lastAction || busy) return;
    setBusy(true);
    const result = await reservasApi.revisarPago(
      lastAction.registrationId,
      lastAction.paymentId,
      lastAction.review,
      lastAction.reason,
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSelectedId(lastAction.paymentId);
    if (filter !== 'Todos' && filter !== lastAction.review) setFilter(lastAction.review);
    setLastAction(null);
  }

  function confirmReject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rejection) decide('Rechazado', rejection);
  }

  return {
    pendingLabel: count('Por revisar') + ' por revisar · ' + formatMoney(pendingTotal),
    filters: filters.map((value) => ({
      value,
      label: filterLabels[value],
      count: count(value),
      pressed: filter === value,
      className: classNames(filter === value && 'is-active'),
    })),
    selectFilter,
    toast: lastAction?.message ?? null,
    undo,
    dismissToast: () => setLastAction(null),
    isEmpty: !current,
    emptyTitle: filter === 'Por revisar' ? 'Todo al día' : 'Sin pagos en esta vista',
    emptyText:
      filter === 'Por revisar'
        ? 'No quedan pagos por confirmar.'
        : 'Cambia el filtro para ver otros pagos.',
    queue: items.map(({ registration, payment }) => {
      const selected = payment.id === current?.payment.id;
      return {
        id: payment.id,
        name: fullName(registration),
        amount: formatMoney(payment.amount),
        detail: payment.concept + ' · ' + formatDate(payment.date),
        review: payment.review,
        showStatus: payment.review !== 'Por revisar',
        mismatch:
          payment.review === 'Por revisar' &&
          payment.amount !== getExpectedAmount(registration, payment),
        current: selected ? ('true' as const) : undefined,
        className: classNames('review-item', selected && 'is-selected'),
      };
    }),
    selectPayment,
    panel: current ? panelView(current, today) : null,
    panelKey: current?.payment.id ?? '',
    panelRef,
    rejecting,
    reasons: [...motivosRechazo, otroMotivo].map((option) => ({
      value: option,
      checked: reason === option,
      className: classNames(reason === option && 'is-checked'),
    })),
    isOtherReason: reason === otroMotivo,
    note,
    canReject: rejection.length > 0,
    startReject: () => setRejecting(true),
    cancelReject: resetRejection,
    selectReason: setReason,
    changeNote: (event: ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value),
    confirmReject,
    error,
    busy,
    verifyText: 'Confirma en la llave Bre-B que el dinero llegó antes de aprobar.',
    approve: () => decide('Aprobado'),
    footLabel: items.length + ' pagos en esta vista · los más antiguos primero',
    detailOpen: detailOpen && !!current,
    detailTitle: current ? fullName(current.registration) : 'Inscripción',
    detailRegistrationId: detailOpen && current ? current.registration.id : null,
    openDetail: () => setDetailOpen(true),
    closeDetail: () => setDetailOpen(false),
  };
}

export type PaymentReviewView = ReturnType<typeof usePaymentReview>;
