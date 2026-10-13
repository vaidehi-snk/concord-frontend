import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

const ToastCtx = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, { tone = 'ok', ms = 3800 } = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message: typeof message === 'string' ? message : String(message?.message || message), tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(92vw,380px)] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="animate-in pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-raised/95 px-4 py-3 text-sm text-ink shadow-[0_18px_40px_-18px_rgba(27,36,51,0.35)] ">
            {t.tone === 'error' ? <AlertTriangle size={18} className="mt-0.5 shrink-0 text-stamp" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-ok" />}
            <span className="flex-1">{t.message}</span>
            <button aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
