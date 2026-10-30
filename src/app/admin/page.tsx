"use client";

import Link from "next/link";
import { useAdminPage } from "@/components/admin/AdminPageContext";
import AdminModuleSkeleton from "@/components/admin/AdminModuleSkeleton";
import type { AdminDashboard } from "@/lib/admin-data";
import { useDashboardQuery, useSyncAdminFetching } from "@/lib/admin-query";

const quickActions = [
  { href: "/admin/sales", label: "Gestionar ventas" },
  { href: "/admin/inventory", label: "Actualizar stock" },
  { href: "/admin/store", label: "Editar tienda online" },
  { href: "/admin/contacts", label: "Responder contactos" },
  { href: "/admin/customers", label: "Segmentar clientes" },
];

function getToneClasses(tone: "success" | "warning" | "danger" | "neutral") {
  if (tone === "success") return "text-emerald-700 bg-emerald-50";
  if (tone === "warning") return "text-amber-700 bg-amber-50";
  if (tone === "danger") return "text-red-700 bg-red-50";
  return "text-zinc-700 bg-zinc-100";
}

function TrendLineChart({
  labels = [],
  values = [],
  changePercent = null,
}: Partial<AdminDashboard["dailyTrend"]>) {
  const safeLabels = labels ?? [];
  const safeValues = values ?? [];
  const maxValue = Math.max(...safeValues, 1);
  const width = 700;
  const height = 240;
  const points = safeValues
    .map((value, index) => {
      const x = safeValues.length === 1 ? width / 2 : (index / (safeValues.length - 1)) * (width - 40) + 20;
      const y = height - (value / maxValue) * (height - 40) - 20;
      return `${x},${y}`;
    })
    .join(" ");

  const badge =
    changePercent == null
      ? "Sin historial"
      : `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(1)}% periodo`;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">Tendencia de ventas (9 dias)</h3>
          <p className="text-sm text-zinc-600">Ingresos diarios desde ventas registradas (sin anuladas).</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            changePercent == null
              ? "bg-zinc-100 text-zinc-600"
              : changePercent >= 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
          }`}
        >
          {badge}
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        {!safeValues.length || safeValues.every((value) => value === 0) ? (
          <p className="rounded-xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
            Aun no hay ventas en los ultimos 9 dias.
          </p>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="h-[240px] w-full min-w-[680px]" role="img" aria-label="Grafica de tendencia de ventas">
            <defs>
              <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#111827" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#111827" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((step) => {
              const y = 20 + (step * (height - 40)) / 3;
              return <line key={step} x1="20" y1={y} x2={width - 20} y2={y} stroke="#e4e4e7" strokeDasharray="4 4" />;
            })}
            <polyline fill="none" stroke="#111827" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points} />
            <polygon points={`${points} ${width - 20},${height - 20} 20,${height - 20}`} fill="url(#lineFill)" />
            {safeValues.map((value, index) => {
              const x = safeValues.length === 1 ? width / 2 : (index / (safeValues.length - 1)) * (width - 40) + 20;
              const y = height - (value / maxValue) * (height - 40) - 20;
              return (
                <g key={`${safeLabels[index]}-${index}`}>
                  <circle cx={x} cy={y} r="5" fill="#111827" />
                  <text x={x} y={height - 4} textAnchor="middle" className="fill-zinc-500 text-[11px]">
                    {safeLabels[index]}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}

function ChannelChart({ channelShare }: { channelShare?: AdminDashboard["channelShare"] }) {
  const shares = channelShare ?? [];
  const gradient = shares.length
    ? `conic-gradient(${shares
        .map((item, index) => {
          const start = shares.slice(0, index).reduce((acc, current) => acc + current.value, 0);
          const end = start + item.value;
          return `${item.color} ${start}% ${end}%`;
        })
        .join(", ")})`
    : "conic-gradient(#e4e4e7 0% 100%)";

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold">Mix de canales</h3>
      <p className="text-sm text-zinc-600">Distribucion de ingresos por canal (ventas activas).</p>

      <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative h-40 w-40 rounded-full" style={{ background: gradient }}>
          <div className="absolute inset-5 rounded-full bg-white" />
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Total</p>
              <p className="text-xl font-black">{shares.length ? "100%" : "—"}</p>
            </div>
          </div>
        </div>

        <ul className="w-full space-y-2 text-sm">
          {shares.length ? (
            shares.map((item) => (
              <li key={item.name} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold">{item.value}%</span>
              </li>
            ))
          ) : (
            <li className="rounded-lg bg-zinc-50 px-3 py-2 text-zinc-500">Sin ventas por canal todavia.</li>
          )}
        </ul>
      </div>
    </article>
  );
}

export default function AdminDashboardPage() {
  useAdminPage({
    title: "Dashboard",
    subtitle: "Centro de control con ventas, inventario, canales y alertas desde Supabase.",
  });
  const dashboardQuery = useDashboardQuery();
  useSyncAdminFetching(dashboardQuery.isFetching);
  const dashboard = dashboardQuery.data;

  if (dashboardQuery.isLoading && !dashboard) {
    return <AdminModuleSkeleton cards={6} />;
  }

  if (dashboardQuery.isError && !dashboard) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {dashboardQuery.error?.message || "No se pudo cargar el dashboard."}
      </p>
    );
  }

  const kpis = dashboard?.kpis ?? [];
  const statusBreakdown = dashboard?.statusBreakdown ?? [];
  const alerts = dashboard?.alerts ?? [];
  const topProducts = dashboard?.topProducts ?? [];
  const health = dashboard?.health ?? [];

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{kpi.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight">{kpi.value}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`rounded-full px-2 py-1 text-xs font-bold ${getToneClasses(kpi.tone)}`}>
                {kpi.delta}
              </span>
              <span className="text-sm text-zinc-600">{kpi.note}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <TrendLineChart {...(dashboard?.dailyTrend ?? { labels: [], values: [], changePercent: null })} />

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold">Acciones rapidas</h3>
          <p className="text-sm text-zinc-600">Atajos para tareas criticas del dia.</p>
          <div className="mt-4 grid gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-100"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold">Estado de ventas</h3>
          <p className="text-sm text-zinc-600">Distribucion real por estado operativo.</p>
          <ul className="mt-4 space-y-2">
            {statusBreakdown.map((step) => (
              <li key={step.stage} className="rounded-xl bg-zinc-50 p-3">
                <div className="mb-1 flex items-center justify-between text-sm font-semibold">
                  <span>{step.stage}</span>
                  <span>{step.value.toLocaleString("es-PE")}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                  <div className="h-full rounded-full bg-zinc-900" style={{ width: `${Math.min(100, step.percentage)}%` }} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">{step.percentage}% del total</p>
              </li>
            ))}
          </ul>
        </article>

        <ChannelChart channelShare={dashboard?.channelShare} />

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold">Alertas operativas</h3>
          <p className="text-sm text-zinc-600">Pendientes que impactan venta o experiencia de cliente.</p>
          <ul className="mt-4 space-y-3">
            {alerts.map((alert) => (
              <li key={alert.title} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-bold text-amber-900">{alert.title}</p>
                <p className="mt-1 text-xs text-amber-900/80">{alert.detail}</p>
                <Link href={alert.actionHref} className="mt-2 inline-block text-xs font-bold underline">
                  {alert.actionLabel}
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Top productos por ingresos</h3>
            <Link href="/admin/sales" className="text-sm font-semibold underline">
              Ver ventas
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            {topProducts.length ? (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="py-2">Producto</th>
                    <th className="py-2">Unidades</th>
                    <th className="py-2">Ingresos</th>
                    <th className="py-2">Peso</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product) => {
                    const maxRevenue = topProducts[0]?.revenue || 1;
                    const ratio = Math.round((product.revenue / maxRevenue) * 100);
                    return (
                      <tr key={product.name} className="border-t border-zinc-100">
                        <td className="py-2 font-semibold">{product.name}</td>
                        <td className="py-2">{product.units}</td>
                        <td className="py-2">
                          S/ {product.revenue.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2">
                          <div className="h-2 rounded-full bg-zinc-200">
                            <div className="h-2 rounded-full bg-zinc-900" style={{ width: `${ratio}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="rounded-xl bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
                Sin lineas de venta todavia. Crea una venta con items para ver el ranking.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold">Salud operativa</h3>
          <div className="mt-4 space-y-3 text-sm">
            {health.map((item) => (
              <div key={item.title} className="rounded-xl bg-zinc-50 p-3">
                <p className="font-semibold">{item.title}</p>
                <p className="text-zinc-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
