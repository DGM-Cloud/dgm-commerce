import currency from "currency.js";
import { mockProducts } from "@/data/mockProducts";
import type { AdminInventoryProduct } from "@/lib/admin-data";
import type { CatalogFormat, CatalogFormatSpec, CatalogOptions } from "./types";

export const CATALOG_FORMATS: Record<CatalogFormat, CatalogFormatSpec> = {
  "social-horizontal": {
    width: 1920,
    height: 1080,
    productsPerPage: 2,
    label: "Redes horizontal 16:9",
    exportPixelRatio: 2,
  },
  a4: {
    width: 1754,
    height: 1240,
    productsPerPage: 2,
    label: "PDF A4 horizontal",
    exportPixelRatio: 2,
  },
  instagram: {
    width: 1080,
    height: 1080,
    productsPerPage: 1,
    label: "Instagram cuadrado",
    exportPixelRatio: 2,
  },
};

export function catalogDisplayTitle(options: CatalogOptions) {
  if (options.collection !== "all") return options.collection;
  if (options.category !== "all") return options.category;
  return "Catálogo";
}

export function catalogShortName(product: AdminInventoryProduct) {
  return product.parentSku;
}

export function catalogProductPrice(product: AdminInventoryProduct, options: CatalogOptions) {
  const prices = product.variants.map((variant) => variant.price ?? product.basePrice ?? 0).filter((price) => price > 0);
  const basePrice = prices.length ? Math.min(...prices) : product.basePrice ?? 0;
  if (options.priceMode === "retail") return currency(basePrice).value;

  return currency(basePrice).multiply(1 - options.wholesaleDiscount / 100).value;
}

export function catalogProductColors(product: AdminInventoryProduct) {
  return Array.from(new Set(product.variants.map((variant) => variant.color).filter(Boolean))) as string[];
}

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "STD"];

function sortCatalogSizes(sizes: string[]) {
  return [...sizes].sort((left, right) => {
    const leftIndex = SIZE_ORDER.indexOf(left);
    const rightIndex = SIZE_ORDER.indexOf(right);
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });
}

export function catalogProductSizes(product: AdminInventoryProduct) {
  return sortCatalogSizes(
    Array.from(new Set(product.variants.map((variant) => variant.size).filter(Boolean))) as string[],
  );
}

export function resolveCatalogImages(product: AdminInventoryProduct): string[] {
  const catalogImages = product.productId
    ? mockProducts.find((item) => item.id === product.productId)?.images ?? []
    : [];
  const merged: string[] = [];

  for (const image of [...product.images, ...catalogImages]) {
    if (image && !merged.includes(image)) merged.push(image);
  }

  while (merged.length < 3) merged.push("");
  return merged.slice(0, 3);
}

export function resolveCatalogImageLayout(product: AdminInventoryProduct) {
  const [back, design, front] = resolveCatalogImages(product);
  return { back, design, front };
}

export function catalogProductDescription(product: AdminInventoryProduct) {
  if (product.summary) {
    return product.summary.replace(/\s+/g, " ").trim().slice(0, 120);
  }

  const mock = product.productId ? mockProducts.find((item) => item.id === product.productId) : undefined;
  return (mock?.description || "Diseño premium en algodón jersey con estampado DTF de alta duración.").slice(0, 120);
}

export function catalogShowcaseMetrics(format: CatalogFormatSpec) {
  const pagePaddingX = 40;
  const pagePaddingY = 24;
  const headerHeight = 84;
  const footerHeight = 26;
  const gridGap = 16;
  const imageGap = 10;
  const twoPerPage = format.productsPerPage === 2;

  const usableHeight = format.height - headerHeight - footerHeight - pagePaddingY;
  const cardWidth = twoPerPage
    ? (format.width - pagePaddingX * 2 - gridGap) / 2
    : format.width - pagePaddingX * 2;

  const maxGalleryHeight = Math.floor(usableHeight * (twoPerPage ? 0.72 : 0.66));
  const sideRatio = 0.94;
  const widthFactor = 2 * sideRatio * (5 / 6) + 4 / 5;
  const maxDesignHeightByWidth = Math.floor((cardWidth - imageGap * 2) / widthFactor);
  const designHeight = Math.min(Math.floor(maxGalleryHeight * 0.97), maxDesignHeightByWidth);
  const sideHeight = Math.floor(designHeight * sideRatio);
  const galleryHeight = designHeight + 18;

  return {
    galleryHeight,
    designHeight,
    sideHeight,
    twoPerPage,
    cardWidth,
  };
}

export function catalogPageLabel(pageNumber: number) {
  return `Página ${String(pageNumber).padStart(2, "0")}`;
}

const COLLECTION_CODES: Record<string, string> = {
  SuperStars: "001",
  Romantic: "002",
  GYM: "003",
  Basicos: "004",
  "Edicion limitada": "005",
};

export function catalogFormatSizes(sizes: string[]) {
  return sortCatalogSizes(sizes).join(" · ");
}

export function catalogCollectionCode(collection?: string | null) {
  if (!collection) return "000";
  return COLLECTION_CODES[collection] ?? "000";
}

export function catalogCollectionLabel(collection?: string | null) {
  if (!collection) return "Collection";
  return `${collection} Collection`;
}

export function catalogSeriesLabel(subcollection?: string | null) {
  if (!subcollection) return "Custom Series";
  return `${subcollection} Series`;
}

export function catalogCompactDate(date = new Date()) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

export function catalogFormatColors(colors: string[]) {
  return colors.join(" / ");
}

export function colorToHex(color: string) {
  const normalized = color.trim().toLowerCase();
  const palette: Record<string, string> = {
    blanco: "#ffffff",
    white: "#ffffff",
    negro: "#111111",
    black: "#111111",
    rojo: "#dc2626",
    red: "#dc2626",
    azul: "#2563eb",
    blue: "#2563eb",
    verde: "#059669",
    green: "#059669",
    rosa: "#f472b6",
    pink: "#f472b6",
    melange: "#d4d4d8",
    gris: "#9ca3af",
    gray: "#9ca3af",
    plomo: "#71717a",
    amarillo: "#facc15",
    yellow: "#facc15",
    morado: "#7c3aed",
    purple: "#7c3aed",
    beige: "#d6c3a5",
    crema: "#f5e6c8",
  };

  return palette[normalized] || "#d4d4d8";
}
