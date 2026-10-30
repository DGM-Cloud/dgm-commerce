"use client";

import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useAdminPage } from "@/components/admin/AdminPageContext";
import AdminModuleSkeleton from "@/components/admin/AdminModuleSkeleton";
import CrudModal from "@/components/admin/CrudModal";
import InventoryMetricsBar from "@/components/admin/inventory/InventoryMetricsBar";
import InventoryProductTable from "@/components/admin/inventory/InventoryProductTable";
import InventoryToolbar from "@/components/admin/inventory/InventoryToolbar";
import ProductEditor from "@/components/admin/inventory/ProductEditor";
import { StatusBadge } from "@/components/admin/inventory/inventory-badges";
import type {
  AdminInventoryItem,
  AdminInventoryProduct,
  AdminInventoryProductInput,
  AdminInventoryVariantInput,
} from "@/lib/admin-data";
import {
  buildCartesianVariants,
  syncOptionLists,
  variantKey,
} from "@/lib/admin-inventory-variants";
import { deriveSubcollection } from "@/lib/product-subcollection";
import type { CatalogOptions } from "@/components/admin/CatalogGeneratorModal";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  useInvalidateInventory,
  useInventoryProductsCatalogQuery,
  useInventoryProductsQuery,
  useSyncAdminFetching,
} from "@/lib/admin-query";

function serializeProductForm(form: AdminInventoryProductInput) {
  const variants = [...(form.variants || [])]
    .map((row) => ({
      color: row.color,
      size: row.size,
      price: row.price,
      onHand: row.onHand,
      status: row.status ?? "active",
      sku: row.sku || "",
    }))
    .sort((a, b) => variantKey(a.color, a.size).localeCompare(variantKey(b.color, b.size)));
  return JSON.stringify({
    ...form,
    parentSku: form.parentSku?.trim().toUpperCase() || "",
    colors: [...form.colors].sort(),
    sizes: [...form.sizes].sort(),
    images: form.images || [],
    variants,
  });
}

function defaultVariants(
  colors: string[],
  sizes: string[],
  price: number,
  onHand: number,
  existing: AdminInventoryVariantInput[] = [],
) {
  return buildCartesianVariants(colors, sizes, { price, onHand, status: "active" }, existing);
}

const CatalogGeneratorModal = dynamic(() => import("@/components/admin/CatalogGeneratorModal"), {
  ssr: false,
});

type InventoryForm = AdminInventoryItem;
type StockFilter = "all" | "low" | "out" | "available";
type ProductEditorForm = AdminInventoryProductInput;

const initialForm: InventoryForm = {
  sku: "",
  parentSku: "",
  productId: undefined,
  product: "",
  description: "",
  category: "Polo",
  collection: "",
  color: "",
  size: "",
  options: {},
  price: 0,
  image: "",
  onHand: 0,
  reserved: 0,
  sold: 0,
  lowStockThreshold: 3,
  status: "active",
  warehouse: "Principal",
};
const initialProductForm: ProductEditorForm = {
  product: "",
  summary: "",
  description: "",
  category: "Polo",
  collection: "",
  subcollection: "",
  seoSlug: "",
  seoTitle: "",
  seoDescription: "",
  image: "",
  images: [],
  basePrice: 35,
  colors: ["Blanco", "Negro"],
  sizes: ["S", "M", "L"],
  variants: defaultVariants(["Blanco", "Negro"], ["S", "M", "L"], 35, 10),
  defaultStock: 10,
  lowStockThreshold: 3,
  status: "active",
  warehouse: "Principal",
};

const itemsPerPage = 25;
const productTypes = ["Polo", "Polera", "Hoodie", "Pantalon", "Short", "Gorra", "Accesorio"];
const collectionOptions = ["SuperStars", "Romantic", "GYM", "Basicos", "Edicion limitada"];
const subcollectionOptions = ["Cristiano Ronaldo", "Lionel Messi", "Neymar", "Ronaldinho", "Girlfriend", "Gym Humor", "Romantic"];
const colorOptions = [
  { name: "Blanco", className: "bg-white ring-1 ring-zinc-300", hex: "#ffffff" },
  { name: "Negro", className: "bg-zinc-950", hex: "#09090b" },
  { name: "Melange", className: "bg-zinc-300", hex: "#d4d4d8" },
  { name: "Rojo", className: "bg-red-600", hex: "#dc2626" },
  { name: "Azul", className: "bg-blue-600", hex: "#2563eb" },
  { name: "Verde", className: "bg-emerald-600", hex: "#059669" },
  { name: "Rosa", className: "bg-pink-400", hex: "#f472b6" },
];
type ColorSwatch = { name: string; hex: string; className?: string };
const sizeOptions = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "STD"];
const initialCatalogOptions: CatalogOptions = {
  collection: "all",
  category: "all",
  includeOutOfStock: false,
  priceMode: "retail",
  wholesaleDiscount: 0,
  format: "social-horizontal",
  includeSku: false,
  includeVariants: true,
  previewReady: false,
};

