import type { InventorySummary } from "@/lib/admin-query";

type Props = {
  metrics: InventorySummary;
  onFilterStock?: (stock: "all" | "low" | "out" | "available") => void;
  activeStock?: string;
};

export default function InventoryMetricsBar({ metrics, onFilterStock, activeStock = "all" }: Props) {
  const replenish = metrics.lowStock + metrics.outOfStock;

  const items = [
    {
      key: "products",
      label: "Productos",
      value: metrics.totalProducts,
      hint: `${metrics.totalSkus} variantes`,
      stock: "all" as const,
      tone: "default" as const,
    },
    {
      key: "available",
      label: "Disponible",
      value: metrics.totalAvailable,
      hint: `${metrics.totalOnHand} en mano · ${metrics.totalReserved} reserv.`,
      stock: "available" as const,
      tone: "default" as const,
    },
    {
      key: "replenish",
      label: "Reponer",
      value: replenish,
      hint: `${metrics.lowStock} bajo · ${metrics.outOfStock} agotados`,
      stock: metrics.outOfStock > 0 ? ("out" as const) : ("low" as const),
      tone: replenish > 0 ? ("warn" as const) : ("default" as const),
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {items.map((item) => {
        const active =
          item.key === "products"
            ? activeStock === "all"
            : item.key === "replenish"
              ? activeStock === "low" || activeStock === "out"
              : activeStock === item.stock;
        const toneClass =
          item.tone === "warn"
            ? active
              ? "border-amber-400 bg-amber-50"
              : "border-amber-200 bg-amber-50/80"
            : active
              ? "border-zinc-900 bg-white"
              : "border-zinc-200 bg-white";

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              if (item.key === "products") onFilterStock?.("all");
              else if (item.key === "replenish") {
                onFilterStock?.(activeStock === "out" ? "low" : activeStock === "low" ? "all" : metrics.outOfStock > 0 ? "out" : "low");
              } else {
                onFilterStock?.(activeStock === item.stock ? "all" : item.stock);
              }
            }}
            className={`rounded-xl border px-4 py-3 text-left transition hover:border-zinc-400 ${toneClass}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{item.label}</p>
              <p className="text-2xl font-black tabular-nums tracking-tight text-zinc-950">{item.value}</p>
            </div>
            <p className="mt-1 text-xs text-zinc-500">{item.hint}</p>
          </button>
        );
      })}
    </section>
  );
}
