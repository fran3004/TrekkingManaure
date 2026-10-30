import Icon from '../../../../../shared/components/Icon';
import { useResumenReserva } from '../../../hooks';
import type { Cotizacion, Estadia } from '../../../types/reserva';

type Props = {
  stay: Estadia;
  planDate: string;
  quote: Cotizacion;
};

export default function ResumenReserva(props: Props) {
  const view = useResumenReserva(props);

  return (
    <aside className="summary reveal" data-delay="1" aria-label="Resumen de la reserva">
      <div className="summary__head">
        <h3>Tu reserva</h3>
        <span>Resumen</span>
      </div>
      <div className="sum-row">
        <span>Inscripción + kit</span>
        <strong>{view.titular}</strong>
      </div>
      {view.acompanante && (
        <div className="sum-row sum-row--dyn">
          <span>Acompañante</span>
          <strong>{view.acompanante}</strong>
        </div>
      )}
      {view.extras && (
        <div className="sum-row sum-row--dyn">
          <span>Actividades extra</span>
          <strong>{view.extras}</strong>
        </div>
      )}
      {view.hotel && (
        <div className="sum-row sum-row--dyn">
          <span>Hotel antes del evento</span>
          <strong>{view.hotel}</strong>
        </div>
      )}
      <div className="sum-row">
        <span>Estadía</span>
        <strong>{view.stay}</strong>
      </div>
      <div className="sum-row">
        <span>Pagas ahora</span>
        <strong>{view.ahora}</strong>
      </div>
      {view.saldo && (
        <div className="sum-row">
          <span>{view.saldo.label}</span>
          <strong>{view.saldo.amount}</strong>
        </div>
      )}
      <div className="sum-total">
        <span>Total</span>
        <strong>{view.total}</strong>
      </div>
      <p className="summary__note">
        <Icon name="info" />
        <span>
          El pago es por llave Bre-B. Al registrar tu reserva recibes un código; la organización
          confirma tu cupo cuando verifica el pago. El restante se paga a más tardar el {view.plazo}
          .
        </span>
      </p>
      <button className="btn btn--gold btn--block" type="button" onClick={view.focusForm}>
        Reservar cupo
      </button>
      <a href="#costos" className="btn btn--ghost btn--block summary__payments">
        Ver esquema de pagos
      </a>
      <div className="summary__channels">
        <span>
          <Icon name="whatsapp" /> WhatsApp
        </span>
        <span>
          <Icon name="calendar" /> Bre-B
        </span>
        <span>
          <Icon name="lock" /> Datos por WhatsApp
        </span>
      </div>
    </aside>
  );
}
