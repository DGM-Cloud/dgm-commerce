const SUBCOLLECTION_ORDER = [
  "Cristiano Ronaldo",
  "Lionel Messi",
  "Neymar",
  "Ronaldinho",
  "Girlfriend",
  "Gym Humor",
  "Romantic",
  "SuperStars",
  "GYM",
  "Basicos",
  "Edicion limitada",
] as const;

export function deriveSubcollection(productName: string, collection?: string | null) {
  const name = productName.trim();

  if (/^cristiano\b/i.test(name)) return "Cristiano Ronaldo";
  if (/^messi\b/i.test(name)) return "Lionel Messi";
  if (/^neymar\b/i.test(name)) return "Neymar";
  if (/^ronaldinho\b/i.test(name)) return "Ronaldinho";
  if (/^girlfriend\b/i.test(name)) return "Girlfriend";
  if (collection === "GYM") return "Gym Humor";
  if (collection === "Romantic") return "Romantic";

  return collection || "General";
}

export function subcollectionSortRank(subcollection?: string | null) {
  if (!subcollection) return 999;
  const index = SUBCOLLECTION_ORDER.indexOf(subcollection as (typeof SUBCOLLECTION_ORDER)[number]);
  return index === -1 ? 500 : index;
}

export const SUPERSTAR_SUBCOLLECTIONS = [
  "Cristiano Ronaldo",
  "Lionel Messi",
  "Neymar",
  "Ronaldinho",
] as const;
