import { mockProducts } from "@/data/mockProducts";
import type { AdminInventoryProduct } from "@/lib/admin-data";
import { buildProductSeo } from "@/lib/seo/product-seo";

export type StorefrontProduct = {
  id: number;
  name: string;
  price: number;
  summary: string;
  category: string;
  collection: string;
  subcollection?: string;
  images: string[];
  colors: string[];
  sizes: string[];
  available: boolean;
  parentSku: string;
  createdAt?: string;
  unitsSold?: number;
  /** SEO-friendly URL slug ending with `-{id}` */
  slug: string;
  path: string;
  seoTitle: string;
  seoDescription: string;
};

export type StorefrontProductDetail = StorefrontProduct & {
  description: string;
};

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "STD"];

function sortSizes(sizes: string[]) {
  return [...sizes].sort((left, right) => {
    const leftIndex = SIZE_ORDER.indexOf(left);
    const rightIndex = SIZE_ORDER.indexOf(right);
    return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
  });
}

function resolveStorefrontImages(product: AdminInventoryProduct) {
  const catalog = product.productId ? mockProducts.find((item) => item.id === product.productId) : undefined;
  const images: string[] = [];

  for (const image of [...product.images, ...(catalog?.images ?? [])]) {
    if (image && !images.includes(image)) images.push(image);
  }

  return images;
}

function resolveSummary(product: AdminInventoryProduct) {
  const catalog = product.productId ? mockProducts.find((item) => item.id === product.productId) : undefined;
  const rawSummary = product.summary || catalog?.description || "";
  return rawSummary.replace(/\s+/g, " ").trim();
}

function resolveDescription(product: AdminInventoryProduct) {
  const catalog = product.productId ? mockProducts.find((item) => item.id === product.productId) : undefined;
  return (product.description || catalog?.detailedDescription || catalog?.description || "").trim();
}

function buildStorefrontProduct(product: AdminInventoryProduct): StorefrontProduct | null {
  if (!product.productId || product.status !== "active") return null;

  const activeVariants = product.variants.filter((variant) => (variant.status ?? "active") === "active");
  if (!activeVariants.length) return null;

  const images = resolveStorefrontImages(product);
  if (!images.length) return null;

  const catalog = mockProducts.find((item) => item.id === product.productId);
  const prices = activeVariants.map((variant) => variant.price ?? product.basePrice ?? 0).filter((price) => price > 0);
  const price = prices.length ? Math.min(...prices) : product.basePrice ?? catalog?.price ?? 0;

  const colors = Array.from(new Set(activeVariants.map((variant) => variant.color).filter(Boolean))) as string[];
  const sizes = sortSizes(
    Array.from(new Set(activeVariants.map((variant) => variant.size).filter(Boolean))) as string[],
  );

  const summary = resolveSummary(product);
  if (!summary) return null;

  const category =
    product.category ||
    (catalog && "category" in catalog ? String(catalog.category) : undefined) ||
    catalog?.collection ||
    "General";
  const collection = product.collection || catalog?.collection || "General";
  const description = resolveDescription(product);
  const seo = buildProductSeo({
    id: product.productId,
    name: product.product,
    summary,
    description,
    category,
    collection,
    slug: product.seoSlug,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
  });

  return {
    id: product.productId,
    name: product.product,
    price,
    summary,
    category,
    collection,
    subcollection: product.subcollection,
    images,
    colors: colors.length ? colors : catalog?.colors ?? [],
    sizes: sizes.length ? sizes : catalog?.sizes ?? [],
    available: product.totalAvailable > 0,
    parentSku: product.parentSku,
    createdAt: product.createdAt,
    slug: seo.slug,
    path: seo.path,
    seoTitle: seo.seoTitle,
    seoDescription: seo.seoDescription,
  };
}

export function mapInventoryProductToStorefront(product: AdminInventoryProduct): StorefrontProduct | null {
  return buildStorefrontProduct(product);
}

export function mapInventoryProductToStorefrontDetail(
  product: AdminInventoryProduct,
): StorefrontProductDetail | null {
  const base = buildStorefrontProduct(product);
  if (!base) return null;

  return {
    ...base,
    description: resolveDescription(product),
  };
}

