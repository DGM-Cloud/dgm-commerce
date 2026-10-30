import type { CatalogFormatSpec } from "./types";

type ExportLibraries = {
  jsPDF: new (options?: Record<string, unknown>) => {
    addPage(format?: unknown, orientation?: string): void;
    addImage(
      imageData: string,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
      alias?: string,
      compression?: string,
    ): void;
    save(filename: string): void;
  };
  toPng: (node: HTMLElement, options?: Record<string, unknown>) => Promise<string>;
};

async function importRemoteModule<T>(url: string): Promise<T> {
  const importer = new Function("url", "return import(url)") as (moduleUrl: string) => Promise<T>;
  return importer(url);
}

async function loadScript(src: string) {
  const existing = document.querySelector(`script[data-catalog-export="${src}"]`);
  if (existing) return;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.catalogExport = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
}

async function loadExportLibraries(): Promise<ExportLibraries> {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const htmlToImageModule = await importRemoteModule<{ toPng: ExportLibraries["toPng"] }>("https://esm.sh/html-to-image@1.11.11");
  const jsPDF = (window as Window & { jspdf?: { jsPDF: ExportLibraries["jsPDF"] } }).jspdf?.jsPDF;

  if (!jsPDF) {
    throw new Error("No se pudo inicializar jsPDF.");
  }

  return {
    jsPDF,
    toPng: htmlToImageModule.toPng,
  };
}

export async function waitForCatalogImages(pageElements: HTMLElement[]) {
  const images = pageElements.flatMap((page) => Array.from(page.querySelectorAll("img")));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

export async function exportCatalogPagesToPdf(
  pageElements: HTMLElement[],
  format: CatalogFormatSpec,
  fileName: string,
) {
  if (!pageElements.length) return;

  const { jsPDF, toPng } = await loadExportLibraries();

  const pdf = new jsPDF({
    orientation: format.width >= format.height ? "landscape" : "portrait",
    unit: "px",
    format: [format.width, format.height],
    hotfixes: ["px_scaling"],
  });

  for (let index = 0; index < pageElements.length; index += 1) {
    const page = pageElements[index];
    const dataUrl = await toPng(page, {
      cacheBust: true,
      pixelRatio: format.exportPixelRatio,
      width: format.width,
      height: format.height,
      style: {
        transform: "none",
        margin: "0",
      },
    });

    if (index > 0) {
      pdf.addPage([format.width, format.height], format.width >= format.height ? "landscape" : "portrait");
    }

    pdf.addImage(dataUrl, "PNG", 0, 0, format.width, format.height, undefined, "FAST");
  }

  pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}

export function printCatalogPages() {
  window.print();
}
