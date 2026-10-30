export function formatAccountDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function orderStatusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("entreg") || normalized.includes("complet") || normalized.includes("pagad")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }

  if (normalized.includes("envi") || normalized.includes("camino") || normalized.includes("transit")) {
    return "bg-sky-50 text-sky-700 ring-sky-600/20";
  }

  if (normalized.includes("pend") || normalized.includes("proces") || normalized.includes("prepar")) {
    return "bg-amber-50 text-amber-800 ring-amber-600/20";
  }

  if (normalized.includes("cancel") || normalized.includes("anul")) {
    return "bg-red-50 text-red-700 ring-red-600/20";
  }

  return "bg-zinc-100 text-zinc-700 ring-zinc-500/10";
}

export function providerLabel(provider: string) {
  if (provider === "google") return "Google";
  if (provider === "facebook") return "Facebook";
  if (provider === "apple") return "Apple";
  return "Correo y contraseña";
}
