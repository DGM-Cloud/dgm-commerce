export type OrderStatusConfig = {
  id: string;
  label: string;
  color: string;
  /** When true, the sale counts toward dashboard revenue metrics. */
  countsInMetrics: boolean;
  /** Built-in statuses cannot be removed from settings. */
  locked?: boolean;
};

export const DEFAULT_ORDER_STATUSES: OrderStatusConfig[] = [
  { id: "anulado", label: "Anulado", color: "#dc2626", countsInMetrics: false, locked: true },
  { id: "pendiente", label: "Pendiente", color: "#d97706", countsInMetrics: false, locked: true },
  { id: "pagado", label: "Pagado", color: "#059669", countsInMetrics: true, locked: true },
  { id: "enviado", label: "Enviado", color: "#2563eb", countsInMetrics: true, locked: true },
];

function slugifyStatusId(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function isHexColor(value: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

export function normalizeOrderStatuses(input?: unknown): OrderStatusConfig[] {
  const defaultsById = new Map(DEFAULT_ORDER_STATUSES.map((item) => [item.id, item]));
  const defaultsByLabel = new Map(
    DEFAULT_ORDER_STATUSES.map((item) => [item.label.toLowerCase(), item]),
  );

  const rawList = Array.isArray(input) ? input : [];
  const seenIds = new Set<string>();
  const normalized: OrderStatusConfig[] = [];

  for (const entry of rawList) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const label = typeof row.label === "string" ? row.label.trim() : "";
    if (!label) continue;

    const defaultMatch =
      (typeof row.id === "string" && defaultsById.get(row.id)) ||
      defaultsByLabel.get(label.toLowerCase());

    let id =
      (typeof row.id === "string" && row.id.trim()) ||
      defaultMatch?.id ||
      slugifyStatusId(label) ||
      `status-${normalized.length + 1}`;

    if (seenIds.has(id)) {
      id = `${id}-${normalized.length + 1}`;
    }
    seenIds.add(id);

    const color =
      typeof row.color === "string" && isHexColor(row.color)
        ? row.color.trim()
        : defaultMatch?.color || "#71717a";

    normalized.push({
      id,
      label,
      color,
      countsInMetrics:
        typeof row.countsInMetrics === "boolean"
          ? row.countsInMetrics
          : Boolean(defaultMatch?.countsInMetrics),
      locked: Boolean(defaultMatch?.locked),
    });
  }

  for (const fallback of DEFAULT_ORDER_STATUSES) {
    if (normalized.some((item) => item.id === fallback.id || item.label.toLowerCase() === fallback.label.toLowerCase())) {
      continue;
    }
    normalized.push({ ...fallback });
  }

  return normalized;
}

export function findOrderStatus(
  statuses: OrderStatusConfig[],
  labelOrId?: string | null,
): OrderStatusConfig | undefined {
  if (!labelOrId) return undefined;
  const needle = labelOrId.trim().toLowerCase();
  return statuses.find(
    (item) => item.label.toLowerCase() === needle || item.id.toLowerCase() === needle,
  );
}

export function orderStatusCountsInMetrics(
  statuses: OrderStatusConfig[],
  labelOrId?: string | null,
): boolean {
  const match = findOrderStatus(statuses, labelOrId);
  if (match) return match.countsInMetrics;
  // Legacy fallback: only exact Pagado counted as paid before Enviado existed.
  return (labelOrId || "").trim().toLowerCase() === "pagado";
}

export function orderStatusBadgeStyle(color: string): { backgroundColor: string; color: string } {
  const hex = color.trim();
  return {
    backgroundColor: `${hex}22`,
    color: hex,
  };
}

/** Keep legacy payment_status column compatible with DB / older rows. */
export function paymentStatusFromOrderStatus(
  orderStatus: string,
  statuses: OrderStatusConfig[] = DEFAULT_ORDER_STATUSES,
): "Pendiente" | "Pagado" | "Parcial" {
  if (orderStatusCountsInMetrics(statuses, orderStatus)) return "Pagado";
  const normalized = orderStatus.trim().toLowerCase();
  if (normalized === "parcial") return "Parcial";
  return "Pendiente";
}

export function createOrderStatusDraft(label: string, color = "#6366f1"): OrderStatusConfig {
  const trimmed = label.trim() || "Nuevo estado";
  return {
    id: slugifyStatusId(trimmed) || `status-${Date.now()}`,
    label: trimmed,
    color: isHexColor(color) ? color.trim() : "#6366f1",
    countsInMetrics: false,
    locked: false,
  };
}
