import { permanentRedirect } from "next/navigation";

/** Legacy route — keep redirect for bookmarks and external links. */
export default function LegacyHomeRedirect() {
  permanentRedirect("/");
}
