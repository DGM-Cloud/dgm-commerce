"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { useProductStock } from "@/hooks/useProductStock";
import { cartLineKey, formatSoles, lineAvailability } from "@/lib/cart";

export default function CartPage() {
  const { lines, coupon, ready, itemCount, subtotal, setQuantity, removeItem, applyCoupon, removeCoupon } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const { stock, loading: stockLoading } = useProductStock();

  if (!ready) {
    return <main className="min-h-screen bg-white pt-28" />;
  }

  const hasStockIssue = lines.some((line) => {
    const availability = lineAvailability(stock, line);
    return availability.known && line.quantity > availability.available;
  });

  return (
    <main className="min-h-screen bg-white pt-28 text-zinc-950">
      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Tu pedido</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Carrito</h1>
          </div>
          <p className="text-sm text-zinc-500">
            {itemCount} {itemCount === 1 ? "prenda" : "prendas"}
          </p>
        </div>

        {lines.length === 0 ? (
          <div className="mt-16 border-t border-zinc-200 pt-12">
            <p className="text-lg text-zinc-600">Todavía no agregaste ningún polo.</p>
            <Link href="/products" className="mt-6 inline-flex text-sm font-semibold text-zinc-950 underline">
              Ver la tienda
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_20rem]">
            <div>
              {lines.map((line) => {
                const key = cartLineKey(line);
                const availability = lineAvailability(stock, line);
                const max = availability.known ? availability.available : line.quantity;
                const overStock = availability.known && line.quantity > availability.available;

                return (
                  <article key={key} className="grid grid-cols-[5.5rem_1fr] gap-4 border-t border-zinc-200 py-6 sm:grid-cols-[7rem_1fr_auto]">
                    <Link href={`/products/${line.productId}`} className="block bg-zinc-100">
                      {line.image ? (
                        <img src={line.image} alt="" className="aspect-[4/5] h-full w-full object-cover" />
                      ) : (
                        <div className="aspect-[4/5] w-full" />
                      )}
                    </Link>
                    <div>
                      <Link href={`/products/${line.productId}`} className="text-base font-medium text-zinc-950">
                        {line.name}
                      </Link>
                      <p className="mt-1 text-sm text-zinc-500">
                        {line.color} · {line.size}
                      </p>
                      <p className="mt-2 text-sm text-zinc-950">{formatSoles(line.price)}</p>
                      <div className="mt-4 inline-flex items-center border border-zinc-200">
                        <button
                          type="button"
                          className="px-3 py-2 text-lg disabled:text-zinc-300"
                          disabled={line.quantity <= 1}
                          onClick={() => setQuantity(key, line.quantity - 1, Math.max(line.quantity - 1, max))}
                          aria-label="Reducir cantidad"
                        >
                          −
                        </button>
                        <span className="min-w-10 border-x border-zinc-200 px-3 py-2 text-center text-sm">{line.quantity}</span>
                        <button
                          type="button"
                          className="px-3 py-2 text-lg disabled:text-zinc-300"
                          disabled={stockLoading || !availability.known || line.quantity >= availability.available}
                          onClick={() => setQuantity(key, line.quantity + 1, availability.available)}
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>
                      {overStock ? (
                        <p className="mt-3 text-sm text-red-700">
                          Solo quedan {availability.available} {availability.available === 1 ? "unidad" : "unidades"}.
                        </p>
                      ) : null}
                      <button type="button" onClick={() => removeItem(key)} className="mt-3 block text-sm text-zinc-500 underline">
                        Quitar
                      </button>
                    </div>
                    <p className="hidden text-sm font-medium sm:block">{formatSoles(line.price * line.quantity)}</p>
                  </article>
                );
              })}
            </div>

            <aside className="h-fit border-t border-zinc-200 pt-6 lg:border-t-0 lg:pt-0">
              <form
                className="mb-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  applyCoupon(couponCode);
                  setCouponCode("");
                }}
              >
                <label htmlFor="coupon" className="text-sm text-zinc-500">
                  Cupón
                </label>
                <div className="mt-2 flex">
                  <input
                    id="coupon"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    placeholder="Código"
                    className="min-w-0 flex-1 border border-zinc-300 px-3 py-3 text-sm uppercase outline-none focus:border-zinc-950"
                  />
                  <button
                    type="submit"
                    disabled={!couponCode.trim()}
                    className="border border-l-0 border-zinc-950 bg-zinc-950 px-4 text-sm font-semibold text-white disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
                  >
                    Agregar
                  </button>
                </div>
                {coupon ? (
                  <p className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-medium tracking-wide">{coupon}</span>
                    <button type="button" onClick={removeCoupon} className="text-zinc-500 underline">
                      Quitar
                    </button>
                  </p>
                ) : null}
              </form>
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Subtotal</span>
                <span className="text-zinc-950">{formatSoles(subtotal)}</span>
              </div>
              <div className="mt-3 flex justify-between text-sm text-zinc-500">
                <span>Envío</span>
                <span>Por calcular</span>
              </div>
              <p className="mt-6 text-sm leading-6 text-zinc-500">El pago se coordina por WhatsApp con los datos de tu pedido.</p>
              {hasStockIssue ? (
                <p className="mt-4 text-sm text-red-700">Ajusta las cantidades antes de continuar.</p>
              ) : (
                <Link
                  href="/checkout"
                  className="mt-6 flex w-full items-center justify-center bg-zinc-950 px-5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-zinc-800"
                >
                  Ir al checkout
                </Link>
              )}
              <Link href="/products" className="mt-4 block text-center text-sm font-semibold text-zinc-950 underline">
                Seguir comprando
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
