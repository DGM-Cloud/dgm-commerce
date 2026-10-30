"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faReceipt,
  faBox,
  faAddressBook,
  faStore,
  faGear,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { brand } from "@/config/brand";
import { AdminPageProvider, useAdminPageMeta, useAdminFetching } from "@/components/admin/AdminPageContext";
import { adminKeys } from "@/lib/admin-query/keys";
import { adminFetch } from "@/lib/admin-query/fetcher";

interface AdminShellProps {
  children: ReactNode;
}

interface AdminNavItem {
  href: string;
  label: string;
  icon: IconDefinition;
  badge?: string;
  prefetch?: () => Promise<unknown>;
}

const navItems: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: faChartLine },
  { href: "/admin/sales", label: "Ventas", icon: faReceipt },
  { href: "/admin/inventory", label: "Inventario", icon: faBox },
  { href: "/admin/contacts", label: "Contactos", icon: faAddressBook },
  { href: "/admin/customers", label: "Clientes", icon: faUsers, badge: "MVP+" },
  { href: "/admin/store", label: "Tienda online", icon: faStore },
  { href: "/admin/settings", label: "Configuración", icon: faGear },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

function prefetchForHref(href: string, queryClient: ReturnType<typeof useQueryClient>) {
  if (href === "/admin" || href === "/admin/") {
    void queryClient.prefetchQuery({
      queryKey: adminKeys.dashboard(),
      queryFn: () => adminFetch<{ dashboard: unknown }>("/api/admin/dashboard"),
    });
    return;
  }
  if (href === "/admin/inventory") {
    const params = { page: 1, pageSize: 25 };
    void queryClient.prefetchQuery({
      queryKey: adminKeys.inventoryProducts(params),
      queryFn: () =>
        adminFetch<{ products: unknown }>("/api/admin/inventory?productsOnly=1&page=1&pageSize=25"),
    });
    return;
  }
  if (href === "/admin/sales") {
    const params = { page: 1, pageSize: 50 };
    void queryClient.prefetchQuery({
      queryKey: adminKeys.sales(params),
      queryFn: () => adminFetch<{ sales: unknown }>("/api/admin/sales?page=1&pageSize=50"),
    });
    return;
  }
  if (href === "/admin/contacts") {
    const params = { page: 1, pageSize: 50 };
    void queryClient.prefetchQuery({
      queryKey: adminKeys.contacts(params),
      queryFn: () => adminFetch<{ contacts: unknown }>("/api/admin/contacts?page=1&pageSize=50"),
    });
    return;
  }
  if (href === "/admin/customers") {
    void queryClient.prefetchQuery({
      queryKey: adminKeys.customers(),
      queryFn: () => adminFetch<{ customers: unknown; summary: unknown }>("/api/admin/customers"),
    });
    return;
  }
  if (href === "/admin/store" || href === "/admin/settings") {
    void queryClient.prefetchQuery({
      queryKey: adminKeys.storeCms(),
      queryFn: () => adminFetch<{ cms: unknown }>("/api/admin/store"),
    });
  }
}

function AdminShellChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { title, subtitle } = useAdminPageMeta();
  const { isFetching } = useAdminFetching();
  const queryClient = useQueryClient();

  useEffect(() => {
    const run = () => {
      prefetchForHref("/admin", queryClient);
      prefetchForHref("/admin/inventory", queryClient);
      prefetchForHref("/admin/store", queryClient);
    };

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof idleWindow.requestIdleCallback === "function") {
      const idleId = idleWindow.requestIdleCallback(run, { timeout: 2500 });
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = globalThis.setTimeout(run, 1200);
    return () => globalThis.clearTimeout(timeoutId);
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-zinc-900">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-zinc-200 bg-white/80 p-5 backdrop-blur lg:border-b-0 lg:border-r">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{brand.name} Admin</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Panel</h1>
          </div>

          <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => prefetchForHref(item.href, queryClient)}
                  onFocus={() => prefetchForHref(item.href, queryClient)}
                  className={[
                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    active
                      ? "bg-black text-white shadow"
                      : "bg-white text-zinc-700 hover:bg-zinc-100",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
                    <span>{item.label}</span>
                  </span>
                  {item.badge ? (
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        active ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700",
                      ].join(" ")}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="p-4 sm:p-6 lg:p-8">
          <header className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
                <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
              </div>
              {isFetching ? (
                <span className="mt-1 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
                  Actualizando
                </span>
              ) : null}
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: AdminShellProps) {
  return (
    <AdminPageProvider>
      <AdminShellChrome>{children}</AdminShellChrome>
    </AdminPageProvider>
  );
}
