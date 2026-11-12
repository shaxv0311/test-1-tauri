import { AlertTriangle } from "lucide-react";
import { forwardRef } from "react";

type ModalProps = {
  open?: boolean;
  title?: string;
  message?: React.ReactNode;
  buttons?: React.ReactNode;
  onClose?: () => void;
  maxWidth?: string;
};

const closeModal = (
  e: React.MouseEvent<HTMLDialogElement>,
  onClose?: () => void,
) => {
  if (e.target === e.currentTarget) {
    onClose?.();
  }
};

const Modal = forwardRef<HTMLDialogElement, ModalProps>(
  ({ open, title, message, buttons, onClose, maxWidth = "modal-panel" }, ref) => {
    if (!open) return null;

    const maxWidthClass =
      maxWidth === "modal-panel-sm" || maxWidth === "modal-panel-md" || maxWidth === "modal-panel-lg"
        ? maxWidth
        : "";

    return (
      <dialog
        ref={ref}
        open
        onClick={(e) => closeModal(e, onClose)}
        className="modal-overlay modal-overlay-dark"
      >
        <div
          className={`alert-modal ${maxWidthClass}`}
        >
          <AlertTriangle size={20} className="text-red" />
          {/* Header */}

          <h3 className="alert-modal-title">{title}</h3>

          {message && <div className="alert-modal-message">{message}</div>}

          {buttons && (
            <div className="alert-modal-actions">{buttons}</div>
          )}
        </div>
      </dialog>
    );
  },
);

export default Modal;
