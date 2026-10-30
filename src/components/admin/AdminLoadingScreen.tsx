"use client";

type AdminLoadingScreenProps = {
  label?: string;
  hint?: string;
  compact?: boolean;
};

export default function AdminLoadingScreen({
  label = "Cargando datos...",
  hint = "Esto solo toma un momento",
  compact = false,
}: AdminLoadingScreenProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm",
        compact ? "min-h-[240px] px-6 py-10" : "min-h-[min(70vh,36rem)] px-6 py-14",
      ].join(" ")}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-[3px] border-zinc-200" />
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-zinc-950" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-950" />
      </div>
      <p className="mt-5 text-sm font-bold text-zinc-900">{label}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}
