import './Pagos.css';
import Icon from '../../../../shared/components/Icon';
import Modal from '../../../../shared/components/Modal';
import RegistrationDetail from '../../components/participantes/RegistrationDetail';
import StatusBadge from '../../components/comun/StatusBadge';
import { usePaymentReview } from '../../hooks';
import ReviewPanel from './ReviewPanel';

export default function Pagos() {
  const review = usePaymentReview();

  return (
    <>
      <div className="admin-page-head">
        <div>
          <span className="eyebrow">Claridad en cada inscripción</span>
          <h1>
            Revisión de <em>pagos</em>
          </h1>
          <p>Confirma en la llave Bre-B que llegó cada pago esperado y apruébalo o recházalo.</p>
        </div>
        <span className="admin-pill admin-pill--warm">{review.pendingLabel}</span>
      </div>

      <article className="admin-panel">
        <div className="admin-status-filters" role="group" aria-label="Filtrar pagos">
          {review.filters.map((filter) => (
            <button
              type="button"
              aria-pressed={filter.pressed}
              className={filter.className}
              key={filter.value}
              onClick={() => review.selectFilter(filter.value)}
            >
              {filter.label}
              <span>{filter.count}</span>
            </button>
          ))}
        </div>

        {review.toast && (
          <div className="review-toast" role="status">
            <Icon name="check" />
            <span>{review.toast}</span>
            <button
              type="button"
              className="review-toast__close"
              aria-label="Cerrar aviso"
              onClick={review.dismissToast}
            >
              <Icon name="close" />
            </button>
          </div>
        )}

        {review.isEmpty ? (
          <div className="empty-state">
            <Icon name="check" />
            <h3>{review.emptyTitle}</h3>
            <p>{review.emptyText}</p>
          </div>
        ) : (
          <div className="review-layout">
            <ul className="review-queue" aria-label="Pagos de esta vista">
              {review.queue.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={item.className}
                    aria-current={item.current}
                    onClick={() => review.selectPayment(item.id)}
                  >
                    <span className="review-item__top">
                      <strong>{item.name}</strong>
                      <span>{item.amount}</span>
                    </span>
                    <span className="review-item__sub">{item.detail}</span>
                    <span className="review-item__tags">
                      {item.showStatus && <StatusBadge status={item.review} />}
                      {item.mismatch && <span className="review-flag">Monto distinto</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <ReviewPanel key={review.panelKey} review={review} />
          </div>
        )}

        <div className="admin-panel-foot">
          <span>{review.footLabel}</span>
          <span>Sin transacciones reales</span>
        </div>
      </article>

      <Modal
        open={review.detailOpen}
        title={review.detailTitle}
        onClose={review.closeDetail}
        className="admin-detail-modal"
      >
        {review.detailRegistrationId && (
          <RegistrationDetail registrationId={review.detailRegistrationId} />
        )}
      </Modal>
    </>
  );
}
