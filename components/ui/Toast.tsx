"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastVariant = "default" | "success" | "danger" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextType {
  toast: (options: {
    title: string;
    description?: string;
    variant?: ToastVariant;
  }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      title,
      description,
      variant = "default",
    }: {
      title: string;
      description?: string;
      variant?: ToastVariant;
    }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, variant: "success" });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, variant: "danger" });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, variant: "info" });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      {/* Toast Render Viewport */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2"
      >
        {toasts.map((t) => {
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-sm transition-all duration-200 animate-in slide-in-from-bottom-3 ${
                t.variant === "success"
                  ? "bg-white border-[#CCE2D2] text-[#141413]"
                  : t.variant === "danger"
                  ? "bg-white border-[#F4CDCD] text-[#141413]"
                  : t.variant === "info"
                  ? "bg-white border-[#D0DDF0] text-[#141413]"
                  : "bg-white border-[#E8E8E3] text-[#141413]"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {t.variant === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-[#28633B]" />
                ) : t.variant === "danger" ? (
                  <AlertCircle className="w-4 h-4 text-[#B83838]" />
                ) : (
                  <Info className="w-4 h-4 text-[#B8532F]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#141413]">{t.title}</p>
                {t.description && (
                  <p className="text-[11px] text-[#6E6E69] mt-0.5 leading-snug">
                    {t.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss notification"
                className="text-[#8A8A85] hover:text-[#141413] p-0.5 rounded transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
