import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastType = "info" | "success" | "error";

export interface IToastItem {
  id: string;
  message: string;
  type: ToastType;
  durationMs: number;
}

export interface IToastContextValue {
  toasts: IToastItem[];
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  dismissToast: (id: string) => void;
}

export interface IToastProviderProps {
  children: ReactNode;
}

const DEFAULT_TOAST_DURATION_MS = 4000 as const;
const DEFAULT_TOAST_TYPE: ToastType = "info" as const;

export const ToastContext = createContext<IToastContextValue | undefined>(
  undefined,
);

/**
 * Context provider managing non-blocking, auto-dismissing toast notifications.
 */
export function ToastProvider({ children }: IToastProviderProps) {
  const [toasts, setToasts] = useState<IToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismissToast = useCallback((id: string): void => {
    const existingTimer = timeoutsRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = DEFAULT_TOAST_TYPE,
      durationMs: number = DEFAULT_TOAST_DURATION_MS,
    ): void => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newToast: IToastItem = { id, message, type, durationMs };

      setToasts((prev) => [...prev, newToast]);

      if (durationMs > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, durationMs);
        timeoutsRef.current.set(id, timer);
      }
    },
    [dismissToast],
  );

  useEffect(() => {
    const timers = timeoutsRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const contextValue = useMemo<IToastContextValue>(
    () => ({
      toasts,
      showToast,
      dismissToast,
    }),
    [toasts, showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}

export default ToastProvider;
