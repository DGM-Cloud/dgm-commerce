"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { AuthUser } from "@/lib/auth";
import {
  buildOAuthCallbackUrl,
  oauthProviderLabel,
  type OAuthProvider,
  type OAuthSignInOptions,
} from "@/lib/oauth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthCredentials {
	email: string;
	password: string;
	rememberMe?: boolean;
	firstName?: string;
	lastName?: string;
	phone?: string;
	termsAccepted?: boolean;
	marketingOptIn?: boolean;
}

interface AuthContextValue {
	user: AuthUser | null;
	loading: boolean;
	signIn: (credentials: AuthCredentials) => Promise<AuthUser>;
	signUp: (credentials: AuthCredentials) => Promise<AuthUser>;
	signInWithOAuth: (provider: OAuthProvider, options?: OAuthSignInOptions) => Promise<void>;
	signInWithGoogle: (options?: OAuthSignInOptions) => Promise<void>;
	signInWithFacebook: (options?: OAuthSignInOptions) => Promise<void>;
	updateProfile: (payload: Partial<Pick<AuthUser, "email" | "firstName" | "lastName" | "phone">>) => Promise<AuthUser>;
	signOut: () => Promise<void>;
	refreshSession: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(init?.headers || {}),
		},
		credentials: "same-origin",
		cache: "no-store",
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(payload.error || "No pudimos completar la solicitud.");
	}

	return payload as T;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);
	const pathname = usePathname();
	const previousPathnameRef = useRef(pathname);

	const refreshSession = async () => {
		try {
			const payload = await requestJson<{ user: AuthUser | null }>("/api/auth/me", { method: "GET" });
			setUser(payload.user);
			return payload.user;
		} catch {
			setUser(null);
			return null;
		}
	};

	useEffect(() => {
		refreshSession().finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		if (previousPathnameRef.current === "/auth/callback" && pathname !== "/auth/callback") {
			refreshSession();
		}

		previousPathnameRef.current = pathname;
	}, [pathname]);

	const signIn = async (credentials: AuthCredentials) => {
		const payload = await requestJson<{ user: AuthUser }>("/api/auth/login", {
			method: "POST",
			body: JSON.stringify(credentials),
		});

		setUser(payload.user);
		return payload.user;
	};

	const signUp = async (credentials: AuthCredentials) => {
		const payload = await requestJson<{ user: AuthUser }>("/api/auth/register", {
			method: "POST",
			body: JSON.stringify(credentials),
		});

		setUser(payload.user);
		return payload.user;
	};

	const signInWithOAuth = async (provider: OAuthProvider, options?: OAuthSignInOptions) => {
		const supabase = createSupabaseBrowserClient();
		const redirectTo = buildOAuthCallbackUrl(provider, options);
		const oauthOptions: {
			redirectTo: string;
			skipBrowserRedirect: true;
			queryParams?: Record<string, string>;
			scopes?: string;
		} = {
			redirectTo,
			skipBrowserRedirect: true,
		};

		if (provider === "google") {
			oauthOptions.queryParams = {
				access_type: "offline",
				prompt: "consent",
			};
		}

		if (provider === "facebook") {
			oauthOptions.scopes = "email,public_profile";
		}

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider,
			options: oauthOptions,
		});

		if (error) {
			throw new Error(error.message || `No se pudo iniciar sesión con ${oauthProviderLabel(provider)}.`);
		}

		if (!data.url) {
			throw new Error(`No se recibió la URL de autenticación de ${oauthProviderLabel(provider)}.`);
		}

		window.location.assign(data.url);
	};

	const signInWithGoogle = (options?: OAuthSignInOptions) => signInWithOAuth("google", options);
	const signInWithFacebook = (options?: OAuthSignInOptions) => signInWithOAuth("facebook", options);

	const updateProfile = async (
		payload: Partial<Pick<AuthUser, "email" | "firstName" | "lastName" | "phone">>
	) => {
		const response = await requestJson<{ user: AuthUser }>("/api/account/profile", {
			method: "PATCH",
			body: JSON.stringify(payload),
		});

		setUser(response.user);
		return response.user;
	};

	const signOut = async () => {
		await requestJson<{ ok: true }>("/api/auth/logout", { method: "POST" });
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				signIn,
				signUp,
				signInWithOAuth,
				signInWithGoogle,
				signInWithFacebook,
				updateProfile,
				signOut,
				refreshSession,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}

	return context;
}
