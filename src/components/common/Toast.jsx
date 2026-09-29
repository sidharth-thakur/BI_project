import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const TONES = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

/**
 * Lightweight toast stack. Dismiss manually or let the host auto-dismiss.
 */
export default function ToastStack({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = TONES[toast.tone] ?? CheckCircle2;
        return (
          <div key={toast.id} className={`toast toast-${toast.tone ?? "success"}`}>
            <span className="toast-icon" aria-hidden="true">
              <Icon size={16} />
            </span>
            <div className="toast-body">
              <p className="toast-title">{toast.title}</p>
              {toast.message && <p className="toast-message">{toast.message}</p>}
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
