import { listInventoryProducts, listSales } from "@/backend/admin-data.server";
import {
  filterStorefrontProducts,
  findStorefrontProductDetail,
  listStorefrontFacets,
  rankBestSellingStorefrontProducts,
  type StorefrontProduct,
  type StorefrontProductDetail,
} from "@/lib/storefront-products";
import { resolveProductIdParam } from "@/lib/seo/product-seo";

export async function getStorefrontCatalog(options?: {
  collection?: string;
  category?: string;
  q?: string;
  limit?: number;
  sort?: string;
  ids?: number[];
}) {
  const inventory = await listInventoryProducts();
  const allActive = filterStorefrontProducts(inventory);

  if (options?.ids?.length) {
    const products = filterStorefrontProducts(inventory, { ids: options.ids });
    return { products, facets: listStorefrontFacets(allActive) };
  }

  if (options?.sort === "bestsellers") {
    const products = rankBestSellingStorefrontProducts(
      inventory,
      await listSales(),
      options.limit ?? 3,
    );
    return { products, facets: listStorefrontFacets(allActive) };
  }

  const products = filterStorefrontProducts(inventory, options);
  return { products, facets: listStorefrontFacets(allActive) };
}

export async function getStorefrontProductByParam(
  param: string,
): Promise<{
  product: StorefrontProductDetail | null;
  related: StorefrontProduct[];
  canonicalSlug: string | null;
}> {
  const productId = resolveProductIdParam(param);
  if (!productId) {
    return { product: null, related: [], canonicalSlug: null };
  }

  const inventory = await listInventoryProducts();
  const product = findStorefrontProductDetail(inventory, productId);
  if (!product) {
    return { product: null, related: [], canonicalSlug: null };
  }

  const related = filterStorefrontProducts(inventory, {
    collection: product.collection,
  })
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  return {
    product,
    related,
    canonicalSlug: product.slug,
  };
}

export async function listStorefrontProductPaths() {
  const { products } = await getStorefrontCatalog();
  return products.map((product) => ({
    slug: product.slug,
    path: product.path,
    updatedAt: product.createdAt,
  }));
}
