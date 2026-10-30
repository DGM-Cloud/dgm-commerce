export type CatalogFormat = "social-horizontal" | "a4" | "instagram";
export type CatalogPriceMode = "retail" | "wholesale";

export interface CatalogOptions {
  collection: string;
  category: string;
  includeOutOfStock: boolean;
  priceMode: CatalogPriceMode;
  wholesaleDiscount: number;
  format: CatalogFormat;
  includeSku: boolean;
  includeVariants: boolean;
  previewReady: boolean;
}

export interface CatalogFormatSpec {
  width: number;
  height: number;
  productsPerPage: number;
  label: string;
  exportPixelRatio: number;
}
