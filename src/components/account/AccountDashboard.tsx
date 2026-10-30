"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBoxOpen,
  faGear,
  faHeart,
  faPhone,
  faShirt,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp as faWhatsappBrand } from "@fortawesome/free-brands-svg-icons";
import type { AuthUser } from "@/lib/auth";
import type { AccountDashboardData } from "@/lib/account-data";
import { formatAccountDate, orderStatusClass } from "@/components/account/account-utils";

const WHATSAPP_URL = "https://wa.me/51975885868";

function profileCompletion(user: AuthUser) {
  const fields = [user.firstName, user.lastName, user.email, user.phone];
  const filled = fields.filter((value) => Boolean(value?.trim())).length;
  return Math.round((filled / fields.length) * 100);
}

function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const content = (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">{value}</p>
      {hint ? <p className="mt-1 text-sm text-zinc-500">{hint}</p> : null}
    </article>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block group">
      {content}
      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-zinc-400 transition group-hover:text-zinc-950">
        Ver detalle <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
      </span>
    </Link>
  );
}

export default function AccountDashboard({
  user,
  data,
  loading,
}: {
  user: AuthUser;
  data: AccountDashboardData | null;
  loading: boolean;
}) {
  const firstName = user.firstName || user.displayName.split(" ")[0] || "cliente";
  const completion = profileCompletion(user);
  const recentOrders = data?.orders.slice(0, 3) ?? [];
  const wishlistPreview = data?.wishlist.slice(0, 4) ?? [];
  const stats = data?.stats;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 rounded-2xl bg-zinc-100" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 rounded-2xl bg-zinc-100" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 rounded-2xl bg-zinc-100 lg:col-span-2" />
          <div className="h-80 rounded-2xl bg-zinc-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 px-6 py-8 text-white sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-400">Panel de cliente</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Hola, {firstName}</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-300">
              Gestiona tus pedidos, revisa tu lista de deseos y mantén tu perfil actualizado para envíos más rápidos.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
            >
              <FontAwesomeIcon icon={faShirt} />
              Seguir comprando
            </Link>
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-zinc-400"
            >
              <FontAwesomeIcon icon={faBoxOpen} />
              Mis pedidos
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pedidos"
          value={String(stats?.totalOrders ?? 0)}
          hint={stats?.activeOrders ? `${stats.activeOrders} en curso` : "Sin pedidos activos"}
          href="/account/orders"
        />
        <StatCard
          label="En curso"
          value={String(stats?.activeOrders ?? 0)}
          hint="Pendientes o en envío"
          href="/account/orders"
        />
        <StatCard
          label="Lista de deseos"
          value={String(stats?.wishlistCount ?? 0)}
          hint="Productos guardados"
          href="/account/wishlist"
        />
        <StatCard
          label="Total comprado"
          value={`S/ ${(stats?.totalSpent ?? 0).toFixed(2)}`}
          hint="Historial acumulado"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-zinc-950">Pedidos recientes</h3>
            {recentOrders.length > 0 ? (
              <Link href="/account/orders" className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950">
                Ver todos
              </Link>
            ) : null}
          </div>

          {recentOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm">
                <FontAwesomeIcon icon={faBoxOpen} />
              </div>
              <p className="mt-4 font-medium text-zinc-950">Aún no has realizado compras</p>
              <p className="mt-2 text-sm text-zinc-500">Tu primer pedido aparecerá aquí con seguimiento y detalle.</p>
              <Link
                href="/products"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-zinc-950 underline-offset-4 hover:underline"
              >
                Explorar polos <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => {
                const previewItem = order.items[0];

                return (
                  <article
                    key={order.id}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-950">{order.id}</p>
                        <p className="mt-1 text-sm text-zinc-500">{formatAccountDate(order.placedAt)}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${orderStatusClass(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 px-5 py-4">
                      {previewItem ? (
                        <>
                          <img
                            src={previewItem.image}
                            alt={previewItem.name}
                            className="h-16 w-16 rounded-xl object-cover bg-zinc-100"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-zinc-950">{previewItem.name}</p>
                            <p className="mt-1 text-sm text-zinc-500">
                              {order.items.length > 1
                                ? `${order.items.length} productos`
                                : `Cantidad: ${previewItem.quantity}`}
                            </p>
                          </div>
                        </>
                      ) : null}
                      <p className="text-sm font-semibold text-zinc-950">S/ {order.total.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50 px-5 py-3 text-sm">
                      <span className="inline-flex items-center gap-2 text-zinc-500">
                        <FontAwesomeIcon icon={faTruck} className="text-xs" />
                        {order.shipping || "Envío estándar"}
                      </span>
                      <Link href="/account/orders" className="font-medium text-zinc-950 hover:underline">
                        Ver detalle
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {wishlistPreview.length > 0 ? (
            <div>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-zinc-950">Guardados para después</h3>
                <Link href="/account/wishlist" className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950">
                  Ver lista completa
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {wishlistPreview.map((item) => (
                  <Link
                    key={item.id}
                    href={`/products/${item.id}`}
                    className="group flex gap-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300"
                  >
                    <img src={item.image} alt={item.name} className="h-20 w-16 rounded-xl object-cover bg-zinc-100" />
                    <div className="min-w-0 py-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">{item.collection}</p>
                      <p className="mt-1 line-clamp-2 text-sm font-medium text-zinc-950">{item.name}</p>
                      <p className="mt-2 text-sm font-semibold text-zinc-950">S/ {item.price.toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-zinc-950">Tu perfil</h3>
              <Link href="/account/settings" className="text-sm font-medium text-zinc-500 hover:text-zinc-950">
                Editar
              </Link>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white">
                {user.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-950">{user.displayName}</p>
                <p className="truncate text-sm text-zinc-500">{user.email}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Completitud</span>
                <span className="font-medium text-zinc-950">{completion}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-zinc-950 transition-all" style={{ width: `${completion}%` }} />
              </div>
              {completion < 100 ? (
                <p className="mt-3 text-sm text-zinc-500">
                  {!user.phone ? "Agrega tu teléfono para coordinar envíos más rápido." : "Completa tus datos en configuración."}
                </p>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">Tu perfil está listo para comprar.</p>
              )}
            </div>
            {completion < 100 ? (
              <Link
                href="/account/settings"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-950 hover:underline"
              >
                <FontAwesomeIcon icon={faGear} />
                Completar perfil
              </Link>
            ) : null}
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <h3 className="font-semibold text-zinc-950">¿Necesitas ayuda?</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Escríbenos por WhatsApp con tu número de pedido y te respondemos lo antes posible.
            </p>
            <div className="mt-4 space-y-2">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-95"
              >
                <FontAwesomeIcon icon={faWhatsappBrand} />
                WhatsApp
              </a>
              <Link
                href="/contact"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
              >
                <FontAwesomeIcon icon={faPhone} />
                Centro de ayuda
              </Link>
            </div>
          </article>

          {wishlistPreview.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-zinc-300 bg-white p-5 text-center">
              <FontAwesomeIcon icon={faHeart} className="text-zinc-300" />
              <p className="mt-3 text-sm font-medium text-zinc-950">Lista de deseos vacía</p>
              <p className="mt-1 text-sm text-zinc-500">Guarda tus polos favoritos mientras navegas.</p>
              <Link href="/products" className="mt-3 inline-block text-sm font-semibold text-zinc-950 hover:underline">
                Ir al catálogo
              </Link>
            </article>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
