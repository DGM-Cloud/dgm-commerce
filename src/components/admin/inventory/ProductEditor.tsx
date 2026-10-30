"use client";

import {
  ClipboardEvent,
  Dispatch,
  RefObject,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faImage,
  faPlus,
  faStar,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { AdminInventoryItem, AdminInventoryProductInput, AdminInventoryVariantInput } from "@/lib/admin-data";
import { variantKey } from "@/lib/admin-inventory-variants";
import { buildProductSeo } from "@/lib/seo/product-seo";
import { StatusBadge } from "./inventory-badges";

const fieldClass =
  "h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/10 disabled:bg-zinc-50";
const areaClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/10";

export type ProductColorSwatch = { name: string; hex: string; className?: string };

type Props = {
  productForm: AdminInventoryProductInput;
  setProductForm: Dispatch<SetStateAction<AdminInventoryProductInput>>;
  editingParentSku: string | null;
  saving: boolean;
  uploadingImage: boolean;
  uploadError?: string | null;
  fieldErrors?: Record<string, string>;
  productTypes: string[];
  sizeOptions: string[];
  availableSubcollections: string[];
  availableCollections: string[];
  availableWarehouses: string[];
  availableColorSwatches: ProductColorSwatch[];
  onAddProductType: (name: string) => void;
  onAddCollection: (name: string) => void;
  onAddSubcollection: (name: string) => void;
  onAddWarehouse: (name: string) => void;
  newColorName: string;
  setNewColorName: (value: string) => void;
  newColorHex: string;
  setNewColorHex: (value: string) => void;
  onAddCustomColor: () => void;
  newSizeName: string;
  setNewSizeName: (value: string) => void;
  onAddCustomSize: () => void;
  imageInputRef: RefObject<HTMLInputElement | null>;
  onUploadImages: (files: FileList | File[] | null) => void;
  onSetPrimaryImage: (url: string) => void;
  onRemoveImage: (url: string) => void;
  onToggleOption: (field: "colors" | "sizes", value: string) => void;
  onUpdateVariant: (key: string, patch: Partial<Pick<AdminInventoryVariantInput, "price" | "onHand" | "status">>) => void;
  onRemoveVariant: (key: string) => void;
  onRemoveVariants?: (keys: string[]) => void;
  onGenerateMissing: () => void;
  onDeriveSubcollection: (product: string, collection?: string) => string;
  onBulkApplyPrice?: (keys: string[], price: number) => void;
  onBulkApplyStock?: (keys: string[], stock: number) => void;
};

function slugPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase();
}

function previewVariantSku(parentSku: string, color: string, size: string) {
  const base = parentSku.trim() || "SKU";
  return `${base}-${slugPart(color) || "UNICO"}-${slugPart(size) || "STD"}`;
}

