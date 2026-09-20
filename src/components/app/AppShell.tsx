"use client";

import { APP_NAV, type NavItem } from "@/components/app/nav";
import { IconLogout } from "@/components/app/nav-icons";
import {
  clearAuthUser,
  hydrateScreeningForUser,
  loadAuthUser,
  loadEmail,
  type AuthUser,
} from "@/lib/screening/storage";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const auth = loadAuthUser();
    if (!auth) {
      router.replace("/prihlaseni");
      return;
    }
    hydrateScreeningForUser(auth.email);
    setUser(auth);
    setEmail(loadEmail() || auth.email);
    setReady(true);
  }, [router]);

  if (!ready || !user) {
    return <div className="app-loading">Načítání…</div>;
  }

  const isActive = (href: string) => {
    if (href === "/prubeh-pece") {
      return (
        pathname === href ||
        pathname.startsWith("/hairscope") ||
        pathname.startsWith("/konzultace") ||
        pathname.startsWith("/vysetreni") ||
        pathname.startsWith("/plan-pece")
      );
    }
    if (href === "/vysetreni") {
      return (
        pathname === href ||
        pathname.startsWith("/objednavka") ||
        pathname.startsWith("/hairscope")
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const displayName =
    user.fullName?.trim() ||
    email.split("@")[0] ||
    "Klient";

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("cs-CZ") ?? "")
    .join("");

  const renderLink = (item: NavItem) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        className={`app-nav-link${isActive(item.href) ? " is-active" : ""}`}
        href={item.href}
      >
        <Icon className="app-nav-icon" />
        <span className="app-nav-link-label">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="app-shell">
      <aside className="app-aside" aria-label="Hlavní navigace">
        <Link className="app-brand" href="/prehled" aria-label="FOLLICAD">
          <Image
            className="app-brand-img"
            src="/follicad-logo.png"
            alt="FOLLICAD"
            width={200}
            height={44}
            priority
          />
        </Link>

        <nav className="app-nav">
          <div className="app-nav-list">{APP_NAV.map(renderLink)}</div>
        </nav>

        <div className="app-aside-footer">
          <div className="app-aside-user">
            <div className="app-aside-avatar" aria-hidden="true">
              {initials || "K"}
            </div>
            <div className="app-aside-user-copy">
              <p className="app-aside-user-name">{displayName}</p>
              <p className="app-aside-user-email">{email}</p>
            </div>
          </div>
          <button
            className="app-logout"
            type="button"
            onClick={() => {
              clearAuthUser();
              router.push("/");
            }}
          >
            <IconLogout className="app-logout-icon" />
            Odhlásit se
          </button>
        </div>
      </aside>
      <div className="app-main">{children}</div>
    </div>
  );
}
