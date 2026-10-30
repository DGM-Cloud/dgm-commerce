"use client";

import { MouseEvent as ReactMouseEvent, useMemo, useEffect, useRef, useState } from "react";
import { useAdminPage } from "@/components/admin/AdminPageContext";
import AdminModuleSkeleton from "@/components/admin/AdminModuleSkeleton";
import ContactModal from "@/components/admin/ContactModal";
import type { AdminContact } from "@/lib/admin-data";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronLeft, faChevronRight, faPen, faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useContactsQuery, useInvalidateContacts, useSyncAdminFetching } from "@/lib/admin-query";

const contactsPageSize = 50;

export default function AdminContactsPage() {
  useAdminPage({
    title: "Contactos",
    subtitle: "Bandeja unificada de consultas, soporte y oportunidades de venta.",
  });
  const invalidateContacts = useInvalidateContacts();
  const [editingContact, setEditingContact] = useState<AdminContact | null>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isContactFilterOpen, setIsContactFilterOpen] = useState(false);
  const [contactFilterSearch, setContactFilterSearch] = useState("");
  const [selectedContactFilters, setSelectedContactFilters] = useState<string[]>([]);
  const [isClientFilterOpen, setIsClientFilterOpen] = useState(false);
  const [clientFilterSearch, setClientFilterSearch] = useState("");
  const [selectedClientFilters, setSelectedClientFilters] = useState<string[]>([]);
  const [isDocumentFilterOpen, setIsDocumentFilterOpen] = useState(false);
  const [documentFilterSearch, setDocumentFilterSearch] = useState("");
  const [selectedDocumentFilters, setSelectedDocumentFilters] = useState<string[]>([]);
  const [isNumberFilterOpen, setIsNumberFilterOpen] = useState(false);
  const [numberFilterSearch, setNumberFilterSearch] = useState("");
  const [selectedNumberFilters, setSelectedNumberFilters] = useState<string[]>([]);
  const contactFilterRef = useRef<HTMLDivElement | null>(null);
  const clientFilterRef = useRef<HTMLDivElement | null>(null);
  const documentFilterRef = useRef<HTMLDivElement | null>(null);
  const numberFilterRef = useRef<HTMLDivElement | null>(null);

  const contactsQuery = useContactsQuery({
    page: currentPage,
    pageSize: contactsPageSize,
    q: debouncedSearch.trim() || undefined,
    client: selectedClientFilters,
    document: selectedDocumentFilters,
    number: selectedNumberFilters,
    contactedBy: selectedContactFilters,
  });
  useSyncAdminFetching(contactsQuery.isFetching);

  const tickets = contactsQuery.data?.contacts ?? [];
  const contactsTotal = contactsQuery.data?.total ?? tickets.length;
  const contactsFacets = contactsQuery.data?.facets;
  const loading = contactsQuery.isLoading;
  const contactsTotalPages = Math.max(1, Math.ceil(contactsTotal / contactsPageSize));

  const contactFilterOptions = useMemo(
    () => contactsFacets?.contactedBy ?? [],
    [contactsFacets?.contactedBy],
  );
  const clientFilterOptions = useMemo(() => contactsFacets?.clients ?? [], [contactsFacets?.clients]);
  const documentFilterOptions = useMemo(() => contactsFacets?.documents ?? [], [contactsFacets?.documents]);
  const numberFilterOptions = useMemo(() => contactsFacets?.numbers ?? [], [contactsFacets?.numbers]);

  useEffect(() => {
    if (contactsQuery.error) {
      setError(contactsQuery.error.message);
    }
  }, [contactsQuery.error]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedClientFilters, selectedDocumentFilters, selectedNumberFilters, selectedContactFilters]);

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, contactsTotalPages));
  }, [contactsTotalPages]);

  async function handleSubmitContact(payload: Omit<AdminContact, "id">, editingId: string | null) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(editingId ? `/api/admin/contacts/${editingId}` : "/api/admin/contacts", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "No se pudo guardar el contacto.");
      }

      await invalidateContacts();
      setEditingContact(null);
      setIsModalOpen(false);
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo guardar el contacto.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteContactById(id: string) {
    const response = await fetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo eliminar el contacto.");
    }

    await invalidateContacts();
    if (editingContact?.id === id) {
      setEditingContact(null);
      setIsModalOpen(false);
    }
  }

  function handleEdit(contact: AdminContact) {
    setEditingContact(contact);
    setIsModalOpen(true);
  }

  function handleCreate() {
    setEditingContact(null);
    setIsModalOpen(true);
  }

  function handleEditSelected() {
    if (selectedTicketIds.length !== 1) return;

    const contact = tickets.find((ticket) => ticket.id === selectedTicketIds[0]);
    if (!contact) return;

    handleEdit(contact);
  }

  async function handleDeleteSelected() {
    if (!selectedTicketIds.length) return;
    if (!window.confirm(`Eliminar ${selectedTicketIds.length} contacto(s)?`)) return;

    setSaving(true);
    setError(null);

    try {
      await Promise.all(selectedTicketIds.map((id) => deleteContactById(id)));
      setSelectedTicketIds([]);
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo eliminar el contacto.");
    } finally {
      setSaving(false);
    }
  }

  function handleRowSelection(ticketId: string, event: React.MouseEvent<HTMLElement>) {
    const withMultiSelect = event.ctrlKey || event.metaKey;

    if (withMultiSelect) {
      setSelectedTicketIds((previous) =>
        previous.includes(ticketId)
          ? previous.filter((id) => id !== ticketId)
          : [...previous, ticketId],
      );
      return;
    }

    setSelectedTicketIds([ticketId]);
  }

  function handleCloseModal() {
    if (saving) return;
    setEditingContact(null);
    setIsModalOpen(false);
  }

  function toggleContactFilter(value: string) {
    setSelectedContactFilters((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value],
    );
  }

  function clearContactFilter() {
    setSelectedContactFilters([]);
    setContactFilterSearch("");
  }

  function toggleClientFilter(value: string) {
    setSelectedClientFilters((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value],
    );
  }

  function clearClientFilter() {
    setSelectedClientFilters([]);
    setClientFilterSearch("");
  }

  function toggleDocumentFilter(value: string) {
    setSelectedDocumentFilters((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value],
    );
  }

  function clearDocumentFilter() {
    setSelectedDocumentFilters([]);
    setDocumentFilterSearch("");
  }

  function toggleNumberFilter(value: string) {
    setSelectedNumberFilters((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value],
    );
  }

  function clearNumberFilter() {
    setSelectedNumberFilters([]);
    setNumberFilterSearch("");
  }

  function renderHeaderFilter(
    label: string,
    isOpen: boolean,
    setOpen: (value: boolean | ((previous: boolean) => boolean)) => void,
    filterRef: React.RefObject<HTMLDivElement | null>,
    searchValue: string,
    setSearchValue: (value: string) => void,
    selectedValues: string[],
    toggleValue: (value: string) => void,
    clearValue: () => void,
    options: string[],
  ) {
    const visibleOptions = options.filter((option) => option.toLowerCase().includes(searchValue.trim().toLowerCase()));

    return (
      <div className="relative inline-block" ref={filterRef}>
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-zinc-600 transition hover:bg-zinc-100"
          title={`Filtrar por ${label.toLowerCase()}`}
        >
          <span>{label}</span>
          <FontAwesomeIcon icon={faChevronDown} className={["h-3 w-3 transition", isOpen ? "rotate-180" : ""].join(" ")} />
        </button>

        {isOpen ? (
          <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl">
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={`Buscar ${label.toLowerCase()}...`}
              className="w-full rounded-lg border border-zinc-300 px-2.5 py-2 text-xs text-zinc-800"
            />

            <div className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1">
              {visibleOptions.length ? (
                visibleOptions.map((value) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-xs text-zinc-700 hover:bg-zinc-100">
                    <input type="checkbox" checked={selectedValues.includes(value)} onChange={() => toggleValue(value)} className="h-3.5 w-3.5 rounded border-zinc-300" />
                    <span className="font-medium text-zinc-800">{value}</span>
                  </label>
                ))
              ) : (
                <p className="px-1.5 py-2 text-xs text-zinc-500">Sin resultados</p>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={clearValue}
                className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                Aplicar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const filteredTickets = tickets;

  if (loading && !tickets.length) {
    return <AdminModuleSkeleton cards={0} />;
  }

  return (
    <>
      <section className="mt-6 min-h-[36rem] overflow-visible rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold">Contactos recientes</h3>
          <div className="flex w-full flex-wrap items-center justify-start gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreate}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                aria-label="Agregar contacto"
                title="Agregar contacto"
              >
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleEditSelected}
                disabled={selectedTicketIds.length !== 1}
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-xl border transition",
                  selectedTicketIds.length === 1
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400",
                ].join(" ")}
                aria-label="Editar contacto seleccionado"
                title="Editar contacto"
              >
                <FontAwesomeIcon icon={faPen} className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={!selectedTicketIds.length}
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-xl border transition",
                  selectedTicketIds.length
                    ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400",
                ].join(" ")}
                aria-label="Eliminar contacto seleccionado"
                title="Eliminar contacto"
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              </button>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar contacto..."
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm sm:w-72"
              />
            </div>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm font-semibold text-red-700">{error}</p> : null}

        <div className="mt-4 overflow-visible">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-2">
                  {renderHeaderFilter(
                    "CLIENTE",
                    isClientFilterOpen,
                    setIsClientFilterOpen,
                    clientFilterRef,
                    clientFilterSearch,
                    setClientFilterSearch,
                    selectedClientFilters,
                    toggleClientFilter,
                    clearClientFilter,
                    clientFilterOptions,
                  )}
                </th>
                <th className="py-2">
                  {renderHeaderFilter(
                    "DOCUMENTO",
                    isDocumentFilterOpen,
                    setIsDocumentFilterOpen,
                    documentFilterRef,
                    documentFilterSearch,
                    setDocumentFilterSearch,
                    selectedDocumentFilters,
                    toggleDocumentFilter,
                    clearDocumentFilter,
                    documentFilterOptions,
                  )}
                </th>
                <th className="py-2">
                  {renderHeaderFilter(
                    "NUMERO",
                    isNumberFilterOpen,
                    setIsNumberFilterOpen,
                    numberFilterRef,
                    numberFilterSearch,
                    setNumberFilterSearch,
                    selectedNumberFilters,
                    toggleNumberFilter,
                    clearNumberFilter,
                    numberFilterOptions,
                  )}
                </th>
                <th className="py-2">
                  {renderHeaderFilter(
                    "CONTACTADO POR",
                    isContactFilterOpen,
                    setIsContactFilterOpen,
                    contactFilterRef,
                    contactFilterSearch,
                    setContactFilterSearch,
                    selectedContactFilters,
                    toggleContactFilter,
                    clearContactFilter,
                    contactFilterOptions,
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className={[
                    "cursor-pointer border-t border-zinc-100",
                    selectedTicketIds.includes(ticket.id) ? "bg-amber-50" : "",
                  ].join(" ")}
                  onClick={(event) => handleRowSelection(ticket.id, event)}
                  onDoubleClick={() => handleEdit(ticket)}
                >
                  <td className="py-4 pr-4 align-top font-semibold text-zinc-900">{ticket.client}</td>
                  <td className="py-4 pr-4 align-top text-zinc-600">{ticket.document}</td>
                  <td className="py-4 pr-4 align-top text-zinc-600">{ticket.cellphone}</td>
                  <td className="py-4 pr-4 align-top text-zinc-600">
                    {Array.isArray(ticket.contactedBy) ? ticket.contactedBy.join(", ") : ticket.contactedBy}
                    {ticket.contactedByOther ? ` (${ticket.contactedByOther})` : ""}
                  </td>
                </tr>
              ))}
              {!filteredTickets.length && !loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-zinc-500">
                    No hay contactos que coincidan con los filtros.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 text-sm text-zinc-600">
          <p>
            Mostrando {contactsTotal === 0 ? 0 : (currentPage - 1) * contactsPageSize + 1} -{" "}
            {Math.min(currentPage * contactsPageSize, contactsTotal)} de {contactsTotal} contactos
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-300 disabled:opacity-40"
              aria-label="Pagina anterior"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-24 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Pagina {currentPage} de {contactsTotalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === contactsTotalPages}
              onClick={() => setCurrentPage((previous) => Math.min(contactsTotalPages, previous + 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-300 disabled:opacity-40"
              aria-label="Pagina siguiente"
            >
              <FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      <ContactModal
        isOpen={isModalOpen}
        saving={saving}
        editingContact={editingContact}
        onClose={handleCloseModal}
        onSubmitContact={handleSubmitContact}
      />
    </>
  );
}

