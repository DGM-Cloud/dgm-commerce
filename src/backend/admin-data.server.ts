import type {
  AdminContact,
  AdminCustomerInsight,
  AdminCustomerSummary,
  AdminDashboard,
  AdminDashboardAlert,
  AdminDashboardKpi,
  AdminInventoryItem,
  AdminInventoryProduct,
  AdminInventoryProductInput,
  AdminSale,
  AdminSaleItem,
} from "@/lib/admin-data";
import type { ProductStock, ProductStockMap } from "@/lib/product-stock";
import { deriveSubcollection } from "@/lib/product-subcollection";
import {
  DEFAULT_ORDER_STATUSES,
  findOrderStatus,
  normalizeOrderStatuses,
  orderStatusCountsInMetrics,
  paymentStatusFromOrderStatus,
  type OrderStatusConfig,
} from "@/lib/order-status";
import { getStoreCms } from "@/backend/store-cms.server";
import { supabaseTableRequest } from "@/backend/supabase.server";
import { mockProducts } from "@/data/mockProducts";

interface AdminSaleRow {
  id: string;
  order_number: string | null;
  placed_at: string | null;
  customer_id: string | null;
  customer_dni: string | null;
  customer_address: string | null;
  channel: AdminSale["channel"];
  customer: string;
  customer_type: AdminSale["customerType"] | null;
  currency: AdminSale["currency"] | null;
  exchange_rate: number | null;
  subtotal: number | null;
  discount_total: number | null;
  shipping_total: number | null;
  tax_total: number | null;
  amount: number;
  payment_status: AdminSale["paymentStatus"] | null;
  status: AdminSale["status"];
  source: AdminSale["source"] | null;
  notes: string | null;
  sales_rep_id: string | null;
  admin_sale_items?: AdminSaleItemRow[];
}

interface AdminSaleItemRow {
  id: string;
  sale_id: string;
  product_id: number | null;
  parent_sku: string | null;
  variant_sku: string;
  product: string;
  description: string | null;
  color: string | null;
  size: string | null;
  quantity: number;
  stock_available: number | null;
  unit_price: number;
  discount_total: number;
  line_total: number;
}

interface AdminInventoryRow {
  sku: string;
  parent_sku: string | null;
  product_id: number | null;
  product: string;
  summary: string | null;
  description: string | null;
  category: string | null;
  collection: string | null;
  subcollection: string | null;
  color: string | null;
  size: string | null;
  options: Record<string, string> | null;
  price: number | null;
  image: string | null;
  images?: string[] | null;
  seo_slug?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  on_hand: number;
  reserved: number;
  sold: number | null;
  low_stock_threshold: number | null;
  status: AdminInventoryItem["status"] | null;
  warehouse: string;
  created_at: string | null;
  updated_at: string | null;
}

interface AdminContactRow {
  id: string;
  document_type: AdminContact["documentType"];
  document: string;
  last_name_paterno: string;
  last_name_materno: string;
  names: string;
  sex: AdminContact["sex"];
  birth_date: string;
  numero: string;
  classification: AdminContact["classification"];
  client: string;
  cellphone: string;
  email: string;
  province: string;
  district: string;
  department: string;
  address: string;
  address_number: string;
  reference: string;
  agency: string;
  contacted_by: string[];
  contacted_by_other: string | null;
}

function saleFromRow(row: AdminSaleRow): AdminSale {
  return {
    id: row.id,
    orderNumber: row.order_number ?? undefined,
    placedAt: row.placed_at ?? undefined,
    customerId: row.customer_id ?? undefined,
    customerDni: row.customer_dni ?? undefined,
    customerAddress: row.customer_address ?? undefined,
    channel: row.channel,
    customer: row.customer,
    customerType: row.customer_type ?? undefined,
    currency: row.currency ?? undefined,
    exchangeRate: row.exchange_rate ?? undefined,
    subtotal: row.subtotal ?? undefined,
    discountTotal: row.discount_total ?? undefined,
    shippingTotal: row.shipping_total ?? undefined,
    taxTotal: row.tax_total ?? undefined,
    amount: row.amount,
    paymentStatus: row.payment_status ?? undefined,
    status: row.status,
    source: row.source ?? undefined,
    notes: row.notes ?? undefined,
    salesRepId: row.sales_rep_id ?? undefined,
    items: row.admin_sale_items?.map(saleItemFromRow) ?? [],
  };
}

