"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import AccountLoading from "@/components/account/AccountLoading";
import { providerLabel } from "@/components/account/account-utils";
import { useAuth } from "@/components/auth/AuthProvider";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, loading, updateProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/account/settings");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await updateProfile({ email, firstName, lastName, phone });
      setMessage("Tus datos se actualizaron correctamente.");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AccountLoading />;
  if (!user) return <AccountLoading />;

  return (
    <AccountShell
      title="Configuración"
      description="Mantén tu información al día para pedidos, envíos y comunicación con el equipo."
    >
      <div className="mb-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <p className="text-sm font-medium text-zinc-950">Cuenta conectada</p>
        <p className="mt-1 text-sm text-zinc-500">
          Inicias sesión con <span className="font-medium text-zinc-700">{providerLabel(user.provider)}</span>.
          {user.provider !== "email"
            ? " Algunos datos pueden venir de tu proveedor y no ser editables aquí."
            : " Puedes actualizar tu correo y contraseña desde esta sección."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset className="space-y-5">
          <legend className="text-sm font-semibold text-zinc-950">Datos personales</legend>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700">Nombres</span>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className={inputClass}
                placeholder="Tu nombre"
                required
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700">Apellidos</span>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className={inputClass}
                placeholder="Tus apellidos"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Teléfono</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={inputClass}
              placeholder="+51 999 999 999"
              inputMode="tel"
            />
            <span className="text-xs text-zinc-400">Útil para coordinar envíos por WhatsApp.</span>
          </label>
        </fieldset>

        <fieldset className="space-y-5 border-t border-zinc-200 pt-8">
          <legend className="text-sm font-semibold text-zinc-950">Contacto</legend>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
              placeholder="tu@email.com"
              required
            />
          </label>
        </fieldset>

        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </AccountShell>
  );
}
