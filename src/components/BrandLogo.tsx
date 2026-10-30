"use client";

import Link from "next/link";
import { brand } from "@/config/brand";
import { useStoreChrome } from "@/components/StoreChromeProvider";
import { getStoreLogoScale } from "@/lib/store-cms";

type BrandLogoProps = {
  href?: string;
  variant?: "header" | "footer" | "mark";
  className?: string;
};

function Mark({
  className = "",
  label,
}: {
  className?: string;
  label: string;
}) {
  const markLetter = label.trim().charAt(0).toUpperCase() || brand.shortName.charAt(0);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role="img"
      aria-label={label}
    >
      <rect width="64" height="64" rx="14" fill="currentColor" />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fill="#fff"
        fontFamily="inherit"
        fontSize="28"
        fontWeight="700"
      >
        {markLetter}
      </text>
    </svg>
  );
}

function LogoImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}

export default function BrandLogo({
  href = "/",
  variant = "header",
  className = "",
}: BrandLogoProps) {
  const chrome = useStoreChrome();
  const logoText = chrome.logoText?.trim() || brand.name;
  const useImage = chrome.logoMode === "image" && Boolean(chrome.logoImage?.trim());
  const scale = getStoreLogoScale(chrome.logoScale);
  const aria = `${logoText} — Inicio`;
  const logoStyle = {
    fontFamily: "var(--store-logo-font)",
  } as const;

  if (variant === "mark") {
    return (
      <Link href={href} className={`inline-flex text-zinc-950 ${className}`} aria-label={aria}>
        {useImage ? (
          <LogoImage src={chrome.logoImage} alt={logoText} className="h-16 w-16 object-contain" />
        ) : (
          <Mark className="h-16 w-16" label={logoText} />
        )}
      </Link>
    );
  }

  if (variant === "footer") {
    return (
      <Link
        href={href}
        className={`inline-flex flex-col text-current ${className}`}
        style={logoStyle}
        aria-label={aria}
      >
        {useImage ? (
          <LogoImage
            src={chrome.logoImage}
            alt={logoText}
            className={`${scale.imageClass} object-contain object-left`}
          />
        ) : (
          <span className={`font-bold tracking-tight leading-none ${scale.textClass}`}>{logoText}</span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`relative z-10 inline-flex shrink-0 items-center text-current ${className}`}
      style={logoStyle}
      aria-label={aria}
    >
      {useImage ? (
        <LogoImage
          src={chrome.logoImage}
          alt={logoText}
          className={`${scale.imageClass} object-contain object-left`}
        />
      ) : (
        <span className={`font-bold tracking-tight leading-none ${scale.textClass}`}>{logoText}</span>
      )}
    </Link>
  );
}
