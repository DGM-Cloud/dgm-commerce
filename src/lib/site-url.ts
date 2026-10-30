import { getSiteOrigin } from "@/lib/supabase/env";

export function absoluteUrl(path: string, fallbackOrigin = "http://localhost:3000") {
  const origin = getSiteOrigin(fallbackOrigin);
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}
