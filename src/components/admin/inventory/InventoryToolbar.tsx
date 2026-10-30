import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faPlus, faRotate, faXmark } from "@fortawesome/free-solid-svg-icons";

type StockFilter = "all" | "low" | "out" | "available";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  collectionFilter: string;
  onCollectionChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  stockFilter: StockFilter;
  onStockChange: (value: StockFilter) => void;
  collections: string[];
  loading: boolean;
  saving: boolean;
  selectionCount: number;
  onSync: () => void;
  onCatalog: () => void;
  onCreate: () => void;
  onEditSelected?: () => void;
  onDeleteSelected?: () => void;
  onClearSelection?: () => void;
  onClearFilters: () => void;
};

export default function InventoryToolbar({
  search,
  onSearchChange,
  collectionFilter,
  onCollectionChange,
  statusFilter,
  onStatusChange,
  stockFilter,
  onStockChange,
  collections,
  loading,
  saving,
  selectionCount,
  onSync,
  onCatalog,
  onCreate,
  onEditSelected,
  onDeleteSelected,
  onClearSelection,
  onClearFilters,
}: Props) {
  const filtersActive = Boolean(search.trim()) || collectionFilter !== "all" || statusFilter !== "all" || stockFilter !== "all";
  const hasSelection = selectionCount > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-950 px-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
            Agregar producto
          </button>
          <button
            type="button"
            onClick={onSync}
            disabled={loading || saving}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faRotate} className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Sincronizar
          </button>
          <button
            type="button"
            onClick={onCatalog}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            <FontAwesomeIcon icon={faFilePdf} className="h-3.5 w-3.5" />
            Exportar catálogo
          </button>
        </div>

        {hasSelection ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-semibold tabular-nums text-zinc-700">
              {selectionCount} seleccionado{selectionCount === 1 ? "" : "s"}
            </span>
            {onEditSelected ? (
              <button
                type="button"
                onClick={onEditSelected}
                className="inline-flex h-9 items-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                Editar
              </button>
            ) : null}
            {onDeleteSelected ? (
              <button
                type="button"
                onClick={onDeleteSelected}
                disabled={saving}
                className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                Eliminar
              </button>
            ) : null}
            {onClearSelection ? (
              <button
                type="button"
                onClick={onClearSelection}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                Quitar selección
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nombre, SKU, color o talla…"
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-950"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={collectionFilter}
            onChange={(event) => onCollectionChange(event.target.value)}
            className="h-10 min-w-[9.5rem] rounded-lg border border-zinc-300 bg-white px-2.5 text-sm outline-none transition focus:border-zinc-950"
            aria-label="Colección"
          >
            <option value="all">Colección</option>
            {collections.map((collection) => (
              <option key={collection} value={collection}>
                {collection}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value)}
            className="h-10 min-w-[8.5rem] rounded-lg border border-zinc-300 bg-white px-2.5 text-sm outline-none transition focus:border-zinc-950"
            aria-label="Estado"
          >
            <option value="all">Estado</option>
            <option value="active">Activo</option>
            <option value="draft">Borrador</option>
            <option value="archived">Archivado</option>
          </select>
          <select
            value={stockFilter}
            onChange={(event) => onStockChange(event.target.value as StockFilter)}
            className="h-10 min-w-[9rem] rounded-lg border border-zinc-300 bg-white px-2.5 text-sm outline-none transition focus:border-zinc-950"
            aria-label="Disponibilidad"
          >
            <option value="all">Disponibilidad</option>
            <option value="available">Disponible</option>
            <option value="low">Stock bajo</option>
            <option value="out">Sin stock</option>
          </select>
          {filtersActive ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
              Limpiar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
