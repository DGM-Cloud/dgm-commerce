"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faShirt } from "@fortawesome/free-solid-svg-icons";
import AccountShell from "@/components/account/AccountShell";
import AccountLoading from "@/components/account/AccountLoading";
import { useAuth } from "@/components/auth/AuthProvider";
import type { WishlistItem } from "@/lib/account-data";

export default function AccountWishlistPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/account/wishlist");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    setFetching(true);
    fetch("/api/account/wishlist", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setItems(payload.items || []))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading) return <AccountLoading />;
  if (!user) return <AccountLoading />;

  return (
    <AccountShell
      title="Lista de deseos"
      description="Los polos que guardaste para revisar o comprar más adelante."
    >
      {fetching ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="aspect-[4/5] animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-zinc-500">
            <FontAwesomeIcon icon={faHeart} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-zinc-950">Tu lista está vacía</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
            Guarda los diseños que te gusten mientras exploras el catálogo. Los verás aquí cuando vuelvas.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            <FontAwesomeIcon icon={faShirt} />
            Explorar polos
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/products/${item.id}`}
              className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-sm"
            >
              <div className="aspect-[4/5] overflow-hidden bg-zinc-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-400">{item.collection}</p>
                <h3 className="mt-2 line-clamp-2 font-medium text-zinc-950">{item.name}</h3>
                <p className="mt-2 text-sm font-semibold text-zinc-950">S/ {item.price.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
