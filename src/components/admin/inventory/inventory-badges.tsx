import type { AdminInventoryItem } from "@/lib/admin-data";

export function stockTone(available: number, threshold = 3): "ok" | "warn" | "danger" {
  if (available <= 0) return "danger";
  if (available <= threshold) return "warn";
  return "ok";
}

export function StockBadge({ value, tone }: { value: number; tone: "ok" | "warn" | "danger" }) {
  const classes = {
    ok: "bg-emerald-50 text-emerald-800",
    warn: "bg-amber-50 text-amber-800",
    danger: "bg-red-50 text-red-800",
  };

  return (
    <span className={`inline-flex min-w-9 items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${classes[tone]}`}>
      {value}
    </span>
  );
}

export function StatusBadge({ status }: { status: NonNullable<AdminInventoryItem["status"]> }) {
  const labels = {
    active: "Activo",
    draft: "Borrador",
    archived: "Archivado",
  };
  const classes = {
    active: "text-emerald-700 bg-emerald-50",
    draft: "text-zinc-600 bg-zinc-100",
    archived: "text-red-700 bg-red-50",
  };

  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${classes[status]}`}>{labels[status]}</span>;
}

export function formatPrice(value: number) {
  return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
