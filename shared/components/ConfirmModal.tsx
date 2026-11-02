import type { ReactNode } from 'react';
import Modal from './Modal';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  busy: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** "¿Estás seguro?": nada ocurre hasta pulsar el botón de confirmar. El foco empieza en "No". */
export default function ConfirmModal({
  open,
  title,
  children,
  confirmLabel,
  busy,
  error,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal open={open} title={title} onClose={busy ? () => {} : onCancel} className="confirm-modal">
      <div className="confirm-modal__body">{children}</div>
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      <div className="modal__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onCancel}
          disabled={busy}
          autoFocus
        >
          No, volver
        </button>
        <button type="button" className="btn btn--primary" onClick={onConfirm} disabled={busy}>
          {busy ? 'Guardando…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
