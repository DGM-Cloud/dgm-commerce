"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import CrudModal from "@/components/admin/CrudModal";
import type { AdminContact, AdminInventoryProduct, AdminSale, AdminSaleItem } from "@/lib/admin-data";
import currency from "currency.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faPen, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useContactsQuery, useInventoryProductsCatalogQuery } from "@/lib/admin-query";
import {
  DEFAULT_ORDER_STATUSES,
  paymentStatusFromOrderStatus,
  type OrderStatusConfig,
} from "@/lib/order-status";

type SaleForm = Omit<AdminSale, "id">;
const IGV_RATE = 0.18;

interface Props {
  isOpen: boolean;
  title: string;
  saving: boolean;
  hasUnsavedChanges: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  form: SaleForm;
  setForm: React.Dispatch<React.SetStateAction<SaleForm>>;
  sellerName: string;
  editingId: string | null;
  computedSaleAmount: number;
  orderStatuses?: OrderStatusConfig[];
}

const inputClass = "w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm uppercase text-zinc-900 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-500";
const readonlyClass = "w-full rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-1.5 text-sm font-semibold uppercase text-zinc-800 outline-none";

export default function SaleModal({
  isOpen,
  title,
  saving,
  hasUnsavedChanges,
  onClose,
  onSubmit,
  form,
  setForm,
  sellerName,
  editingId,
  computedSaleAmount,
  orderStatuses = DEFAULT_ORDER_STATUSES,
}: Props) {
  const contactsQuery = useContactsQuery();
  const inventoryQuery = useInventoryProductsCatalogQuery(isOpen);
  const statusOptions = orderStatuses.length ? orderStatuses : DEFAULT_ORDER_STATUSES;

  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchPage, setCustomerSearchPage] = useState(1);
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);
  const [exchangeRateError, setExchangeRateError] = useState<string | null>(null);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [selectedSaleItemId, setSelectedSaleItemId] = useState<string | null>(null);
  const [editingSaleItem, setEditingSaleItem] = useState<AdminSaleItem | null>(null);
  const customerSearchPageSize = 6;

  const customerDirectory = contactsQuery.data?.contacts ?? [];
  const customerDirectoryLoading = contactsQuery.isLoading || (isCustomerSearchOpen && contactsQuery.isFetching);
  const customerDirectoryError = contactsQuery.error?.message ?? null;
  const inventoryProductsCache = inventoryQuery.data?.products ?? [];

  async function fetchUsdToPenRate() {
    setExchangeRateLoading(true);
    setExchangeRateError(null);

    try {
      const response = await fetch("/api/exchange-rate/usd-pen", { cache: "no-store" });
      const payload = await response.json();
      const nextRate = Number(payload.rate);

      if (!response.ok || !Number.isFinite(nextRate) || nextRate <= 0) {
        throw new Error(payload.error || "No se pudo cargar la tasa de cambio.");
      }

      setForm((previous) => ({
        ...previous,
        exchangeRate: currency(nextRate, { precision: 4 }).value,
      }));
    } catch (error: unknown) {
      setExchangeRateError(error instanceof Error ? error.message.toUpperCase() : "NO SE PUDO CARGAR LA TASA.");
    } finally {
      setExchangeRateLoading(false);
    }
  }

  useEffect(() => {
    if (isCustomerSearchOpen && !contactsQuery.data && !contactsQuery.isFetching) {
      void contactsQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomerSearchOpen, contactsQuery.data, contactsQuery.isFetching]);

  useEffect(() => {
    if (isCustomerSearchOpen) setCustomerSearchPage(1);
  }, [isCustomerSearchOpen, customerSearchTerm]);

  useEffect(() => {
    if (!isOpen || form.currency !== "DOLARES") return;
    if (form.exchangeRate && form.exchangeRate !== 1) return;

    fetchUsdToPenRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, form.currency]);

  const normalizedCustomerSearch = customerSearchTerm.trim().toLowerCase();
  const customerSearchResults = useMemo(() => {
    if (normalizedCustomerSearch.length < 5) return [];

    return customerDirectory.filter((contact) => {
      const fullName = contact.client || `${contact.lastNamePaterno} ${contact.lastNameMaterno} ${contact.names}`;
      const haystack = [fullName, contact.document, contact.documentType].join(" ").toLowerCase();
      return haystack.includes(normalizedCustomerSearch);
    });
  }, [customerDirectory, normalizedCustomerSearch]);

  const customerSearchTotalPages = Math.max(1, Math.ceil(customerSearchResults.length / customerSearchPageSize));
  const customerSearchCurrentPage = Math.min(customerSearchPage, customerSearchTotalPages);
  const customerSearchPagedResults = customerSearchResults.slice(
    (customerSearchCurrentPage - 1) * customerSearchPageSize,
    customerSearchCurrentPage * customerSearchPageSize,
  );

  async function loadCustomerDirectory() {
    if (customerDirectory.length) return customerDirectory;
    const result = await contactsQuery.refetch();
    return result.data?.contacts ?? [];
  }

  function normalizeDocument(value: string) {
    return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }

  async function handleDocumentEnter() {
    const document = normalizeDocument(form.customerDni || "");
    if (!document) return;

    const contacts = await loadCustomerDirectory();
    const exactMatch = contacts.find((contact) => normalizeDocument(contact.document) === document);

    if (exactMatch) {
      handleSelectCustomer(exactMatch);
      return;
    }

    setCustomerSearchTerm(document);
    setIsCustomerSearchOpen(true);
  }

  function handleCloseCustomerSearch() {
    setIsCustomerSearchOpen(false);
    setCustomerSearchTerm("");
    setCustomerSearchPage(1);
  }

  function formatCustomerAddress(contact: AdminContact) {
    const streetAddress = [contact.address, contact.addressNumber].filter(Boolean).join(" ").trim();
    const location = [contact.department, contact.province, contact.district].filter(Boolean).join(" / ").trim();
    return [streetAddress, location].filter(Boolean).join(" - ");
  }

  function handleSelectCustomer(contact: AdminContact) {
    setForm((previous) => ({
      ...previous,
      customerId: contact.id,
      customer: contact.client.toUpperCase(),
      customerDni: contact.document.toUpperCase(),
      customerType: contact.classification,
      customerAddress: formatCustomerAddress(contact).toUpperCase(),
    }));
    handleCloseCustomerSearch();
  }

  const currencySymbol = form.currency === "DOLARES" ? "$" : "S/";
  const formattedTotal = currency(computedSaleAmount, { symbol: `${currencySymbol} ` }).format();
  const formattedExchangeRate = exchangeRateLoading
    ? "CARGANDO..."
    : currency(form.currency === "SOLES" ? 1 : form.exchangeRate || 1, { precision: 4, symbol: "" }).format();
  const saleItems = form.items || [];

  function applySaleItems(nextItems: AdminSaleItem[]) {
    const grossSubtotal = nextItems.reduce((sum, item) => currency(sum).add(currency(item.unitPrice).multiply(item.quantity)).value, 0);
    const discountTotal = nextItems.reduce((sum, item) => currency(sum).add(item.discountTotal).value, 0);
    const grossTotal = Math.max(0, currency(grossSubtotal).subtract(discountTotal).value);
    const taxableSubtotal = currency(grossTotal).divide(1 + IGV_RATE).value;
    const taxTotal = currency(grossTotal).subtract(taxableSubtotal).value;

    setForm((previous) => ({
      ...previous,
      items: nextItems,
      subtotal: currency(taxableSubtotal).value,
      discountTotal: currency(discountTotal).value,
      shippingTotal: 0,
      taxTotal: currency(taxTotal).value,
      amount: currency(grossTotal).value,
    }));
  }

  function handleAddOrUpdateSaleItem(nextItem: AdminSaleItem) {
    const existingId = editingSaleItem?.id;
    const nextItems = existingId
      ? saleItems.map((item) => (item.id === existingId ? { ...nextItem, id: existingId } : item))
      : [...saleItems, { ...nextItem, id: `local-${Date.now()}` }];

    applySaleItems(nextItems);
    setSelectedSaleItemId(existingId || nextItems[nextItems.length - 1]?.id || null);
    setEditingSaleItem(null);
    setIsProductPickerOpen(false);
  }

  function handleEditSaleItem() {
    const item = saleItems.find((saleItem) => saleItem.id === selectedSaleItemId);
    if (!item) return;

    setEditingSaleItem(item);
    setIsProductPickerOpen(true);
  }

  function handleDeleteSaleItem() {
    if (!selectedSaleItemId) return;
    const nextItems = saleItems.filter((item) => item.id !== selectedSaleItemId);
    applySaleItems(nextItems);
    setSelectedSaleItemId(nextItems[0]?.id || null);
  }

  return (
    <CrudModal isOpen={isOpen} title={title.toUpperCase()} saving={saving} hasUnsavedChanges={hasUnsavedChanges} maxWidthClass="max-w-[96rem]" onClose={onClose} onSubmit={onSubmit}>
      <div className="space-y-3 uppercase">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
            <Field label="Venta">
              <input value={form.orderNumber || editingId || "AUTOMATICO"} readOnly className={readonlyClass} />
            </Field>
            <Field label="Fecha">
              <input type="date" value={form.placedAt} onChange={(event) => setForm((previous) => ({ ...previous, placedAt: event.target.value }))} className={inputClass} />
            </Field>
            <Field label="Vendedor">
              <input value={sellerName} readOnly className={readonlyClass} />
            </Field>
            <Field label="Estado de pedido">
              <select
                value={form.status}
                onChange={(event) => {
                  const status = event.target.value;
                  setForm((previous) => ({
                    ...previous,
                    status,
                    paymentStatus: paymentStatusFromOrderStatus(status, statusOptions),
                  }));
                }}
                className={inputClass}
              >
                {!statusOptions.some((item) => item.label === form.status) && form.status ? (
                  <option value={form.status}>{form.status}</option>
                ) : null}
                {statusOptions.map((item) => (
                  <option key={item.id} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Moneda">
              <select
                value={form.currency}
                onChange={(event) => {
                  const nextCurrency = event.target.value as SaleForm["currency"];
                  setExchangeRateError(null);
                  setForm((previous) => ({
                    ...previous,
                    currency: nextCurrency,
                    exchangeRate: nextCurrency === "SOLES" ? 1 : previous.exchangeRate || 1,
                  }));
                  if (nextCurrency === "DOLARES") fetchUsdToPenRate();
                }}
                className={inputClass}
              >
                <option value="SOLES">SOLES</option>
                <option value="DOLARES">DOLARES</option>
              </select>
            </Field>
            <Field label="Tasa de cambio">
              <input type="text" value={formattedExchangeRate} readOnly className={readonlyClass} aria-busy={exchangeRateLoading} />
            </Field>
            <Field label="Origen">
              <select value={form.source} onChange={(event) => setForm((previous) => ({ ...previous, source: event.target.value as SaleForm["source"] }))} className={inputClass}>
                <option value="web">WEB</option>
                <option value="instagram">INSTAGRAM</option>
                <option value="whatsapp">WHATSAPP</option>
                <option value="store">TIENDA</option>
              </select>
            </Field>
          </div>
          {exchangeRateError ? <p className="mt-2 text-[11px] font-bold uppercase leading-snug text-red-600">{exchangeRateError}</p> : null}
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_18rem] 2xl:grid-cols-[minmax(0,1.4fr)_18rem]">
          <div className="space-y-3">
            <Section title="Cliente" compact>
              <div className="grid gap-2 xl:grid-cols-[10rem_2.5rem_minmax(0,1fr)_9rem_8rem]">
                <Field label="Documento">
                  <input
                    value={form.customerDni || ""}
                    onChange={(event) => setForm((previous) => ({ ...previous, customerDni: event.target.value.toUpperCase() }))}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      handleDocumentEnter();
                    }}
                    className={inputClass}
                  />
                </Field>
                <div className="flex items-end">
                  <button type="button" onClick={() => setIsCustomerSearchOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-100" title="Buscar cliente">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4" />
                  </button>
                </div>
                <Field label="Cliente">
                  <input value={form.customer} readOnly className={readonlyClass} placeholder="SELECCIONA UN CLIENTE" />
                </Field>
                <Field label="Tipo">
                  <select value={form.customerType} onChange={(event) => setForm((previous) => ({ ...previous, customerType: event.target.value as SaleForm["customerType"] }))} className={inputClass}>
                    <option value="MINORISTA">MINORISTA</option>
                    <option value="MAYORISTA">MAYORISTA</option>
                  </select>
                </Field>
                <Field label="Canal">
                  <select value={form.channel} onChange={(event) => setForm((previous) => ({ ...previous, channel: event.target.value as SaleForm["channel"] }))} className={inputClass}>
                    <option value="online">ONLINE</option>
                    <option value="pos">POS</option>
                    <option value="whatsapp">WHATSAPP</option>
                  </select>
                </Field>
              </div>
              <div className="mt-2">
                <Field label="Direccion">
                  <input value={form.customerAddress || ""} readOnly className={readonlyClass} placeholder="SIN DIRECCION SELECCIONADA" />
                </Field>
              </div>
            </Section>

            <Section title="Items de venta">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <IconButton icon={faPlus} label="Agregar item" tone="success" onClick={() => { setEditingSaleItem(null); setIsProductPickerOpen(true); }} />
                <IconButton icon={faPen} label="Editar item" tone="warn" onClick={handleEditSaleItem} disabled={!selectedSaleItemId} />
                <IconButton icon={faTrash} label="Eliminar item" tone="danger" onClick={handleDeleteSaleItem} disabled={!selectedSaleItemId} />
              </div>
              <div className="min-h-[18rem] overflow-x-auto rounded-xl border border-zinc-200">
                <table className="min-w-[1120px] text-left text-sm">
                  <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-2">Item</th>
                      <th className="whitespace-nowrap px-3 py-2">Producto</th>
                      <th className="whitespace-nowrap px-3 py-2">Color</th>
                      <th className="whitespace-nowrap px-3 py-2">Talla</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right">Cant.</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right">Dscto.</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right">P. Venta</th>
                      <th className="whitespace-nowrap px-3 py-2 text-right">V. Venta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleItems.length ? saleItems.map((item, index) => {
                      const selected = item.id === selectedSaleItemId;
                      return (
                        <tr
                          key={item.id || item.variantSku}
                          onClick={() => setSelectedSaleItemId(item.id || null)}
                          className={`cursor-pointer border-t border-zinc-200 transition ${selected ? "bg-zinc-100" : "bg-white hover:bg-zinc-50"}`}
                        >
                          <td className="whitespace-nowrap px-3 py-2 font-semibold">{index + 1}</td>
                          <td className="min-w-56 px-3 py-2 font-semibold text-zinc-950">{item.product}</td>
                          <td className="whitespace-nowrap px-3 py-2">{item.color || "UNICO"}</td>
                          <td className="whitespace-nowrap px-3 py-2">{item.size || "STD"}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{item.quantity}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right">{currency(item.discountTotal, { symbol: "S/ " }).format()}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right">{currency(item.unitPrice, { symbol: "S/ " }).format()}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right font-black">{currency(item.lineTotal, { symbol: "S/ " }).format()}</td>
                        </tr>
                      );
                    }) : (
                      <tr className="border-t border-zinc-200 bg-white">
                        <td className="h-[14.5rem] px-3 py-6 text-center align-middle text-zinc-500" colSpan={8}>
                          Sin items agregados todavia.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>

          <aside className="space-y-3">
            <Section title="Resumen" compact>
              <MoneyInput label="Subtotal" value={form.subtotal ?? 0} prefix={currencySymbol} readOnly />
              <MoneyInput label="Descuento" value={form.discountTotal ?? 0} prefix={currencySymbol} readOnly />
              <MoneyInput label="IGV / Impuesto" value={form.taxTotal ?? 0} prefix={currencySymbol} readOnly />
              <div className="mt-2 rounded-xl bg-zinc-950 p-3 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Total</p>
                <p className="text-right text-2xl font-black">{formattedTotal}</p>
              </div>
            </Section>

            <Section title="Notas internas" compact>
              <textarea value={form.notes} onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value.toUpperCase() }))} placeholder="NOTAS..." rows={2} className={inputClass} />
            </Section>
          </aside>
        </div>

        {isCustomerSearchOpen ? (
          <CustomerSearchDialog
            term={customerSearchTerm}
            setTerm={setCustomerSearchTerm}
            loading={customerDirectoryLoading}
            error={customerDirectoryError}
            normalizedTerm={normalizedCustomerSearch}
            results={customerSearchResults}
            pagedResults={customerSearchPagedResults}
            page={customerSearchCurrentPage}
            totalPages={customerSearchTotalPages}
            pageSize={customerSearchPageSize}
            setPage={setCustomerSearchPage}
            onClose={handleCloseCustomerSearch}
            onSelect={handleSelectCustomer}
          />
        ) : null}

        {isProductPickerOpen ? (
          <ProductPickerDialog
            initialItem={editingSaleItem}
            cachedProducts={inventoryProductsCache}
            loadingProducts={inventoryQuery.isLoading}
            productsError={inventoryQuery.error?.message ?? null}
            onEnsureProducts={() => inventoryQuery.refetch()}
            onClose={() => { setIsProductPickerOpen(false); setEditingSaleItem(null); }}
            onConfirm={handleAddOrUpdateSaleItem}
          />
        ) : null}
      </div>
    </CrudModal>
  );
}

