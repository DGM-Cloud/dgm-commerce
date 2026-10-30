export interface AdminSale {
  id: string;
  orderNumber?: string;
  placedAt?: string;
  customerId?: string;
  customerDni?: string;
  customerAddress?: string;
  channel: "online" | "pos" | "whatsapp";
  customer: string;
  customerType?: "MAYORISTA" | "MINORISTA";
  currency?: "SOLES" | "DOLARES";
  exchangeRate?: number;
  subtotal?: number;
  discountTotal?: number;
  shippingTotal?: number;
  taxTotal?: number;
  amount: number;
  /** @deprecated Synced from `status` for DB backward compatibility. */
  paymentStatus?: "Pendiente" | "Pagado" | "Parcial";
  /** Order status label (configurable in Settings). Defaults: Anulado, Pendiente, Pagado, Enviado. */
  status: string;
  source?: "web" | "instagram" | "whatsapp" | "store";
  notes?: string;
  salesRepId?: string;
  items?: AdminSaleItem[];
}

export interface AdminSaleItem {
  id?: string;
  saleId?: string;
  productId?: number;
  parentSku?: string;
  variantSku: string;
  product: string;
  description?: string;
  color?: string;
  size?: string;
  quantity: number;
  stockAvailable?: number;
  unitPrice: number;
  discountTotal: number;
  lineTotal: number;
}

export interface AdminInventoryItem {
  sku: string;
  parentSku?: string;
  productId?: number;
  product: string;
  summary?: string;
  description?: string;
  category?: string;
  collection?: string;
  subcollection?: string;
  color?: string;
  size?: string;
  options?: Record<string, string>;
  price?: number;
  image?: string;
  images?: string[];
  seoSlug?: string;
  seoTitle?: string;
  seoDescription?: string;
  onHand: number;
  reserved: number;
  sold?: number;
  lowStockThreshold?: number;
  status?: "active" | "draft" | "archived";
  warehouse: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminInventoryProduct {
  productId?: number;
  parentSku: string;
  product: string;
  summary?: string;
  description?: string;
  category?: string;
  collection?: string;
  subcollection?: string;
  /** Optional SEO overrides — auto-generated for storefront when omitted */
  seoSlug?: string;
  seoTitle?: string;
  seoDescription?: string;
  images: string[];
  basePrice?: number;
  status: "active" | "draft" | "archived";
  totalOnHand: number;
  totalReserved: number;
  totalSold: number;
  totalAvailable: number;
  createdAt?: string;
  variants: AdminInventoryItem[];
}

/** Explicit color×size row — preferred over sizePrices/sizeStocks cartesian generation. */
export interface AdminInventoryVariantInput {
  color: string;
  size: string;
  price: number;
  onHand: number;
  status?: "active" | "draft" | "archived";
  /** Existing SKU when editing; generated on save if omitted. */
  sku?: string;
}

export interface AdminInventoryProductInput {
  productId?: number;
  parentSku?: string;
  product: string;
  summary?: string;
  description?: string;
  category?: string;
  collection?: string;
  subcollection?: string;
  seoSlug?: string;
  seoTitle?: string;
  seoDescription?: string;
  image?: string;
  images?: string[];
  basePrice: number;
  colors: string[];
  sizes: string[];
  /** Preferred: independent variants with their own price/stock. */
  variants?: AdminInventoryVariantInput[];
  /** @deprecated Prefer `variants`. Kept for backward-compatible cartesian upsert. */
  sizePrices?: Record<string, number>;
  /** @deprecated Prefer `variants`. Kept for backward-compatible cartesian upsert. */
  sizeStocks?: Record<string, number>;
  defaultStock?: number;
  lowStockThreshold?: number;
  status?: "active" | "draft" | "archived";
  warehouse?: string;
}

export interface AdminContact {
  id: string;
  documentType: "DNI" | "CE" | "PASAPORTE" | "RUC" | "OTRO";
  document: string;
  lastNamePaterno: string;
  lastNameMaterno: string;
  names: string;
  sex: "MASCULINO" | "FEMENINO" | "OTRO";
  birthDate: string;
  numero: string;
  classification: "MINORISTA" | "MAYORISTA";
  client: string;
  cellphone: string;
  email: string;
  province: string;
  district: string;
  department: string;
  address: string;
  addressNumber: string;
  reference: string;
  agency: string;
  contactedBy: string[];
  contactedByOther?: string;
}

export interface AdminCustomerInsight {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  type: "MINORISTA" | "MAYORISTA";
  district: string;
  province: string;
  department: string;
  address: string;
  agency: string;
  orderCount: number;
  saleCount: number;
  ltv: number;
  lastPurchase?: string;
  lastSaleStatus?: AdminSale["status"];
}

export interface AdminCustomerSummary {
  total: number;
  newCustomers: number;
  recurrent: number;
  highValue: number;
  totalLtv: number;
}

export interface AdminDashboardKpi {
  label: string;
  value: string;
  delta: string;
  note: string;
  tone: "success" | "warning" | "danger" | "neutral";
}

export interface AdminDashboardAlert {
  title: string;
  detail: string;
  actionHref: string;
  actionLabel: string;
}

export interface AdminDashboard {
  kpis: AdminDashboardKpi[];
  dailyTrend: {
    labels: string[];
    values: number[];
    changePercent: number | null;
  };
  channelShare: Array<{ name: string; value: number; color: string }>;
  statusBreakdown: Array<{ stage: string; value: number; percentage: number }>;
  topProducts: Array<{ name: string; units: number; revenue: number }>;
  alerts: AdminDashboardAlert[];
  health: Array<{ title: string; detail: string }>;
}
