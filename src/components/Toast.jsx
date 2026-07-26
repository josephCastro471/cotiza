import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const mostrar = useCallback((mensaje, opciones = {}) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ mensaje, ...opciones });
    timeoutRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 bg-ink-900 text-white text-small rounded-control px-4 py-2.5 shadow-[var(--shadow-popover)]"
        >
          {toast.mensaje}
          {toast.deshacer && (
            <button onClick={toast.deshacer} className="ml-3 underline">
              Deshacer
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
