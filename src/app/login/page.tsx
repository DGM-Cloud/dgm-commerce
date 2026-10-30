"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";

import { sanitizeAuthRedirect } from "@/lib/auth-redirect";

function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectTarget = sanitizeAuthRedirect(searchParams.get("next"));
	const oauthError = searchParams.get("error");
	const { user, loading, signIn, signInWithGoogle, signInWithFacebook } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!loading && user) {
			router.replace(redirectTarget);
		}
	}, [loading, user, router, redirectTarget]);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitting(true);
		setError("");

		try {
			await signIn({ email, password, rememberMe });
			router.replace(redirectTarget);
		} catch (submissionError) {
			setError(submissionError instanceof Error ? submissionError.message : "No pudimos iniciar sesión.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setSubmitting(true);
		setError("");

		try {
			await signInWithGoogle({ next: redirectTarget, termsAccepted: true });
		} catch (submissionError) {
			setError(submissionError instanceof Error ? submissionError.message : "No pudimos iniciar sesión con Google.");
			setSubmitting(false);
		}
	};

	const handleFacebookSignIn = async () => {
		setSubmitting(true);
		setError("");

		try {
			await signInWithFacebook({ next: redirectTarget, termsAccepted: true });
		} catch (submissionError) {
			setError(submissionError instanceof Error ? submissionError.message : "No pudimos iniciar sesión con Facebook.");
			setSubmitting(false);
		}
	};

	if (loading || user) return <div className="min-h-screen bg-[#f5efe6]" />;

	return (
		<div className="min-h-screen bg-white px-4 py-10 lg:px-8 flex items-center justify-center">
			<section className="w-full max-w-2xl rounded-[2rem] border border-zinc-200 bg-white px-6 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.08)] lg:px-10 lg:py-10">
				<div className="flex items-center justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">Cuenta</p>
						<h2 className="mt-3 text-3xl font-black text-zinc-950">Inicia sesión</h2>
						<p className="mt-2 text-sm text-zinc-600">Dirección de correo electrónico y contraseña para entrar.</p>
					</div>
					<Link href="/register" className="rounded-full border border-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-950 hover:text-white">
						Registrarme
					</Link>
				</div>

				<form className="mt-8 space-y-5" onSubmit={handleSubmit}>
					<label className="block space-y-2">
						<span className="text-sm font-semibold text-zinc-800">Dirección de correo electrónico</span>
						<input
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							className="w-full rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3.5 text-zinc-950 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-950"
							placeholder="tu@email.com"
							required
						/>
					</label>

					<label className="block space-y-2">
						<span className="text-sm font-semibold text-zinc-800">Contraseña</span>
						<div className="relative">
							<input
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								className="w-full rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-3.5 pr-12 text-zinc-950 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-950"
								placeholder="••••••••"
								required
							/>
							<button
								type="button"
								onClick={() => setShowPassword((value) => !value)}
								className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-700"
								aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
							>
								<FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
							</button>
						</div>
					</label>

					<div className="flex flex-wrap items-center justify-between gap-3 text-sm">
						<label className="inline-flex items-center gap-2 text-zinc-700">
							<input
								type="checkbox"
								checked={rememberMe}
								onChange={(event) => setRememberMe(event.target.checked)}
								className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
							/>
							Mantener la sesión iniciada
						</label>
						<Link href="/contact" className="font-semibold text-zinc-950 underline-offset-4 hover:underline">
							¿Has olvidado tu contraseña?
						</Link>
					</div>

					{error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
					{!error && oauthError && (
						<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{oauthError}</div>
					)}

					<button
						type="submit"
						disabled={submitting}
						className="w-full rounded-2xl bg-zinc-950 px-5 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
					>
						{submitting ? "Entrando..." : "Entrar"}
					</button>

					<p className="text-center text-sm text-zinc-600">
						¿Tienes problemas para iniciar sesión? <Link href="/contact" className="font-semibold text-zinc-950 underline-offset-4 hover:underline">Contáctanos</Link>
					</p>
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

				<p className="mt-6 text-xs leading-5 text-zinc-500">
					Usamos Google y Facebook solo para autenticarte. No publicaremos nada en tus cuentas sin tu permiso.
				</p>
			</section>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-[#f5efe6]" />}>
			<LoginForm />
		</Suspense>
	);
}
