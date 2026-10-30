import { AUTH_COOKIE_NAME, createSessionUser, mergeSessionUser, parseSessionUser, type AuthProvider, type AuthUser, type UserRole } from "@/lib/auth";
import { supabaseAdminAuthRequest, supabaseAuthRequest, supabaseTableRequest, type SupabaseAuthSession, type SupabaseAuthUser } from "@/backend/supabase.server";

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  provider: AuthProvider | null;
  terms_accepted_at: string | null;
  marketing_opt_in: boolean | null;
  updated_at: string | null;
}

interface UserRoleRow {
  roles: {
    name: UserRole;
  } | null;
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function metadataText(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}

export function createSessionUserFromSupabase(input: {
  user: SupabaseAuthUser;
  profile?: ProfileRow | null;
  provider?: AuthProvider;
  roles?: UserRole[];
  rememberMe?: boolean;
}): AuthUser {
  const profileName = input.profile?.full_name ?? "";
  const metadata = input.user.user_metadata;
  const metadataFullName =
    metadataText(metadata, "full_name") ||
    metadataText(metadata, "name") ||
    [metadataText(metadata, "given_name"), metadataText(metadata, "family_name")].filter(Boolean).join(" ");
  const names = splitFullName(profileName || metadataFullName);
  const firstName = input.profile?.full_name ? names.firstName : metadataText(metadata, "first_name") || names.firstName;
  const lastName = input.profile?.full_name ? names.lastName : metadataText(metadata, "last_name") || names.lastName;

  return {
    ...createSessionUser({
      email: input.profile?.email ?? input.user.email ?? "",
      firstName,
      lastName,
      phone: input.profile?.phone ?? input.user.phone ?? "",
      provider: input.profile?.provider ?? input.provider ?? "email",
      roles: input.roles?.length ? input.roles : ["cliente"],
      rememberMe: input.rememberMe,
    }),
    id: input.user.id,
    updatedAt: input.profile?.updated_at ?? input.user.updated_at ?? new Date().toISOString(),
  };
}

export async function getProfile(userId: string) {
  const profiles = await supabaseTableRequest<ProfileRow[]>(`/profiles?id=eq.${encodeURIComponent(userId)}&limit=1`);
  return profiles[0] ?? null;
}

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const rows = await supabaseTableRequest<UserRoleRow[]>(
    `/user_roles?user_id=eq.${encodeURIComponent(userId)}&select=roles(name)`
  );
  const roles = rows.map((row) => row.roles?.name).filter((role): role is UserRole => Boolean(role));
  return roles.length ? roles : ["cliente"];
}

export async function upsertProfile(user: AuthUser, options?: { termsAccepted?: boolean; marketingOptIn?: boolean }) {
  const [profile] = await supabaseTableRequest<ProfileRow[]>("/profiles?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify([
      {
        id: user.id,
        full_name: user.displayName,
        email: user.email,
        phone: user.phone || null,
        provider: user.provider,
        terms_accepted_at: options?.termsAccepted ? new Date().toISOString() : undefined,
        marketing_opt_in: options?.marketingOptIn ?? undefined,
        is_active: true,
        last_login_at: new Date().toISOString(),
      },
    ]),
  });

  return profile;
}

export async function signInWithSupabase(input: { email: string; password: string; rememberMe?: boolean; provider?: AuthProvider }) {
  const session = await supabaseAuthRequest<SupabaseAuthSession>("/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
    }),
  });
  const profile = await getProfile(session.user.id);
  const roles = await getUserRoles(session.user.id);
  const user = createSessionUserFromSupabase({
    user: session.user,
    profile,
    roles,
    provider: input.provider ?? "email",
    rememberMe: input.rememberMe,
  });
  await upsertProfile(user);
  return user;
}

export async function signUpWithSupabase(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  rememberMe?: boolean;
  provider?: AuthProvider;
  termsAccepted?: boolean;
  marketingOptIn?: boolean;
}) {
  if (!input.termsAccepted) {
    throw new Error("Debes aceptar los terminos y condiciones para crear tu cuenta.");
  }

  const fullName = [input.firstName, input.lastName].filter(Boolean).join(" ").trim();
  const session = await supabaseAuthRequest<SupabaseAuthSession>("/signup", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      phone: input.phone || undefined,
      data: {
        first_name: input.firstName ?? "",
        last_name: input.lastName ?? "",
        full_name: fullName,
        provider: input.provider ?? "email",
        terms_accepted: true,
        marketing_opt_in: input.marketingOptIn ?? false,
      },
    }),
  });
  const user = createSessionUserFromSupabase({
    user: session.user,
    roles: ["cliente"],
    provider: input.provider ?? "email",
    rememberMe: input.rememberMe,
  });
  await upsertProfile(user, { termsAccepted: true, marketingOptIn: input.marketingOptIn ?? false });
  return user;
}

export async function establishSessionFromOAuthUser(
  supabaseUser: SupabaseAuthUser,
  options?: {
    provider?: AuthProvider;
    rememberMe?: boolean;
    termsAccepted?: boolean;
    marketingOptIn?: boolean;
  },
) {
  const profile = await getProfile(supabaseUser.id);
  const roles = await getUserRoles(supabaseUser.id);
  const provider = options?.provider ?? resolveAuthProviderFromSupabaseUser(supabaseUser);
  const user = createSessionUserFromSupabase({
    user: supabaseUser,
    profile,
    roles,
    provider,
    rememberMe: options?.rememberMe ?? true,
  });

  await upsertProfile(user, {
    termsAccepted: options?.termsAccepted ?? true,
    marketingOptIn: options?.marketingOptIn ?? false,
  });

  return user;
}

export function resolveAuthProviderFromSupabaseUser(supabaseUser: SupabaseAuthUser): AuthProvider {
  const appProvider = supabaseUser.app_metadata?.provider;
  if (appProvider === "google" || appProvider === "facebook" || appProvider === "apple") {
    return appProvider;
  }

  const userProvider = supabaseUser.user_metadata?.provider;
  if (userProvider === "google" || userProvider === "facebook" || userProvider === "apple") {
    return userProvider;
  }

  return "email";
}

export async function updateSupabaseProfile(currentUser: AuthUser, patch: Partial<Pick<AuthUser, "email" | "firstName" | "lastName" | "phone">>) {
  const user = mergeSessionUser(currentUser, patch);

  await supabaseAdminAuthRequest(`/admin/users/${encodeURIComponent(user.id)}`, {
    method: "PUT",
    body: JSON.stringify({
      email: user.email,
      phone: user.phone || undefined,
      user_metadata: {
        first_name: user.firstName,
        last_name: user.lastName,
        full_name: user.displayName,
      },
    }),
  });
  await upsertProfile(user);

  return user;
}

export { AUTH_COOKIE_NAME, createSessionUser, mergeSessionUser, parseSessionUser };