function Section({ title, description, compact = false, children }: { title: string; description?: string; compact?: boolean; children: React.ReactNode }) {
  return (
    <section className={`rounded-xl border border-zinc-200 bg-white shadow-sm ${compact ? "p-2" : "p-3"}`}>
      <div className={description ? "mb-3" : "mb-2"}>
        <h4 className="text-[13px] font-black uppercase tracking-[0.16em] text-zinc-950">{title}</h4>
        {description ? <p className="mt-1 text-xs text-zinc-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-0.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

function IconButton({ icon, label, tone, onClick, disabled = false }: { icon: any; label: string; tone: "success" | "warn" | "danger"; onClick?: () => void; disabled?: boolean }) {
  const classes = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    warn: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400 ${classes[tone]}`} title={label} aria-label={label}>
      <FontAwesomeIcon icon={icon} className="h-4 w-4" />
    </button>
  );
}

function MoneyInput({ label, value, onChange, prefix, readOnly = false }: { label: string; value: number; onChange?: (value: string) => void; prefix: string; readOnly?: boolean }) {
  return (
    <label className="mb-2 grid gap-1">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</span>
      <div className={`flex items-center rounded-lg border px-3 transition ${readOnly ? "border-zinc-200 bg-zinc-100" : "border-zinc-300 bg-white focus-within:border-zinc-950 focus-within:ring-2 focus-within:ring-zinc-200"}`}>
        <span className="text-sm font-semibold text-zinc-500">{prefix}</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
          className="w-full bg-transparent px-2 py-2 text-right text-sm font-semibold uppercase text-zinc-950 outline-none"
        />
      </div>
    </label>
  );
}

function ProductPickerDialog({
  initialItem,
  cachedProducts,
  loadingProducts,
  productsError,
  onEnsureProducts,
  onClose,
  onConfirm,
}: {
  initialItem: AdminSaleItem | null;
  cachedProducts: AdminInventoryProduct[];
  loadingProducts: boolean;
  productsError: string | null;
  onEnsureProducts: () => Promise<unknown>;
  onClose: () => void;
  onConfirm: (item: AdminSaleItem) => void;
}) {
  const products = cachedProducts;
  const loading = loadingProducts && cachedProducts.length === 0;
  const error = productsError;
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<AdminInventoryProduct | null>(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discountTotal, setDiscountTotal] = useState(0);

  useEffect(() => {
    if (!cachedProducts.length) {
      void onEnsureProducts();
      return;
    }

    if (initialItem) {
      const product = cachedProducts.find(
        (item) =>
          item.parentSku === initialItem.parentSku ||
          item.variants.some((variant) => variant.sku === initialItem.variantSku),
      );
      if (product) {
        setSelectedProduct(product);
        setSelectedColor(initialItem.color || "UNICO");
        setSelectedSize(initialItem.size || "STD");
        setQuantity(initialItem.quantity);
        setDiscountTotal(initialItem.discountTotal || 0);
      }
    }
  }, [cachedProducts, initialItem, onEnsureProducts]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleProducts = useMemo(() => {
    const activeProducts = products.filter((product) => product.status === "active" && product.variants.some((variant) => (variant.status ?? "active") === "active"));
    if (!normalizedQuery) return activeProducts.slice(0, 8);

    return activeProducts.filter((product) => {
      const variantsText = product.variants.map((variant) => [variant.sku, variant.color, variant.size].join(" ")).join(" ");
      return [product.product, product.parentSku, product.collection, product.category, variantsText].join(" ").toLowerCase().includes(normalizedQuery);
    }).slice(0, 12);
  }, [products, normalizedQuery]);

  const activeVariants = useMemo(() => {
    if (!selectedProduct) return [];
    return selectedProduct.variants.filter((variant) => (variant.status ?? "active") === "active");
  }, [selectedProduct]);

  const availableColors = useMemo(() => {
    return Array.from(new Set(activeVariants.map((variant) => variant.color || "UNICO")));
  }, [activeVariants]);

  const availableSizes = useMemo(() => {
    return Array.from(new Set(activeVariants.filter((variant) => (variant.color || "UNICO") === selectedColor).map((variant) => variant.size || "STD")));
  }, [activeVariants, selectedColor]);

  const selectedVariant = activeVariants.find((variant) => (variant.color || "UNICO") === selectedColor && (variant.size || "STD") === selectedSize) || null;
  const availableStock = selectedVariant ? Math.max(0, selectedVariant.onHand - selectedVariant.reserved) : 0;
  const linePrice = selectedVariant?.price ?? selectedProduct?.basePrice ?? 0;
  const maxDiscount = currency(linePrice).multiply(quantity || 0).value;
  const lineTotalValue = Math.max(0, currency(linePrice).multiply(quantity || 0).subtract(discountTotal || 0).value);
  const lineTotal = currency(lineTotalValue).format({ symbol: "S/ " });

  function handleSelectProduct(product: AdminInventoryProduct) {
    const firstAvailableVariant = product.variants.find((variant) => (variant.status ?? "active") === "active" && Math.max(0, variant.onHand - variant.reserved) > 0)
      || product.variants.find((variant) => (variant.status ?? "active") === "active")
      || null;

    setSelectedProduct(product);
    setSelectedColor(firstAvailableVariant?.color || "UNICO");
    setSelectedSize(firstAvailableVariant?.size || "STD");
    setQuantity(1);
    setDiscountTotal(0);
  }

  function handleConfirm() {
    if (!selectedProduct || !selectedVariant || availableStock <= 0) return;

    onConfirm({
      id: initialItem?.id,
      productId: selectedProduct.productId,
      parentSku: selectedProduct.parentSku,
      variantSku: selectedVariant.sku,
      product: selectedProduct.product,
      description: selectedProduct.description || selectedVariant.description,
      color: selectedColor,
      size: selectedSize,
      quantity,
      stockAvailable: availableStock,
      unitPrice: currency(linePrice).value,
      discountTotal: currency(discountTotal || 0).value,
      lineTotal: currency(lineTotalValue).value,
    });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-8 backdrop-blur-[2px]">
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
          <div>
            <h4 className="text-base font-black uppercase text-zinc-950">Agregar producto a la venta</h4>
            <p className="mt-1 text-xs uppercase text-zinc-500">Flujo propuesto: buscar producto padre, elegir variante, validar stock y agregar linea.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-xl leading-none text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900" aria-label="Cerrar selector">
            X
          </button>
        </div>

        <div className="grid min-h-[520px] gap-0 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4 border-r border-zinc-200 p-5">
            <div className="grid gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Buscar producto</span>
              <input value={query} onChange={(event) => setQuery(event.target.value.toUpperCase())} placeholder="NOMBRE, SKU PADRE, SKU VARIANTE, COLOR O TALLA..." autoFocus className={inputClass} />
            </div>

            {loading ? <p className="text-sm font-semibold uppercase text-zinc-500">CARGANDO PRODUCTOS...</p> : null}
            {error ? <p className="text-sm font-semibold uppercase text-red-600">{error}</p> : null}

            {!loading && !error ? (
              <div className="grid gap-3 md:grid-cols-2">
                {visibleProducts.length ? visibleProducts.map((product) => {
                  const isSelected = selectedProduct?.parentSku === product.parentSku;
                  return (
                    <button
                      key={product.parentSku}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      className={`grid grid-cols-[4.5rem_1fr] gap-3 rounded-2xl border p-3 text-left transition ${isSelected ? "border-zinc-950 bg-zinc-50 ring-2 ring-zinc-200" : "border-zinc-200 bg-white hover:border-zinc-400"}`}
                    >
                      {product.images[0] ? (
                        <img src={product.images[0]} alt={product.product} className="h-16 w-16 rounded-xl object-cover ring-1 ring-zinc-200" />
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-zinc-100" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black uppercase text-zinc-950">{product.product}</span>
                        <span className="mt-1 block font-mono text-xs uppercase text-zinc-500">{product.parentSku} · {product.variants.length} VARIANTES</span>
                        <span className="mt-2 inline-flex rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-bold uppercase text-zinc-700">STOCK {product.totalAvailable}</span>
                      </span>
                    </button>
                  );
                }) : (
                  <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm font-semibold uppercase text-zinc-500 md:col-span-2">
                    NO SE ENCONTRARON PRODUCTOS CON ESE CRITERIO.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <aside className="space-y-4 bg-zinc-50 p-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Linea de venta</p>
              <h5 className="mt-2 text-lg font-black uppercase text-zinc-950">{selectedProduct?.product || "Selecciona un producto"}</h5>
              {selectedProduct ? <p className="font-mono text-xs uppercase text-zinc-500">{selectedProduct.parentSku}</p> : null}
            </div>

            <Field label="Color disponible">
              <select
                value={selectedColor}
                onChange={(event) => {
                  const nextColor = event.target.value;
                  const firstSizeForColor = activeVariants.find((variant) => (variant.color || "UNICO") === nextColor)?.size || "STD";
                  setSelectedColor(nextColor);
                  setSelectedSize(firstSizeForColor);
                  setQuantity(1);
                }}
                disabled={!availableColors.length}
                className={inputClass}
              >
                {availableColors.length ? availableColors.map((color) => (
                  <option key={color} value={color}>{color}</option>
                )) : (
                  <option value="">SIN COLORES ACTIVOS</option>
                )}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Talla disponible">
                <select
                  value={selectedSize}
                  onChange={(event) => {
                    setSelectedSize(event.target.value);
                    setQuantity(1);
                  }}
                  disabled={!availableSizes.length}
                  className={inputClass}
                >
                  {availableSizes.length ? availableSizes.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  )) : (
                    <option value="">SIN TALLAS</option>
                  )}
                </select>
              </Field>
              <Field label="Precio">
                <input value={currency(linePrice, { symbol: "S/ " }).format()} readOnly className={readonlyClass} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Stock disponible">
                <input value={availableStock} readOnly className={readonlyClass} />
              </Field>
              <Field label="Cantidad">
                <input type="number" min="1" max={Math.max(1, availableStock)} value={quantity} onChange={(event) => setQuantity(Math.min(Math.max(1, Number(event.target.value) || 1), Math.max(1, availableStock)))} disabled={!selectedVariant || availableStock <= 0} className={inputClass} />
              </Field>
            </div>

            <Field label="Descuento linea">
              <input type="number" min="0" max={maxDiscount} step="0.01" value={discountTotal} onChange={(event) => setDiscountTotal(Math.min(Math.max(0, currency(event.target.value || 0).value), maxDiscount))} disabled={!selectedVariant || availableStock <= 0} className={inputClass} />
            </Field>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3 text-sm uppercase">
                <span className="font-bold text-zinc-500">Precio unitario</span>
                <span className="font-black text-zinc-950">{currency(linePrice, { symbol: "S/ " }).format()}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm uppercase">
                <span className="font-bold text-zinc-500">Total linea</span>
                <span className="text-xl font-black text-zinc-950">{lineTotal}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={!selectedVariant || availableStock <= 0}
              onClick={handleConfirm}
              className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-black uppercase text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {initialItem ? "Actualizar linea" : "Agregar linea"}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

function CustomerSearchDialog({
  term,
  setTerm,
  loading,
  error,
  normalizedTerm,
  results,
  pagedResults,
  page,
  totalPages,
  pageSize,
  setPage,
  onClose,
  onSelect,
}: {
  term: string;
  setTerm: (value: string) => void;
  loading: boolean;
  error: string | null;
  normalizedTerm: string;
  results: AdminContact[];
  pagedResults: AdminContact[];
  page: number;
  totalPages: number;
  pageSize: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
  onSelect: (contact: AdminContact) => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h4 className="text-base font-bold text-zinc-900">Buscar cliente</h4>
            <p className="text-xs uppercase text-zinc-500">ESCRIBE AL MENOS 5 CARACTERES PARA BUSCAR POR NOMBRE O DNI.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-xl leading-none text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900" aria-label="Cerrar buscador">
            X
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <input type="search" value={term} onChange={(event) => setTerm(event.target.value.toUpperCase())} placeholder="BUSCAR POR NOMBRE O DNI..." autoFocus className={inputClass} />
          {loading ? <p className="text-sm uppercase text-zinc-500">CARGANDO CLIENTES...</p> : null}
          {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

          {!loading && !error ? (
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3">Cliente</th>
                    <th className="whitespace-nowrap px-4 py-3">DNI</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedTerm.length < 5 ? (
                    Array.from({ length: pageSize }).map((_, index) => (
                      <tr key={`placeholder-${index}`} className="border-t border-zinc-200 bg-white">
                        <td className="px-4 py-3"><div className="h-4 w-40 rounded bg-zinc-100" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-zinc-100" /></td>
                      </tr>
                    ))
                  ) : pagedResults.length ? (
                    pagedResults.map((contact) => (
                      <tr key={contact.id} className="cursor-pointer border-t border-zinc-200 bg-white transition hover:bg-zinc-50" onClick={() => onSelect(contact)}>
                        <td className="px-4 py-3 align-top font-semibold text-zinc-900">{contact.client}</td>
                        <td className="px-4 py-3 align-top text-zinc-700">{contact.document}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-zinc-200 bg-white">
                      <td className="px-4 py-4 text-sm uppercase text-zinc-500" colSpan={2}>NO SE ENCONTRARON CLIENTES CON ESE CRITERIO.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}

          {normalizedTerm.length >= 5 && results.length ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase text-zinc-500">PAGINA {page} DE {totalPages} · {results.length} RESULTADO(S)</p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((previous) => Math.max(1, previous - 1))} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold uppercase text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50">ANTERIOR</button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold uppercase text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50">SIGUIENTE</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
