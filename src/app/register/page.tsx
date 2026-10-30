"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";

import { sanitizeAuthRedirect } from "@/lib/auth-redirect";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = sanitizeAuthRedirect(searchParams.get("next"));
  const { user, loading, signUp, signInWithGoogle, signInWithFacebook } = useAuth();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTarget);
    }
  }, [loading, user, router, redirectTarget]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!termsAccepted) {
      setError("Debes aceptar los terminos y condiciones para crear tu cuenta.");
      return;
    }

    setSubmitting(true);

    try {
      await signUp({
        email,
        firstName,
        lastName,
        password,
        rememberMe: true,
        termsAccepted,
        marketingOptIn,
      });
      router.replace(redirectTarget);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No pudimos crear tu cuenta.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!termsAccepted) {
      setError("Debes aceptar los terminos y condiciones para crear tu cuenta.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await signInWithGoogle({
        next: redirectTarget,
        termsAccepted: true,
        marketingOptIn,
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No pudimos crear tu cuenta con Google.");
      setSubmitting(false);
    }
  };

  const handleFacebookSignIn = async () => {
    if (!termsAccepted) {
      setError("Debes aceptar los terminos y condiciones para crear tu cuenta.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await signInWithFacebook({
        next: redirectTarget,
        termsAccepted: true,
        marketingOptIn,
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No pudimos crear tu cuenta con Facebook.");
      setSubmitting(false);
    }
  };

  if (loading || user) return <div className="min-h-screen bg-[#f5efe6]" />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10 lg:px-8">
      <section className="w-full max-w-2xl rounded-[2rem] border border-zinc-200 bg-white px-6 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.08)] lg:px-10 lg:py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Cuenta</p>
            <h2 className="mt-3 text-3xl font-black text-zinc-950">Crea tu cuenta</h2>
            <p className="mt-2 text-sm text-zinc-600">Registrarse es muy facil.</p>
          </div>
          <Link href="/login" className="rounded-full border border-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-950 hover:text-white">
            Inicia sesion
          </Link>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-zinc-800">Direccion de correo electronico *</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3.5 text-zinc-950 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-950"
              placeholder="tu@email.com"
              required
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-800">Nombres *</span>
              <input
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="w-full rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3.5 text-zinc-950 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-950"
                placeholder="Juan"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-800">Apellidos *</span>
              <input
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="w-full rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3.5 text-zinc-950 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-950"
                placeholder="Perez"
                required
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-zinc-800">Contrasena *</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3.5 text-zinc-950 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-950"
              placeholder="********"
              minLength={6}
              required
            />
          </label>

          <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <label className="flex gap-3 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-300"
                required
              />
              <span>
                Acepto los{" "}
                <Link href="/terms" className="font-semibold text-zinc-950 underline underline-offset-2">
                  terminos y condiciones
                </Link>{" "}
                y la politica de privacidad. *
              </span>
            </label>

            <label className="flex gap-3 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(event) => setMarketingOptIn(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-300"
              />
              <span>Deseo recibir promociones, novedades y cupones por WhatsApp o email.</span>
            </label>
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-zinc-950 px-5 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Registrando..." : "Registrarme"}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-zinc-200" />
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-400">O</span>
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <SocialAuthButtons
          disabled={submitting}
          onGoogleClick={handleGoogleSignIn}
          onFacebookClick={handleFacebookSignIn}
        />
      </section>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5efe6]" />}>
      <RegisterForm />
    </Suspense>
  );
}
