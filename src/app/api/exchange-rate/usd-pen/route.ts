import currency from "currency.js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 60 * 60 },
    });
    const payload = await response.json();
    const rate = Number(payload?.rates?.PEN);

    if (!response.ok || !Number.isFinite(rate) || rate <= 0) {
      throw new Error("Invalid exchange rate response.");
    }

    return NextResponse.json({
      base: "USD",
      quote: "PEN",
      rate: currency(rate, { precision: 4 }).value,
      source: "open.er-api.com",
      updatedAt: payload?.time_last_update_utc ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "NO SE PUDO CARGAR LA TASA DE CAMBIO.", rate: null },
      { status: 502 },
    );
  }
}
