import { NextResponse } from "next/server";
import { getStorefrontCatalog } from "@/backend/storefront.server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const q = searchParams.get("q") ?? undefined;
    const sort = searchParams.get("sort") ?? undefined;
    const limitParam = Number(searchParams.get("limit") ?? "0");
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined;
    const ids = (searchParams.get("ids") ?? "")
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);

    const { products, facets } = await getStorefrontCatalog({
      collection,
      category,
      q,
      limit,
      sort: sort ?? undefined,
      ids: ids.length ? ids : undefined,
    });

    return NextResponse.json({ products, facets });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudieron cargar los productos.",
        products: [],
        facets: { categories: [], collections: [] },
      },
      { status: 500 },
    );
  }
}
