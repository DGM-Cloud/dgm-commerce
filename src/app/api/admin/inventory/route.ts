import { NextResponse } from "next/server";
import { createInventoryItem, listInventory, listInventoryProducts } from "@/backend/admin-data.server";
import { requireStaffUser, readJsonBody } from "@/backend/admin-api.server";
import type { AdminInventoryItem, AdminInventoryProduct } from "@/lib/admin-data";
import { paginateItems, parseAdminListQuery } from "@/lib/admin-query/list-params";

function matchesInventoryFilters(
  item: AdminInventoryItem,
  query: ReturnType<typeof parseAdminListQuery>,
) {
  if (query.collection !== "all" && item.collection !== query.collection) return false;
  if (query.status !== "all" && (item.status || "active") !== query.status) return false;

  const available = Math.max(0, (item.onHand || 0) - (item.reserved || 0));
  if (query.stock === "low" && !(available > 0 && available <= (item.lowStockThreshold || 3))) return false;
  if (query.stock === "out" && available > 0) return false;
  if (query.stock === "available" && available <= 0) return false;

  if (!query.q) return true;
  const haystack = [item.sku, item.parentSku, item.product, item.collection, item.category, item.color, item.size]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.q);
}

function matchesProductFilters(
  product: AdminInventoryProduct,
  query: ReturnType<typeof parseAdminListQuery>,
) {
  if (query.collection !== "all" && product.collection !== query.collection) return false;
  if (query.status !== "all" && (product.status || "active") !== query.status) return false;

  const threshold = Math.min(...product.variants.map((variant) => variant.lowStockThreshold ?? 3), 3);
  if (query.stock === "out" && product.totalAvailable > 0) return false;
  if (query.stock === "low" && !(product.totalAvailable > 0 && product.totalAvailable <= threshold)) return false;
  if (query.stock === "available" && product.totalAvailable <= threshold) return false;

  if (!query.q) return true;
  const variantText = product.variants.map((variant) => [variant.sku, variant.color, variant.size].join(" ")).join(" ");
  const haystack = [product.parentSku, product.product, product.collection, product.category, variantText]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.q);
}

function buildProductSummary(products: AdminInventoryProduct[]) {
  return products.reduce(
    (acc, row) => {
      const threshold = Math.min(...row.variants.map((variant) => variant.lowStockThreshold ?? 3), 3);
      acc.totalSkus += row.variants.length;
      acc.totalProducts += 1;
      acc.totalOnHand += row.totalOnHand;
      acc.totalReserved += row.totalReserved;
      acc.totalSold += row.totalSold;
      acc.totalAvailable += row.totalAvailable;
      if (row.totalAvailable <= 0) acc.outOfStock += 1;
      else if (row.totalAvailable <= threshold) acc.lowStock += 1;
      if (row.collection) acc.collections.add(row.collection);
      if (row.category) acc.categories.add(row.category);
      return acc;
    },
    {
      totalProducts: 0,
      totalSkus: 0,
      totalOnHand: 0,
      totalReserved: 0,
      totalSold: 0,
      totalAvailable: 0,
      lowStock: 0,
      outOfStock: 0,
      collections: new Set<string>(),
      categories: new Set<string>(),
    },
  );
}

export async function GET(request: Request) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  const query = parseAdminListQuery(request.url);
  const products = await listInventoryProducts();

  if (query.productsOnly) {
    const filtered = products.filter((product) => matchesProductFilters(product, query));
    const stats = buildProductSummary(filtered);
    const paged = paginateItems(filtered, query.page, query.pageSize);

    return NextResponse.json({
      products: paged.items,
      inventory: [],
      total: paged.total,
      page: paged.page,
      pageSize: paged.pageSize,
      summary: {
        totalProducts: stats.totalProducts,
        totalSkus: stats.totalSkus,
        totalOnHand: stats.totalOnHand,
        totalReserved: stats.totalReserved,
        totalSold: stats.totalSold,
        totalAvailable: stats.totalAvailable,
        lowStock: stats.lowStock,
        outOfStock: stats.outOfStock,
        collections: Array.from(stats.collections).sort((a, b) => a.localeCompare(b, "es")),
        categories: Array.from(stats.categories).sort((a, b) => a.localeCompare(b, "es")),
      },
    });
  }

  const inventory = await listInventory();
  const filtered = inventory.filter((item) => matchesInventoryFilters(item, query));
  const paged = paginateItems(filtered, query.page, query.pageSize);

  return NextResponse.json({
    inventory: paged.items,
    products,
    total: paged.total,
    page: paged.page,
    pageSize: paged.pageSize,
  });
}

export async function POST(request: Request) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  const body = await readJsonBody<AdminInventoryItem>(request);

  if (!body.sku || !body.product || !body.warehouse || typeof body.onHand !== "number" || typeof body.reserved !== "number") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const item = await createInventoryItem({
    sku: body.sku,
    parentSku: body.parentSku,
    productId: body.productId,
    product: body.product,
    summary: body.summary,
    description: body.description,
    category: body.category,
    collection: body.collection,
    color: body.color,
    size: body.size,
    options: body.options,
    price: body.price,
    image: body.image,
    warehouse: body.warehouse,
    onHand: body.onHand,
    reserved: body.reserved,
    sold: body.sold,
    lowStockThreshold: body.lowStockThreshold,
    status: body.status,
  });

  if (!item) {
    return NextResponse.json({ error: "SKU already exists." }, { status: 409 });
  }

  return NextResponse.json({ item }, { status: 201 });
}
