import { brand, storageKeys } from "@/config/brand";

export const AUTH_COOKIE_NAME = storageKeys.sessionCookie;

export type AuthProvider = "email" | "google" | "facebook" | "apple";
export type UserRole = "guest" | "cliente" | "vendedor" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  initials: string;
  provider: AuthProvider;
  phone: string;
  roles: UserRole[];
  rememberMe: boolean;
  updatedAt: string;
}

export interface SessionUserInput {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  provider?: AuthProvider;
  roles?: UserRole[];
  rememberMe?: boolean;
}

export interface SessionUserPatch {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

const DEFAULT_EMAIL = `cliente@${brand.domain}`;

function trimText(value: string | undefined | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function deriveNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] || "cliente";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  return cleaned ? titleCase(cleaned) : "Cliente";
}

function buildInitials(firstName: string, lastName: string): string {
  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.trim();
  return initials ? initials.toUpperCase() : "YY";
}

function normalizeEmail(email: string | undefined | null): string {
  const sanitizedEmail = trimText(email);
  return sanitizedEmail || DEFAULT_EMAIL;
}

export function createSessionUser(input: SessionUserInput): AuthUser {
  const email = normalizeEmail(input.email);
  const firstName = trimText(input.firstName) || deriveNameFromEmail(email);
  const lastName = trimText(input.lastName);
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || firstName;

  return {
    id: crypto.randomUUID(),
    email,
    firstName,
    lastName,
    displayName,
    initials: buildInitials(firstName, lastName),
    provider: input.provider ?? "email",
    phone: trimText(input.phone),
    roles: input.roles?.length ? input.roles : ["cliente"],
    rememberMe: input.rememberMe ?? true,
    updatedAt: new Date().toISOString(),
  };
}

export function mergeSessionUser(current: AuthUser, patch: SessionUserPatch): AuthUser {
  const nextFirstName = patch.firstName !== undefined ? trimText(patch.firstName) || current.firstName : current.firstName;
  const nextLastName = patch.lastName !== undefined ? trimText(patch.lastName) : current.lastName;
  const nextEmail = patch.email !== undefined ? normalizeEmail(patch.email) : current.email;
  const nextPhone = patch.phone !== undefined ? trimText(patch.phone) : current.phone;
  const nextDisplayName = [nextFirstName, nextLastName].filter(Boolean).join(" ").trim() || nextFirstName;

  return {
    ...current,
    email: nextEmail,
    firstName: nextFirstName,
    lastName: nextLastName,
    displayName: nextDisplayName,
    initials: buildInitials(nextFirstName, nextLastName),
    phone: nextPhone,
    updatedAt: new Date().toISOString(),
  };
}

export function parseSessionUser(rawValue: string | undefined | null): AuthUser | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as AuthUser;
    return parsedValue && typeof parsedValue === "object" ? parsedValue : null;
  } catch {
    return null;
  }
}
