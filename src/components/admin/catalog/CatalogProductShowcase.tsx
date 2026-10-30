import currency from "currency.js";
import type { AdminInventoryProduct } from "@/lib/admin-data";
import type { CatalogFormatSpec, CatalogOptions } from "@/lib/catalog/types";
import {
  catalogProductColors,
  catalogProductDescription,
  catalogProductPrice,
  catalogProductSizes,
  catalogShortName,
  catalogShowcaseMetrics,
  colorToHex,
  resolveCatalogImageLayout,
} from "@/lib/catalog/catalog-utils";

function CatalogSideImage({
  src,
  alt,
  label,
  sku,
  height,
  twoPerPage,
}: {
  src: string;
  alt: string;
  label: string;
  sku?: string;
  height: number;
  twoPerPage: boolean;
}) {
  const width = Math.round(height * (5 / 6));

  return (
    <div className="flex shrink-0 flex-col items-center">
      <div
        className="relative flex items-center justify-center overflow-hidden border border-zinc-300 bg-white"
        style={{ width, height }}
      >
        {sku ? (
          <span
            className="absolute left-2 top-2 z-10 bg-zinc-950 px-2 py-1 font-bold uppercase text-white"
            style={{ fontSize: twoPerPage ? 11 : 12, letterSpacing: "0.14em" }}
          >
            {sku}
          </span>
        ) : null}
        {src ? <img src={src} alt={alt} crossOrigin="anonymous" className="h-full w-full object-contain" /> : null}
      </div>
      <p
        className="mt-1.5 font-bold uppercase text-zinc-500"
        style={{ fontSize: twoPerPage ? 11 : 12, letterSpacing: "0.24em" }}
      >
        {label}
      </p>
    </div>
  );
}

function CatalogDesignImage({
  src,
  alt,
  height,
}: {
  src: string;
  alt: string;
  height: number;
}) {
  const width = Math.round(height * (4 / 5));

  return (
    <div className="flex shrink-0 flex-col items-center">
      <div
        className="flex items-center justify-center overflow-hidden border border-zinc-300 bg-white"
        style={{ width, height }}
      >
        {src ? <img src={src} alt={alt} crossOrigin="anonymous" className="h-full w-full object-contain" /> : null}
      </div>
    </div>
  );
}

export default function CatalogProductShowcase({
  product,
  options,
  format,
}: {
  product: AdminInventoryProduct;
  options: CatalogOptions;
  format: CatalogFormatSpec;
}) {
  const { back, design, front } = resolveCatalogImageLayout(product);
  const colors = catalogProductColors(product);
  const sizes = catalogProductSizes(product);
  const price = catalogProductPrice(product, options);
  const shortName = catalogShortName(product);
  const subtitle = product.subcollection || product.collection || "Catalog";
  const description = catalogProductDescription(product);
  const metrics = catalogShowcaseMetrics(format);
  const { twoPerPage, galleryHeight, designHeight, sideHeight } = metrics;

  return (
    <article className="flex flex-col overflow-hidden border border-zinc-300 bg-white">
      <div
        className="flex shrink-0 items-end justify-center gap-3 px-2 pt-2"
        style={{ height: galleryHeight }}
      >
        <CatalogSideImage
          src={back}
          alt={`${product.product} espalda`}
          label="Espalda"
          sku={shortName}
          height={sideHeight}
          twoPerPage={twoPerPage}
        />
        <CatalogDesignImage src={design} alt={`${product.product} diseño`} height={designHeight} />
        <CatalogSideImage
          src={front}
          alt={`${product.product} frente`}
          label="Frente"
          height={sideHeight}
          twoPerPage={twoPerPage}
        />
      </div>

      <div className="flex flex-col px-4 pb-3 pt-3">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-2.5">
          <div className="min-w-0">
            <h3 className="text-xl font-black uppercase leading-tight tracking-tight text-zinc-950">{product.product}</h3>
            <p className="mt-0.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-zinc-500">{subtitle}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">Precio</p>
            <p className="text-2xl font-black text-zinc-950">{currency(price, { symbol: "S/ " }).format()}</p>
          </div>
        </div>

        {!twoPerPage ? (
          <p className="mt-2 flex items-start gap-2 text-[13px] leading-snug text-zinc-600">
            <span className="text-red-500">➤</span>
            <span>{description}</span>
          </p>
        ) : null}

        {options.includeVariants ? (
          <div className={`mt-2.5 grid gap-3 ${twoPerPage ? "grid-cols-2" : "grid-cols-1"}`}>
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Colores disponibles</p>
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => (
                  <div key={color} className="flex items-center gap-1.5">
                    <span className="h-4 w-4 border border-zinc-300" style={{ backgroundColor: colorToHex(color) }} />
                    <span className="text-[12px] font-semibold uppercase text-zinc-700">{color}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Tallas disponibles</p>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((size) => (
                  <span
                    key={size}
                    className="flex h-7 min-w-[1.75rem] items-center justify-center bg-zinc-950 px-2 text-[12px] font-black text-white"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <p className="mt-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          ✎ Personalizable · Escríbenos por WhatsApp
        </p>
      </div>
    </article>
  );
}
