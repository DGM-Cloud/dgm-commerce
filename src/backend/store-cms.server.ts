import { revalidatePath } from "next/cache";
import { supabaseTableRequest } from "@/backend/supabase.server";
import {
  defaultStoreCms,
  mergeStoreCms,
  packHomeForStorage,
  sanitizeStoreCms,
  type StoreCms,
} from "@/lib/store-cms";

type StoreCmsRow = {
  id: string;
  seo: unknown;
  home: unknown;
  updated_at: string | null;
};

async function fetchStoreCmsRow(): Promise<StoreCmsRow | null> {
  try {
    const rows = await supabaseTableRequest<StoreCmsRow[]>(
      "/store_cms?id=eq.default&select=id,seo,home,updated_at&limit=1",
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getStoreCms(): Promise<StoreCms> {
  const row = await fetchStoreCmsRow();
  if (!row) return defaultStoreCms();

  return sanitizeStoreCms(
    mergeStoreCms({
      seo: row.seo,
      home: row.home,
      updatedAt: row.updated_at,
    }),
  );
}

export async function updateStoreCms(input: StoreCms): Promise<StoreCms> {
  const sanitized = sanitizeStoreCms(input);

  const [row] = await supabaseTableRequest<StoreCmsRow[]>("/store_cms?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify([
      {
        id: "default",
        seo: sanitized.seo,
        home: packHomeForStorage(sanitized),
      },
    ]),
  });

  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin/store");
  revalidatePath("/admin/settings");
  revalidatePath("/products");
  revalidatePath("/contact");
  revalidatePath("/about");
  revalidatePath("/faq");
  revalidatePath("/terms");

  return sanitizeStoreCms(
    mergeStoreCms({
      seo: row?.seo ?? sanitized.seo,
      home: row?.home ?? packHomeForStorage(sanitized),
      updatedAt: row?.updated_at ?? new Date().toISOString(),
    }),
  );
}
