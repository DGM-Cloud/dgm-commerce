import Link from "next/link";
import { siteContent } from "@/config/site-content";

const { about } = siteContent;

export default function AboutPageContent() {
  return (
    <main className="min-h-screen bg-white pt-20 text-zinc-950">
      <section className="border-b border-zinc-200">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
          <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-zinc-400">{about.eyebrow}</p>
          <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {about.title}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-zinc-500 sm:text-lg">{about.lead}</p>
        </div>
      </section>

      <section className="border-b border-zinc-200">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-zinc-400">{about.storyEyebrow}</p>
            <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              {about.storyTitle}
            </h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-zinc-600">
              {about.story.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="relative min-h-[280px] overflow-hidden rounded-2xl bg-zinc-950 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-stone-900 to-teal-950" />
            <div className="relative flex h-full min-h-[280px] flex-col justify-end p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/50">
                {about.storyAsideEyebrow}
              </p>
              <p className="mt-3 font-serif text-2xl font-semibold">{about.storyAsideTitle}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-zinc-400">{about.pillarsEyebrow}</p>
            <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              {about.pillarsTitle}
            </h2>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {about.pillars.map((pillar) => (
              <div key={pillar.title} className="border-t border-zinc-200 pt-6">
                <h3 className="text-lg font-semibold text-zinc-950">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-500">{pillar.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:px-8 lg:py-20">
          <div>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {about.ctaTitle}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-zinc-400">{about.ctaText}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-white px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-950 transition hover:bg-zinc-100"
            >
              Ver productos
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center border border-zinc-600 px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:border-zinc-400"
            >
              Contacto
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
