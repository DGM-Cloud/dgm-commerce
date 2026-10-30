type JsonRecord = Record<string, unknown>;

export interface SupabaseAuthUser {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: JsonRecord;
  app_metadata?: JsonRecord;
  updated_at?: string;
}

export interface SupabaseAuthSession {
  user: SupabaseAuthUser;
  access_token?: string;
  refresh_token?: string;
}

function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  return value.replace(/\/$/, "");
}

function getAnonKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return value;
}

function getServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return value;
}

async function parseSupabaseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      typeof payload?.msg === "string"
        ? payload.msg
        : typeof payload?.message === "string"
          ? payload.message
          : typeof payload?.error_description === "string"
            ? payload.error_description
            : "Supabase request failed.";
    throw new Error(message);
  }

  return payload as T;
}

export async function getSupabaseUserFromAccessToken(accessToken: string) {
  const anonKey = getAnonKey();
  const response = await fetch(`${getSupabaseUrl()}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  return parseSupabaseResponse<SupabaseAuthUser>(response);
}

export async function supabaseAuthRequest<T>(path: string, init: RequestInit = {}) {
  const anonKey = getAnonKey();
  const response = await fetch(`${getSupabaseUrl()}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  return parseSupabaseResponse<T>(response);
}

export async function supabaseAdminAuthRequest<T>(path: string, init: RequestInit = {}) {
  const serviceRoleKey = getServiceRoleKey();
  const response = await fetch(`${getSupabaseUrl()}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  return parseSupabaseResponse<T>(response);
}

export async function supabaseTableRequest<T>(path: string, init: RequestInit = {}) {
  const serviceRoleKey = getServiceRoleKey();
  const response = await fetch(`${getSupabaseUrl()}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  return parseSupabaseResponse<T>(response);
}
