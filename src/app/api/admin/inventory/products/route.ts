import { NextResponse } from "next/server";
import { upsertInventoryProduct } from "@/backend/admin-data.server";
import { requireStaffUser, readJsonBody } from "@/backend/admin-api.server";
import type { AdminInventoryProductInput } from "@/lib/admin-data";

export async function POST(request: Request) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  const body = await readJsonBody<AdminInventoryProductInput>(request);

  if (!body.product || typeof body.basePrice !== "number") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const product = await upsertInventoryProduct({
    productId: body.productId,
    parentSku: typeof body.parentSku === "string" ? body.parentSku.trim() : body.parentSku,
    product: body.product,
    summary: body.summary,
    description: body.description,
    category: body.category,
    collection: body.collection,
    subcollection: body.subcollection,
    image: body.image,
    images: body.images,
    basePrice: body.basePrice,
    colors: body.colors?.length ? body.colors : ["UNICO"],
    sizes: body.sizes?.length ? body.sizes : ["STD"],
    variants: body.variants,
    sizePrices: body.sizePrices,
    sizeStocks: body.sizeStocks,
    defaultStock: body.defaultStock,
    lowStockThreshold: body.lowStockThreshold,
    status: body.status,
    warehouse: body.warehouse,
  });

  return NextResponse.json({ product });
}
