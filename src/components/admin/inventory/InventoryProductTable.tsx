"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faEllipsisVertical,
  faPen,
  faTrash,
  faBoxesStacked,
} from "@fortawesome/free-solid-svg-icons";
import type { AdminInventoryItem, AdminInventoryProduct } from "@/lib/admin-data";
import { formatPrice, StatusBadge, StockBadge, stockTone } from "./inventory-badges";

type Props = {
  products: AdminInventoryProduct[];
  loading: boolean;
  expanded: Set<string>;
  onToggleExpand: (parentSku: string) => void;
  selectedParentSkus: string[];
  onToggleSelect: (parentSku: string) => void;
  onToggleSelectAll: (selectAll: boolean) => void;
  onEditProduct: (product: AdminInventoryProduct) => void;
  onDeleteProduct: (product: AdminInventoryProduct) => void;
  onDeleteVariant: (sku: string) => void;
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  emptyInventory: boolean;
  onCreate: () => void;
};

export default function InventoryProductTable({
  products,
  loading,
  expanded,
  onToggleExpand,
  selectedParentSkus,
  onToggleSelect,
  onToggleSelectAll,
  onEditProduct,
  onDeleteProduct,
  onDeleteVariant,
  currentPage,
  totalPages,
  totalProducts,
  itemsPerPage,
  onPageChange,
  onClearFilters,
  hasActiveFilters,
  emptyInventory,
  onCreate,
}: Props) {
  const from = totalProducts === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(currentPage * itemsPerPage, totalProducts);
  const selectedSet = new Set(selectedParentSkus);
  const visibleSelectedCount = products.filter((product) => selectedSet.has(product.parentSku)).length;
  const allVisibleSelected = products.length > 0 && visibleSelectedCount === products.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  if (!products.length && !loading) {
    return (
      <EmptyState
        emptyInventory={emptyInventory}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
        onCreate={onCreate}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                <th className="w-10 px-3 py-3" />
                <th className="px-3 py-3">Producto</th>
                <th className="px-3 py-3">Variantes</th>
                <th className="px-3 py-3 text-right">Precio</th>
                <th className="px-3 py-3 text-right">Disponible</th>
                <th className="px-3 py-3">Estado</th>
                <th className="w-12 px-3 py-3" />
                <th className="w-12 px-3 py-3 text-center">
                  <SelectionCheckbox
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={(checked) => onToggleSelectAll(checked)}
                    label="Seleccionar todos los productos visibles"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isExpanded = expanded.has(product.parentSku);
                const isSelected = selectedSet.has(product.parentSku);
                const threshold = Math.min(...product.variants.map((v) => v.lowStockThreshold ?? 3), 3);
                const tone = stockTone(product.totalAvailable, threshold);

                return (
                  <ProductRows
                    key={product.parentSku}
                    product={product}
                    isExpanded={isExpanded}
                    isSelected={isSelected}
                    tone={tone}
                    onToggleExpand={() => onToggleExpand(product.parentSku)}
                    onToggleSelect={() => onToggleSelect(product.parentSku)}
                    onEdit={() => onEditProduct(product)}
                    onDelete={() => onDeleteProduct(product)}
                    onDeleteVariant={onDeleteVariant}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {products.length ? (
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <SelectionCheckbox
                checked={allVisibleSelected}
                indeterminate={someVisibleSelected}
                onChange={(checked) => onToggleSelectAll(checked)}
                label="Seleccionar todos"
              />
              Seleccionar todos
            </label>
            {visibleSelectedCount > 0 ? (
              <span className="text-xs font-semibold tabular-nums text-zinc-500">{visibleSelectedCount} en esta página</span>
            ) : null}
          </div>
        ) : null}

        {products.map((product) => {
          const isExpanded = expanded.has(product.parentSku);
          const isSelected = selectedSet.has(product.parentSku);
          const threshold = Math.min(...product.variants.map((v) => v.lowStockThreshold ?? 3), 3);
          const tone = stockTone(product.totalAvailable, threshold);

          return (
            <article
              key={product.parentSku}
              className={`rounded-xl border bg-white ${isSelected ? "border-zinc-900" : "border-zinc-200"}`}
            >
              <div className="flex items-start gap-3 p-3">
                <button
                  type="button"
                  onClick={() => onToggleExpand(product.parentSku)}
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600"
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? "Contraer variantes" : "Expandir variantes"}
                >
                  <FontAwesomeIcon icon={faChevronDown} className={`h-3 w-3 transition ${isExpanded ? "rotate-180" : ""}`} />
                </button>
                <button type="button" className="min-w-0 flex-1 text-left" onDoubleClick={() => onEditProduct(product)}>
                  <div className="flex gap-3">
                    <ProductThumb product={product} />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-zinc-950">{product.product}</p>
                      <p className="font-mono text-[11px] text-zinc-500">{product.parentSku}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-zinc-500">{product.variants.length} var.</span>
                        <StockBadge value={product.totalAvailable} tone={tone} />
                        <StatusBadge status={product.status} />
                      </div>
                    </div>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <RowMenu
                    onEdit={() => onEditProduct(product)}
                    onAdjustStock={() => onEditProduct(product)}
                    onDelete={() => onDeleteProduct(product)}
                  />
                  <SelectionCheckbox
                    checked={isSelected}
                    onChange={() => onToggleSelect(product.parentSku)}
                    label={`Seleccionar ${product.product}`}
                  />
                </div>
              </div>
              {isExpanded ? (
                <div className="border-t border-zinc-100 bg-zinc-50/80 px-3 py-2">
                  <VariantList
                    variants={product.variants}
                    dense
                    onEditProduct={() => onEditProduct(product)}
                    onDeleteVariant={onDeleteVariant}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-zinc-600">
        <p>
          {from}–{to} de {totalProducts} productos
          {loading ? <span className="ml-2 text-xs text-zinc-400">Actualizando…</span> : null}
        </p>
        <div className="flex items-center gap-2">
          <PagerButton label="Anterior" icon={faChevronLeft} disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} />
          <span className="min-w-20 text-center text-xs font-semibold tabular-nums text-zinc-500">
            {currentPage} / {totalPages}
          </span>
          <PagerButton
            label="Siguiente"
            icon={faChevronRight}
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          />
        </div>
      </div>
    </div>
  );
}

function ProductRows({
  product,
  isExpanded,
  isSelected,
  tone,
  onToggleExpand,
  onToggleSelect,
  onEdit,
  onDelete,
  onDeleteVariant,
}: {
  product: AdminInventoryProduct;
  isExpanded: boolean;
  isSelected: boolean;
  tone: "ok" | "warn" | "danger";
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteVariant: (sku: string) => void;
}) {
  return (
    <>
      <tr
        className={[
          "border-t border-zinc-100 transition",
          isSelected ? "bg-zinc-100/80" : "hover:bg-zinc-50/80",
        ].join(" ")}
      >
        <td className="px-2 py-2.5">
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Contraer variantes" : "Expandir variantes"}
          >
            <FontAwesomeIcon icon={faChevronDown} className={`h-3 w-3 transition ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </td>
        <td className="px-3 py-2.5">
          <button type="button" onDoubleClick={onEdit} className="flex max-w-md items-center gap-3 text-left">
            <ProductThumb product={product} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-zinc-950">{product.product}</p>
              <p className="truncate font-mono text-[11px] text-zinc-500">
                {product.parentSku}
                {product.collection ? ` · ${product.collection}` : ""}
              </p>
            </div>
          </button>
        </td>
        <td className="px-3 py-2.5">
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200"
          >
            <FontAwesomeIcon icon={faBoxesStacked} className="h-3 w-3" />
            {product.variants.length}
          </button>
        </td>
        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-zinc-900">
          {formatPrice(product.basePrice ?? 0)}
        </td>
        <td className="px-3 py-2.5 text-right">
          <StockBadge value={product.totalAvailable} tone={tone} />
        </td>
        <td className="px-3 py-2.5">
          <StatusBadge status={product.status} />
        </td>
        <td className="px-2 py-2.5 text-right">
          <RowMenu onEdit={onEdit} onAdjustStock={onEdit} onDelete={onDelete} />
        </td>
        <td className="px-3 py-2.5 text-center">
          <SelectionCheckbox
            checked={isSelected}
            onChange={onToggleSelect}
            label={`Seleccionar ${product.product}`}
          />
        </td>
      </tr>
      {isExpanded ? (
        <tr className="border-t border-zinc-100 bg-zinc-50/60">
          <td colSpan={8} className="px-3 py-3 pl-12">
            <VariantList variants={product.variants} onEditProduct={onEdit} onDeleteVariant={onDeleteVariant} />
          </td>
        </tr>
      ) : null}
    </>
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
      onClick={(event) => event.stopPropagation()}
      aria-label={label}
      className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-zinc-950 accent-zinc-950 focus:ring-zinc-950"
    />
  );
}

function VariantList({
  variants,
  onEditProduct,
  onDeleteVariant,
  dense = false,
}: {
  variants: AdminInventoryItem[];
  onEditProduct: () => void;
  onDeleteVariant: (sku: string) => void;
  dense?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            <th className="px-3 py-2">Variante</th>
            {!dense ? <th className="px-3 py-2">Color</th> : null}
            {!dense ? <th className="px-3 py-2">Talla</th> : null}
            <th className="px-3 py-2">SKU</th>
            <th className="px-3 py-2 text-right">Precio</th>
            <th className="px-3 py-2 text-right" title="En mano − Reservado">
              Disp.
            </th>
            <th className="px-3 py-2 text-right text-zinc-400" title="En mano">
              Mano
            </th>
            <th className="px-3 py-2 text-right text-zinc-400" title="Reservado">
              Res.
            </th>
            <th className="px-3 py-2">Estado</th>
            <th className="w-16 px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {variants.map((row) => {
            const available = Math.max(0, (row.onHand || 0) - (row.reserved || 0));
            const tone = stockTone(available, row.lowStockThreshold ?? 3);
            return (
              <tr key={row.sku} className="border-t border-zinc-50 hover:bg-zinc-50/80">
                <td className="px-3 py-2 font-medium text-zinc-800">
                  {[row.color, row.size].filter(Boolean).join(" / ") || "Única"}
                </td>
                {!dense ? <td className="px-3 py-2 text-zinc-600">{row.color || "—"}</td> : null}
                {!dense ? <td className="px-3 py-2 text-zinc-600">{row.size || "—"}</td> : null}
                <td className="px-3 py-2 font-mono text-[11px] text-zinc-600">{row.sku}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatPrice(row.price ?? 0)}</td>
                <td className="px-3 py-2 text-right">
                  <StockBadge value={available} tone={tone} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-500">{row.onHand}</td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-500">{row.reserved}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={row.status ?? "active"} />
                </td>
                <td className="px-2 py-2 text-right">
                  <div className="inline-flex gap-1">
                    <IconAction label="Editar producto" icon={faPen} onClick={onEditProduct} />
                    <IconAction label="Eliminar variante" icon={faTrash} danger onClick={() => onDeleteVariant(row.sku)} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-zinc-100 px-3 py-1.5 text-[11px] text-zinc-500">
        Disponible = En mano − Reservado. Las unidades vendidas son históricas y no restan del inventario actual.
      </p>
    </div>
  );
}

function ProductThumb({ product }: { product: AdminInventoryProduct }) {
  if (product.images[0]) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={product.images[0]} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-zinc-200" />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200">
      <FontAwesomeIcon icon={faBoxOpen} className="h-4 w-4" />
    </div>
  );
}

function RowMenu({
  onEdit,
  onAdjustStock,
  onDelete,
}: {
  onEdit: () => void;
  onAdjustStock: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Acciones del producto"
      >
        <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
        >
          <MenuItem
            label="Editar producto"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          />
          <MenuItem
            label="Gestionar variantes"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          />
          <MenuItem
            label="Ajustar stock"
            onClick={() => {
              setOpen(false);
              onAdjustStock();
            }}
          />
          <div className="my-1 border-t border-zinc-100" />
          <MenuItem
            label="Eliminar"
            danger
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`block w-full px-3 py-2 text-left text-sm font-medium transition ${
        danger ? "text-red-700 hover:bg-red-50" : "text-zinc-800 hover:bg-zinc-50"
      }`}
    >
      {label}
    </button>
  );
}

function IconAction({
  label,
  icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: typeof faPen;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
        danger ? "text-red-600 hover:bg-red-50" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      <FontAwesomeIcon icon={icon} className="h-3 w-3" />
    </button>
  );
}

function PagerButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: typeof faChevronLeft;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <FontAwesomeIcon icon={icon} className="h-3 w-3" />
    </button>
  );
}

function EmptyState({
  emptyInventory,
  hasActiveFilters,
  onClearFilters,
  onCreate,
}: {
  emptyInventory: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCreate: () => void;
}) {
  if (emptyInventory && !hasActiveFilters) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
        <FontAwesomeIcon icon={faBoxOpen} className="mx-auto h-8 w-8 text-zinc-300" />
        <h3 className="mt-4 text-lg font-bold text-zinc-950">Tu inventario está vacío</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
          Crea el primer producto con colores y tallas. Las variantes se generan automáticamente.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Agregar producto
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-6 py-14 text-center">
      <h3 className="text-lg font-bold text-zinc-950">Sin resultados</h3>
      <p className="mt-1 text-sm text-zinc-500">Ningún producto coincide con la búsqueda o los filtros.</p>
      <button
        type="button"
        onClick={onClearFilters}
        className="mt-4 inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
