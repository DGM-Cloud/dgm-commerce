"use client";

import React, { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { siteContent } from "@/config/site-content";
import {
  getStoreFontPair,
  heroSlideSurfaceStyle,
  heroSlideTextColor,
  heroSlideUsesImage,
  normalizeHeroAlign,
  type StoreHeroSlide,
  type StoreHomeContent,
} from "@/lib/store-cms";

const SLIDE_INTERVAL_MS = 7000;

export default function Hero({
  content = siteContent.home.hero as unknown as StoreHomeContent["hero"],
}: {
  content?: StoreHomeContent["hero"];
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = content.slides;
  const active = slides[activeSlide] ?? slides[0];
  const align = normalizeHeroAlign(content.align);
  const fontPair = getStoreFontPair(content.fontPair);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!active) return null;

  const primaryLabel = active.ctaLabel?.trim() || content.primaryCta.label;
  const textColor = heroSlideTextColor(active);
  const contentAlign =
    align === "center" ? "items-center text-center" : align === "right" ? "items-end text-right" : "items-start text-left";
  const rowAlign = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";
  const blockAlign = align === "center" ? "mx-auto" : align === "right" ? "ml-auto" : "";

  return (
    <section
      className="relative min-h-screen w-full overflow-hidden bg-zinc-950"
      style={
        {
          "--store-hero-display": `var(${fontPair.displayVar})`,
          "--store-hero-sans": `var(${fontPair.sansVar})`,
          fontFamily: "var(--store-hero-sans)",
          color: textColor,
        } as CSSProperties
      }
    >
      {slides.map((slide, index) => {
        const isActive = index === activeSlide;
        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${
              isActive ? "z-0 opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <SlideBackground slide={slide} />
            <div className="absolute inset-0 opacity-30" style={gridOverlayStyle} />
            <div className="absolute -right-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-white/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        );
      })}

      <div
        className={`relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 lg:justify-center lg:px-8 lg:pb-24 ${contentAlign}`}
      >
        {content.eyebrow || active.kicker ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.42em] opacity-55">
            {content.eyebrow?.trim() || active.kicker}
          </p>
        ) : null}
        <h1
          className={`mt-5 max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl ${blockAlign}`}
          style={{ fontFamily: "var(--store-hero-display)" }}
        >
          <span className="block opacity-40">{content.title}</span>
          <span className="mt-2 block">{active.title}</span>
        </h1>
        {content.subtitle?.trim() ? (
          <p className={`mt-4 max-w-xl text-base leading-7 opacity-60 sm:text-lg ${blockAlign}`}>
            {content.subtitle}
          </p>
        ) : null}
        <p className={`mt-6 max-w-xl text-base leading-8 opacity-70 sm:text-lg ${blockAlign}`}>{active.text}</p>

        <div className={`mt-10 flex flex-col gap-3 sm:flex-row ${rowAlign}`}>
          <Link
            href={active.href || content.primaryCta.href}
            className="group inline-flex items-center justify-center gap-3 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] transition hover:opacity-90"
            style={{ backgroundColor: textColor, color: contrastOn(textColor) }}
          >
            {primaryLabel}
            <FontAwesomeIcon
              icon={faArrowRight}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
          <Link
            href={content.secondaryCta.href}
            className="inline-flex items-center justify-center border px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] transition hover:bg-current/10"
            style={{ borderColor: "color-mix(in srgb, currentColor 35%, transparent)", color: textColor }}
          >
            {content.secondaryCta.label}
          </Link>
        </div>

        <div className={`mt-12 flex gap-2 ${rowAlign}`}>
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Ir a banner ${index + 1}`}
              onClick={() => setActiveSlide(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === activeSlide ? "w-10 opacity-100" : "w-4 opacity-35 hover:opacity-60"
              }`}
              style={{ backgroundColor: textColor }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function contrastOn(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "#18181b";
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#18181b" : "#ffffff";
}

function SlideBackground({ slide }: { slide: StoreHeroSlide }) {
  if (heroSlideUsesImage(slide)) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />
      </>
    );
  }

  return <div className="absolute inset-0" style={heroSlideSurfaceStyle(slide)} />;
}

const gridOverlayStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
};
