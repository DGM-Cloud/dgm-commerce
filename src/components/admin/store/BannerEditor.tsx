"use client";

import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFloppyDisk,
  faImage,
  faTrash,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import AdminModuleSkeleton from "@/components/admin/AdminModuleSkeleton";
import {
  createEmptyBanner,
  defaultStoreCms,
  sanitizeStoreCms,
  HERO_BACKGROUND_MODES,
  heroSlideSurfaceStyle,
  heroSlideTextColor,
  heroSlideUsesImage,
  normalizeHeroSlide,
  type HeroBackgroundMode,
  type StoreCms,
  type StoreHeroSlide,
} from "@/lib/store-cms";
import { useSaveStoreCms, useStoreCmsQuery, useSyncAdminFetching } from "@/lib/admin-query";

const LINK_PRESETS = [
  { value: "/products", label: "Catálogo" },
  { value: "/contact", label: "Contacto" },
  { value: "/", label: "Inicio" },
  { value: "/about", label: "Nosotros" },
] as const;

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5";

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
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-zinc-900">{label}</span>
      {children}
      {hint ? <span className="block text-xs leading-5 text-zinc-500">{hint}</span> : null}
    </label>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-2">
      <span className="min-w-[4.5rem] text-xs font-bold text-zinc-700">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 cursor-pointer rounded-lg border border-zinc-200 bg-white p-0.5"
        aria-label={label}
      />
      <input
        className={`${inputClass} max-w-[7.5rem]`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#18181b"
      />
    </label>
  );
}

function BannerPreview({
  slide,
  brandTitle,
  fallbackCta,
}: {
  slide: StoreHeroSlide;
  brandTitle: string;
  fallbackCta: string;
}) {
  const showImage = heroSlideUsesImage(slide);
  const surface = heroSlideSurfaceStyle(slide);
  const textColor = heroSlideTextColor(slide);

  return (
    <div
      className="relative min-h-[150px] overflow-hidden rounded-2xl px-5 py-5 sm:min-h-[170px]"
      style={
        {
          ...(showImage ? undefined : surface),
          color: textColor,
        } as CSSProperties
      }
    >
      {showImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />
        </>
      ) : null}
      <div className="relative max-w-xl space-y-2">
        {slide.kicker ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] opacity-60">{slide.kicker}</p>
        ) : null}
        <p className="font-serif text-xl font-semibold leading-tight sm:text-2xl">
          <span className="block opacity-40">{brandTitle}</span>
          <span className="mt-0.5 block">{slide.title || "Título del banner"}</span>
        </p>
        <p className="text-sm leading-6 opacity-75">{slide.text || "Mensaje corto"}</p>
        <span
          className="inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ backgroundColor: textColor, color: surfaceContrast(textColor) }}
        >
          {slide.ctaLabel?.trim() || fallbackCta}
        </span>
      </div>
    </div>
  );
}

function surfaceContrast(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "#18181b";
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#18181b" : "#ffffff";
}

