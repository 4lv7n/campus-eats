'use client';

import { createContext, useCallback, useContext, useState } from 'react';

type ToastKind = 'success' | 'error';
interface Toast { id: number; kind: ToastKind; text: string }

const ToastContext = createContext<(kind: ToastKind, text: string) => void>(() => undefined);

// Small pop-up messages ("Added to cart") shown at the bottom of the screen.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((kind: ToastKind, text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto max-w-md rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
              t.kind === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
