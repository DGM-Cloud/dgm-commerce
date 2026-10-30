import type { AdminDashboard } from "@/lib/admin-data";

export const EMPTY_DASHBOARD: AdminDashboard = {
  kpis: [],
  dailyTrend: { labels: [], values: [], changePercent: null },
  channelShare: [],
  statusBreakdown: [],
  topProducts: [],
  alerts: [],
  health: [],
};

/** Unwraps `{ dashboard }` envelopes and fills missing arrays from persist/API drift. */
export function normalizeDashboard(raw: unknown): AdminDashboard {
  if (!raw || typeof raw !== "object") return EMPTY_DASHBOARD;

  const root = raw as Record<string, unknown>;
  const nested =
    root.dashboard && typeof root.dashboard === "object"
      ? (root.dashboard as Record<string, unknown>)
      : root;

  const dailyTrendRaw =
    nested.dailyTrend && typeof nested.dailyTrend === "object"
      ? (nested.dailyTrend as Record<string, unknown>)
      : {};

  return {
    kpis: Array.isArray(nested.kpis) ? (nested.kpis as AdminDashboard["kpis"]) : [],
    dailyTrend: {
      labels: Array.isArray(dailyTrendRaw.labels) ? (dailyTrendRaw.labels as string[]) : [],
      values: Array.isArray(dailyTrendRaw.values) ? (dailyTrendRaw.values as number[]) : [],
      changePercent:
        typeof dailyTrendRaw.changePercent === "number" || dailyTrendRaw.changePercent === null
          ? (dailyTrendRaw.changePercent as number | null)
          : null,
    },
    channelShare: Array.isArray(nested.channelShare)
      ? (nested.channelShare as AdminDashboard["channelShare"])
      : [],
    statusBreakdown: Array.isArray(nested.statusBreakdown)
      ? (nested.statusBreakdown as AdminDashboard["statusBreakdown"])
      : [],
    topProducts: Array.isArray(nested.topProducts)
      ? (nested.topProducts as AdminDashboard["topProducts"])
      : [],
    alerts: Array.isArray(nested.alerts) ? (nested.alerts as AdminDashboard["alerts"]) : [],
    health: Array.isArray(nested.health) ? (nested.health as AdminDashboard["health"]) : [],
  };
}
