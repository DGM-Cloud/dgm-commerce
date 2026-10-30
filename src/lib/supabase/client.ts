import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { storageKeys } from "@/config/brand";

const STORAGE_KEY = storageKeys.supabaseAuth;

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        flowType: "pkce",
        autoRefreshToken: false,
        // Required so the PKCE code verifier survives the Google redirect.
        persistSession: true,
        detectSessionInUrl: false,
        storageKey: STORAGE_KEY,
      },
    });
  }

  return browserClient;
}

export async function clearSupabaseBrowserSession() {
  const client = createSupabaseBrowserClient();
  await client.auth.signOut({ scope: "local" });
}
