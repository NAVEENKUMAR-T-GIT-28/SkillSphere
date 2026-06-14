/**
 * ToastContext — global toast notification system.
 * Replaces all window.alert() and silent console.error calls.
 * Usage: const toast = useToast(); toast.success('Done'); toast.error('Oops');
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((message, type = 'success', duration = 4000) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const success = useCallback((msg) => add(msg, 'success'), [add]);
  const error   = useCallback((msg) => add(msg, 'error', 5000), [add]);

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-80 pointer-events-none"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="alert"
            className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg pointer-events-auto
              transition-all duration-300 text-sm font-medium
              ${toast.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
              }`}
          >
            {toast.type === 'success'
              ? <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              : <XCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
            }
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-current opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}