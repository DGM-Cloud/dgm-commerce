import type { CSSProperties } from "react";
import { getStoreFontPair, type StoreHomeContent } from "@/lib/store-cms";

export default function ValueProposition({
  content,
}: {
  content: StoreHomeContent["value"];
}) {
  const font = getStoreFontPair(content.fontPair);
  const backgroundColor = content.backgroundColor || "#09090b";
  const textColor = content.textColor || "#ffffff";
  const points = content.points || [];
  const gridClass =
    points.length <= 1
      ? "sm:grid-cols-1"
      : points.length === 2
        ? "sm:grid-cols-2"
        : points.length === 3
          ? "sm:grid-cols-2 lg:grid-cols-3"
          : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <section
      style={
        {
          backgroundColor,
          color: textColor,
          fontFamily: `var(${font.sansVar})`,
          "--store-value-display": `var(${font.displayVar})`,
          "--store-value-muted": `color-mix(in srgb, ${textColor} 65%, transparent)`,
          "--store-value-border": `color-mix(in srgb, ${textColor} 15%, transparent)`,
        } as CSSProperties
      }
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <h2
          className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl"
          style={{ fontFamily: "var(--store-value-display)" }}
        >
          {content.title}
        </h2>

        {points.length ? (
          <div className={`mt-16 grid gap-10 border-t pt-10 ${gridClass}`} style={{ borderColor: "var(--store-value-border)" }}>
            {points.map((point, index) => (
              <div key={`${point.title}-${index}`}>
                <h3 className="text-lg font-semibold">{point.title}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--store-value-muted)" }}>
                  {point.text}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
