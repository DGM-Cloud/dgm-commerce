"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { brand } from "@/config/brand";
import { siteContent } from "@/config/site-content";

const { contact } = siteContent;

const WHATSAPP_URL =
  brand.social.whatsapp +
  (brand.social.whatsapp.includes("?") ? "&" : "?") +
  "text=" +
  encodeURIComponent(`¡Hola! Quiero hablar con ${brand.name}.`);

export default function ContactPageContent() {
  const [startTime, setStartTime] = useState(0);
  const [honeypot, setHoneypot] = useState("");
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    reason: "general",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const elapsedTime = (Date.now() - startTime) / 1000;

    if (honeypot) {
      setFeedback({ type: "success", message: "Mensaje enviado. Te contactaremos pronto." });
      return;
    }

    if (elapsedTime < 3) {
      setFeedback({ type: "error", message: "Envío demasiado rápido. Inténtalo de nuevo." });
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      setFeedback({ type: "success", message: "Mensaje enviado. Te contactaremos pronto." });
      setFormState({ name: "", email: "", reason: "general", message: "" });
    }, 600);
  };

  const channels = contact.channels.map((channel) => {
    if (channel.label === "WhatsApp") {
      return { ...channel, href: WHATSAPP_URL };
    }
    return channel;
  });

  return (
    <main className="min-h-screen bg-white pt-20 text-zinc-950">
      <section className="border-b border-zinc-200">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-zinc-400">{contact.eyebrow}</p>
          <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            {contact.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-500">{contact.lead}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
        <div className="space-y-6">
          {channels.map((channel) => (
            <a
              key={channel.label}
              href={"href" in channel && channel.href ? channel.href : WHATSAPP_URL}
              target={String(channel.href ?? WHATSAPP_URL).startsWith("http") ? "_blank" : undefined}
              rel={String(channel.href ?? WHATSAPP_URL).startsWith("http") ? "noopener noreferrer" : undefined}
              className="block rounded-2xl border border-zinc-200 p-5 transition hover:border-zinc-400"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-400">{channel.label}</p>
              <p className="mt-2 text-lg font-semibold text-zinc-950">{channel.value}</p>
              <p className="mt-1 text-sm text-zinc-500">{channel.hint}</p>
            </a>
          ))}
          <p className="text-sm text-zinc-500">
            También puedes revisar las{" "}
            <Link href="/faq" className="font-semibold text-zinc-950 underline">
              preguntas frecuentes
            </Link>
            .
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 sm:p-8">
          <input
            type="text"
            name="company"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">Nombre</span>
              <input
                required
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 outline-none ring-zinc-950 focus:ring-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">Email</span>
              <input
                required
                type="email"
                value={formState.email}
                onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 outline-none ring-zinc-950 focus:ring-2"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">Motivo</span>
            <select
              value={formState.reason}
              onChange={(event) => setFormState((prev) => ({ ...prev, reason: event.target.value }))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 outline-none ring-zinc-950 focus:ring-2"
            >
              <option value="general">Consulta general</option>
              <option value="order">Seguimiento de pedido</option>
              <option value="custom">Personalización</option>
              <option value="wholesale">Mayorista</option>
            </select>
          </label>

          <label className="mt-4 block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">Mensaje</span>
            <textarea
              required
              rows={5}
              value={formState.message}
              onChange={(event) => setFormState((prev) => ({ ...prev, message: event.target.value }))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 outline-none ring-zinc-950 focus:ring-2"
            />
          </label>

          {feedback ? (
            <p className={`mt-4 text-sm ${feedback.type === "success" ? "text-emerald-700" : "text-red-700"}`}>
              {feedback.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Enviando..." : "Enviar mensaje"}
          </button>
        </form>
      </section>
    </main>
  );
}
