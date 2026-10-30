import { NextResponse } from "next/server";
import { listProductStock } from "@/backend/admin-data.server";

export async function GET() {
  try {
    const stock = await listProductStock();
    return NextResponse.json({ stock });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudo cargar el stock.",
        stock: {},
      },
      { status: 500 }
    );
  }
}
