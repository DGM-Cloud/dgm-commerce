"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faPlus, faStore, faTrash } from "@fortawesome/free-solid-svg-icons";
import AdminModuleSkeleton from "@/components/admin/AdminModuleSkeleton";
import {
  defaultStoreSettings,
  normalizeStoreSettings,
  sanitizeStoreCms,
  type StoreCms,
  type StoreSettings,
} from "@/lib/store-cms";
import { createOrderStatusDraft, orderStatusBadgeStyle } from "@/lib/order-status";
import { useSaveStoreCms, useStoreCmsQuery, useSyncAdminFetching } from "@/lib/admin-query";

const inputClass =
  "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5";

const TIMEZONES = [
  "America/Lima",
  "America/Bogota",
  "America/Mexico_City",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo",
  "America/New_York",
  "Europe/Madrid",
  "UTC",
];

const CURRENCIES = [
  { code: "PEN", symbol: "S/" },
  { code: "USD", symbol: "$" },
  { code: "MXN", symbol: "$" },
  { code: "COP", symbol: "$" },
  { code: "CLP", symbol: "$" },
  { code: "ARS", symbol: "$" },
  { code: "BRL", symbol: "R$" },
  { code: "EUR", symbol: "€" },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-zinc-900">{label}</span>
      {children}
      {hint ? <span className="block text-sm leading-6 text-zinc-500">{hint}</span> : null}
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="border-b border-zinc-100 pb-4">
        <h3 className="text-lg font-bold text-zinc-950">{title}</h3>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default function StoreSettingsStudio() {
  const storeQuery = useStoreCmsQuery();
  const saveCms = useSaveStoreCms();
  useSyncAdminFetching(storeQuery.isFetching || saveCms.isPending);

  const [cms, setCms] = useState<StoreCms | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings());
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const loading = storeQuery.isLoading && !hydrated;
  const saving = saveCms.isPending;

  useEffect(() => {
    if (!storeQuery.data || dirty) return;
    const next = sanitizeStoreCms(storeQuery.data);
    setCms(next);
    setSettings(normalizeStoreSettings(next.settings));
    setHydrated(true);
  }, [storeQuery.data, dirty]);

  useEffect(() => {
    if (storeQuery.error) {
      setError(storeQuery.error.message);
    }
  }, [storeQuery.error]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function patchSettings(updater: (previous: StoreSettings) => StoreSettings) {
    setSettings((previous) => normalizeStoreSettings(updater(previous)));
    setDirty(true);
    setSavedAt(null);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (saving || !dirty) return;
    setError(null);

    try {
      // Merge against React Query cache — no extra GET before PUT.
      const latest: StoreCms = storeQuery.data || cms!;
      const nextSettings = normalizeStoreSettings(settings);
      const nextCms: StoreCms = {
        ...latest,
        settings: nextSettings,
        theme: {
          ...latest.theme,
          logoText: latest.theme.logoText?.trim() || nextSettings.storeName,
          contact: {
            ...latest.theme.contact,
            blurb: nextSettings.tagline,
            whatsapp: nextSettings.whatsapp,
            whatsappNote: nextSettings.whatsappNote,
            email: nextSettings.email,
            instagram: nextSettings.instagram,
            tiktok: nextSettings.tiktok,
            facebook: nextSettings.facebook,
            locationLabel: nextSettings.locationLabel,
            description: nextSettings.description,
          },
        },
      };

      const saved = await saveCms.mutateAsync(nextCms);
      setCms(saved);
      setSettings(normalizeStoreSettings(saved.settings));
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }));
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar.");
    }
  }

  if (loading || !cms) {
    return <AdminModuleSkeleton cards={2} />;
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="sticky top-3 z-30 rounded-[1.5rem] border border-zinc-200 bg-white px-4 py-3 shadow-md sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-600">
              {dirty ? (
                <span className="font-semibold text-amber-700">Cambios sin guardar</span>
              ) : savedAt ? (
                <span className="font-semibold text-emerald-700">Guardado a las {savedAt}</span>
              ) : (
                <span>Datos legales, dominio, moneda y zona horaria.</span>
              )}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Nombre público, logo, eslogan y contacto se editan en{" "}
              <Link href="/admin/store" className="font-semibold text-zinc-800 underline">
                Tienda online
              </Link>
              . Los textos de Google, en el paso Google y redes.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faFloppyDisk} />
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
        {error ? <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Section
            title="Datos del negocio"
            description="Solo lo que no se edita en Tienda online ni en Google y redes."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre corto" hint="Iniciales o abreviatura interna.">
                <input
                  className={inputClass}
                  value={settings.shortName}
                  onChange={(e) => patchSettings((p) => ({ ...p, shortName: e.target.value }))}
                />
              </Field>
              <Field label="Razón social / nombre legal">
                <input
                  className={inputClass}
                  value={settings.legalName}
                  onChange={(e) => patchSettings((p) => ({ ...p, legalName: e.target.value }))}
                />
              </Field>
              <Field label="Dominio público" hint="Sin https://">
                <input
                  className={inputClass}
                  value={settings.domain}
                  placeholder="mitienda.com"
                  onChange={(e) => patchSettings((p) => ({ ...p, domain: e.target.value }))}
                />
              </Field>
              <Field label="Email de soporte" hint="Uso interno. El correo público va en Tienda online → Barra y pie.">
                <input
                  className={inputClass}
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => patchSettings((p) => ({ ...p, supportEmail: e.target.value }))}
                />
              </Field>
              <Field label="Dirección (opcional)">
                <input
                  className={inputClass}
                  value={settings.address}
                  onChange={(e) => patchSettings((p) => ({ ...p, address: e.target.value }))}
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Operación"
            description="Moneda, idioma y zona horaria con los que opera tu tienda."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Moneda">
                <select
                  className={inputClass}
                  value={settings.currency}
                  onChange={(e) => {
                    const code = e.target.value;
                    const match = CURRENCIES.find((item) => item.code === code);
                    patchSettings((p) => ({
                      ...p,
                      currency: code,
                      currencySymbol: match?.symbol || p.currencySymbol,
                    }));
                  }}
                >
                  {CURRENCIES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Símbolo de moneda">
                <input
                  className={inputClass}
                  value={settings.currencySymbol}
                  onChange={(e) => patchSettings((p) => ({ ...p, currencySymbol: e.target.value }))}
                />
              </Field>
              <Field label="Idioma (locale)">
                <select
                  className={inputClass}
                  value={settings.locale}
                  onChange={(e) => patchSettings((p) => ({ ...p, locale: e.target.value }))}
                >
                  <option value="es">Español (es)</option>
                  <option value="es-PE">Español Perú (es-PE)</option>
                  <option value="es-MX">Español México (es-MX)</option>
                  <option value="en">English (en)</option>
                </select>
              </Field>
              <Field label="Zona horaria">
                <select
                  className={inputClass}
                  value={settings.timezone}
                  onChange={(e) => patchSettings((p) => ({ ...p, timezone: e.target.value }))}
                >
                  {TIMEZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section
            title="Estados de pedido"
            description="Estados usados en Ventas. Marca cuáles suman a las métricas del dashboard (por defecto Pagado y Enviado)."
          >
            <div className="space-y-3">
              {settings.orderStatuses.map((status, index) => (
                <div
                  key={status.id}
                  className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3 sm:grid-cols-[minmax(0,1fr)_7rem_auto_auto]"
                >
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-zinc-500">Nombre</span>
                    <input
                      className={inputClass}
                      value={status.label}
                      disabled={status.locked}
                      onChange={(event) => {
                        const label = event.target.value;
                        patchSettings((previous) => ({
                          ...previous,
                          orderStatuses: previous.orderStatuses.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, label } : item,
                          ),
                        }));
                      }}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-zinc-500">Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={status.color}
                        onChange={(event) => {
                          const color = event.target.value;
                          patchSettings((previous) => ({
                            ...previous,
                            orderStatuses: previous.orderStatuses.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, color } : item,
                            ),
                          }));
                        }}
                        className="h-12 w-14 cursor-pointer rounded-xl border border-zinc-200 bg-white p-1"
                        aria-label={`Color de ${status.label}`}
                      />
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-bold"
                        style={orderStatusBadgeStyle(status.color)}
                      >
                        {status.label || "Estado"}
                      </span>
                    </div>
                  </label>
                  <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-zinc-700">
                    <input
                      type="checkbox"
                      checked={status.countsInMetrics}
                      onChange={(event) => {
                        const countsInMetrics = event.target.checked;
                        patchSettings((previous) => ({
                          ...previous,
                          orderStatuses: previous.orderStatuses.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, countsInMetrics } : item,
                          ),
                        }));
                      }}
                      className="h-4 w-4 accent-zinc-950"
                    />
                    En métricas
                  </label>
                  <div className="flex items-end justify-end pb-1">
                    {status.locked ? (
                      <span className="rounded-full bg-zinc-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-600">
                        Base
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          patchSettings((previous) => ({
                            ...previous,
                            orderStatuses: previous.orderStatuses.filter((_, itemIndex) => itemIndex !== index),
                          }))
                        }
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                        aria-label={`Eliminar ${status.label}`}
                      >
                        <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  patchSettings((previous) => ({
                    ...previous,
                    orderStatuses: [
                      ...previous.orderStatuses,
                      createOrderStatusDraft(`Estado ${previous.orderStatuses.length + 1}`),
                    ],
                  }))
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-950"
              >
                <FontAwesomeIcon icon={faPlus} />
                Agregar estado
              </button>
            </div>
          </Section>
        </div>

        <aside className="space-y-3 xl:sticky xl:top-[5.5rem] xl:self-start">
          <div className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">Vista rápida</p>
            </div>
            <div className="space-y-3 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                  <FontAwesomeIcon icon={faStore} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-zinc-950">{settings.legalName || settings.shortName || "Tu negocio"}</p>
                  <p className="truncate text-xs text-zinc-500">{settings.domain || "tudominio.com"}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-zinc-50 px-3 py-3 text-xs text-zinc-600">
                <p>
                  <span className="font-bold text-zinc-900">Moneda:</span> {settings.currencySymbol}{" "}
                  {settings.currency}
                </p>
                <p className="mt-1">
                  <span className="font-bold text-zinc-900">Zona:</span> {settings.timezone}
                </p>
                <p className="mt-1">
                  <span className="font-bold text-zinc-900">Idioma:</span> {settings.locale}
                </p>
                <p className="mt-1 truncate">
                  <span className="font-bold text-zinc-900">Soporte:</span> {settings.supportEmail || "—"}
                </p>
              </div>
            </div>
          </div>
          <p className="px-1 text-xs leading-5 text-zinc-500">
            Nombre público, logo, eslogan, contacto y SEO se editan en Tienda online.
          </p>
        </aside>
      </div>
    </form>
  );
}
