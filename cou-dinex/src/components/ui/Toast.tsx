"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/* ========== Toast Provider ========== */
const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-4 right-4 z-[var(--z-toast)]",
      "flex flex-col gap-2",
      "max-h-screen w-full max-w-sm",
      "outline-none",
      "md:bottom-6 md:right-6",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

/* ========== Toast ========== */
type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>, "type"> {
  toastType?: ToastType;
  title: string;
  description?: string;
}

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle  size={18} className="text-[var(--success)]" aria-hidden="true" />,
  error:   <AlertCircle  size={18} className="text-[var(--error)]"   aria-hidden="true" />,
  warning: <AlertTriangle size={18} className="text-[var(--warning)]" aria-hidden="true" />,
  info:    <Info          size={18} className="text-[var(--info)]"    aria-hidden="true" />,
};

const bgMap: Record<ToastType, string> = {
  success: "border-l-[var(--success)]",
  error:   "border-l-[var(--error)]",
  warning: "border-l-[var(--warning)]",
  info:    "border-l-[var(--info)]",
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ className, toastType = "info", title, description, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      "group flex items-start gap-3",
      "bg-[var(--surface)] border border-[var(--border)] border-l-4",
      "rounded-[var(--radius-lg)] p-4",
      "shadow-[var(--shadow-xl)]",
      bgMap[toastType],
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[swipe=end]:animate-out",
      "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
      "data-[state=open]:slide-in-from-bottom-full data-[state=open]:sm:slide-in-from-bottom-full",
      className
    )}
    {...props}
  >
    <div className="shrink-0 mt-0.5">{iconMap[toastType]}</div>

    <div className="flex-1 min-w-0">
      <ToastPrimitive.Title className="text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </ToastPrimitive.Title>
      {description && (
        <ToastPrimitive.Description className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
          {description}
        </ToastPrimitive.Description>
      )}
    </div>

    <ToastPrimitive.Close
      className={cn(
        "shrink-0 h-6 w-6 rounded-[6px] flex items-center justify-center",
        "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
        "hover:bg-[var(--surface-secondary)]",
        "transition-colors",
        "opacity-0 group-hover:opacity-100",
        "focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
      )}
      aria-label="Dismiss notification"
    >
      <X size={12} aria-hidden="true" />
    </ToastPrimitive.Close>
  </ToastPrimitive.Root>
));
Toast.displayName = "Toast";

/* ========== Toast Context & Hook ========== */
interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  open: boolean;
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, "id" | "open">) => void;
  success: (title: string, description?: string) => void;
  error:   (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info:    (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastContextProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = React.useCallback(
    (opts: Omit<ToastItem, "id" | "open">) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { ...opts, id, open: true }]);
    },
    []
  );

  const contextValue = React.useMemo<ToastContextValue>(
    () => ({
      toast:   (opts) => addToast(opts),
      success: (title, desc) => addToast({ type: "success", title, description: desc }),
      error:   (title, desc) => addToast({ type: "error",   title, description: desc }),
      warning: (title, desc) => addToast({ type: "warning", title, description: desc }),
      info:    (title, desc) => addToast({ type: "info",    title, description: desc }),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      <ToastProvider>
        {children}
        {toasts.map((t) => (
          <Toast
            key={t.id}
            toastType={t.type}
            title={t.title}
            description={t.description}
            open={t.open}
            onOpenChange={(open) => {
              if (!open) {
                setToasts((prev) =>
                  prev.map((item) => (item.id === t.id ? { ...item, open: false } : item))
                );
                setTimeout(() => {
                  setToasts((prev) => prev.filter((item) => item.id !== t.id));
                }, 400);
              }
            }}
            duration={t.duration ?? 5000}
          />
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastContextProvider");
  return ctx;
}

export { Toast, ToastProvider, ToastViewport };