export default function BannerEditor({ bannerId }: { bannerId: string }) {
  const router = useRouter();
  const storeQuery = useStoreCmsQuery();
  const saveCms = useSaveStoreCms();
  useSyncAdminFetching(storeQuery.isFetching || saveCms.isPending);

  const [cms, setCms] = useState<StoreCms>(defaultStoreCms());
  const [slide, setSlide] = useState<StoreHeroSlide | null>(null);
  const [index, setIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const loading = storeQuery.isLoading && !hydrated;
  const saving = saveCms.isPending;

  useEffect(() => {
    if (!storeQuery.data || (dirty && hydrated)) return;
    const nextCms = sanitizeStoreCms(storeQuery.data);
    setCms(nextCms);

    if (bannerId === "new") {
      if (!hydrated) {
        const draft = createEmptyBanner(nextCms.home.hero.slides.length);
        setSlide(draft);
        setIndex(nextCms.home.hero.slides.length);
        setDirty(true);
        setHydrated(true);
      }
      return;
    }

    const foundIndex = nextCms.home.hero.slides.findIndex((item) => item.id === bannerId);
    if (foundIndex < 0) {
      setError("No encontramos este banner.");
      setSlide(null);
      setHydrated(true);
      return;
    }
    setIndex(foundIndex);
    setSlide(normalizeHeroSlide(nextCms.home.hero.slides[foundIndex], foundIndex));
    setHydrated(true);
  }, [storeQuery.data, bannerId, dirty, hydrated]);

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

  const bannerNumber = useMemo(() => index + 1, [index]);

  function patchSlide(patch: Partial<StoreHeroSlide>) {
    setSlide((previous) => (previous ? normalizeHeroSlide({ ...previous, ...patch }, index) : previous));
    setDirty(true);
  }

  function setBackgroundMode(backgroundMode: HeroBackgroundMode) {
    patchSlide({ backgroundMode });
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/admin/inventory/upload-image", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo subir la imagen.");
      patchSlide({ backgroundMode: "image", image: payload.url });
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(event?: FormEvent) {
    event?.preventDefault();
    if (!slide || saving) return;
    setError(null);

    try {
      // Merge against React Query cache — no extra GET before PUT.
      const latest = storeQuery.data || cms;
      const slides = [...latest.home.hero.slides];
      if (bannerId === "new") {
        slides.push(slide);
      } else {
        const targetIndex = slides.findIndex((item) => item.id === slide.id);
        if (targetIndex >= 0) slides[targetIndex] = slide;
        else slides[index] = slide;
      }

      const nextCms: StoreCms = {
        ...latest,
        home: {
          ...latest.home,
          hero: {
            ...latest.home.hero,
            slides,
          },
        },
      };

      const saved = await saveCms.mutateAsync(nextCms);
      setCms(saved);
      setDirty(false);

      if (bannerId === "new") {
        const created = saved.home.hero.slides[saved.home.hero.slides.length - 1];
        router.replace(`/admin/store/banners/${created.id}`);
        return;
      }

      const refreshed = saved.home.hero.slides.find((item) => item.id === slide.id) || slide;
      setSlide(normalizeHeroSlide(refreshed, index));
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar.");
    }
  }

  async function handleDelete() {
    if (!slide || bannerId === "new") return;
    const ok = window.confirm("¿Eliminar este banner?");
    if (!ok) return;

    setError(null);
    try {
      const latest = storeQuery.data || cms;
      if (latest.home.hero.slides.length <= 1) {
        setError("Debe quedar al menos un banner.");
        return;
      }
      const slides = latest.home.hero.slides.filter((item) => item.id !== slide.id);
      const nextCms: StoreCms = {
        ...latest,
        home: {
          ...latest.home,
          hero: { ...latest.home.hero, slides },
        },
      };
      await saveCms.mutateAsync(nextCms);
      router.push("/admin/store");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar.");
    }
  }

  if (loading) {
    return <AdminModuleSkeleton cards={2} />;
  }

  if (!slide) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        <p className="font-semibold">{error || "Banner no encontrado."}</p>
        <Link href="/admin/store" className="mt-3 inline-block font-bold underline">
          Volver a Tienda online
        </Link>
      </div>
    );
  }

  const mode = slide.backgroundMode;
  const showPrimaryColor = mode === "solid" || mode === "gradient" || mode === "spotlight";
  const showSecondaryColor = mode === "gradient" || mode === "spotlight";

  const previewCard = (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2">
        <p className="text-xs font-bold text-zinc-900">Vista previa</p>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
          En vivo
        </span>
      </div>
      <div className="bg-[linear-gradient(180deg,#fafafa,white)] p-2.5">
        <BannerPreview
          slide={slide}
          brandTitle={cms.home.hero.title}
          fallbackCta={cms.home.hero.primaryCta.label}
        />
      </div>
    </section>
  );

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div className="sticky top-3 z-30">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 shadow-md">
          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/store"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              aria-label="Volver"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
            <div>
              <p className="text-sm font-bold text-zinc-900">
                {bannerId === "new" ? "Nuevo banner" : `Banner ${bannerNumber}`}
              </p>
              <p className="text-[11px] text-zinc-500">
                {dirty ? "Cambios sin guardar" : "Edita y mira el resultado al instante"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {bannerId !== "new" ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-40"
              >
                <FontAwesomeIcon icon={faTrash} />
                Eliminar
              </button>
            ) : null}
            <button
              type="submit"
              disabled={saving || !dirty}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
            >
              <FontAwesomeIcon icon={faFloppyDisk} />
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>
      ) : null}

      <div className="sticky top-[4.25rem] z-20 lg:hidden">
        <div className="max-h-[36vh] overflow-auto rounded-2xl border border-zinc-200/80 bg-white/95 p-1.5 shadow-md backdrop-blur">
          {previewCard}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-3">
          <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm sm:p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Textos</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Título">
                <input
                  className={inputClass}
                  value={slide.title}
                  onChange={(e) => patchSlide({ title: e.target.value })}
                  placeholder="Diseños que se notan"
                />
              </Field>
              <Field label="Etiqueta (opcional)">
                <input
                  className={inputClass}
                  value={slide.kicker}
                  onChange={(e) => patchSlide({ kicker: e.target.value })}
                  placeholder="Nueva temporada"
                />
              </Field>
            </div>
            <Field label="Mensaje corto">
              <textarea
                rows={2}
                className={inputClass}
                value={slide.text}
                onChange={(e) => patchSlide({ text: e.target.value })}
                placeholder="Piezas cómodas, listas para el día a día."
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Texto del botón">
                <input
                  className={inputClass}
                  value={slide.ctaLabel || ""}
                  onChange={(e) => patchSlide({ ctaLabel: e.target.value })}
                  placeholder={cms.home.hero.primaryCta.label}
                />
              </Field>
              <Field label="Al pulsar, ir a">
                <select
                  className={inputClass}
                  value={LINK_PRESETS.some((item) => item.value === slide.href) ? slide.href : "/products"}
                  onChange={(e) => patchSlide({ href: e.target.value })}
                >
                  {LINK_PRESETS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm sm:p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Fondo</p>
              <p className="mt-1 text-xs text-zinc-500">Elige un tipo y ajusta colores o imagen.</p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {HERO_BACKGROUND_MODES.map((option) => {
                const selected = mode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBackgroundMode(option.value)}
                    className={[
                      "rounded-xl border px-2 py-2 text-left transition",
                      selected ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-800",
                    ].join(" ")}
                  >
                    <p className="text-xs font-bold">{option.label}</p>
                    <p className={`text-[10px] ${selected ? "text-white/70" : "text-zinc-500"}`}>{option.hint}</p>
                  </button>
                );
              })}
            </div>

            {mode !== "image" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {showPrimaryColor ? (
                  <ColorRow
                    label={mode === "solid" ? "Color del fondo" : mode === "spotlight" ? "Luz" : "Color 1"}
                    value={slide.primaryColor}
                    onChange={(primaryColor) => patchSlide({ primaryColor })}
                  />
                ) : null}
                {showSecondaryColor ? (
                  <ColorRow
                    label={mode === "spotlight" ? "Base" : "Color 2"}
                    value={slide.secondaryColor}
                    onChange={(secondaryColor) => patchSlide({ secondaryColor })}
                  />
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <ColorRow
                label="Texto"
                value={slide.textColor}
                onChange={(textColor) => patchSlide({ textColor })}
              />
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Blanco", value: "#ffffff" },
                  { label: "Negro", value: "#18181b" },
                  { label: "Crema", value: "#fafaf9" },
                  { label: "Arena", value: "#e7e5e4" },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => patchSlide({ textColor: preset.value })}
                    className={[
                      "rounded-lg border px-2.5 py-1 text-[11px] font-bold transition",
                      slide.textColor === preset.value
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : "border-zinc-200 bg-white text-zinc-700",
                    ].join(" ")}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "image" ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-zinc-950 px-3 py-2 text-xs font-bold text-white">
                    <FontAwesomeIcon icon={faUpload} />
                    {uploading ? "Subiendo..." : "Subir foto"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={uploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadImage(file);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {slide.image ? (
                    <button
                      type="button"
                      onClick={() => patchSlide({ image: "" })}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700"
                    >
                      Quitar
                    </button>
                  ) : null}
                </div>
                <Field label="O pega un link">
                  <input
                    className={inputClass}
                    value={slide.image || ""}
                    onChange={(e) => patchSlide({ image: e.target.value, backgroundMode: "image" })}
                    placeholder="https://..."
                  />
                </Field>
                <div className="flex h-24 items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-zinc-50">
                  {slide.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={slide.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center text-xs text-zinc-400">
                      <FontAwesomeIcon icon={faImage} className="mb-1 h-4 w-4" />
                      <p>Sin imagen</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-[4.75rem] space-y-2">
            {previewCard}
            <p className="px-1 text-[11px] leading-4 text-zinc-500">
              La vista se mantiene visible mientras editas.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
