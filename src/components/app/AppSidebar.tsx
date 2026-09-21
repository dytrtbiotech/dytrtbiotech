"use client";

import { APP_NAV, type NavItem } from "@/components/app/nav";
import { IconLogout } from "@/components/app/nav-icons";
import Image from "next/image";
import Link from "next/link";

type AppSidebarProps = {
  pathname: string;
  displayName: string;
  email: string;
  initials: string;
  onLogout: () => void;
};

export default function AppSidebar({
  pathname,
  displayName,
  email,
  initials,
  onLogout,
}: AppSidebarProps) {
  const isActive = (href: string) => {
    if (href === "/prubeh-pece") {
      return (
        pathname === href ||
        pathname.startsWith("/vysetreni") ||
        pathname.startsWith("/plan-pece") ||
        pathname.startsWith("/muj-lekar") ||
        pathname.startsWith("/objednavky") ||
        pathname.startsWith("/fotografie")
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

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
        <button className="app-logout" type="button" onClick={onLogout}>
          <IconLogout className="app-logout-icon" />
          Odhlásit se
        </button>
      </div>
    </aside>
  );
}
