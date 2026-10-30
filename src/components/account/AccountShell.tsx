"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faBoxOpen,
  faGear,
  faHeart,
  faHouse,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";

const navItems = [
  { href: "/account", label: "Inicio", icon: faHouse, exact: true },
  { href: "/account/orders", label: "Pedidos", icon: faBoxOpen },
  { href: "/account/wishlist", label: "Favoritos", icon: faHeart },
  { href: "/account/settings", label: "Perfil", icon: faGear },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AccountShell({
  title,
  description,
  children,
  hideHeading = false,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  hideHeading?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const isDashboard = pathname === "/account";

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-16 text-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <header className="border-b border-zinc-100 px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white">
                  {user.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-400">Mi cuenta</p>
                  <p className="truncate font-semibold text-zinc-950">{user.displayName}</p>
                </div>
              </div>

              <nav className="flex gap-1 overflow-x-auto pb-1 lg:pb-0">
                {navItems.map((item) => {
                  const active = isActive(pathname, item.href, item.exact);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                        active
                          ? "bg-zinc-950 text-white"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                      ].join(" ")}
                    >
                      <FontAwesomeIcon icon={item.icon} className="text-xs" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 self-start rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 lg:self-center"
              >
                <FontAwesomeIcon icon={faArrowRightFromBracket} className="text-xs" />
                Salir
              </button>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 sm:py-8">
            {!hideHeading && title ? (
              <div className="mb-8 border-b border-zinc-100 pb-6">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                {description ? <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-500">{description}</p> : null}
              </div>
            ) : null}

            <div className={isDashboard ? "" : ""}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
