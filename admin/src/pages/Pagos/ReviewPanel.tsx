import Icon from '../../../../shared/components/Icon';
import StatusBadge from '../../components/comun/StatusBadge';
import type { PaymentReviewView } from '../../hooks';

export default function ReviewPanel({ review }: { review: PaymentReviewView }) {
  const panel = review.panel;

  if (!panel) return null;

  return (
    <section className="review-panel" ref={review.panelRef} aria-label="Pago seleccionado">
      <header className="review-panel__head">
        <div>
          <small>{panel.concept}</small>
          <h2>{panel.amount}</h2>
          <span>{panel.person}</span>
        </div>
        <StatusBadge status={panel.review} />
      </header>

      <div className={panel.check.className}>
        <Icon name={panel.check.icon} />
        {panel.check.ok ? (
          <span>{panel.check.message}</span>
        ) : (
          <span>
            Se esperaban <strong>{panel.check.expected}</strong>. {panel.check.message}
          </span>
        )}
      </div>

      {panel.guardianWarning && (
        <div className="review-check is-warn" role="status">
          <Icon name="info" />
          <span>{panel.guardianWarning}</span>
        </div>
      )}

      <dl className="review-facts">
        {panel.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="review-receipt">
        <Icon name="shield" />
        <span>
          <strong>Pago por confirmar</strong>
          <small>{review.verifyText}</small>
        </span>
      </div>

      {review.error && (
        <p role="alert" className="admin-error">
          {review.error}
        </p>
      )}

      {panel.isPending && !review.rejecting && (
        <>
          <div className="review-outcome">
            <div>
              <small>Si apruebas</small>
              <StatusBadge status={panel.approvedStatus} />
              <span>{panel.approvedText}</span>
            </div>
            <div>
              <small>Si rechazas</small>
              <StatusBadge status={panel.rejectedStatus} />
              <span>Se le notifica por WhatsApp</span>
            </div>
          </div>
          <div className="review-actions">
            <button type="button" className="btn btn--ghost" onClick={review.startReject}>
              <Icon name="close" /> Rechazar
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={review.approve}
              disabled={review.busy}
            >
              <Icon name="check" /> Aprobar pago
            </button>
          </div>
        </>
      )}

      {panel.isPending && review.rejecting && (
        <form className="review-reject" onSubmit={review.confirmReject}>
          <fieldset>
            <legend>¿Por qué rechazas este pago?</legend>
            {review.reasons.map((reason) => (
              <label key={reason.value} className={reason.className}>
                <input
                  type="radio"
                  name="motivo"
                  value={reason.value}
                  checked={reason.checked}
                  onChange={() => review.selectReason(reason.value)}
                />
                {reason.value}
              </label>
            ))}
          </fieldset>
          {review.isOtherReason && (
            <label className="review-note">
              Describe el motivo
              <textarea
                required
                autoFocus
                maxLength={160}
                rows={2}
                value={review.note}
                onChange={review.changeNote}
              />
            </label>
          )}
          <p>
            La inscripción quedará como <StatusBadge status={panel.rejectedStatus} />
          </p>
          <small className="review-reject__hint">
            El motivo queda guardado en su historial para explicárselo por WhatsApp.
          </small>
          <div className="review-actions">
            <button type="button" className="btn btn--ghost" onClick={review.cancelReject}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={!review.canReject || review.busy}
            >
              Confirmar rechazo
            </button>
          </div>
        </form>
      )}

      {!panel.isPending && <p className="review-decided">{panel.decidedText}</p>}

      <button
        type="button"
        className="admin-text-link review-detail-link"
        onClick={review.openDetail}
      >
        Ver inscripción completa <Icon name="arrow" />
      </button>
    </section>
  );
}
