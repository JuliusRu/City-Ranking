"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextValue {
  toast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingRef = useRef(4000);
  const startRef = useRef(Date.now());

  // Start auto-dismiss
  if (!timerRef.current) {
    timerRef.current = setTimeout(() => onRemove(toast.id), remainingRef.current);
    startRef.current = Date.now();
  }

  function handleMouseEnter() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      remainingRef.current -= Date.now() - startRef.current;
      timerRef.current = null;
    }
  }

  function handleMouseLeave() {
    startRef.current = Date.now();
    timerRef.current = setTimeout(
      () => onRemove(toast.id),
      Math.max(remainingRef.current, 500)
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
        toast.type === "success"
          ? "bg-green-600 text-white"
          : toast.type === "error"
            ? "bg-destructive text-white"
            : "bg-card text-foreground border border-border"
      }`}
    >
      {toast.type === "success" && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M13.333 4L6 11.333 2.667 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {toast.type === "error" && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      <span>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-1 opacity-60 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M10.5 3.5l-7 7M3.5 3.5l7 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: Toast["type"] = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
