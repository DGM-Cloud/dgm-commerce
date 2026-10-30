import { NextResponse } from "next/server";
import { getStorefrontProductByParam } from "@/backend/storefront.server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { product, related, canonicalSlug } = await getStorefrontProductByParam(id);

    if (!product || !canonicalSlug) {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      product,
      related,
      canonicalPath: `/products/${canonicalSlug}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudo cargar el producto.",
      },
      { status: 500 },
    );
  }
}
