import { useContext } from "react";
import { ToastContext, type IToastContextValue } from "@/context/ToastContext";

const CONTEXT_OUTSIDE_ERROR = "useToast must be used within a ToastProvider" as const;

/**
 * Custom hook to access toast notification actions and active toasts.
 */
export function useToast(): IToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error(CONTEXT_OUTSIDE_ERROR);
  }
  return context;
}

export default useToast;
