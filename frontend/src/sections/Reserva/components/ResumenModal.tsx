import Icon from '../../../../../shared/components/Icon';
import { useResumenModal } from '../../../hooks';
import type { FilaResumen, ResumenReservaTexto } from '../../../types/reserva';
import './ResumenModal.css';

type Props = {
  resumen: ResumenReservaTexto;
  estado: 'revision' | 'enviando' | 'registrada';
  error: string;
  /** WhatsApp ya se abrió al confirmar: no hace falta ofrecer el enlace. */
  whatsappAbierto: boolean;
  onConfirm: () => void;
  onBack: () => void;
};

function Lista({ filas }: { filas: FilaResumen[] }) {
  return (
    <dl className="resumen-lista">
      {filas.map((fila) => (
        <div className="resumen-fila" key={fila.label}>
          <dt>{fila.label}</dt>
          <dd>{fila.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ResumenModal({
  resumen,
  estado,
  error,
  whatsappAbierto,
  onConfirm,
  onBack,
}: Props) {
  const view = useResumenModal(resumen);

  return (
    <div className="resumen-modal">
      {view.codigo ? (
        <div className="resumen-exito" role="status">
          <Icon name="check" />
          <div>
            <small>Código de reserva</small>
            <strong>{view.codigo}</strong>
            <p>{view.confirmacion}</p>
            {whatsappAbierto && <p>Abrimos WhatsApp con tus datos: envíalos para terminar.</p>}
          </div>
        </div>
      ) : (
        <p className="resumen-modal__intro">
          Revisa tu información. Al confirmar, tu reserva queda registrada y pendiente de pago.
        </p>
      )}

      <section className="resumen-sec">
        <h4>Participante</h4>
        <Lista filas={view.participante} />
      </section>

      <section className="resumen-sec">
        <h4>Reserva</h4>
        <Lista filas={view.reserva} />
      </section>

      <section className="resumen-sec">
        <h4>Acompañante</h4>
        {view.acompanante ? <Lista filas={view.acompanante} /> : <p>No llevas acompañante.</p>}
      </section>

      <section className="resumen-sec resumen-sec--pago">
        <h4>Pagos</h4>
        <Lista filas={view.pagos} />
      </section>

      <p className="resumen-metodo__elegido" role="status">
        Método de pago: <strong>{view.metodoPago}</strong>
      </p>
      {view.avisoMenor && <p className="form-aviso">{view.avisoMenor}</p>}
      <p className="form-aviso">{view.avisoHoja}</p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {estado === 'registrada' ? (
        <div className="resumen-acciones">
          {view.whatsapp && !whatsappAbierto && (
            <a className="btn btn--primary" href={view.whatsapp} target="_blank" rel="noreferrer">
              Enviar mis datos por WhatsApp <Icon name="whatsapp" />
            </a>
          )}
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            Cerrar
          </button>
        </div>
      ) : (
        <div className="resumen-acciones">
          <button
            className="btn btn--primary"
            type="button"
            onClick={onConfirm}
            disabled={estado === 'enviando'}
            aria-busy={estado === 'enviando'}
          >
            {estado === 'enviando' ? 'Registrando…' : 'Confirmar y enviar por WhatsApp'}{' '}
            <Icon name="whatsapp" />
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onBack}
            disabled={estado === 'enviando'}
          >
            Volver al formulario
          </button>
        </div>
      )}
    </div>
  );
}
