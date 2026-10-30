"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { useProductStock } from "@/hooks/useProductStock";
import {
  DELIVERY_OPTIONS,
  buildOrderWhatsappText,
  cartLineKey,
  formatSoles,
  isCheckoutReady,
  lineAvailability,
  shippingQuote,
  whatsappUrl,
  type CheckoutDetails,
} from "@/lib/cart";
import { findShippingZone, LIMA_DELIVERY_ZONES } from "@/lib/shipping-rates";
import { checkoutErrors, type CheckoutField } from "@/lib/checkout-validation";

const emptyDetails: CheckoutDetails = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  documentType: "DNI",
  documentNumber: "",
  department: "",
  province: "",
  district: "",
  address: "",
  addressNumber: "",
  reference: "",
  deliveryMethod: "",
  agency: "",
};

export default function CheckoutPage() {
  const { lines, coupon, ready, subtotal, clear } = useCart();
  const { stock, loading: stockLoading } = useProductStock();
  const [details, setDetails] = useState<CheckoutDetails>(emptyDetails);
  const [touched, setTouched] = useState<Partial<Record<CheckoutField, boolean>>>({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [whatsappHref, setWhatsappHref] = useState("");

  const stockIssues = useMemo(() => {
    return lines.flatMap((line) => {
      const availability = lineAvailability(stock, line);
      if (!availability.known) return [`${line.name}: stock no confirmado`];
      if (availability.available <= 0) return [`${line.name} (${line.color}, ${line.size}) está sin stock`];
      if (line.quantity > availability.available) {
        return [`${line.name} (${line.color}, ${line.size}): solo quedan ${availability.available}`];
      }
      return [];
    });
  }, [lines, stock]);

  const errors = useMemo(() => checkoutErrors(details), [details]);
  const fieldError = (field: CheckoutField) => (showAllErrors || touched[field] ? errors[field] : undefined);
  const markTouched = (field: CheckoutField) => setTouched((current) => ({ ...current, [field]: true }));
  const canConfirm = Boolean(lines.length && !stockLoading && stockIssues.length === 0 && isCheckoutReady(details));

  const update = (field: keyof CheckoutDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
  };

  const setDeliveryMethod = (method: string) => {
    setDetails((current) => {
      if (method !== "delivery-lima") return { ...current, deliveryMethod: method };
      const zone = findShippingZone(current.district);
      return {
        ...current,
        deliveryMethod: method,
        district: zone?.name ?? "",
        department: zone?.region ?? "",
        province: "",
      };
    });
  };

  const selectZone = (name: string) => {
    const zone = findShippingZone(name);
    setDetails((current) => ({
      ...current,
      deliveryMethod: zone ? "delivery-lima" : current.deliveryMethod,
      district: zone?.name ?? "",
      department: zone?.region ?? "",
      province: "",
    }));
  };

  const shipping = shippingQuote(details);
  const total = shipping.amount === null ? null : subtotal + shipping.amount;
  const selectedZone = findShippingZone(details.district);

  const confirmOrder = () => {
    setShowAllErrors(true);
    if (!canConfirm) return;
    const href = whatsappUrl(buildOrderWhatsappText(lines, details, coupon));
    window.open(href, "_blank", "noopener,noreferrer");
    setWhatsappHref(href);
    clear();
    setSubmitted(true);
  };

  if (!ready) {
    return <main className="min-h-screen bg-white pt-28" />;
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-white px-4 pt-24 text-zinc-950">
        <div className="mx-auto max-w-xl pb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Pedido</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Listo para coordinar el pago</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Abrimos WhatsApp con tu orden. Ahí se concreta la venta y el pago.</p>
          {whatsappHref ? (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex bg-zinc-950 px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white">
              Abrir WhatsApp
            </a>
          ) : null}
          <Link href="/products" className="mt-4 block text-sm font-semibold underline">
            Seguir viendo polos
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 pt-24 text-zinc-950 lg:px-8">
      <section className="mx-auto grid max-w-6xl items-start gap-8 pb-12 lg:grid-cols-[1fr_22rem]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Checkout</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Datos para tu pedido</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
            Completa tus datos. Al confirmar, enviamos la orden completa por WhatsApp para concretar el pago.
          </p>

          {lines.length === 0 ? (
            <div className="mt-8 border-t border-zinc-200 pt-6">
              <p className="text-sm text-zinc-500">Tu carrito está vacío.</p>
              <Link href="/products" className="mt-3 inline-flex text-sm text-zinc-950 underline">
                Ver la tienda
              </Link>
            </div>
          ) : (
            <form
              noValidate
              className="mt-6 space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                confirmOrder();
              }}
            >
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Contacto</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nombres" value={details.firstName} onChange={(value) => update("firstName", value)} onBlur={() => markTouched("firstName")} error={fieldError("firstName")} placeholder="Juan" />
                  <Field label="Apellidos" value={details.lastName} onChange={(value) => update("lastName", value)} onBlur={() => markTouched("lastName")} error={fieldError("lastName")} placeholder="Pérez" />
                  <Field label="Teléfono" value={details.phone} onChange={(value) => update("phone", value)} onBlur={() => markTouched("phone")} error={fieldError("phone")} placeholder="987654321" inputMode="numeric" />
                  <Field label="Email" type="email" value={details.email} onChange={(value) => update("email", value)} onBlur={() => markTouched("email")} error={fieldError("email")} placeholder="tu@email.com" />
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Documento</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-zinc-800">Tipo</span>
                    <select
                      value={details.documentType}
                      onChange={(event) => update("documentType", event.target.value)}
                      onBlur={() => markTouched("documentNumber")}
                      className={controlClass}
                    >
                      <option value="DNI">DNI</option>
                      <option value="RUC">RUC</option>
                      <option value="CE">Carnet de extranjería</option>
                    </select>
                  </label>
                  <Field
                    label={details.documentType === "RUC" ? "Número de RUC" : "Número de documento"}
                    value={details.documentNumber}
                    onChange={(value) => update("documentNumber", value)}
                    onBlur={() => markTouched("documentNumber")}
                    error={fieldError("documentNumber")}
                    placeholder={details.documentType === "RUC" ? "20123456789" : details.documentType === "CE" ? "001234567" : "12345678"}
                    inputMode={details.documentType === "CE" ? "text" : "numeric"}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold">Método de entrega</h2>
                <label className="block max-w-sm space-y-1">
                  <span className="text-sm font-medium text-zinc-800">Entrega</span>
                  <select
                    value={details.deliveryMethod}
                    onChange={(event) => setDeliveryMethod(event.target.value)}
                    onBlur={() => markTouched("deliveryMethod")}
                    className={fieldError("deliveryMethod") ? `${controlClass} border-red-600` : controlClass}
                    aria-invalid={Boolean(fieldError("deliveryMethod"))}
                  >
                    <option value="">Selecciona una opción</option>
                    {DELIVERY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    </select>
                    {fieldError("deliveryMethod") ? <span className="text-xs text-red-700">{fieldError("deliveryMethod")}</span> : null}
                  </label>
                </section>

              {details.deliveryMethod ? (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold">Dirección de envío</h2>
                  {details.deliveryMethod === "delivery-lima" ? (
                    <label className="block max-w-sm space-y-1">
                      <span className="text-sm font-medium text-zinc-800">Distrito</span>
                      <select
                        value={selectedZone?.name ?? ""}
                        onChange={(event) => selectZone(event.target.value)}
                        onBlur={() => markTouched("district")}
                        className={fieldError("district") ? `${controlClass} border-red-600` : controlClass}
                        aria-invalid={Boolean(fieldError("district"))}
                      >
                        <option value="">Selecciona tu distrito</option>
                        {LIMA_DELIVERY_ZONES.map((zone) => (
                          <option key={zone.name} value={zone.name}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                      {fieldError("district") ? <span className="text-xs text-red-700">{fieldError("district")}</span> : null}
                    </label>
                  ) : details.deliveryMethod === "recojo" ? (
                    <p className="text-sm text-zinc-500">Coordinamos el recojo por WhatsApp. El envío no tiene costo.</p>
                  ) : details.deliveryMethod === "agencia-provincia" ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Departamento" value={details.department} onChange={(value) => update("department", value)} onBlur={() => markTouched("department")} error={fieldError("department")} placeholder="Lima" />
                        <Field label="Provincia" value={details.province} onChange={(value) => update("province", value)} onBlur={() => markTouched("province")} error={fieldError("province")} placeholder="Lima" />
                        <Field label="Distrito" value={details.district} onChange={(value) => update("district", value)} onBlur={() => markTouched("district")} error={fieldError("district")} placeholder="Miraflores" />
                      </div>
                      <Field
                        label="Agencia Shalom más cercana"
                        value={details.agency}
                        onChange={(value) => update("agency", value)}
                        onBlur={() => markTouched("agency")}
                        error={fieldError("agency")}
                        placeholder="Shalom Gamarra"
                      />
                    </div>
                  ) : null}
                  {details.deliveryMethod === "delivery-lima" ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-[1fr_6.5rem]">
                        <Field label="Dirección" value={details.address} onChange={(value) => update("address", value)} onBlur={() => markTouched("address")} error={fieldError("address")} placeholder="Av. Larco" />
                        <Field label="Número" value={details.addressNumber} onChange={(value) => update("addressNumber", value)} onBlur={() => markTouched("addressNumber")} error={fieldError("addressNumber")} placeholder="123" required={false} />
                      </div>
                      <Field label="Referencia" value={details.reference} onChange={(value) => update("reference", value)} onBlur={() => markTouched("reference")} error={fieldError("reference")} placeholder="Frente al parque, piso 3" required={false} />
                    </div>
                  ) : null}
                </section>
              ) : null}

              <div>
                {stockLoading ? <p className="mb-3 text-sm text-zinc-500">Validando stock disponible...</p> : null}
                {showAllErrors && !stockLoading && stockIssues.length === 0 && !canConfirm ? (
                  <p className="mb-3 text-sm text-red-700">Revisa los campos marcados antes de confirmar.</p>
                ) : null}
                {!stockLoading && stockIssues.length > 0 ? (
                  <div className="mb-3 space-y-1 text-sm text-red-700">
                    {stockIssues.map((issue) => (
                      <p key={issue}>{issue}</p>
                    ))}
                    <Link href="/cart" className="inline-flex underline">
                      Volver al carrito
                    </Link>
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={stockLoading || stockIssues.length > 0}
                  className="flex w-full items-center justify-center bg-zinc-950 px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
                >
                  Confirmar pedido por WhatsApp
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="h-fit border-t border-zinc-200 pt-5 lg:sticky lg:top-24 lg:border-t-0 lg:pt-0">
          <h2 className="text-lg font-semibold">Resumen</h2>
          {lines.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No hay productos en el carrito.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {lines.map((line) => (
                <div key={cartLineKey(line)} className="flex gap-3">
                  <div className="h-16 w-14 shrink-0 bg-zinc-100">
                    {line.image ? <img src={line.image} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{line.name}</p>
                    <p className="text-sm text-zinc-500">
                      {line.color} · {line.size} · x{line.quantity}
                    </p>
                    <p className="text-sm">{formatSoles(line.price * line.quantity)}</p>
                  </div>
                </div>
              ))}
              <div className="space-y-1.5 border-t border-zinc-200 pt-3 text-sm">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal</span>
                  <span className="text-zinc-950">{formatSoles(subtotal)}</span>
                </div>
                {coupon ? (
                  <div className="flex justify-between text-zinc-500">
                    <span>Cupón</span>
                    <span className="text-zinc-950">{coupon}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-zinc-500">
                  <span>Envío{selectedZone && details.deliveryMethod === "delivery-lima" ? ` · ${selectedZone.name}` : ""}</span>
                  <span className={shipping.amount === null ? "text-zinc-400" : "text-zinc-950"}>{shipping.label}</span>
                </div>
                <div className="flex justify-between pt-1.5 text-base font-semibold">
                  <span>{total === null ? "Total referencial" : "Total"}</span>
                  <span>{formatSoles(total ?? subtotal)}</span>
                </div>
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

const controlClass = "w-full border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-950";

function Field({
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  type = "text",
  required = true,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  inputMode?: "text" | "numeric" | "email";
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        className={error ? `${controlClass} border-red-600` : controlClass}
      />
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </label>
  );
}
