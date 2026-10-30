"use client";

import { useMemo, useState } from "react";
import { useAdminPage } from "@/components/admin/AdminPageContext";
import AdminModuleSkeleton from "@/components/admin/AdminModuleSkeleton";
import type { AdminCustomerSummary } from "@/lib/admin-data";
import { useCustomersQuery, useSyncAdminFetching } from "@/lib/admin-query";

const emptySummary: AdminCustomerSummary = {
  total: 0,
  newCustomers: 0,
  recurrent: 0,
  highValue: 0,
  totalLtv: 0,
};

export default function AdminCustomersPage() {
  useAdminPage({
    title: "Clientes",
    subtitle: "Base real de clientes, compras, LTV y seguimiento comercial.",
  });
  const customersQuery = useCustomersQuery();
  useSyncAdminFetching(customersQuery.isFetching);

  const customers = customersQuery.data?.customers ?? [];
  const summary = customersQuery.data?.summary ?? emptySummary;
  const loading = customersQuery.isLoading;
  const error = customersQuery.error?.message ?? null;
  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) =>
      [customer.name, customer.document, customer.phone, customer.email, customer.district, customer.agency]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [customers, search]);

  if (loading && !customers.length) {
    return <AdminModuleSkeleton cards={4} />;
  }

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Clientes" value={summary.total} detail="Registrados en la base" />
        <MetricCard label="Nuevos" value={summary.newCustomers} detail="Sin historial recurrente" />
        <MetricCard label="Recurrentes" value={summary.recurrent} detail="Mas de una venta" />
        <MetricCard label="LTV total" value={`S/ ${summary.totalLtv.toFixed(2)}`} detail="Ventas acumuladas" />
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">Clientes y ultimas compras</h3>
            <p className="text-sm text-zinc-500">Cruza datos de clientes y ventas para ver valor, recurrencia y ultima compra.</p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cliente, DNI, telefono, distrito..."
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-950 sm:w-96"
          />
        </div>

        {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

        <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-100">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Ubicacion</th>
                <th className="px-4 py-3 text-right">Ventas</th>
                <th className="px-4 py-3 text-right">LTV</th>
                <th className="px-4 py-3">Ultima compra</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-t border-zinc-100 transition hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <p className="font-bold text-zinc-950">{customer.name}</p>
                    <p className="text-xs text-zinc-500">{customer.type} · {customer.document || "Sin documento"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-800">{customer.phone || "Sin telefono"}</p>
                    <p className="text-xs text-zinc-500">{customer.email || "Sin email"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-zinc-800">{customer.district || "Sin distrito"}</p>
                    <p className="text-xs text-zinc-500">{customer.agency || customer.department || "Sin agencia"}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{customer.saleCount}</td>
                  <td className="px-4 py-3 text-right font-black">S/ {customer.ltv.toFixed(2)}</td>
                  <td className="px-4 py-3 text-zinc-600">{formatDate(customer.lastPurchase)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-bold text-zinc-700">
                      {customer.lastSaleStatus || "Sin historial"}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredCustomers.length && !loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-500">
                    No hay clientes que coincidan con la busqueda.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-zinc-950">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{detail}</p>
    </article>
  );
}

function formatDate(value?: string) {
  if (!value) return "Sin compras";
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(new Date(value));
}