function saleItemFromRow(row: AdminSaleItemRow): AdminSaleItem {
  return {
    id: row.id,
    saleId: row.sale_id,
    productId: row.product_id ?? undefined,
    parentSku: row.parent_sku ?? undefined,
    variantSku: row.variant_sku,
    product: row.product,
    description: row.description ?? undefined,
    color: row.color ?? undefined,
    size: row.size ?? undefined,
    quantity: row.quantity,
    stockAvailable: row.stock_available ?? undefined,
    unitPrice: row.unit_price,
    discountTotal: row.discount_total,
    lineTotal: row.line_total,
  };
}

function saleItemToRow(saleId: string, item: AdminSaleItem) {
  return {
    sale_id: saleId,
    product_id: item.productId,
    parent_sku: item.parentSku,
    variant_sku: item.variantSku,
    product: item.product,
    description: item.description,
    color: item.color,
    size: item.size,
    quantity: item.quantity,
    stock_available: item.stockAvailable,
    unit_price: item.unitPrice,
    discount_total: item.discountTotal,
    line_total: item.lineTotal,
  };
}

function saleToRow(input: Partial<Omit<AdminSale, "id">>) {
  const status = input.status;
  const paymentStatus =
    status !== undefined
      ? paymentStatusFromOrderStatus(status)
      : input.paymentStatus;

  return {
    order_number: input.orderNumber,
    placed_at: input.placedAt,
    customer_id: input.customerId,
    customer_dni: input.customerDni,
    customer_address: input.customerAddress,
    channel: input.channel,
    customer: input.customer,
    customer_type: input.customerType,
    currency: input.currency,
    exchange_rate: input.exchangeRate,
    subtotal: input.subtotal,
    discount_total: input.discountTotal,
    shipping_total: input.shippingTotal,
    tax_total: input.taxTotal,
    amount: input.amount,
    payment_status: paymentStatus,
    status,
    source: input.source,
    notes: input.notes,
    sales_rep_id: input.salesRepId,
  };
}

function compact<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function normalizeProductImages(input: { images?: unknown; image?: string | null }) {
  const rawImages = input.images;
  let fromArray: string[] = [];

  if (Array.isArray(rawImages)) {
    fromArray = rawImages.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  } else if (typeof rawImages === "string" && rawImages.trim()) {
    try {
      const parsed = JSON.parse(rawImages);
      if (Array.isArray(parsed)) {
        fromArray = parsed.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
      }
    } catch {
      fromArray = [];
    }
  }

  const fromSingle = input.image?.trim();
  const merged = fromArray.length ? fromArray : fromSingle ? [fromSingle] : [];
  return Array.from(new Set(merged));
}