export default function ProductEditor({
  productForm,
  setProductForm,
  editingParentSku,
  saving,
  uploadingImage,
  uploadError,
  fieldErrors = {},
  productTypes,
  sizeOptions,
  availableSubcollections,
  availableCollections,
  availableWarehouses,
  availableColorSwatches,
  onAddProductType,
  onAddCollection,
  onAddSubcollection,
  onAddWarehouse,
  newColorName,
  setNewColorName,
  newColorHex,
  setNewColorHex,
  onAddCustomColor,
  newSizeName,
  setNewSizeName,
  onAddCustomSize,
  imageInputRef,
  onUploadImages,
  onSetPrimaryImage,
  onRemoveImage,
  onToggleOption,
  onUpdateVariant,
  onRemoveVariant,
  onRemoveVariants,
  onGenerateMissing,
  onDeriveSubcollection,
  onBulkApplyPrice,
  onBulkApplyStock,
}: Props) {
  const [seoOpen, setSeoOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [addingColor, setAddingColor] = useState(false);
  const [addingSize, setAddingSize] = useState(false);

  const variants = useMemo(() => {
    const parent = (productForm.parentSku || "").trim().toUpperCase();
    return (productForm.variants || []).map((row) => {
      const key = variantKey(row.color, row.size);
      return {
        key,
        color: row.color,
        size: row.size,
        label: `${row.color} / ${row.size}`,
        sku: row.sku || previewVariantSku(parent, row.color, row.size),
        price: row.price,
        stock: row.onHand,
        status: row.status ?? productForm.status ?? "active",
      };
    });
  }, [productForm]);

  const expectedCombos = productForm.colors.length * productForm.sizes.length;
  const missingCombos = Math.max(0, expectedCombos - variants.length);

  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const allSelected = variants.length > 0 && selectedKeys.length === variants.length;
  const someSelected = selectedKeys.length > 0 && !allSelected;

  useEffect(() => {
    setSelectedKeys((previous) => previous.filter((key) => variants.some((row) => row.key === key)));
  }, [variants]);

  const seoPreview = buildProductSeo({
    id: productForm.productId || 0,
    name: productForm.product || "Producto",
    summary: productForm.summary,
    description: productForm.description,
    category: productForm.category,
    collection: productForm.collection,
    slug: productForm.seoSlug,
    seoTitle: productForm.seoTitle,
    seoDescription: productForm.seoDescription,
  });

  function toggleSelect(key: string) {
    setSelectedKeys((previous) =>
      previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key],
    );
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedKeys(checked ? variants.map((row) => row.key) : []);
  }

  function applyBulkPrice() {
    const price = Number(bulkPrice);
    if (!Number.isFinite(price) || price < 0 || !selectedKeys.length) return;
    onBulkApplyPrice?.(selectedKeys, price);
  }

  function applyBulkStock() {
    const stock = Number(bulkStock);
    if (!Number.isFinite(stock) || stock < 0 || !selectedKeys.length) return;
    onBulkApplyStock?.(selectedKeys, stock);
  }

  return (
    <div className="space-y-3">
      {/* Multimedia + general */}
      <div className="grid gap-3 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)]">
        <Section
          title="Multimedia"
          description={
            (productForm.images?.length || 0) > 0
              ? `${productForm.images?.length} imagen${(productForm.images?.length || 0) === 1 ? "" : "es"} · la primera es la portada`
              : "Sube fotos del producto. La primera será la portada."
          }
          className="h-fit lg:sticky lg:top-3"
        >
          <MediaPanel
            images={productForm.images || []}
            productName={productForm.product}
            uploading={uploadingImage}
            saving={saving}
            error={uploadError}
            imageInputRef={imageInputRef}
            onUpload={onUploadImages}
            onSetPrimary={onSetPrimaryImage}
            onRemove={onRemoveImage}
          />
        </Section>

        <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <Section title="Información general">
            <div className="space-y-3">
              <Field label="Nombre del producto" error={fieldErrors.product} required>
                <input
                  type="text"
                  value={productForm.product}
                  onChange={(event) => {
                    const product = event.target.value;
                    setProductForm((previous) => ({
                      ...previous,
                      product,
                      subcollection: previous.subcollection || onDeriveSubcollection(product, previous.collection),
                    }));
                  }}
                  placeholder="Ej. Polo Classic Tee"
                  required
                  className={fieldClass}
                />
              </Field>

              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="SKU principal" error={fieldErrors.parentSku}>
                  <input
                    type="text"
                    value={productForm.parentSku || ""}
                    onChange={(event) =>
                      setProductForm((previous) => ({ ...previous, parentSku: event.target.value.toUpperCase() }))
                    }
                    placeholder="SPD-016"
                    className={`${fieldClass} font-mono uppercase tracking-wide`}
                  />
                </Field>
                <CreatableSelect
                  label="Tipo"
                  value={productForm.category || ""}
                  options={productTypes}
                  onChange={(category) => setProductForm((previous) => ({ ...previous, category }))}
                  onCreate={onAddProductType}
                  createLabel="Nuevo tipo"
                  createPlaceholder="Ej. Camisa"
                  required
                />
                <Field label="Estado">
                  <select
                    value={productForm.status ?? "active"}
                    onChange={(event) =>
                      setProductForm((previous) => ({
                        ...previous,
                        status: event.target.value as AdminInventoryItem["status"],
                      }))
                    }
                    className={fieldClass}
                  >
                    <option value="active">Activo</option>
                    <option value="draft">Borrador</option>
                    <option value="archived">Archivado</option>
                  </select>
                </Field>
                <CreatableSelect
                  label="Almacén"
                  value={productForm.warehouse || ""}
                  options={availableWarehouses}
                  onChange={(warehouse) => setProductForm((previous) => ({ ...previous, warehouse }))}
                  onCreate={onAddWarehouse}
                  createLabel="Nuevo almacén"
                  createPlaceholder="Ej. Principal"
                  required
                />
              </div>

              <div className="space-y-2">
                <CreatableSelect
                  label="Colección"
                  value={productForm.collection || ""}
                  options={availableCollections}
                  emptyLabel="Sin colección"
                  onChange={(collection) =>
                    setProductForm((previous) => ({
                      ...previous,
                      collection,
                      subcollection:
                        previous.subcollection || onDeriveSubcollection(previous.product, collection),
                    }))
                  }
                  onCreate={onAddCollection}
                  createLabel="Nueva colección"
                  createPlaceholder="Nueva colección"
                />
                <CreatableSelect
                  label="Subcolección"
                  value={productForm.subcollection || ""}
                  options={availableSubcollections}
                  emptyLabel="Sin subcolección"
                  onChange={(subcollection) => setProductForm((previous) => ({ ...previous, subcollection }))}
                  onCreate={onAddSubcollection}
                  createLabel="Nueva subcolección"
                  createPlaceholder="Ej. Cristiano Ronaldo"
                />
              </div>

              <div className="max-w-[10rem]">
                <Field label="Stock mínimo (aviso)">
                  <input
                    type="number"
                    min="0"
                    value={productForm.lowStockThreshold ?? 3}
                    onChange={(event) =>
                      setProductForm((previous) => ({
                        ...previous,
                        lowStockThreshold: Number(event.target.value),
                      }))
                    }
                    required
                    className={fieldClass}
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Descripción">
            <div className="space-y-3">
              <Field label="Resumen comercial">
                <textarea
                  rows={3}
                  value={productForm.summary || ""}
                  onChange={(event) => setProductForm((previous) => ({ ...previous, summary: event.target.value }))}
                  placeholder="Texto corto para ficha, catálogo y listados"
                  className={areaClass}
                />
              </Field>
              <CompactRichText
                label="Descripción completa"
                value={productForm.description || ""}
                onChange={(description) => setProductForm((previous) => ({ ...previous, description }))}
              />
            </div>
          </Section>
        </div>
      </div>

      {/* Variants */}
      <Section
        title="Variantes"
        description="Cada combinación color × talla tiene su propio precio y stock. Puedes borrar filas individuales."
      >
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-zinc-700">Colores</p>
                <SecondaryButton
                  onClick={() => {
                    setAddingColor(true);
                    setAddingSize(false);
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
                  Agregar color
                </SecondaryButton>
              </div>
              <p className="text-[11px] text-zinc-500">Activa un color para crear sus variantes por cada talla activa.</p>
              <div className="flex flex-wrap gap-1.5">
                {availableColorSwatches.map((color) => {
                  const selected = productForm.colors.includes(color.name);
                  return (
                    <button
                      key={color.name}
                      type="button"
                      title={color.name}
                      aria-pressed={selected}
                      onClick={() => onToggleOption("colors", color.name)}
                      className={[
                        "inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900",
                        selected
                          ? "border-zinc-900 bg-white text-zinc-950"
                          : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400",
                      ].join(" ")}
                    >
                      <span
                        className={`h-3.5 w-3.5 rounded-full ${color.className || ""}`}
                        style={color.className ? undefined : { backgroundColor: color.hex }}
                      />
                      {color.name}
                    </button>
                  );
                })}
              </div>
              {addingColor ? (
                <div className="flex max-w-sm items-center gap-1.5">
                  <label className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-zinc-200">
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(event) => setNewColorHex(event.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Tono"
                    />
                    <span className="block h-full w-full" style={{ backgroundColor: newColorHex }} />
                  </label>
                  <input
                    type="text"
                    value={newColorName}
                    onChange={(event) => setNewColorName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        onAddCustomColor();
                        setAddingColor(false);
                      }
                      if (event.key === "Escape") setAddingColor(false);
                    }}
                    placeholder="Nombre del color"
                    autoFocus
                    className={`${fieldClass} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onAddCustomColor();
                      setAddingColor(false);
                    }}
                    disabled={!newColorName.trim()}
                    className="h-9 rounded-lg bg-zinc-950 px-2.5 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    Añadir
                  </button>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-zinc-700">Tallas</p>
                <SecondaryButton
                  onClick={() => {
                    setAddingSize(true);
                    setAddingColor(false);
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
                  Agregar talla
                </SecondaryButton>
              </div>
              <p className="text-[11px] text-zinc-500">Activa una talla para crear sus variantes por cada color activo.</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set([...sizeOptions, ...productForm.sizes])).map((size) => {
                  const selected = productForm.sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onToggleOption("sizes", size)}
                      className={[
                        "min-w-10 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900",
                        selected
                          ? "border-zinc-950 bg-zinc-950 text-white"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400",
                      ].join(" ")}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              {addingSize ? (
                <div className="flex max-w-xs items-center gap-1.5">
                  <input
                    type="text"
                    value={newSizeName}
                    onChange={(event) => setNewSizeName(event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        onAddCustomSize();
                        setAddingSize(false);
                      }
                      if (event.key === "Escape") setAddingSize(false);
                    }}
                    placeholder="Ej. 4XL"
                    autoFocus
                    className={`${fieldClass} flex-1 font-mono uppercase`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onAddCustomSize();
                      setAddingSize(false);
                    }}
                    disabled={!newSizeName.trim()}
                    className="h-9 rounded-lg bg-zinc-950 px-2.5 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    Añadir
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-zinc-500">
              {variants.length} variante{variants.length === 1 ? "" : "s"}
              {missingCombos > 0 ? ` · faltan ${missingCombos} combinaciones` : ""}
            </p>
            {missingCombos > 0 ? (
              <SecondaryButton onClick={onGenerateMissing}>
                <FontAwesomeIcon icon={faPlus} className="h-2.5 w-2.5" />
                Completar combinaciones
              </SecondaryButton>
            ) : null}
          </div>

          {selectedKeys.length ? (
            <div className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="mr-1 text-xs font-semibold text-zinc-600">
                {selectedKeys.length} seleccionada{selectedKeys.length === 1 ? "" : "s"}
              </p>
              <label className="grid gap-0.5">
                <span className="text-[10px] font-medium text-zinc-500">Precio</span>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bulkPrice}
                    onChange={(event) => setBulkPrice(event.target.value)}
                    className="h-8 w-24 rounded-md border border-zinc-200 px-2 text-sm outline-none focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={applyBulkPrice}
                    className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Aplicar
                  </button>
                </div>
              </label>
              <label className="grid gap-0.5">
                <span className="text-[10px] font-medium text-zinc-500">Stock</span>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="0"
                    value={bulkStock}
                    onChange={(event) => setBulkStock(event.target.value)}
                    className="h-8 w-20 rounded-md border border-zinc-200 px-2 text-sm outline-none focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={applyBulkStock}
                    className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Aplicar
                  </button>
                </div>
              </label>
              <button
                type="button"
                onClick={() => {
                  (onRemoveVariants || ((keys) => keys.forEach((key) => onRemoveVariant(key))))(selectedKeys);
                  setSelectedKeys([]);
                }}
                className="h-8 rounded-md border border-red-200 bg-red-50 px-2 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                Eliminar
              </button>
              <button
                type="button"
                onClick={() => setSelectedKeys([])}
                className="h-8 rounded-md px-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100"
              >
                Quitar selección
              </button>
            </div>
          ) : null}

          {fieldErrors.variants ? <p className="text-xs font-medium text-red-600">{fieldErrors.variants}</p> : null}

          {variants.length ? (
            <div className="overflow-hidden rounded-lg border border-zinc-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/80 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      <th className="w-10 px-2 py-2 text-center">
                        <SelectionCheckbox
                          checked={allSelected}
                          indeterminate={someSelected}
                          onChange={toggleSelectAll}
                          label="Seleccionar todas"
                        />
                      </th>
                      <th className="px-3 py-2">Variante</th>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Precio</th>
                      <th className="px-3 py-2">Stock</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="w-12 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((row) => (
                      <tr key={row.key} className="border-t border-zinc-50 hover:bg-zinc-50/60">
                        <td className="px-2 py-1.5 text-center">
                          <SelectionCheckbox
                            checked={selectedSet.has(row.key)}
                            onChange={() => toggleSelect(row.key)}
                            label={`Seleccionar ${row.label}`}
                          />
                        </td>
                        <td className="px-3 py-1.5 font-medium text-zinc-900">{row.label}</td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-zinc-500">{row.sku}</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.price}
                            onChange={(event) => onUpdateVariant(row.key, { price: Number(event.target.value) })}
                            className="h-8 w-24 rounded-md border border-zinc-200 px-2 text-sm outline-none focus:border-zinc-900"
                            aria-label={`Precio ${row.label}`}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="number"
                            min="0"
                            value={row.stock}
                            onChange={(event) => onUpdateVariant(row.key, { onHand: Number(event.target.value) })}
                            className="h-8 w-20 rounded-md border border-zinc-200 px-2 text-sm outline-none focus:border-zinc-900"
                            aria-label={`Stock ${row.label}`}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => onRemoveVariant(row.key)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-red-50 hover:text-red-700"
                            aria-label={`Eliminar ${row.label}`}
                            title="Eliminar variante"
                          >
                            <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-zinc-800">Sin variantes todavía</p>
              <p className="mt-1 text-xs text-zinc-500">Activa un color y una talla para generar la primera combinación.</p>
            </div>
          )}
        </div>
      </Section>

      {/* SEO */}
      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <button
          type="button"
          onClick={() => setSeoOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-zinc-50"
          aria-expanded={seoOpen}
        >
          <div>
            <p className="text-sm font-semibold text-zinc-900">SEO</p>
            <p className="text-xs text-zinc-500">Opcional. Si está vacío, se genera automáticamente.</p>
          </div>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`h-3 w-3 text-zinc-400 transition ${seoOpen ? "rotate-180" : ""}`}
          />
        </button>
        {seoOpen ? (
          <div className="space-y-2.5 border-t border-zinc-100 px-4 py-3">
            <Field label="Slug">
              <input
                value={productForm.seoSlug || ""}
                onChange={(event) => setProductForm((previous) => ({ ...previous, seoSlug: event.target.value }))}
                placeholder="classic-tee-algodon"
                className={fieldClass}
              />
            </Field>
            <Field label="Meta title">
              <input
                value={productForm.seoTitle || ""}
                onChange={(event) => setProductForm((previous) => ({ ...previous, seoTitle: event.target.value }))}
                placeholder="Classic Tee | Polos"
                className={fieldClass}
              />
            </Field>
            <Field label="Meta description">
              <textarea
                rows={2}
                value={productForm.seoDescription || ""}
                onChange={(event) =>
                  setProductForm((previous) => ({ ...previous, seoDescription: event.target.value }))
                }
                placeholder="~158 caracteres"
                className={areaClass}
              />
            </Field>
            <div className="rounded-lg bg-zinc-50 px-3 py-2">
              <p className="font-mono text-[11px] text-zinc-400">{seoPreview.path}</p>
              <p className="text-sm font-semibold text-blue-700">{seoPreview.seoTitle}</p>
              <p className="line-clamp-2 text-xs text-zinc-600">{seoPreview.seoDescription}</p>
            </div>
          </div>
        ) : null}
      </section>

      {editingParentSku ? (
        <p className="text-[11px] text-zinc-400">
          Editando <span className="font-mono text-zinc-600">{editingParentSku}</span>. Las variantes quitadas al
          guardar se archivan; las existentes conservan reservas y ventas.
        </p>
      ) : null}
    </div>
  );
}

function Section({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-zinc-200 bg-white p-3.5 sm:p-4 ${className}`}>
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-zinc-950">{title}</h4>
        {description ? <p className="mt-0.5 text-xs text-zinc-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className = "",
  error,
  required,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className={`grid gap-1 ${className}`}>
      <span className="text-xs font-medium text-zinc-600">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

function CreatableSelect({
  label,
  value,
  options,
  onChange,
  onCreate,
  emptyLabel,
  createLabel,
  createPlaceholder,
  required,
  error,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onCreate: (name: string) => void;
  emptyLabel?: string;
  createLabel: string;
  createPlaceholder: string;
  required?: boolean;
  error?: string;
}) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");

  const selectOptions = useMemo(() => {
    const names = [...options, value].filter((item): item is string => Boolean(item));
    return Array.from(new Set(names));
  }, [options, value]);

  function commitCreate() {
    const name = draft.trim();
    if (!name) return;
    onCreate(name);
    setCreating(false);
    setDraft("");
  }

  function cancelCreate() {
    setCreating(false);
    setDraft("");
  }

  return (
    <Field label={label} required={required} error={error}>
      {creating ? (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitCreate();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                cancelCreate();
              }
            }}
            placeholder={createPlaceholder}
            autoFocus
            className={`${fieldClass} flex-1`}
          />
          <button
            type="button"
            onClick={commitCreate}
            disabled={!draft.trim()}
            className="h-9 shrink-0 rounded-lg bg-zinc-950 px-2.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            Crear
          </button>
          <IconButton label="Cancelar" onClick={cancelCreate}>
            <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
          </IconButton>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            required={required}
            className={`${fieldClass} flex-1`}
          >
            {emptyLabel !== undefined ? <option value="">{emptyLabel}</option> : null}
            {selectOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <IconButton label={createLabel} onClick={() => setCreating(true)}>
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
          </IconButton>
        </div>
      )}
    </Field>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
    >
      {children}
    </button>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
    >
      {children}
    </button>
  );
}

function SelectionCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={label}
      className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-zinc-950"
    />
  );
}

function MediaPanel({
  images,
  productName,
  uploading,
  saving,
  error,
  imageInputRef,
  onUpload,
  onSetPrimary,
  onRemove,
}: {
  images: string[];
  productName: string;
  uploading: boolean;
  saving: boolean;
  error?: string | null;
  imageInputRef: RefObject<HTMLInputElement | null>;
  onUpload: (files: FileList | File[] | null) => void;
  onSetPrimary: (url: string) => void;
  onRemove: (url: string) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const safeIndex = images.length === 0 ? 0 : Math.min(selectedIndex, images.length - 1);
  const current = images[safeIndex];
  const isPrimary = safeIndex === 0;
  const hasMultiple = images.length > 1;

  useEffect(() => {
    if (selectedIndex > images.length - 1) {
      setSelectedIndex(Math.max(0, images.length - 1));
    }
  }, [images.length, selectedIndex]);

  function goPrev() {
    if (!hasMultiple) return;
    setSelectedIndex((index) => (index - 1 + images.length) % images.length);
  }

  function goNext() {
    if (!hasMultiple) return;
    setSelectedIndex((index) => (index + 1) % images.length);
  }

  useEffect(() => {
    if (!current && lightboxOpen) setLightboxOpen(false);
  }, [current, lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft" && images.length > 1) {
        setSelectedIndex((index) => (index - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight" && images.length > 1) {
        setSelectedIndex((index) => (index + 1) % images.length);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen, images.length]);

  function handleRemove(url: string, index: number) {
    onRemove(url);
    if (index < safeIndex || (index === safeIndex && safeIndex >= images.length - 1)) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200 sm:aspect-square">
        {current ? (
          <>
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute inset-0 z-0 cursor-zoom-in"
              aria-label="Ver imagen más grande"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current}
                alt={productName || "Producto"}
                className="h-full w-full object-cover"
              />
            </button>
            {isPrimary ? (
              <span className="pointer-events-none absolute left-2.5 top-2.5 z-[1] inline-flex items-center gap-1 rounded-md bg-zinc-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                <FontAwesomeIcon icon={faStar} className="h-2.5 w-2.5" />
                Portada
              </span>
            ) : (
              <span className="pointer-events-none absolute left-2.5 top-2.5 z-[1] rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold text-zinc-700 ring-1 ring-zinc-200">
                {safeIndex + 1} / {images.length}
              </span>
            )}
            {hasMultiple ? (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    goPrev();
                  }}
                  className="absolute left-2 top-1/2 z-[1] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition hover:bg-white"
                  aria-label="Foto anterior"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    goNext();
                  }}
                  className="absolute right-2 top-1/2 z-[1] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition hover:bg-white"
                  aria-label="Foto siguiente"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5" />
                </button>
              </>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading || saving}
            className="flex h-full w-full flex-col items-center justify-center gap-2.5 text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-600 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faImage} className="h-8 w-8" />
            <span className="text-sm font-semibold">{uploading ? "Subiendo…" : "Agregar imagen"}</span>
            <span className="px-6 text-center text-xs text-zinc-400">JPG, PNG, WEBP o GIF</span>
          </button>
        )}
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-zinc-700">
            Subiendo…
          </div>
        ) : null}
      </div>

      {current ? (
        <div className="flex flex-wrap items-center gap-2">
          {!isPrimary ? (
            <button
              type="button"
              onClick={() => onSetPrimary(current)}
              disabled={uploading || saving}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faStar} className="h-3 w-3" />
              Hacer portada
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => handleRemove(current, safeIndex)}
            disabled={uploading || saving}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
            Eliminar
          </button>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading || saving}
            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-white px-2.5 text-xs font-semibold text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            Agregar
          </button>
        </div>
      ) : null}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(event) => onUpload(event.target.files)}
      />

      {images.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {images.map((url, index) => {
            const selected = index === safeIndex;
            const primary = index === 0;
            return (
              <button
                key={url}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                  selected ? "ring-zinc-950" : "ring-zinc-200 hover:ring-zinc-400"
                }`}
                aria-label={primary ? `Portada, imagen ${index + 1}` : `Ver imagen ${index + 1}`}
                aria-current={selected ? "true" : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                {primary ? (
                  <span className="absolute bottom-1 left-1 rounded bg-zinc-950 px-1 py-0.5 text-[9px] font-bold text-white">
                    ★
                  </span>
                ) : null}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading || saving}
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-700 disabled:opacity-50"
            aria-label="Agregar imágenes"
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}

      {lightboxOpen && current
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/85 p-4 sm:p-8"
              role="dialog"
              aria-modal="true"
              aria-label="Vista ampliada de la imagen"
              onClick={() => setLightboxOpen(false)}
            >
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="absolute right-4 top-4 z-[1] flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition hover:bg-white"
                aria-label="Cerrar"
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              </button>

              {hasMultiple ? (
                <>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      goPrev();
                    }}
                    className="absolute left-3 top-1/2 z-[1] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition hover:bg-white sm:left-6"
                    aria-label="Foto anterior"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      goNext();
                    }}
                    className="absolute right-3 top-1/2 z-[1] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition hover:bg-white sm:right-6"
                    aria-label="Foto siguiente"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
                  </button>
                </>
              ) : null}

              <div
                className="relative flex max-h-full max-w-full flex-col items-center gap-3"
                onClick={(event) => event.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current}
                  alt={productName || "Producto"}
                  className="max-h-[min(85vh,900px)] max-w-[min(92vw,1100px)] rounded-lg object-contain shadow-2xl"
                />
                <p className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
                  {safeIndex + 1} / {images.length}
                  {isPrimary ? " · Portada" : ""}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function CompactRichText({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastEmittedHtml = useRef<string | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (lastEmittedHtml.current !== null && value === lastEmittedHtml.current) return;
    editor.innerHTML = value || "";
    lastEmittedHtml.current = value;
  }, [value]);

  function emitChange() {
    const html = editorRef.current?.innerHTML || "";
    lastEmittedHtml.current = html;
    onChange(html);
  }

  function runCommand(command: string, commandValue?: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    if (command === "formatBlock" && commandValue) {
      const applied = document.execCommand("formatBlock", false, commandValue);
      if (!applied) document.execCommand("formatBlock", false, `<${commandValue}>`);
    } else {
      document.execCommand(command, false, commandValue);
    }
    emitChange();
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
    emitChange();
  }

  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="flex flex-wrap gap-0.5 border-b border-zinc-100 bg-zinc-50 px-1.5 py-1">
          {[
            { label: "B", title: "Negrita", cmd: "bold", strong: true },
            { label: "I", title: "Cursiva", cmd: "italic", italic: true },
            { label: "U", title: "Subrayado", cmd: "underline", underline: true },
            { label: "•", title: "Lista", cmd: "insertUnorderedList" },
            { label: "1.", title: "Numerada", cmd: "insertOrderedList" },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              title={item.title}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => runCommand(item.cmd)}
              className={[
                "rounded px-1.5 py-0.5 text-[11px] text-zinc-600 transition hover:bg-white hover:text-zinc-950",
                "strong" in item && item.strong ? "font-black" : "font-semibold",
                "italic" in item && item.italic ? "italic" : "",
                "underline" in item && item.underline ? "underline" : "",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div
          ref={editorRef}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          onPaste={handlePaste}
          className="min-h-[6.5rem] max-h-40 overflow-y-auto px-2.5 py-2 text-sm leading-6 text-zinc-800 outline-none [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4"
        />
      </div>
    </div>
  );
}
