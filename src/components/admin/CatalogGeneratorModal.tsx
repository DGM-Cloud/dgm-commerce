"use client";

import React, { useCallback, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import type { AdminInventoryProduct } from "@/lib/admin-data";
import { CATALOG_FORMATS } from "@/lib/catalog/catalog-utils";
import type { CatalogFormat, CatalogOptions, CatalogPriceMode } from "@/lib/catalog/types";
import CatalogDocument, { downloadCatalogPdf } from "./CatalogDocument";

export type { CatalogFormat, CatalogOptions, CatalogPriceMode } from "@/lib/catalog/types";

const inputClass = "rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-zinc-950 disabled:bg-zinc-100 disabled:text-zinc-500";

export default function CatalogGeneratorModal({
  products,
  collections,
  categories,
  options,
  fileName,
  setOptions,
  onClose,
}: {
  products: AdminInventoryProduct[];
  collections: string[];
  categories: string[];
  options: CatalogOptions;
  fileName: string;
  setOptions: React.Dispatch<React.SetStateAction<CatalogOptions>>;
  onClose: () => void;
}) {
  const [exporting, setExporting] = useState(false);
  const getPagesRef = useRef<(() => HTMLElement[]) | null>(null);

  function updateOption<K extends keyof CatalogOptions>(key: K, value: CatalogOptions[K]) {
    setOptions((previous) => ({ ...previous, [key]: value, previewReady: key === "previewReady" ? Boolean(value) : false }));
  }

  const bindExportPages = useCallback((getter: () => HTMLElement[]) => {
    getPagesRef.current = getter;
  }, []);

  async function handleDownloadPdf() {
    if (!products.length || !getPagesRef.current) return;

    setExporting(true);
    try {
      await downloadCatalogPdf(products, options, fileName, getPagesRef.current);
    } catch (error) {
      console.error("No se pudo exportar el catalogo", error);
      window.alert("No se pudo generar el PDF. Verifica tu conexion e intenta de nuevo.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-3 py-4 backdrop-blur-[2px]">
      <div className="w-full max-w-7xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-black text-zinc-950">Generador de catálogo</h3>
            <p className="text-sm text-zinc-500">Vista previa por hojas con 3 imágenes por producto y exportación PDF en alta calidad.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-xl leading-none text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900" aria-label="Cerrar generador">
            X
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[23rem_minmax(0,1fr)]">
          <aside className="border-r border-zinc-200 bg-zinc-50 p-5">
            <div className="space-y-4">
              <Field label="Colección">
                <select value={options.collection} onChange={(event) => updateOption("collection", event.target.value)} className={inputClass}>
                  <option value="all">Todas las colecciones</option>
                  {collections.map((collection) => (
                    <option key={collection} value={collection}>{collection}</option>
                  ))}
                </select>
              </Field>

              <Field label="Categoría">
                <select value={options.category} onChange={(event) => updateOption("category", event.target.value)} className={inputClass}>
                  <option value="all">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </Field>

              <Field label="Formato">
                <select value={options.format} onChange={(event) => updateOption("format", event.target.value as CatalogFormat)} className={inputClass}>
                  {Object.entries(CATALOG_FORMATS).map(([value, spec]) => (
                    <option key={value} value={value}>{spec.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Precio">
                <select value={options.priceMode} onChange={(event) => updateOption("priceMode", event.target.value as CatalogPriceMode)} className={inputClass}>
                  <option value="retail">Precio público</option>
                  <option value="wholesale">Precio mayorista</option>
                </select>
              </Field>

              {options.priceMode === "wholesale" ? (
                <Field label="Descuento mayorista (%)">
                  <input type="number" min="0" max="80" value={options.wholesaleDiscount} onChange={(event) => updateOption("wholesaleDiscount", Math.max(0, Math.min(80, Number(event.target.value) || 0)))} className={inputClass} />
                </Field>
              ) : null}

              <OptionSwitch label="Incluir sin stock" checked={options.includeOutOfStock} onChange={(checked) => updateOption("includeOutOfStock", checked)} />
              <OptionSwitch label="Incluir SKU" checked={options.includeSku} onChange={(checked) => updateOption("includeSku", checked)} />
              <OptionSwitch label="Incluir colores/tallas" checked={options.includeVariants} onChange={(checked) => updateOption("includeVariants", checked)} />

              <div className="rounded-2xl bg-zinc-950 p-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Resultado</p>
                <p className="mt-2 text-3xl font-black">{products.length}</p>
                <p className="text-sm text-zinc-300">productos · hojas con portadas por subcolección</p>
              </div>

              <button
                type="button"
                onClick={() => updateOption("previewReady", true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 transition hover:bg-zinc-100"
              >
                <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                Generar vista previa
              </button>

              <button
                type="button"
                disabled={!products.length || exporting}
                onClick={handleDownloadPdf}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${products.length && !exporting ? "bg-zinc-950 text-white hover:bg-zinc-800" : "pointer-events-none bg-zinc-200 text-zinc-500"}`}
              >
                <FontAwesomeIcon icon={faFilePdf} className="h-4 w-4" />
                {exporting ? "Generando PDF..." : "Descargar PDF"}
              </button>
            </div>
          </aside>

          <section className="relative min-h-[42rem] bg-zinc-100 p-5">
            {products.length ? (
              <CatalogDocument
                products={products}
                options={options}
                showPreview={options.previewReady}
                onExportRef={bindExportPages}
              />
            ) : (
              <div className="flex min-h-[38rem] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white text-center text-sm font-semibold text-zinc-500">
                No hay productos para los filtros seleccionados.
              </div>
            )}

            {!options.previewReady && products.length ? (
              <div className="absolute inset-5 flex items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white text-center">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-zinc-400">Vista previa pendiente</p>
                  <p className="mt-2 text-lg font-bold text-zinc-900">Configura el catálogo y genera una vista previa por hojas.</p>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-zinc-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

function OptionSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4" />
    </label>
  );
}
