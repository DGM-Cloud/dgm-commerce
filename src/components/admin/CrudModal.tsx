"use client";

import { useId, type FormEvent, type ReactNode } from "react";

interface CrudModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  headerMeta?: ReactNode;
  saving: boolean;
  hasUnsavedChanges?: boolean;
  maxWidthClass?: string;
  submitLabel?: string;
  dense?: boolean;
  footerStart?: ReactNode;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}

export default function CrudModal({
  isOpen,
  title,
  subtitle,
  headerMeta,
  saving,
  hasUnsavedChanges = false,
  maxWidthClass = "max-w-6xl",
  submitLabel = "Guardar",
  dense = false,
  footerStart,
  onClose,
  onSubmit,
  children,
}: CrudModalProps) {
  const formId = useId();
  if (!isOpen) return null;

  function handleRequestClose() {
    if (saving) return;

    if (hasUnsavedChanges) {
      const shouldClose = window.confirm("Hay cambios sin guardar. ¿Salir de todas formas?");
      if (!shouldClose) return;
    }

    onClose();
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/40 px-3 backdrop-blur-[3px] ${
        dense ? "py-3 sm:py-4" : "py-4 sm:py-6"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleRequestClose();
      }}
    >
      <div
        className={`flex w-full ${maxWidthClass} flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-[#f7f4ef] shadow-[0_24px_64px_rgba(15,23,42,0.18)] ${
          dense ? "max-h-[calc(100vh-1.5rem)]" : "max-h-[calc(100vh-2rem)]"
        }`}
      >
        <div
          className={`flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200/80 bg-white ${
            dense ? "px-4 py-3" : "px-5 py-3.5 sm:px-6"
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{title}</p>
            {subtitle ? (
              <h3 className="mt-0.5 truncate text-base font-semibold tracking-tight text-zinc-950">{subtitle}</h3>
            ) : (
              <h3 className="mt-0.5 truncate text-base font-semibold tracking-tight text-zinc-950">{title}</h3>
            )}
            {headerMeta ? <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{headerMeta}</div> : null}
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            disabled={saving}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60"
            aria-label="Cerrar"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className={`min-h-0 flex-1 overflow-y-auto ${dense ? "px-4 py-3" : "px-5 py-4 sm:px-6 sm:py-5"}`}>
          <form id={formId} className="space-y-0" onSubmit={onSubmit}>
            {children}
          </form>
        </div>

        <div
          className={`flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-zinc-200/80 bg-white ${
            dense ? "px-4 py-2.5" : "px-5 py-3 sm:px-6"
          }`}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2">{footerStart}</div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleRequestClose}
              disabled={saving}
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form={formId}
              disabled={saving}
              className="h-9 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60"
            >
              {saving ? "Guardando…" : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
