import type { AdminInventoryProduct } from "@/lib/admin-data";
import type { CatalogFormatSpec } from "@/lib/catalog/types";
import { catalogCollectionCode, catalogCompactDate, catalogSeriesLabel, resolveCatalogImageLayout } from "@/lib/catalog/catalog-utils";
import { brand } from "@/config/brand";

const SUBCOLLECTION_THEMES: Record<string, { accent: string; glow: string; gradient: string }> = {
  "Cristiano Ronaldo": {
    accent: "#ef4444",
    glow: "rgba(239,68,68,0.35)",
    gradient: "linear-gradient(135deg, #09090b 0%, #1c0a0a 42%, #450a0a 100%)",
  },
  "Lionel Messi": {
    accent: "#38bdf8",
    glow: "rgba(56,189,248,0.32)",
    gradient: "linear-gradient(135deg, #09090b 0%, #0c1a2e 45%, #172554 100%)",
  },
  Neymar: {
    accent: "#facc15",
    glow: "rgba(250,204,21,0.28)",
    gradient: "linear-gradient(135deg, #09090b 0%, #1a1508 45%, #422006 100%)",
  },
  Ronaldinho: {
    accent: "#a3e635",
    glow: "rgba(163,230,53,0.28)",
    gradient: "linear-gradient(135deg, #09090b 0%, #14210a 45%, #1a2e05 100%)",
  },
  Girlfriend: {
    accent: "#f472b6",
    glow: "rgba(244,114,182,0.32)",
    gradient: "linear-gradient(135deg, #09090b 0%, #2a0f1f 45%, #4a044e 100%)",
  },
  "Gym Humor": {
    accent: "#f97316",
    glow: "rgba(249,115,22,0.3)",
    gradient: "linear-gradient(135deg, #09090b 0%, #1c1208 45%, #431407 100%)",
  },
};

function themeFor(subcollection: string, collection: string) {
  return (
    SUBCOLLECTION_THEMES[subcollection] ?? {
      accent: "#fafafa",
      glow: "rgba(255,255,255,0.12)",
      gradient: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)",
    }
  );
}

export default function CatalogCoverPage({
  collection,
  subcollection,
  products,
  format,
  pageNumber,
  totalPages,
}: {
  collection: string;
  subcollection: string;
  products: AdminInventoryProduct[];
  format: CatalogFormatSpec;
  pageNumber: number;
  totalPages: number;
}) {
  const theme = themeFor(subcollection, collection);
  const heroImage = products[0] ? resolveCatalogImageLayout(products[0]).design : "";
  const isHorizontal = format.width >= format.height;

  return (
    <section
      data-catalog-page
      className="relative overflow-hidden text-white"
      style={{
        width: format.width,
        height: format.height,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        background: theme.gradient,
      }}
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 28%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05), transparent 24%)",
        }}
      />
      <div
        className="absolute -right-24 top-1/2 h-[140%] w-[62%] -translate-y-1/2 rounded-[4rem] opacity-30 blur-3xl"
        style={{ backgroundColor: theme.glow }}
      />

      <div className={`relative z-10 flex h-full ${isHorizontal ? "flex-row" : "flex-col"}`}>
        <div className={`flex flex-col justify-between ${isHorizontal ? "w-[58%] px-14 py-12" : "flex-1 px-10 py-10"}`}>
          <div>
            <div className="flex items-baseline justify-between gap-6">
              <span className="text-[13px] font-black uppercase tracking-[0.34em] text-white/85">{brand.name}®</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.34em] text-white/45">
                Collection {catalogCollectionCode(collection)}
              </span>
            </div>

            <p className="mt-10 text-sm font-bold uppercase tracking-[0.38em] text-white/50">{collection}</p>
            <p className="mt-2 text-base font-semibold uppercase tracking-[0.16em] text-white/60">{catalogSeriesLabel(subcollection)}</p>

            <h1
              className={`mt-5 font-black uppercase leading-[0.9] tracking-[-0.04em] ${isHorizontal ? "text-[7rem]" : "text-[4rem]"}`}
              style={{ textShadow: `0 0 80px ${theme.glow}` }}
            >
              {subcollection}
            </h1>

            <div className="mt-8 flex items-center gap-4">
              <span className="h-[2px] w-14" style={{ backgroundColor: theme.accent }} />
              <p className="max-w-xl text-base font-medium leading-7 text-white/68">
                Diseños hechos para lo que te importa. Estampado DTF, algodón jersey y acabados premium en cada pieza.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-5">
            <div className="border border-white/12 bg-white/5 px-5 py-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">Diseños</p>
              <p className="mt-2 text-4xl font-black leading-none">{products.length}</p>
            </div>
            <div className="border border-white/12 bg-white/5 px-5 py-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">Tipo</p>
              <p className="mt-2 text-xl font-black uppercase tracking-tight">{products[0]?.category || "Polo"}</p>
            </div>
            <div className="border border-white/12 bg-white/5 px-5 py-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">Fecha</p>
              <p className="mt-2 text-lg font-bold tabular-nums text-white/85">{catalogCompactDate()}</p>
            </div>
          </div>
        </div>

        <div className={`relative ${isHorizontal ? "w-[42%]" : "h-[42%]"}`}>
          <div className="absolute inset-8 border border-white/10 bg-white/[0.03] backdrop-blur-[2px]" />
          <div className="absolute inset-14 flex items-center justify-center">
            {heroImage ? (
              <img
                src={heroImage}
                alt={subcollection}
                crossOrigin="anonymous"
                className="max-h-full max-w-full object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.55)]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-[2rem] border border-dashed border-white/15 text-sm font-semibold uppercase tracking-[0.2em] text-white/35">
                Vista destacada
              </div>
            )}
          </div>
          <div
            className="absolute bottom-16 left-16 right-16 border px-6 py-3 text-center text-[11px] font-bold uppercase tracking-[0.34em] text-white/80 backdrop-blur-md"
            style={{ backgroundColor: `${theme.accent}22`, borderColor: `${theme.accent}55` }}
          >
            {catalogSeriesLabel(subcollection)} · Hoja {pageNumber} / {totalPages}
          </div>
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-white/10 px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35">
        <span>{brand.domain}</span>
        <span>{format.label}</span>
      </footer>
    </section>
  );
}
