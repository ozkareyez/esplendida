"use client";

import Link from "next/link";
import { Check, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast, type ToastVariant } from "@/hooks/use-toast";

const VARIANT_ICON: Record<ToastVariant, typeof Check> = {
  success: Check,
  error: CircleAlert,
  info: Info,
};

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-success/30 bg-success/10 text-success",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-primary/25 bg-primary/10 text-primary",
};

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const dismissToast = useToast((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96">
      {toasts.map((toast) => {
        const variant = toast.variant ?? "success";
        const Icon = VARIANT_ICON[variant];
        return (
          <div
            key={toast.id}
            role={variant === "error" ? "alert" : "status"}
            aria-live={variant === "error" ? "assertive" : "polite"}
            className="pointer-events-auto w-full overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-lift)] animate-slide-up"
          >
            <div className="flex items-start gap-3 p-4">
              <span
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                  VARIANT_STYLES[variant]
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-semibold text-foreground">{toast.title}</p>
                {toast.description && (
                  <p className="clamp-2 text-body-sm text-muted-foreground">
                    {toast.description}
                  </p>
                )}
                {toast.href && (
                  <Link
                    href={toast.href}
                    onClick={() => dismissToast(toast.id)}
                    className="mt-2 inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary transition-colors hover:text-primary-dark"
                  >
                    {toast.hrefLabel ?? "Ver más"}
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Cerrar notificación"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
