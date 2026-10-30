"use client";

import React, { useMemo, useRef } from "react";
import type { AdminInventoryProduct } from "@/lib/admin-data";
import { exportCatalogPagesToPdf, waitForCatalogImages } from "@/lib/catalog/catalog-export";
import { buildCatalogSheets } from "@/lib/catalog/catalog-sheets";
import { CATALOG_FORMATS, catalogDisplayTitle } from "@/lib/catalog/catalog-utils";
import type { CatalogOptions } from "@/lib/catalog/types";
import CatalogCoverPage from "./catalog/CatalogCoverPage";
import CatalogPage from "./catalog/CatalogPage";

export default function CatalogDocument({
  products,
  options,
  showPreview = true,
  previewScale = 0.42,
  onExportRef,
}: {
  products: AdminInventoryProduct[];
  options: CatalogOptions;
  showPreview?: boolean;
  previewScale?: number;
  onExportRef?: (getPages: () => HTMLElement[]) => void;
}) {
  const format = CATALOG_FORMATS[options.format];
  const sheets = useMemo(() => buildCatalogSheets(products, format.productsPerPage), [format.productsPerPage, products]);
  const exportRootRef = useRef<HTMLDivElement>(null);
  const coverCount = sheets.filter((sheet) => sheet.kind === "cover").length;

  React.useEffect(() => {
    if (!onExportRef) return;

    onExportRef(() => {
      const root = exportRootRef.current;
      if (!root) return [];
      return Array.from(root.querySelectorAll<HTMLElement>("[data-catalog-page]"));
    });
  }, [onExportRef, sheets, options]);

  if (!products.length) {
    if (!showPreview) return null;

    return (
      <div className="flex min-h-[24rem] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm font-semibold text-zinc-500">
        No hay productos para los filtros seleccionados.
      </div>
    );
  }

  function renderSheet(sheet: (typeof sheets)[number], pageNumber: number, exportMode = false) {
    if (sheet.kind === "cover") {
      return (
        <CatalogCoverPage
          collection={sheet.collection}
          subcollection={sheet.subcollection}
          products={sheet.products}
          format={format}
          pageNumber={pageNumber}
          totalPages={sheets.length}
        />
      );
    }

    return (
      <CatalogPage
        products={sheet.products}
        options={options}
        format={format}
        pageNumber={pageNumber}
        totalPages={sheets.length}
        collection={sheet.collection}
        subcollection={sheet.subcollection}
      />
    );
  }

  return (
    <>
      {showPreview ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Vista previa</p>
              <p className="mt-1 text-lg font-black text-zinc-950">
                {catalogDisplayTitle(options)} · {sheets.length} {sheets.length === 1 ? "hoja" : "hojas"}
              </p>
            </div>
            <p className="text-sm font-semibold text-zinc-500">
              {coverCount} portadas · {format.productsPerPage} productos por hoja
            </p>
          </div>

          {sheets.map((sheet, index) => (
            <div key={`preview-${sheet.kind}-${index}`} className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-zinc-200/60 p-4 shadow-inner">
              <div className="mx-auto overflow-hidden" style={{ width: format.width * previewScale, height: format.height * previewScale }}>
                <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: format.width, height: format.height }}>
                  {renderSheet(sheet, index + 1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div ref={exportRootRef} aria-hidden className="pointer-events-none fixed top-0 -left-[30000px]">
        {sheets.map((sheet, index) => (
          <React.Fragment key={`export-${sheet.kind}-${index}`}>{renderSheet(sheet, index + 1, true)}</React.Fragment>
        ))}
      </div>
    </>
  );
}

export async function downloadCatalogPdf(
  products: AdminInventoryProduct[],
  options: CatalogOptions,
  fileName: string,
  getPages: () => HTMLElement[],
) {
  const format = CATALOG_FORMATS[options.format];
  const pages = getPages();

  if (!pages.length) return;

  await waitForCatalogImages(pages);
  await exportCatalogPagesToPdf(pages, format, fileName);
}