function inventoryFromRow(row: AdminInventoryRow): AdminInventoryItem {
  const images = normalizeProductImages({ images: row.images, image: row.image });

  return {
    sku: row.sku,
    parentSku: row.parent_sku ?? undefined,
    productId: row.product_id ?? undefined,
    product: row.product,
    summary: row.summary ?? undefined,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
    collection: row.collection ?? undefined,
    subcollection: row.subcollection ?? undefined,
    color: row.color ?? undefined,
    size: row.size ?? undefined,
    options: row.options ?? undefined,
    price: row.price ?? undefined,
    image: images[0] ?? row.image ?? undefined,
    images,
    seoSlug: row.seo_slug ?? undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    onHand: row.on_hand,
    reserved: row.reserved,
    sold: row.sold ?? 0,
    lowStockThreshold: row.low_stock_threshold ?? 3,
    status: row.status ?? "active",
    warehouse: row.warehouse,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function slugPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
}

function productPrefix(product: { id: number; collection: string }) {
  return `${slugPart(product.collection)}-${String(product.id).padStart(3, "0")}`;
}

function variantSku(parentSku: string, color: string, size: string) {
  return `${parentSku}-${slugPart(color)}-${slugPart(size)}`;
}

function catalogInventoryRows(): AdminInventoryRow[] {
  return mockProducts.flatMap((product) => {
    const colors = product.colors?.length ? product.colors : ["UNICO"];
    const sizes = product.sizes?.length ? product.sizes : ["STD"];
    const image = product.images?.[0] ?? null;
    const parentSku = productPrefix(product);

    return colors.flatMap((color) =>
      sizes.map((size) => ({
        sku: `${parentSku}-${slugPart(color)}-${slugPart(size)}`,
        parent_sku: parentSku,
        product_id: product.id,
        product: product.name,
        summary: product.description,
        description: product.detailedDescription || product.description,
        category: ("category" in product && product.category) || "General",
        collection: product.collection,
        subcollection: deriveSubcollection(product.name, product.collection),
        color,
        size,
        options: { color, size },
        price: product.price,
        image,
        on_hand: 10,
        reserved: 0,
        sold: 0,
        low_stock_threshold: 3,
        status: product.available ? "active" : "draft",
        warehouse: "Principal",
        created_at: null,
        updated_at: null,
      }))
    );
  });
}

function enrichRowsWithCatalogMetadata(rows: AdminInventoryRow[]) {
  const productsById = new Map(mockProducts.map((product) => [product.id, product]));

  return rows.map((row) => {
    if (!row.product_id) return row;

    const product = productsById.get(row.product_id);
    if (!product) return row;

    const detailedDescription = product.detailedDescription || product.description;
    const shouldUseCatalogDescription = !row.description || row.description.length < detailedDescription.length;

    return {
      ...row,
      summary: row.summary ?? product.description,
      description: shouldUseCatalogDescription ? detailedDescription : row.description,
      category: row.category ?? (("category" in product && product.category) || "General"),
      subcollection: row.subcollection ?? deriveSubcollection(product.name, product.collection),
      image: row.image ?? product.images?.[0] ?? null,
    };
  });
}

async function syncCatalogInventoryRows(existingRows: AdminInventoryRow[]) {
  const existingSkus = new Set(existingRows.map((row) => row.sku));
  const missingRows = catalogInventoryRows().filter((row) => !existingSkus.has(row.sku));

  if (!missingRows.length) {
    return existingRows;
  }

  const insertedRows = await supabaseTableRequest<AdminInventoryRow[]>("/admin_inventory_items?on_conflict=sku", {
    method: "POST",
    headers: {
      Prefer: "resolution=ignore-duplicates,return=representation",
    },
    body: JSON.stringify(missingRows),
  });

  return [...existingRows, ...insertedRows];
}

function contactFromRow(row: AdminContactRow): AdminContact {
  return {
    id: row.id,
    documentType: row.document_type,
    document: row.document,
    lastNamePaterno: row.last_name_paterno,
    lastNameMaterno: row.last_name_materno,
    names: row.names,
    sex: row.sex,
    birthDate: row.birth_date,
    numero: row.numero,
    classification: row.classification,
    client: row.client,
    cellphone: row.cellphone,
    email: row.email,
    province: row.province,
    district: row.district,
    department: row.department,
    address: row.address,
    addressNumber: row.address_number,
    reference: row.reference,
    agency: row.agency,
    contactedBy: row.contacted_by,
    contactedByOther: row.contacted_by_other ?? undefined,
  };
}

function contactToRow(input: Partial<Omit<AdminContact, "id">>) {
  return {
    document_type: input.documentType,
    document: input.document,
    last_name_paterno: input.lastNamePaterno,
    last_name_materno: input.lastNameMaterno,
    names: input.names,
    sex: input.sex,
    birth_date: input.birthDate,
    numero: input.numero,
    classification: input.classification,
    client: input.client,
    cellphone: input.cellphone,
    email: input.email,
    province: input.province,
    district: input.district,
    department: input.department,
    address: input.address,
    address_number: input.addressNumber,
    reference: input.reference,
    agency: input.agency,
    contacted_by: input.contactedBy,
    contacted_by_other: input.contactedByOther,
  };
}

function normalizeLookup(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function contactMatchesSale(contact: AdminContact, sale: AdminSale) {
  return (
    (!!sale.customerId && sale.customerId === contact.id) ||
    (!!sale.customerDni && sale.customerDni === contact.document) ||
    normalizeLookup(sale.customer) === normalizeLookup(contact.client)
  );
}

function latestSaleDate(sales: AdminSale[]) {
  const timestamps = sales
    .map((sale) => (sale.placedAt ? new Date(sale.placedAt).getTime() : 0))
    .filter((timestamp) => Number.isFinite(timestamp) && timestamp > 0);

  if (!timestamps.length) return undefined;
  return new Date(Math.max(...timestamps)).toISOString();
}

function customerSummary(customers: AdminCustomerInsight[]): AdminCustomerSummary {
  const totalLtv = customers.reduce((sum, customer) => sum + customer.ltv, 0);

  return {
    total: customers.length,
    newCustomers: customers.filter((customer) => customer.saleCount + customer.orderCount <= 1).length,
    recurrent: customers.filter((customer) => customer.saleCount > 1).length,
    highValue: customers.filter((customer) => customer.ltv >= 300).length,
    totalLtv,
  };
}

export async function listSales() {
  const rows = await supabaseTableRequest<AdminSaleRow[]>("/admin_sales?select=*,admin_sale_items(*)&order=id.desc");
  return rows.map(saleFromRow);
}

export async function createSale(input: Omit<AdminSale, "id">) {
  const [row] = await supabaseTableRequest<AdminSaleRow[]>("/admin_sales", {
    method: "POST",
    body: JSON.stringify([compact(saleToRow(input))]),
  });

  if (input.items?.length) {
    await replaceSaleItems(row.id, input.items);
  }

  return (await getSale(row.id)) ?? saleFromRow(row);
}

export async function updateSale(id: string, patch: Partial<Omit<AdminSale, "id">>) {
  const rows = await supabaseTableRequest<AdminSaleRow[]>(`/admin_sales?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(compact(saleToRow(patch))),
  });

  if (!rows[0]) return null;

  if (patch.items) {
    await replaceSaleItems(id, patch.items);
  }

  return getSale(id);
}

async function getSale(id: string) {
  const rows = await supabaseTableRequest<AdminSaleRow[]>(`/admin_sales?id=eq.${encodeURIComponent(id)}&select=*,admin_sale_items(*)&limit=1`);
  return rows[0] ? saleFromRow(rows[0]) : null;
}

async function replaceSaleItems(saleId: string, items: AdminSaleItem[]) {
  await supabaseTableRequest<AdminSaleItemRow[]>(`/admin_sale_items?sale_id=eq.${encodeURIComponent(saleId)}`, {
    method: "DELETE",
  });

  if (!items.length) return;

  await supabaseTableRequest<AdminSaleItemRow[]>("/admin_sale_items", {
    method: "POST",
    body: JSON.stringify(items.map((item) => compact(saleItemToRow(saleId, item)))),
  });
}

export async function deleteSale(id: string) {
  const rows = await supabaseTableRequest<AdminSaleRow[]>(`/admin_sales?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  return rows.length > 0;
}

/** Opt-in only: pushes src/data/mockProducts into Supabase inventory. Off by default for clean DGM demos. */
const CATALOG_SYNC_FROM_MOCK = process.env.CATALOG_SYNC_FROM_MOCK === "true";

export async function listInventory() {
  const rows = await supabaseTableRequest<AdminInventoryRow[]>("/admin_inventory_items?select=*&order=sku.asc");
  const enriched = enrichRowsWithCatalogMetadata(rows);
  const syncedRows = CATALOG_SYNC_FROM_MOCK ? await syncCatalogInventoryRows(enriched) : enriched;
  return syncedRows.sort((a, b) => a.sku.localeCompare(b.sku)).map(inventoryFromRow);
}

function earlierTimestamp(current?: string, next?: string) {
  if (!next) return current;
  if (!current) return next;
  return new Date(next).getTime() < new Date(current).getTime() ? next : current;
}

export async function listInventoryProducts(): Promise<AdminInventoryProduct[]> {
  const variants = await listInventory();
  const groups = new Map<string, AdminInventoryProduct>();

  for (const variant of variants) {
    const parentSku = variant.parentSku || variant.sku.split("-").slice(0, 2).join("-");
    const variantImages = normalizeProductImages({ images: variant.images, image: variant.image });
    const existing =
      groups.get(parentSku) ??
      {
        productId: variant.productId,
        parentSku,
        product: variant.product,
        summary: variant.summary,
        description: variant.description,
        category: variant.category,
        collection: variant.collection,
        subcollection: variant.subcollection ?? deriveSubcollection(variant.product, variant.collection),
        seoSlug: variant.seoSlug,
        seoTitle: variant.seoTitle,
        seoDescription: variant.seoDescription,
        images: [],
        basePrice: variant.price,
        status: variant.status ?? "active",
        totalOnHand: 0,
        totalReserved: 0,
        totalSold: 0,
        totalAvailable: 0,
        createdAt: variant.createdAt,
        variants: [],
      };

    const available = Math.max(0, variant.onHand - variant.reserved);
    existing.totalOnHand += variant.onHand;
    existing.totalReserved += variant.reserved;
    existing.totalSold += variant.sold ?? 0;
    existing.totalAvailable += available;
    existing.variants.push(variant);
    if (!existing.seoSlug && variant.seoSlug) existing.seoSlug = variant.seoSlug;
    if (!existing.seoTitle && variant.seoTitle) existing.seoTitle = variant.seoTitle;
    if (!existing.seoDescription && variant.seoDescription) existing.seoDescription = variant.seoDescription;

    if (!existing.images.length && variantImages.length) {
      existing.images = variantImages;
    } else {
      for (const image of variantImages) {
        if (!existing.images.includes(image)) existing.images.push(image);
      }
    }
    if ((variant.status ?? "active") === "active") {
      existing.status = "active";
    }
    existing.createdAt = earlierTimestamp(existing.createdAt, variant.createdAt);

    groups.set(parentSku, existing);
  }

  return Array.from(groups.values()).sort((a, b) => a.parentSku.localeCompare(b.parentSku));
}

export async function listProductStock(): Promise<ProductStockMap> {
  const rows = await supabaseTableRequest<AdminInventoryRow[]>(
    "/admin_inventory_items?select=sku,product_id,color,size,on_hand,reserved,status&order=sku.asc"
  );
  const stockMap: ProductStockMap = {};

  for (const row of rows) {
    if (!row.product_id) continue;

    const available = row.status === "active" ? Math.max(0, row.on_hand - row.reserved) : 0;
    const existing: ProductStock =
      stockMap[row.product_id] ??
      {
        productId: row.product_id,
        available: 0,
        variants: [],
      };

    existing.available += available;
    existing.variants.push({
      sku: row.sku,
      color: row.color ?? undefined,
      size: row.size ?? undefined,
      available,
      status: row.status ?? "active",
    });

    stockMap[row.product_id] = existing;
  }

  return stockMap;
}

export async function createInventoryItem(input: AdminInventoryItem) {
  const [row] = await supabaseTableRequest<AdminInventoryRow[]>("/admin_inventory_items", {
    method: "POST",
    body: JSON.stringify([
      {
        sku: input.sku,
        parent_sku: input.parentSku,
        product_id: input.productId,
        product: input.product,
        summary: input.summary,
        description: input.description,
        category: input.category,
        collection: input.collection,
        color: input.color,
        size: input.size,
        options: input.options,
        price: input.price,
        image: input.image,
        on_hand: input.onHand,
        reserved: input.reserved,
        sold: input.sold ?? 0,
        low_stock_threshold: input.lowStockThreshold ?? 3,
        status: input.status ?? "active",
        warehouse: input.warehouse,
      },
    ]),
  });

  return inventoryFromRow(row);
}

async function nextInventoryProductId() {
  const rows = await supabaseTableRequest<Array<{ product_id: number | null }>>(
    "/admin_inventory_items?select=product_id&product_id=not.is.null&order=product_id.desc&limit=1"
  );

  return (rows[0]?.product_id ?? 0) + 1;
}

export async function upsertInventoryProduct(input: AdminInventoryProductInput) {
  const productId = input.productId ?? (await nextInventoryProductId());
  const collection = input.collection || input.category || "Producto";
  const parentSku = (input.parentSku?.trim() || productPrefix({ id: productId, collection })).toUpperCase();
  const colors = input.colors.length ? input.colors : ["UNICO"];
  const sizes = input.sizes.length ? input.sizes : ["STD"];
  const images = normalizeProductImages({ images: input.images, image: input.image });
  const primaryImage = images[0] || null;
  const existingRows = input.productId
    ? await supabaseTableRequest<AdminInventoryRow[]>(
        `/admin_inventory_items?product_id=eq.${productId}&select=*`
      )
    : await supabaseTableRequest<AdminInventoryRow[]>(
        `/admin_inventory_items?parent_sku=eq.${encodeURIComponent(parentSku)}&select=*`
      );
  const existingByVariant = new Map(existingRows.map((row) => [`${row.color || ""}|${row.size || ""}`, row]));
  const nextSkus = new Set<string>();

  const explicitVariants =
    input.variants?.filter((variant) => variant.color && variant.size).map((variant) => ({
      color: variant.color,
      size: variant.size,
      price: typeof variant.price === "number" ? variant.price : input.basePrice,
      onHand: typeof variant.onHand === "number" ? variant.onHand : input.defaultStock ?? 0,
      status: variant.status,
      sku: variant.sku,
    })) ?? [];

  const variantDefs =
    explicitVariants.length > 0
      ? explicitVariants
      : colors.flatMap((color) =>
          sizes.map((size) => ({
            color,
            size,
            price: input.sizePrices?.[size] ?? input.basePrice,
            onHand: input.sizeStocks?.[size] ?? input.defaultStock ?? 0,
            status: input.status,
            sku: undefined as string | undefined,
          })),
        );

  const rows = variantDefs.map((variant) => {
    const color = variant.color;
    const size = variant.size;
    const existing = existingByVariant.get(`${color}|${size}`);
    const sku = (variant.sku?.trim() || existing?.sku || variantSku(parentSku, color, size)).toUpperCase();
    nextSkus.add(sku);

    return {
      sku,
      parent_sku: parentSku,
      product_id: productId,
      product: input.product,
      summary: input.summary,
      description: input.description,
      category: input.category,
      collection,
      subcollection: input.subcollection || deriveSubcollection(input.product, collection),
      color,
      size,
      options: { color, size },
      price: variant.price,
      image: primaryImage,
      images,
      seo_slug: input.seoSlug?.trim() || null,
      seo_title: input.seoTitle?.trim() || null,
      seo_description: input.seoDescription?.trim() || null,
      on_hand: variant.onHand,
      reserved: existing?.reserved ?? 0,
      sold: existing?.sold ?? 0,
      low_stock_threshold: input.lowStockThreshold ?? existing?.low_stock_threshold ?? 3,
      status: variant.status ?? input.status ?? existing?.status ?? "active",
      warehouse: input.warehouse ?? existing?.warehouse ?? "Principal",
    };
  });

  await supabaseTableRequest<AdminInventoryRow[]>("/admin_inventory_items?on_conflict=sku", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });

  const removedRows = existingRows.filter((row) => !nextSkus.has(row.sku));
  await Promise.all(
    removedRows.map((row) =>
      supabaseTableRequest<AdminInventoryRow[]>(`/admin_inventory_items?sku=eq.${encodeURIComponent(row.sku)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "archived" }),
      })
    )
  );

  const products = await listInventoryProducts();
  return products.find((product) => product.parentSku === parentSku) ?? null;
}

export async function updateInventoryItem(sku: string, patch: Partial<Omit<AdminInventoryItem, "sku">>) {
  const rows = await supabaseTableRequest<AdminInventoryRow[]>(`/admin_inventory_items?sku=eq.${encodeURIComponent(sku)}`, {
    method: "PATCH",
    body: JSON.stringify(
      compact({
        product: patch.product,
        parent_sku: patch.parentSku,
        product_id: patch.productId,
        summary: patch.summary,
        description: patch.description,
        category: patch.category,
        collection: patch.collection,
        subcollection: patch.subcollection,
        color: patch.color,
        size: patch.size,
        options: patch.options,
        price: patch.price,
        image: patch.image,
        seo_slug: patch.seoSlug,
        seo_title: patch.seoTitle,
        seo_description: patch.seoDescription,
        on_hand: patch.onHand,
        reserved: patch.reserved,
        sold: patch.sold,
        low_stock_threshold: patch.lowStockThreshold,
        status: patch.status,
        warehouse: patch.warehouse,
      })
    ),
  });

  return rows[0] ? inventoryFromRow(rows[0]) : null;
}

export async function deleteInventoryItem(sku: string) {
  const rows = await supabaseTableRequest<AdminInventoryRow[]>(`/admin_inventory_items?sku=eq.${encodeURIComponent(sku)}`, {
    method: "DELETE",
  });

  return rows.length > 0;
}

export async function listContacts() {
  const rows = await supabaseTableRequest<AdminContactRow[]>("/admin_contacts?select=*&order=id.desc");
  return rows.map(contactFromRow);
}

export async function listCustomerInsights() {
  const [contacts, sales] = await Promise.all([listContacts(), listSales()]);
  const customers = contacts.map<AdminCustomerInsight>((contact) => {
    const customerSales = sales.filter((sale) => contactMatchesSale(contact, sale));
    const sortedSales = [...customerSales].sort((a, b) => {
      const left = a.placedAt ? new Date(a.placedAt).getTime() : 0;
      const right = b.placedAt ? new Date(b.placedAt).getTime() : 0;
      return right - left;
    });
    const latestSale = sortedSales[0];

    return {
      id: contact.id,
      name: contact.client,
      document: contact.document,
      phone: contact.cellphone,
      email: contact.email,
      type: contact.classification,
      district: contact.district,
      province: contact.province,
      department: contact.department,
      address: [contact.address, contact.addressNumber, contact.reference].filter(Boolean).join(" "),
      agency: contact.agency,
      orderCount: customerSales.length,
      saleCount: customerSales.length,
      ltv: customerSales.reduce((sum, sale) => sum + sale.amount, 0),
      lastPurchase: latestSaleDate(customerSales),
      lastSaleStatus: latestSale?.status,
    };
  });

  const orphanSales = sales.filter((sale) => !contacts.some((contact) => contactMatchesSale(contact, sale)));
  const orphanCustomers = orphanSales.map<AdminCustomerInsight>((sale) => ({
    id: sale.customerId || sale.customerDni || sale.customer,
    name: sale.customer,
    document: sale.customerDni || "",
    phone: "",
    email: "",
    type: sale.customerType || "MINORISTA",
    district: "",
    province: "",
    department: "",
    address: sale.customerAddress || "",
    agency: "",
    orderCount: 1,
    saleCount: 1,
    ltv: sale.amount,
    lastPurchase: sale.placedAt,
    lastSaleStatus: sale.status,
  }));

  const mergedCustomers = [...customers, ...orphanCustomers].sort((a, b) => b.ltv - a.ltv || a.name.localeCompare(b.name));

  return {
    customers: mergedCustomers,
    summary: customerSummary(mergedCustomers),
  };
}

export async function createContact(input: Omit<AdminContact, "id">) {
  const [row] = await supabaseTableRequest<AdminContactRow[]>("/admin_contacts", {
    method: "POST",
    body: JSON.stringify([compact(contactToRow(input))]),
  });

  return contactFromRow(row);
}

export async function updateContact(id: string, patch: Partial<Omit<AdminContact, "id">>) {
  const rows = await supabaseTableRequest<AdminContactRow[]>(`/admin_contacts?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(compact(contactToRow(patch))),
  });

  return rows[0] ? contactFromRow(rows[0]) : null;
}

export async function deleteContact(id: string) {
  const rows = await supabaseTableRequest<AdminContactRow[]>(`/admin_contacts?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  return rows.length > 0;
}

function formatMoney(amount: number) {
  return `S/ ${amount.toLocaleString("es-PE", { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function saleDateKey(sale: AdminSale) {
  if (!sale.placedAt) return null;
  return sale.placedAt.slice(0, 10);
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDateKey(key: string, days: number) {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function weekdayLabel(key: string) {
  const labels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
  return labels[new Date(`${key}T12:00:00`).getDay()] ?? key;
}

const CHANNEL_COLORS: Record<AdminSale["channel"], string> = {
  online: "#111827",
  pos: "#ca8a04",
  whatsapp: "#059669",
};

const CHANNEL_LABELS: Record<AdminSale["channel"], string> = {
  online: "Online",
  pos: "POS",
  whatsapp: "WhatsApp",
};

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const [sales, inventory, contacts, storeCms] = await Promise.all([
    listSales(),
    listInventory(),
    listContacts(),
    getStoreCms().catch(() => null),
  ]);

  const orderStatuses: OrderStatusConfig[] = normalizeOrderStatuses(
    storeCms?.settings?.orderStatuses ?? DEFAULT_ORDER_STATUSES,
  );
  const metricSales = sales.filter((sale) => orderStatusCountsInMetrics(orderStatuses, sale.status));
  const pendingSales = sales.filter((sale) => {
    const match = findOrderStatus(orderStatuses, sale.status);
    return (match?.label || sale.status).toLowerCase() === "pendiente";
  });
  const today = localDateKey();
  const yesterday = shiftDateKey(today, -1);

  const salesToday = metricSales.filter((sale) => saleDateKey(sale) === today);
  const salesYesterday = metricSales.filter((sale) => saleDateKey(sale) === yesterday);
  const revenueToday = salesToday.reduce((sum, sale) => sum + sale.amount, 0);
  const revenueYesterday = salesYesterday.reduce((sum, sale) => sum + sale.amount, 0);
  const averageTicket = metricSales.length
    ? metricSales.reduce((sum, sale) => sum + sale.amount, 0) / metricSales.length
    : 0;

  const lowStockItems = inventory.filter((item) => {
    const available = Math.max(0, item.onHand - item.reserved);
    const threshold = item.lowStockThreshold ?? 3;
    return available <= threshold;
  });
  const outOfStock = inventory.filter((item) => Math.max(0, item.onHand - item.reserved) <= 0);
  const productParents = new Set(inventory.map((item) => item.parentSku || item.sku.split("-").slice(0, 2).join("-")));
  const activeSkus = inventory.filter((item) => (item.status ?? "active") === "active");

  const revenueDelta =
    revenueYesterday > 0
      ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100
      : revenueToday > 0
        ? 100
        : 0;

  const kpis: AdminDashboardKpi[] = [
    {
      label: "Ventas hoy",
      value: formatMoney(revenueToday),
      delta: `${revenueDelta >= 0 ? "+" : ""}${revenueDelta.toFixed(1)}%`,
      note: "vs ayer",
      tone: revenueDelta >= 0 ? "success" : "danger",
    },
    {
      label: "Ventas pendientes",
      value: String(pendingSales.length),
      delta: `${pendingSales.length} por atender`,
      note: "desde ventas",
      tone: pendingSales.length ? "warning" : "success",
    },
    {
      label: "Ticket promedio",
      value: formatMoney(averageTicket),
      delta: `${metricSales.length} ventas`,
      note: "solo pagadas / métrica",
      tone: "neutral",
    },
    {
      label: "Stock critico",
      value: `${lowStockItems.length} SKU`,
      delta: `${outOfStock.length} sin stock`,
      note: "necesitan compra",
      tone: lowStockItems.length ? "danger" : "success",
    },
    {
      label: "Productos",
      value: String(productParents.size),
      delta: `${activeSkus.length} SKUs activos`,
      note: "en inventario",
      tone: "neutral",
    },
    {
      label: "Contactos",
      value: String(contacts.length),
      delta: `${sales.length} ventas totales`,
      note: "base comercial",
      tone: "neutral",
    },
  ];

  const trendKeys = Array.from({ length: 9 }, (_, index) => shiftDateKey(today, index - 8));
  const revenueByDay = new Map(trendKeys.map((key) => [key, 0]));
  for (const sale of metricSales) {
    const key = saleDateKey(sale);
    if (!key || !revenueByDay.has(key)) continue;
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + sale.amount);
  }
  const dailyValues = trendKeys.map((key) => revenueByDay.get(key) ?? 0);
  const firstHalf = dailyValues.slice(0, 4).reduce((sum, value) => sum + value, 0);
  const secondHalf = dailyValues.slice(4).reduce((sum, value) => sum + value, 0);
  const changePercent =
    firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : secondHalf > 0 ? 100 : null;

  const channelTotals = new Map<AdminSale["channel"], number>();
  for (const sale of metricSales) {
    channelTotals.set(sale.channel, (channelTotals.get(sale.channel) ?? 0) + sale.amount);
  }
  const channelRevenueTotal = [...channelTotals.values()].reduce((sum, value) => sum + value, 0);
  const channelShare =
    channelRevenueTotal > 0
      ? ([...channelTotals.entries()] as Array<[AdminSale["channel"], number]>)
          .map(([channel, amount]) => ({
            name: CHANNEL_LABELS[channel],
            value: Math.round((amount / channelRevenueTotal) * 100),
            color: CHANNEL_COLORS[channel],
          }))
          .filter((item) => item.value > 0)
          .sort((a, b) => b.value - a.value)
      : [];

  const statusTotal = Math.max(1, sales.length);
  const statusBreakdown = orderStatuses.map((stage) => {
    const value = sales.filter((sale) => {
      const match = findOrderStatus(orderStatuses, sale.status);
      return (match?.id || sale.status) === stage.id || sale.status === stage.label;
    }).length;
    return {
      stage: stage.label,
      value,
      percentage: Math.round((value / statusTotal) * 1000) / 10,
    };
  });
  const paidCount = metricSales.length;

  const productTotals = new Map<string, { units: number; revenue: number }>();
  for (const sale of metricSales) {
    for (const item of sale.items ?? []) {
      const current = productTotals.get(item.product) ?? { units: 0, revenue: 0 };
      current.units += item.quantity;
      current.revenue += item.lineTotal || item.unitPrice * item.quantity;
      productTotals.set(item.product, current);
    }
  }
  const topProducts = [...productTotals.entries()]
    .map(([name, stats]) => ({ name, units: stats.units, revenue: stats.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const alerts: AdminDashboardAlert[] = [];
  if (lowStockItems.length) {
    const sample = lowStockItems
      .slice(0, 3)
      .map((item) => `${item.sku} (${Math.max(0, item.onHand - item.reserved)})`)
      .join(", ");
    alerts.push({
      title: "Reposicion urgente",
      detail: `${lowStockItems.length} SKU bajo umbral${sample ? `: ${sample}` : "."}`,
      actionHref: "/admin/inventory",
      actionLabel: "Ir a inventario",
    });
  }
  if (pendingSales.length) {
    alerts.push({
      title: "Ventas por atender",
      detail: `${pendingSales.length} venta${pendingSales.length === 1 ? "" : "s"} pendiente${pendingSales.length === 1 ? "" : "s"} requieren confirmacion o despacho.`,
      actionHref: "/admin/sales",
      actionLabel: "Revisar ventas",
    });
  }
  if (!alerts.length) {
    alerts.push({
      title: "Operacion al dia",
      detail: "Sin alertas criticas de stock ni ventas pendientes.",
      actionHref: "/admin/sales",
      actionLabel: "Ver ventas",
    });
  }

  const health = [
    {
      title: "Catalogo",
      detail: `${productParents.size} productos / ${inventory.length} variantes en inventario.`,
    },
    {
      title: "Canales",
      detail: channelShare.length
        ? channelShare.map((item) => `${item.name} ${item.value}%`).join(" · ")
        : "Aun no hay ventas registradas por canal.",
    },
    {
      title: "Ventas",
      detail: `${sales.length} registradas · ${pendingSales.length} pendientes · ${paidCount} en métrica.`,
    },
    {
      title: "Contactos",
      detail: `${contacts.length} contactos en la base comercial.`,
    },
  ];

  return {
    kpis,
    dailyTrend: {
      labels: trendKeys.map((key, index) => (index === trendKeys.length - 1 ? "Hoy" : weekdayLabel(key))),
      values: dailyValues,
      changePercent,
    },
    channelShare,
    statusBreakdown,
    topProducts,
    alerts,
    health,
  };
}
