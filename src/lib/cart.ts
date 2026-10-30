import { findVariantStock, type ProductStockMap } from "@/lib/product-stock";
import { checkoutErrors } from "@/lib/checkout-validation";
import { findShippingZone } from "@/lib/shipping-rates";

export const WHATSAPP_NUMBER = "51975885868";

export type CartLine = {
  productId: number;
  name: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
};

export type CheckoutDetails = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  documentType: string;
  documentNumber: string;
  department: string;
  province: string;
  district: string;
  address: string;
  addressNumber: string;
  reference: string;
  deliveryMethod: string;
  agency: string;
};

export const DELIVERY_OPTIONS = [
  { value: "delivery-lima", label: "Delivery Lima" },
  { value: "agencia-provincia", label: "Agencia Shalom" },
  { value: "recojo", label: "Recojo coordinado" },
] as const;

export function cartLineKey(line: Pick<CartLine, "productId" | "color" | "size">) {
  return `${line.productId}|${line.color}|${line.size}`;
}

export function cartItemCount(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

export function formatSoles(amount: number) {
  return `S/ ${amount.toFixed(2)}`;
}

export function whatsappUrl(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function lineAvailability(stock: ProductStockMap, line: Pick<CartLine, "productId" | "color" | "size">) {
  const productStock = stock[line.productId];
  if (!productStock) return { known: false, available: 0 };

  const variant = findVariantStock(productStock, line.color, line.size);
  return { known: true, available: variant?.available ?? 0 };
}

export function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<CartLine>;
  return (
    typeof line.productId === "number" &&
    typeof line.name === "string" &&
    typeof line.price === "number" &&
    typeof line.image === "string" &&
    typeof line.color === "string" &&
    typeof line.size === "string" &&
    typeof line.quantity === "number" &&
    line.quantity > 0
  );
}

export function buildSingleItemWhatsappText(line: Pick<CartLine, "name" | "color" | "size" | "quantity" | "price">) {
  return [
    `Hola, quiero el polo ${line.name}`,
    `Color: ${line.color}`,
    `Talla: ${line.size}`,
    `Cantidad: ${line.quantity}`,
    `Precio: ${formatSoles(line.price * line.quantity)}`,
  ].join("\n");
}

export function normalizeCoupon(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function shippingQuote(details: Pick<CheckoutDetails, "deliveryMethod" | "district">) {
  if (details.deliveryMethod === "recojo") {
    return { amount: 0, label: "Sin costo" };
  }

  if (details.deliveryMethod === "delivery-lima") {
    const zone = findShippingZone(details.district);
    if (!zone) return { amount: null, label: "—" };
    return { amount: zone.rate, label: formatSoles(zone.rate) };
  }

  return { amount: null, label: "Por calcular" };
}

export function buildOrderWhatsappText(lines: CartLine[], details: CheckoutDetails, coupon?: string | null) {
  const delivery = DELIVERY_OPTIONS.find((option) => option.value === details.deliveryMethod)?.label ?? details.deliveryMethod;
  const address = [details.address, details.addressNumber].filter(Boolean).join(" ");
  const place = [details.district, details.province, details.department].filter((part) => part.trim()).join(", ");
  const shipping = shippingQuote(details);
  const subtotal = cartSubtotal(lines);
  const total = shipping.amount === null ? null : subtotal + shipping.amount;

  return [
    "Hola, quiero confirmar mi pedido:",
    "",
    ...lines.map((line, index) => {
      return `${index + 1}. ${line.name} · ${line.color} · ${line.size} · x${line.quantity} · ${formatSoles(line.price * line.quantity)}`;
    }),
    "",
    `Subtotal: ${formatSoles(subtotal)}`,
    coupon ? `Cupón: ${coupon}` : null,
    `Envío: ${shipping.label}`,
    total === null ? null : `Total: ${formatSoles(total)}`,
    "",
    `Nombre: ${details.firstName} ${details.lastName}`.trim(),
    `Teléfono: ${details.phone}`,
    `Email: ${details.email}`,
    `Documento: ${details.documentType} ${details.documentNumber}`,
    `Entrega: ${delivery}`,
    details.deliveryMethod === "agencia-provincia" && details.agency.trim()
      ? `Agencia Shalom más cercana: ${details.agency.trim()}`
      : null,
    details.deliveryMethod === "agencia-provincia"
      ? place ? `Destino: ${place}` : null
      : [address, place].filter(Boolean).join(", ")
        ? `Dirección: ${[address, place].filter(Boolean).join(", ")}`
        : null,
    details.deliveryMethod !== "agencia-provincia" && details.reference.trim() ? `Referencia: ${details.reference.trim()}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

export function isCheckoutReady(details: CheckoutDetails) {
  return Object.keys(checkoutErrors(details)).length === 0;
}
