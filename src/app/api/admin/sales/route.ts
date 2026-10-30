import { NextResponse } from "next/server";
import { createSale, listSales } from "@/backend/admin-data.server";
import { requireStaffUser, readJsonBody } from "@/backend/admin-api.server";
import type { AdminSale } from "@/lib/admin-data";
import { paginateItems, parseAdminListQuery } from "@/lib/admin-query/list-params";

function parseCsvParam(url: string, key: string) {
  const value = new URL(url).searchParams.get(key);
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  const query = parseAdminListQuery(request.url);
  const channels = parseCsvParam(request.url, "channel");
  const statuses = parseCsvParam(request.url, "status");
  const customers = parseCsvParam(request.url, "customer");
  const ids = parseCsvParam(request.url, "id");
  const amountMinRaw = new URL(request.url).searchParams.get("amountMin");
  const amountMaxRaw = new URL(request.url).searchParams.get("amountMax");
  const amountMin = amountMinRaw != null && amountMinRaw !== "" ? Number(amountMinRaw) : null;
  const amountMax = amountMaxRaw != null && amountMaxRaw !== "" ? Number(amountMaxRaw) : null;

  const sales = await listSales();
  const facets = {
    ids: Array.from(new Set(sales.map((sale) => sale.id))),
    channels: Array.from(new Set(sales.map((sale) => sale.channel))).sort((a, b) => a.localeCompare(b, "es")),
    customers: Array.from(new Set(sales.map((sale) => sale.customer).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "es"),
    ),
    statuses: Array.from(new Set(sales.map((sale) => sale.status))).sort((a, b) => a.localeCompare(b, "es")),
  };

  const filtered = sales.filter((sale) => {
    const matchesSearch =
      !query.q ||
      [sale.id, sale.orderNumber, sale.customer, sale.customerDni, sale.channel, sale.status, sale.paymentStatus]
        .join(" ")
        .toLowerCase()
        .includes(query.q);
    const matchesChannel = channels.length === 0 || channels.includes(sale.channel);
    const matchesStatus = statuses.length === 0 || statuses.includes(sale.status);
    const matchesCustomer = customers.length === 0 || customers.includes(sale.customer);
    const matchesId = ids.length === 0 || ids.includes(sale.id);
    const matchesAmount =
      (amountMin === null || Number.isNaN(amountMin) || sale.amount >= amountMin) &&
      (amountMax === null || Number.isNaN(amountMax) || sale.amount <= amountMax);

    return matchesSearch && matchesChannel && matchesStatus && matchesCustomer && matchesId && matchesAmount;
  });

  // No pageSize → full list. Explicit pageSize → server page.
  const paged = paginateItems(filtered, query.page, query.pageSize);

  return NextResponse.json({
    sales: paged.items,
    total: paged.total,
    page: paged.page,
    pageSize: paged.pageSize,
    facets,
  });
}

export async function POST(request: Request) {
  const { error: authError } = requireStaffUser(request);
  if (authError) return authError;

  const body = await readJsonBody<Omit<AdminSale, "id">>(request);

  if (!body.customer || !body.channel || !body.status || typeof body.amount !== "number") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const sale = await createSale({
    orderNumber: body.orderNumber,
    placedAt: body.placedAt,
    customerId: body.customerId,
    customerDni: body.customerDni,
    customerAddress: body.customerAddress,
    customer: body.customer,
    channel: body.channel,
    status: body.status,
    customerType: body.customerType,
    currency: body.currency,
    exchangeRate: body.exchangeRate,
    subtotal: body.subtotal,
    discountTotal: body.discountTotal,
    shippingTotal: body.shippingTotal,
    taxTotal: body.taxTotal,
    amount: body.amount,
    paymentStatus: body.paymentStatus,
    source: body.source,
    notes: body.notes,
    salesRepId: body.salesRepId,
  });

  return NextResponse.json({ sale }, { status: 201 });
}
