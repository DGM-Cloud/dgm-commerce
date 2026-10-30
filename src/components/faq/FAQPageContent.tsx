"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { siteContent } from "@/config/site-content";

const { faq } = siteContent;

export default function FAQPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(faq.items[0]?.id ?? null);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return faq.items;

    return faq.items.filter(
      (item) =>
        item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  return (
    <main className="min-h-screen bg-white pt-20 text-zinc-950">
      <section className="border-b border-zinc-200">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
          <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-zinc-400">{faq.eyebrow}</p>
          <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{faq.title}</h1>
          <p className="mt-5 text-base leading-8 text-zinc-500">{faq.lead}</p>

          <div className="mt-8">
            <input
              type="search"
              placeholder="Buscar una pregunta..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {filteredItems.length === 0 ? (
          <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-8 text-center text-sm text-zinc-500">
            No encontramos nada con &ldquo;{searchQuery}&rdquo;. Prueba con otras palabras o{" "}
            <Link href="/contact" className="font-medium text-zinc-950 underline underline-offset-2">
              escríbenos
            </Link>
            .
          </p>
        ) : (
          <div className="divide-y divide-zinc-200 border-y border-zinc-200">
            {filteredItems.map((item) => {
              const isOpen = openId === item.id;

              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="flex w-full items-start justify-between gap-4 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-medium leading-7 text-zinc-950">{item.question}</span>
                    <span className="mt-1 shrink-0 text-lg leading-none text-zinc-400">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen ? <p className="pb-5 text-sm leading-7 text-zinc-500">{item.answer}</p> : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
