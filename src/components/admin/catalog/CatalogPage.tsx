import type { AdminInventoryProduct } from "@/lib/admin-data";
import type { CatalogFormatSpec, CatalogOptions } from "@/lib/catalog/types";
import {
  catalogCollectionCode,
  catalogCollectionLabel,
  catalogPageLabel,
  catalogSeriesLabel,
} from "@/lib/catalog/catalog-utils";
import { brand } from "@/config/brand";
import CatalogProductShowcase from "./CatalogProductShowcase";

export default function CatalogPage({
  products,
  options,
  format,
  pageNumber,
  totalPages,
  collection,
  subcollection,
}: {
  products: AdminInventoryProduct[];
  options: CatalogOptions;
  format: CatalogFormatSpec;
  pageNumber: number;
  totalPages: number;
  collection: string;
  subcollection: string;
}) {
  const slots = Array.from({ length: format.productsPerPage }, (_, index) => products[index] ?? null);
  const catalogYear = new Date().getFullYear();

  return (
    <section
      data-catalog-page
      className="relative flex flex-col overflow-hidden bg-[#f4f4f2] text-zinc-950"
      style={{
        width: format.width,
        height: format.height,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <header className="shrink-0 border-b border-zinc-300 bg-white px-8 py-4">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-950">{brand.name}®</p>
            <h2 className="mt-1.5 text-[1.6rem] font-black uppercase leading-none tracking-tight text-zinc-950">
              {catalogCollectionLabel(collection)}
            </h2>
            <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.1em] text-zinc-600">{catalogSeriesLabel(subcollection)}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="inline-flex items-center gap-2">
              <span className="bg-zinc-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                {catalogPageLabel(pageNumber)}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-400">
                Catálogo oficial {catalogYear}
              </span>
            </div>
            <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
              Collection {catalogCollectionCode(collection)} · {pageNumber}/{totalPages}
            </p>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-3">
        <div
          className={`grid w-full gap-4 ${format.productsPerPage === 1 ? "grid-cols-1" : "grid-cols-2"}`}
        >
          {slots.map((product, index) =>
            product ? (
              <CatalogProductShowcase key={product.parentSku} product={product} options={options} format={format} />
            ) : (
              <div key={`empty-${index}`} className="border border-dashed border-zinc-300 bg-white/60" />
            ),
          )}
        </div>
      </div>

      <footer className="shrink-0 border-t border-zinc-300 bg-white px-8 py-2.5">
        <div className="flex items-center justify-between gap-4 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          <span>{brand.domain}</span>
          <span className="text-center normal-case tracking-normal text-zinc-400">Diseños únicos. Hechos para lo que te inspira.</span>
          <span>Gracias por apoyar lo original.</span>
        </div>
      </footer>
    </section>
  );
}