export function findStorefrontProductDetail(
  products: AdminInventoryProduct[],
  productId: number,
): StorefrontProductDetail | null {
  const inventoryProduct = products.find((product) => product.productId === productId);
  return inventoryProduct ? mapInventoryProductToStorefrontDetail(inventoryProduct) : null;
}

export function filterStorefrontProducts(
  products: AdminInventoryProduct[],
  options?: {
    collection?: string;
    category?: string;
    q?: string;
    limit?: number;
    ids?: number[];
  },
) {
  let result = products
    .map(mapInventoryProductToStorefront)
    .filter((product): product is StorefrontProduct => product !== null);

  if (options?.ids?.length) {
    const byId = new Map(result.map((product) => [product.id, product]));
    return options.ids
      .map((id) => byId.get(id))
      .filter((product): product is StorefrontProduct => Boolean(product));
  }

  if (options?.category) {
    const category = options.category.toLowerCase();
    result = result.filter((product) => product.category.toLowerCase() === category);
  }

  if (options?.collection) {
    const collection = options.collection.toLowerCase();
    result = result.filter((product) => product.collection.toLowerCase() === collection);
  }

  if (options?.q) {
    const query = options.q.toLowerCase().trim();
    result = result.filter((product) => {
      const haystack = [
        product.name,
        product.summary,
        product.seoDescription,
        product.category,
        product.collection,
        product.subcollection,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  result.sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    if (rightTime !== leftTime) return rightTime - leftTime;
    return right.id - left.id;
  });

  if (options?.limit && options.limit > 0) {
    result = result.slice(0, options.limit);
  }

  return result;
}

export function listStorefrontFacets(products: StorefrontProduct[]) {
  const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort();
  const collections = Array.from(new Set(products.map((product) => product.collection).filter(Boolean))).sort();
  return { categories, collections };
}

export function isNewArrival(createdAt?: string, now = new Date()) {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const cutoff = new Date(now);
  const day = cutoff.getDate();
  cutoff.setDate(1);
  cutoff.setMonth(cutoff.getMonth() - 1);
  const lastDayOfMonth = new Date(cutoff.getFullYear(), cutoff.getMonth() + 1, 0).getDate();
  cutoff.setDate(Math.min(day, lastDayOfMonth));
  return created.getTime() >= cutoff.getTime();
}

export function sortStorefrontSizes(sizes: string[]) {
  return sortSizes(sizes);
}

export function rankBestSellingStorefrontProducts(
  inventory: AdminInventoryProduct[],
  sales: { status?: string; items?: { productId?: number; parentSku?: string; quantity: number }[] }[],
  limit = 3,
) {
  const catalog = filterStorefrontProducts(inventory);
  const catalogIds = new Set(catalog.map((product) => product.id));
  const idByParentSku = new Map(catalog.map((product) => [product.parentSku, product.id]));
  const soldById = new Map<number, number>();

  for (const sale of sales) {
    if (sale.status === "Anulado") continue;

    for (const item of sale.items ?? []) {
      if (!item.quantity) continue;

      const productId =
        (item.productId && catalogIds.has(item.productId) ? item.productId : undefined) ??
        (item.parentSku ? idByParentSku.get(item.parentSku) : undefined);

      if (!productId) continue;

      soldById.set(productId, (soldById.get(productId) ?? 0) + item.quantity);
    }
  }

  const ranked = catalog
    .map((product) => ({
      ...product,
      unitsSold: soldById.get(product.id) ?? 0,
    }))
    .filter((product) => product.unitsSold > 0)
    .sort((left, right) => right.unitsSold - left.unitsSold || right.id - left.id);

  const rankedIds = new Set(ranked.map((product) => product.id));
  const fallback = catalog
    .filter((product) => !rankedIds.has(product.id))
    .slice(0, Math.max(0, limit - ranked.length))
    .map((product) => ({ ...product, unitsSold: 0 }));

  return [...ranked, ...fallback].slice(0, limit);
}
