"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faShirt } from "@fortawesome/free-solid-svg-icons";
import AccountShell from "@/components/account/AccountShell";
import AccountLoading from "@/components/account/AccountLoading";
import { formatAccountDate, orderStatusClass } from "@/components/account/account-utils";
import { useAuth } from "@/components/auth/AuthProvider";
import type { AccountOrder } from "@/lib/account-data";

export default function AccountOrdersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/account/orders");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    setFetching(true);
    fetch("/api/account/orders", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setOrders(payload.orders || []))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading) return <AccountLoading />;
  if (!user) return <AccountLoading />;

  return (
    <AccountShell
      title="Mis pedidos"
      description="Historial de compras y estado de cada pedido. Si tienes dudas, escríbenos por WhatsApp con tu número de pedido."
    >
      {fetching ? (
        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-zinc-500">
            <FontAwesomeIcon icon={faBoxOpen} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-zinc-950">Aún no tienes pedidos</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
            Cuando compres, tus pedidos aparecerán aquí con el detalle y el estado del envío.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            <FontAwesomeIcon icon={faShirt} />
            Ver polos
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <article key={order.id} className="overflow-hidden rounded-2xl border border-zinc-200">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 bg-zinc-50 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-400">Pedido</p>
                  <p className="mt-1 font-semibold text-zinc-950">{order.id}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatAccountDate(order.placedAt)}
                    {order.shipping ? ` · ${order.shipping}` : ""}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${orderStatusClass(order.status)}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="divide-y divide-zinc-100 px-5 sm:px-6">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.id}`} className="flex items-center gap-4 py-4">
                    <Link href={`/products/${item.id}`} className="shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                      <img src={item.image} alt={item.name} className="h-16 w-16 object-cover sm:h-20 sm:w-20" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/products/${item.id}`} className="font-medium text-zinc-950 hover:underline">
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm text-zinc-500">
                        Cantidad: {item.quantity} · S/ {item.price.toFixed(2)} c/u
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-zinc-950">
                      S/ {(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 bg-white px-5 py-4 sm:px-6">
                <span className="text-sm text-zinc-500">Total del pedido</span>
                <span className="text-lg font-semibold text-zinc-950">S/ {order.total.toFixed(2)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
