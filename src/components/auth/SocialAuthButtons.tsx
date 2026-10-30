"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faGoogle } from "@fortawesome/free-brands-svg-icons";

interface SocialAuthButtonsProps {
  disabled?: boolean;
  onGoogleClick: () => void;
  onFacebookClick: () => void;
}

export default function SocialAuthButtons({
  disabled = false,
  onGoogleClick,
  onFacebookClick,
}: SocialAuthButtonsProps) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={disabled}
        onClick={onGoogleClick}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <FontAwesomeIcon icon={faGoogle} className="text-base" />
        <span>Continuar con Google</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={onFacebookClick}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#1877F2] bg-[#1877F2] px-5 py-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#166FE5] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <FontAwesomeIcon icon={faFacebookF} className="text-base" />
        <span>Continuar con Facebook</span>
      </button>

      <p className="text-xs leading-5 text-zinc-500">
        Al continuar con Google o Facebook, aceptas los términos y la política de privacidad. No publicaremos
        nada en tus redes sin tu permiso.
      </p>
    </div>
  );
}
