import { useToasts } from '../state/ToastContext'

/** Renders queued toasts. The region is polite rather than assertive: these
 * are confirmations, not interruptions. */
export function Toaster() {
  const { toasts, dismissToast } = useToasts()

  return (
    <div className="toaster" role="region" aria-label="Notifications">
      <ul className="toaster__list" aria-live="polite">
        {toasts.map((toast) => (
          <li key={toast.id} className={`toast toast--${toast.tone}`}>
            <span className="toast__message">{toast.message}</span>

            <span className="toast__controls">
              {toast.action ? (
                <button
                  type="button"
                  className="button button--ghost button--small"
                  onClick={() => {
                    toast.action?.onAction()
                    dismissToast(toast.id)
                  }}
                >
                  {toast.action.label}
                </button>
              ) : null}

              <button
                type="button"
                className="toast__dismiss"
                onClick={() => dismissToast(toast.id)}
                aria-label={`Dismiss notification: ${toast.message}`}
              >
                <span aria-hidden="true">×</span>
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