export default function AdminInventoryPage() {
  useAdminPage({
    title: "Inventario",
    subtitle: "Administra productos, variantes y stock disponible desde un solo lugar.",
  });
  const [form, setForm] = useState<InventoryForm>(initialForm);
  const [productForm, setProductForm] = useState<ProductEditorForm>(initialProductForm);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editingParentSku, setEditingParentSku] = useState<string | null>(null);
  const [selectedParentSkus, setSelectedParentSkus] = useState<string[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);

  const listParams = {
    page: currentPage,
    pageSize: itemsPerPage,
    q: debouncedSearch.trim() || undefined,
    collection: collectionFilter,
    status: statusFilter,
    stock: stockFilter,
  };
  const inventoryQuery = useInventoryProductsQuery(listParams);
  const catalogQuery = useInventoryProductsCatalogQuery(isCatalogModalOpen);
  const invalidateInventory = useInvalidateInventory();
  useSyncAdminFetching(inventoryQuery.isFetching || catalogQuery.isFetching);

  const inventoryProducts = inventoryQuery.data?.products ?? [];
  const summary = inventoryQuery.data?.summary;
  const totalProducts = inventoryQuery.data?.total ?? inventoryProducts.length;
  const loading = inventoryQuery.isLoading;
  const [catalogOptions, setCatalogOptions] = useState<CatalogOptions>(initialCatalogOptions);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [customCollections, setCustomCollections] = useState<string[]>([]);
  const [customProductTypes, setCustomProductTypes] = useState<string[]>([]);
  const [customSubcollections, setCustomSubcollections] = useState<string[]>([]);
  const [customWarehouses, setCustomWarehouses] = useState<string[]>([]);
  const [customColorSwatches, setCustomColorSwatches] = useState<ColorSwatch[]>([]);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#6366f1");
  const [newSizeName, setNewSizeName] = useState("");
  const [productFormBaseline, setProductFormBaseline] = useState(() => serializeProductForm(initialProductForm));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const hasUnsavedProductChanges = serializeProductForm(productForm) !== productFormBaseline;

  async function fetchInventory() {
    setError(null);
    await invalidateInventory();
  }

  useEffect(() => {
    if (inventoryQuery.error) {
      setError(inventoryQuery.error.message);
    }
  }, [inventoryQuery.error]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, collectionFilter, statusFilter, stockFilter]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const endpoint = editingSku ? `/api/admin/inventory/${editingSku}` : "/api/admin/inventory";
      const payload = editingSku
        ? {
            productId: form.productId,
            parentSku: form.parentSku,
            product: form.product,
            summary: form.summary,
            description: form.description,
            category: form.category,
            collection: form.collection,
            color: form.color,
            size: form.size,
            options: form.options,
            price: form.price,
            image: form.image,
            onHand: form.onHand,
            reserved: form.reserved,
            sold: form.sold,
            lowStockThreshold: form.lowStockThreshold,
            status: form.status,
            warehouse: form.warehouse,
          }
        : form;

      const response = await fetch(endpoint, {
        method: editingSku ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "No se pudo guardar el SKU.");
      }

      await fetchInventory();
      setForm(initialForm);
      setEditingSku(null);
      setSelectedParentSkus([]);
      setIsModalOpen(false);
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo guardar el SKU.");
    } finally {
      setSaving(false);
    }
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploadingImage || saving) return;

    const nextErrors: Record<string, string> = {};
    const variants = productForm.variants || [];
    if (!productForm.product.trim()) nextErrors.product = "El nombre es obligatorio.";
    if (!variants.length) nextErrors.variants = "Agrega al menos una variante (color + talla).";
    for (const row of variants) {
      if (typeof row.price !== "number" || Number.isNaN(row.price) || row.price < 0) {
        nextErrors.variants = `Precio inválido en ${row.color} / ${row.size}.`;
        break;
      }
      if (typeof row.onHand !== "number" || Number.isNaN(row.onHand) || row.onHand < 0) {
        nextErrors.variants = `Stock inválido en ${row.color} / ${row.size}.`;
        break;
      }
    }
    const keys = variants.map((row) => variantKey(row.color, row.size));
    if (new Set(keys).size !== keys.length) {
      nextErrors.variants = "Hay variantes duplicadas (mismo color y talla).";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setError("Revisa los campos marcados antes de guardar.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/inventory/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "No se pudo guardar el producto.");
      }

      await fetchInventory();
      setProductForm(initialProductForm);
      setProductFormBaseline(serializeProductForm(initialProductForm));
      setFieldErrors({});
      setEditingParentSku(null);
      setEditingSku(null);
      setSelectedParentSkus([]);
      setIsModalOpen(false);
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(sku: string) {
    if (!window.confirm("¿Eliminar esta variante (SKU)?")) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/inventory/${sku}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo eliminar el SKU.");
      }

      await fetchInventory();
      if (editingSku === sku) {
        setEditingSku(null);
        setForm(initialForm);
        setIsModalOpen(false);
      }
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo eliminar el SKU.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct(product: AdminInventoryProduct) {
    const count = product.variants.length;
    if (
      !window.confirm(
        `¿Eliminar el producto "${product.product}" y sus ${count} variante${count === 1 ? "" : "s"}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      for (const variant of product.variants) {
        const response = await fetch(`/api/admin/inventory/${encodeURIComponent(variant.sku)}`, { method: "DELETE" });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || `No se pudo eliminar ${variant.sku}.`);
        }
      }

      await fetchInventory();
      setSelectedParentSkus((previous) => previous.filter((sku) => sku !== product.parentSku));
      setExpandedProducts((previous) => {
        if (!previous.has(product.parentSku)) return previous;
        const next = new Set(previous);
        next.delete(product.parentSku);
        return next;
      });
      if (editingParentSku === product.parentSku) {
        setEditingParentSku(null);
        setProductForm(initialProductForm);
        setProductFormBaseline(serializeProductForm(initialProductForm));
        setFieldErrors({});
        setIsModalOpen(false);
      }
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo eliminar el producto.");
      await fetchInventory();
    } finally {
      setSaving(false);
    }
  }

  /** Deletes without re-confirm when called from bulk flow (confirm already shown). */
  async function deleteProductVariants(product: AdminInventoryProduct) {
    for (const variant of product.variants) {
      const response = await fetch(`/api/admin/inventory/${encodeURIComponent(variant.sku)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || `No se pudo eliminar ${variant.sku}.`);
      }
    }
  }

  function toggleProductSelection(parentSku: string) {
    setSelectedParentSkus((previous) =>
      previous.includes(parentSku) ? previous.filter((sku) => sku !== parentSku) : [...previous, parentSku],
    );
  }

  function toggleSelectAllVisible(selectAll: boolean) {
    const visibleSkus = inventoryProducts.map((product) => product.parentSku);
    setSelectedParentSkus((previous) => {
      if (selectAll) {
        return Array.from(new Set([...previous, ...visibleSkus]));
      }
      const visible = new Set(visibleSkus);
      return previous.filter((sku) => !visible.has(sku));
    });
  }

  function toggleProductExpanded(parentSku: string) {
    setExpandedProducts((previous) => {
      const next = new Set(previous);
      if (next.has(parentSku)) next.delete(parentSku);
      else next.add(parentSku);
      return next;
    });
  }

  function clearInventoryFilters() {
    setSearch("");
    setCollectionFilter("all");
    setStatusFilter("all");
    setStockFilter("all");
  }

  function handleCreate() {
    setEditingSku(null);
    setEditingParentSku(null);
    setCustomColorSwatches([]);
    setNewColorName("");
    setNewColorHex("#6366f1");
    setNewSizeName("");
    setFieldErrors({});
    setUploadError(null);
    setProductForm(initialProductForm);
    setProductFormBaseline(serializeProductForm(initialProductForm));
    setIsModalOpen(true);
  }

  function pushUniqueOption(setter: Dispatch<SetStateAction<string[]>>, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return "";
    setter((previous) =>
      previous.some((item) => item.toLowerCase() === trimmed.toLowerCase()) ? previous : [...previous, trimmed],
    );
    return trimmed;
  }

  function handleAddProductType(name: string) {
    const type = pushUniqueOption(setCustomProductTypes, name);
    if (!type) return;
    setProductForm((previous) => ({ ...previous, category: type }));
  }

  function handleAddCollection(name: string) {
    const collection = pushUniqueOption(setCustomCollections, name);
    if (!collection) return;
    setProductForm((previous) => ({
      ...previous,
      collection,
      subcollection: previous.subcollection || deriveSubcollection(previous.product, collection),
    }));
  }

  function handleAddSubcollection(name: string) {
    const subcollection = pushUniqueOption(setCustomSubcollections, name);
    if (!subcollection) return;
    setProductForm((previous) => ({ ...previous, subcollection }));
  }

  function handleAddWarehouse(name: string) {
    const warehouse = pushUniqueOption(setCustomWarehouses, name);
    if (!warehouse) return;
    setProductForm((previous) => ({ ...previous, warehouse }));
  }

  function handleAddCustomColor() {
    const name = newColorName.trim();
    if (!name) return;

    const alreadyKnown =
      colorOptions.some((color) => color.name.toLowerCase() === name.toLowerCase()) ||
      customColorSwatches.some((color) => color.name.toLowerCase() === name.toLowerCase());

    if (!alreadyKnown) {
      setCustomColorSwatches((previous) => [...previous, { name, hex: newColorHex }]);
    } else {
      setCustomColorSwatches((previous) =>
        previous.map((color) => (color.name.toLowerCase() === name.toLowerCase() ? { ...color, hex: newColorHex } : color)),
      );
    }

    setProductForm((previous) => {
      if (previous.colors.includes(name)) {
        return previous;
      }
      const sizes = previous.sizes.length ? previous.sizes : ["STD"];
      const existing = previous.variants || [];
      const additions = sizes
        .filter((size) => !existing.some((row) => row.color === name && row.size === size))
        .map((size) => ({
          color: name,
          size,
          price: previous.basePrice,
          onHand: previous.defaultStock ?? 0,
          status: previous.status ?? "active",
        }));
      const variants = [...existing, ...additions];
      return {
        ...previous,
        colors: Array.from(new Set([...previous.colors, name])),
        sizes: syncOptionLists(variants).sizes.length ? syncOptionLists(variants).sizes : previous.sizes,
        variants,
      };
    });
    setNewColorName("");
  }

  function handleAddCustomSize() {
    const size = newSizeName.trim().toUpperCase();
    if (!size) return;
    setProductForm((previous) => {
      if (previous.sizes.includes(size)) return previous;
      const colors = previous.colors.length ? previous.colors : ["UNICO"];
      const existing = previous.variants || [];
      const additions = colors
        .filter((color) => !existing.some((row) => row.color === color && row.size === size))
        .map((color) => ({
          color,
          size,
          price: previous.basePrice,
          onHand: previous.defaultStock ?? 0,
          status: previous.status ?? "active",
        }));
      const variants = [...existing, ...additions];
      const options = syncOptionLists(variants);
      return {
        ...previous,
        sizes: Array.from(new Set([...previous.sizes, size])),
        colors: options.colors.length ? options.colors : previous.colors,
        variants,
      };
    });
    setNewSizeName("");
  }

  async function handleImageUpload(files: FileList | File[] | null) {
    const selectedFiles = files ? Array.from(files) : [];
    if (!selectedFiles.length) return;

    setUploadingImage(true);
    setUploadError(null);

    try {
      const uploadedUrls: string[] = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch("/api/admin/inventory/upload-image", {
          method: "POST",
          body: formData,
        });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error || "No se pudo subir la imagen.");
        }

        if (body.url) uploadedUrls.push(body.url);
      }

      if (!uploadedUrls.length) return;

      setProductForm((previous) => {
        const images = Array.from(new Set([...(previous.images || []), ...uploadedUrls]));
        return {
          ...previous,
          images,
          image: images[0] || "",
        };
      });
    } catch (caughtError: unknown) {
      setUploadError(caughtError instanceof Error ? caughtError.message : "No se pudo subir la imagen.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  function setPrimaryImage(url: string) {
    setProductForm((previous) => {
      const images = [url, ...(previous.images || []).filter((image) => image !== url)];
      return { ...previous, images, image: images[0] || "" };
    });
  }

  function removeProductImage(url: string) {
    setProductForm((previous) => {
      const images = (previous.images || []).filter((image) => image !== url);
      return { ...previous, images, image: images[0] || "" };
    });
  }

  function handleEditProduct(product: AdminInventoryProduct) {
    const activeVariants = product.variants.filter((variant) => (variant.status || "active") !== "archived");
    const sourceVariants = activeVariants.length ? activeVariants : product.variants;
    const colors = Array.from(new Set(sourceVariants.map((variant) => variant.color || "UNICO")));
    const sizes = Array.from(new Set(sourceVariants.map((variant) => variant.size || "STD")));
    const variants: AdminInventoryVariantInput[] = sourceVariants.map((variant) => ({
      color: variant.color || "UNICO",
      size: variant.size || "STD",
      price: variant.price ?? product.basePrice ?? 0,
      onHand: variant.onHand,
      status: variant.status ?? "active",
      sku: variant.sku,
    }));
    const firstVariant = sourceVariants[0];

    setEditingParentSku(product.parentSku);
    setNewColorName("");
    setNewColorHex("#6366f1");
    setNewSizeName("");
    setFieldErrors({});
    setUploadError(null);
    setCustomColorSwatches(
      colors
        .filter((color) => !colorOptions.some((option) => option.name === color))
        .map((color) => ({ name: color, hex: "#a1a1aa" })),
    );
    const nextForm: ProductEditorForm = {
      productId: product.productId,
      parentSku: product.parentSku,
      product: product.product,
      summary: product.summary || firstVariant?.summary || "",
      description: product.description || firstVariant?.description || "",
      category: product.category || firstVariant?.category || "Polo",
      collection: product.collection || "",
      subcollection: product.subcollection || deriveSubcollection(product.product, product.collection),
      seoSlug: product.seoSlug || firstVariant?.seoSlug || "",
      seoTitle: product.seoTitle || firstVariant?.seoTitle || "",
      seoDescription: product.seoDescription || firstVariant?.seoDescription || "",
      image: product.images[0] || firstVariant?.image || "",
      images: product.images.length ? product.images : firstVariant?.image ? [firstVariant.image] : [],
      basePrice: product.basePrice ?? 0,
      colors,
      sizes,
      variants,
      defaultStock: 10,
      lowStockThreshold: firstVariant?.lowStockThreshold ?? 3,
      status: product.status,
      warehouse: firstVariant?.warehouse || "Principal",
    };
    setProductForm(nextForm);
    setProductFormBaseline(serializeProductForm(nextForm));
    setIsModalOpen(true);
  }

  function handleEditSelected() {
    if (selectedParentSkus.length !== 1) return;
    const product = inventoryProducts.find((item) => item.parentSku === selectedParentSkus[0]);
    if (product) handleEditProduct(product);
  }

  async function handleDeleteSelected() {
    if (!selectedParentSkus.length) return;

    const selectedProducts = inventoryProducts.filter((product) => selectedParentSkus.includes(product.parentSku));
    if (!selectedProducts.length) return;

    if (selectedProducts.length === 1) {
      await handleDeleteProduct(selectedProducts[0]);
      return;
    }

    const variantCount = selectedProducts.reduce((acc, product) => acc + product.variants.length, 0);
    if (
      !window.confirm(
        `¿Eliminar ${selectedProducts.length} productos (${variantCount} variantes)? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      for (const product of selectedProducts) {
        await deleteProductVariants(product);
      }
      await fetchInventory();
      setSelectedParentSkus([]);
      setExpandedProducts((previous) => {
        const next = new Set(previous);
        for (const product of selectedProducts) next.delete(product.parentSku);
        return next;
      });
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron eliminar los productos.");
      await fetchInventory();
    } finally {
      setSaving(false);
    }
  }

  function handleCloseModal() {
    if (saving || uploadingImage) return;
    setEditingSku(null);
    setEditingParentSku(null);
    setCustomColorSwatches([]);
    setNewColorName("");
    setNewColorHex("#6366f1");
    setNewSizeName("");
    setFieldErrors({});
    setUploadError(null);
    setForm(initialForm);
    setProductForm(initialProductForm);
    setProductFormBaseline(serializeProductForm(initialProductForm));
    setIsModalOpen(false);
  }

  function toggleProductOption(field: "colors" | "sizes", value: string) {
    const current = productForm[field] || [];
    const removing = current.includes(value);
    const existingVariants = productForm.variants || [];

    if (removing) {
      const affected = existingVariants.filter((row) =>
        field === "colors" ? row.color === value : row.size === value,
      );
      if (affected.length) {
        const label = field === "colors" ? "color" : "talla";
        const ok = window.confirm(
          `Al quitar ${label} "${value}" se eliminarán ${affected.length} variante${affected.length === 1 ? "" : "s"} de este producto. ¿Continuar?`,
        );
        if (!ok) return;
      }
    }

    setProductForm((previous) => {
      const list = previous[field] || [];
      const isRemoving = list.includes(value);
      let variants = [...(previous.variants || [])];

      if (isRemoving) {
        variants = variants.filter((row) => (field === "colors" ? row.color !== value : row.size !== value));
      } else if (field === "colors") {
        const sizes = previous.sizes.length ? previous.sizes : ["STD"];
        for (const size of sizes) {
          if (!variants.some((row) => row.color === value && row.size === size)) {
            variants.push({
              color: value,
              size,
              price: previous.basePrice,
              onHand: previous.defaultStock ?? 0,
              status: previous.status ?? "active",
            });
          }
        }
      } else {
        const colors = previous.colors.length ? previous.colors : ["UNICO"];
        for (const color of colors) {
          if (!variants.some((row) => row.color === color && row.size === value)) {
            variants.push({
              color,
              size: value,
              price: previous.basePrice,
              onHand: previous.defaultStock ?? 0,
              status: previous.status ?? "active",
            });
          }
        }
      }

      const options = syncOptionLists(variants);
      return {
        ...previous,
        colors: field === "colors"
          ? isRemoving
            ? list.filter((item) => item !== value)
            : [...list, value]
          : options.colors.length
            ? options.colors
            : previous.colors,
        sizes: field === "sizes"
          ? isRemoving
            ? list.filter((item) => item !== value)
            : [...list, value]
          : options.sizes.length
            ? options.sizes
            : previous.sizes,
        variants,
      };
    });
  }

  function updateVariantField(key: string, patch: Partial<Pick<AdminInventoryVariantInput, "price" | "onHand" | "status">>) {
    setProductForm((previous) => ({
      ...previous,
      variants: (previous.variants || []).map((row) =>
        variantKey(row.color, row.size) === key ? { ...row, ...patch } : row,
      ),
    }));
  }

  function removeVariants(keys: string[], askConfirm = true) {
    if (!keys.length) return;
    const keySet = new Set(keys);
    const affected = (productForm.variants || []).filter((item) => keySet.has(variantKey(item.color, item.size)));
    if (!affected.length) return;
    if (askConfirm) {
      const label =
        affected.length === 1
          ? `¿Eliminar la variante ${affected[0].color} / ${affected[0].size}?`
          : `¿Eliminar ${affected.length} variantes seleccionadas?`;
      if (!window.confirm(label)) return;
    }

    setProductForm((previous) => {
      const variants = (previous.variants || []).filter((item) => !keySet.has(variantKey(item.color, item.size)));
      const options = syncOptionLists(variants);
      return {
        ...previous,
        variants,
        colors: options.colors,
        sizes: options.sizes,
      };
    });
  }

  function removeVariant(key: string) {
    removeVariants([key], true);
  }

  function bulkApplyPrice(keys: string[], price: number) {
    const selected = new Set(keys);
    setProductForm((previous) => ({
      ...previous,
      basePrice: price,
      variants: (previous.variants || []).map((row) =>
        selected.has(variantKey(row.color, row.size)) ? { ...row, price } : row,
      ),
    }));
  }

  function bulkApplyStock(keys: string[], stock: number) {
    const selected = new Set(keys);
    setProductForm((previous) => ({
      ...previous,
      variants: (previous.variants || []).map((row) =>
        selected.has(variantKey(row.color, row.size)) ? { ...row, onHand: stock } : row,
      ),
    }));
  }

  function addMissingCombinations() {
    setProductForm((previous) => {
      const colors = previous.colors.length ? previous.colors : ["UNICO"];
      const sizes = previous.sizes.length ? previous.sizes : ["STD"];
      const variants = buildCartesianVariants(
        colors,
        sizes,
        {
          price: previous.basePrice,
          onHand: previous.defaultStock ?? 0,
          status: previous.status ?? "active",
        },
        previous.variants || [],
      );
      return { ...previous, colors, sizes, variants };
    });
  }

  async function handleDeleteProductFromEditor() {
    if (!editingParentSku) return;
    const product = inventoryProducts.find((item) => item.parentSku === editingParentSku);
    if (!product) {
      setError("No se encontró el producto para eliminar.");
      return;
    }
    await handleDeleteProduct(product);
  }

  const collections = useMemo(
    () => summary?.collections ?? (Array.from(new Set(inventoryProducts.map((row) => row.collection).filter(Boolean))).sort() as string[]),
    [inventoryProducts, summary?.collections],
  );

  const availableCollections = useMemo(() => {
    const names = [...collectionOptions, ...collections, ...customCollections, productForm.collection].filter(
      (value): value is string => Boolean(value),
    );
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "es"));
  }, [collections, customCollections, productForm.collection]);

  const availableProductTypes = useMemo(() => {
    const fromInventory = inventoryProducts
      .map((row) => row.category)
      .filter((value): value is string => Boolean(value));
    const names = [...productTypes, ...fromInventory, ...customProductTypes, productForm.category].filter(
      (value): value is string => Boolean(value),
    );
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "es"));
  }, [customProductTypes, inventoryProducts, productForm.category]);

  const availableSubcollections = useMemo(() => {
    const fromInventory = inventoryProducts
      .map((row) => row.subcollection)
      .filter((value): value is string => Boolean(value));
    const names = [
      ...subcollectionOptions,
      ...fromInventory,
      ...customSubcollections,
      productForm.subcollection,
    ].filter((value): value is string => Boolean(value));
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "es"));
  }, [customSubcollections, inventoryProducts, productForm.subcollection]);

  const availableWarehouses = useMemo(() => {
    const fromInventory = inventoryProducts.flatMap((product) =>
      product.variants.map((variant) => variant.warehouse).filter((value): value is string => Boolean(value)),
    );
    const names = ["Principal", ...fromInventory, ...customWarehouses, productForm.warehouse].filter(
      (value): value is string => Boolean(value),
    );
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "es"));
  }, [customWarehouses, inventoryProducts, productForm.warehouse]);

  const availableColorSwatches = useMemo<ColorSwatch[]>(() => {
    const presets: ColorSwatch[] = colorOptions.map((color) => ({
      name: color.name,
      hex: color.hex,
      className: color.className,
    }));
    const extras = customColorSwatches.filter(
      (swatch) => !presets.some((preset) => preset.name.toLowerCase() === swatch.name.toLowerCase()),
    );
    return [...presets, ...extras];
  }, [customColorSwatches]);

  const categories = useMemo(
    () => summary?.categories ?? (Array.from(new Set(inventoryProducts.map((row) => row.category).filter(Boolean))).sort() as string[]),
    [inventoryProducts, summary?.categories],
  );

  const metrics = useMemo(
    () =>
      summary ?? {
        totalProducts: 0,
        totalSkus: 0,
        totalOnHand: 0,
        totalReserved: 0,
        totalSold: 0,
        totalAvailable: 0,
        lowStock: 0,
        outOfStock: 0,
        collections: [],
        categories: [],
      },
    [summary],
  );

  const totalPages = Math.max(1, Math.ceil(totalProducts / itemsPerPage));

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  const catalogSource = catalogQuery.data?.products ?? [];
  const catalogProducts = useMemo(() => {
    return catalogSource.filter((product) => {
      const matchesCollection = catalogOptions.collection === "all" || product.collection === catalogOptions.collection;
      const matchesCategory = catalogOptions.category === "all" || product.category === catalogOptions.category;
      const matchesStock = catalogOptions.includeOutOfStock || product.totalAvailable > 0;
      const matchesStatus = product.status === "active";

      return matchesCollection && matchesCategory && matchesStock && matchesStatus;
    });
  }, [catalogOptions.category, catalogOptions.collection, catalogOptions.includeOutOfStock, catalogSource]);

  const catalogFileName = useMemo(() => {
    const scope = [catalogOptions.collection, catalogOptions.category].filter((value) => value !== "all").join("-") || "catalogo";
    return `dgm-commerce-${scope}-${catalogOptions.format}.pdf`.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  }, [catalogOptions.category, catalogOptions.collection, catalogOptions.format]);

  const hasActiveFilters =
    Boolean(search.trim()) || collectionFilter !== "all" || statusFilter !== "all" || stockFilter !== "all";

  if (loading && !inventoryProducts.length) {
    return <AdminModuleSkeleton cards={3} />;
  }

  return (
    <>
      <div className="space-y-4">
        <InventoryMetricsBar
          metrics={metrics}
          activeStock={stockFilter}
          onFilterStock={(next) => setStockFilter(next)}
        />

        <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
          <InventoryToolbar
            search={search}
            onSearchChange={setSearch}
            collectionFilter={collectionFilter}
            onCollectionChange={setCollectionFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            stockFilter={stockFilter}
            onStockChange={setStockFilter}
            collections={collections}
            loading={loading || inventoryQuery.isFetching}
            saving={saving}
            selectionCount={selectedParentSkus.length}
            onSync={fetchInventory}
            onCatalog={() => setIsCatalogModalOpen(true)}
            onCreate={handleCreate}
            onEditSelected={selectedParentSkus.length === 1 ? handleEditSelected : undefined}
            onDeleteSelected={handleDeleteSelected}
            onClearSelection={() => setSelectedParentSkus([])}
            onClearFilters={clearInventoryFilters}
          />

          {error ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>
          ) : null}

          <div className="mt-4">
            <InventoryProductTable
              products={inventoryProducts}
              loading={inventoryQuery.isFetching}
              expanded={expandedProducts}
              onToggleExpand={toggleProductExpanded}
              selectedParentSkus={selectedParentSkus}
              onToggleSelect={toggleProductSelection}
              onToggleSelectAll={toggleSelectAllVisible}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onDeleteVariant={handleDelete}
              currentPage={currentPage}
              totalPages={totalPages}
              totalProducts={totalProducts}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onClearFilters={clearInventoryFilters}
              hasActiveFilters={hasActiveFilters}
              emptyInventory={!hasActiveFilters && totalProducts === 0}
              onCreate={handleCreate}
            />
          </div>
        </section>
      </div>

      <CrudModal
        isOpen={isModalOpen}
        title={editingParentSku ? "Editar producto" : "Nuevo producto"}
        subtitle={productForm.product.trim() || "Sin nombre"}
        headerMeta={
          <>
            <StatusBadge status={productForm.status ?? "active"} />
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-600">
              {(productForm.parentSku || "").trim() || "SKU pendiente"}
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-600">
              {(productForm.variants || []).length} variantes
            </span>
            {hasUnsavedProductChanges ? (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                Sin guardar
              </span>
            ) : null}
          </>
        }
        saving={saving || uploadingImage}
        hasUnsavedChanges={hasUnsavedProductChanges}
        maxWidthClass="max-w-5xl"
        dense
        submitLabel={editingParentSku ? "Guardar cambios" : "Crear producto"}
        footerStart={
          editingParentSku ? (
            <button
              type="button"
              onClick={handleDeleteProductFromEditor}
              disabled={saving || uploadingImage}
              className="h-9 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-50"
            >
              Eliminar producto
            </button>
          ) : null
        }
        onClose={handleCloseModal}
        onSubmit={handleProductSubmit}
      >
        {error && isModalOpen ? (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}
        <ProductEditor
          productForm={productForm}
          setProductForm={setProductForm}
          editingParentSku={editingParentSku}
          saving={saving}
          uploadingImage={uploadingImage}
          uploadError={uploadError}
          fieldErrors={fieldErrors}
          productTypes={availableProductTypes}
          sizeOptions={sizeOptions}
          availableSubcollections={availableSubcollections}
          availableCollections={availableCollections}
          availableWarehouses={availableWarehouses}
          availableColorSwatches={availableColorSwatches}
          onAddProductType={handleAddProductType}
          onAddCollection={handleAddCollection}
          onAddSubcollection={handleAddSubcollection}
          onAddWarehouse={handleAddWarehouse}
          newColorName={newColorName}
          setNewColorName={setNewColorName}
          newColorHex={newColorHex}
          setNewColorHex={setNewColorHex}
          onAddCustomColor={handleAddCustomColor}
          newSizeName={newSizeName}
          setNewSizeName={setNewSizeName}
          onAddCustomSize={handleAddCustomSize}
          imageInputRef={imageInputRef}
          onUploadImages={handleImageUpload}
          onSetPrimaryImage={setPrimaryImage}
          onRemoveImage={removeProductImage}
          onToggleOption={toggleProductOption}
          onUpdateVariant={updateVariantField}
          onRemoveVariant={removeVariant}
          onRemoveVariants={(keys) => removeVariants(keys, true)}
          onGenerateMissing={addMissingCombinations}
          onDeriveSubcollection={deriveSubcollection}
          onBulkApplyPrice={bulkApplyPrice}
          onBulkApplyStock={bulkApplyStock}
        />
      </CrudModal>

      {isCatalogModalOpen ? (
        <CatalogGeneratorModal
          products={catalogProducts}
          collections={collections}
          categories={categories}
          options={catalogOptions}
          fileName={catalogFileName}
          setOptions={setCatalogOptions}
          onClose={() => setIsCatalogModalOpen(false)}
        />
      ) : null}
    </>
  );
}
