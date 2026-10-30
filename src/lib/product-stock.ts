export interface ProductStockVariant {
  sku: string;
  color?: string;
  size?: string;
  available: number;
  status: "active" | "draft" | "archived";
}

export interface ProductStock {
  productId: number;
  available: number;
  variants: ProductStockVariant[];
}

export type ProductStockMap = Record<number, ProductStock>;

export function isProductInStock(stock?: ProductStock) {
  return Boolean(stock && stock.available > 0);
}

export function findVariantStock(stock: ProductStock | undefined, color?: string | null, size?: string | null) {
  if (!stock) return undefined;

  return stock.variants.find((variant) => {
    const matchesColor = !color || !variant.color || variant.color === color;
    const matchesSize = !size || !variant.size || variant.size === size;
    return matchesColor && matchesSize;
  });
}
