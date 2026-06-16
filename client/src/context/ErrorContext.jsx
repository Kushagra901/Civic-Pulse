import { createContext, useContext, useState, useCallback, useRef } from "react";

const ErrorContext = createContext(null);

export function ErrorProvider({ children }) {
  const [toasts, setToasts] = useState([]);   // [ { id, message, type } ]
  const counterRef = useRef(0);

  const addToast = useCallback((message, type = "error", duration = 5000) => {
    const id = ++counterRef.current;

    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Convenience methods
  const showError   = useCallback((msg, duration) =>
    addToast(msg, "error", duration),   [addToast]);
  const showSuccess = useCallback((msg, duration) =>
    addToast(msg, "success", duration), [addToast]);
  const showWarning = useCallback((msg, duration) =>
    addToast(msg, "warning", duration), [addToast]);

  // Handles an unknown thrown value — ApiError, TypeError, string, etc.
  const handleError = useCallback((err) => {
    if (err?.status === 401) {
      // Let the auth flow handle this — don't show a toast
      return;
    }
    if (err?.status === 403) {
      showError("You don't have permission to do that.");
      return;
    }
    if (err?.status >= 500) {
      showError("Something went wrong on our end. Please try again.");
      return;
    }
    showError(err?.message || "An unexpected error occurred.");
  }, [showError]);

  return (
    <ErrorContext.Provider value={{ showError, showSuccess, showWarning, handleError, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ErrorContext.Provider>
  );
}

export function useError() {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error("useError must be used inside <ErrorProvider>");
  return ctx;
}

const TOAST_STYLES = {
  error:   "bg-red-50   border-red-200   text-red-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

const TOAST_ICONS = {
  error:   "✕",
  success: "✓",
  warning: "⚠",
};

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2
                    max-w-sm w-full pointer-events-none"
         role="region" aria-label="Notifications">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border
                      shadow-sm pointer-events-auto
                      animate-in slide-in-from-right-4 duration-200
                      ${TOAST_STYLES[toast.type]}`}
          role="alert"
        >
          <span className="text-sm font-medium flex-shrink-0 mt-px">
            {TOAST_ICONS[toast.type]}
          </span>
          <p className="text-sm flex-1 leading-snug">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-sm opacity-50 hover:opacity-100 transition-opacity
                       flex-shrink-0 ml-auto"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
