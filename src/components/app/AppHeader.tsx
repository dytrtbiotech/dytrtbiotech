"use client";

import { APP_NAV, type NavItem } from "@/components/app/nav";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type AppHeaderProps = {
  pathname: string;
  onLogout: () => void;
};

function isNavActive(pathname: string, href: string) {
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
}

export default function AppHeader({ pathname, onLogout }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 901px)").matches) {
        setMenuOpen(false);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  const renderLink = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      className={isNavActive(pathname, item.href) ? "is-active" : undefined}
      onClick={closeMenu}
    >
      {item.label}
    </Link>
  );

  return (
    <>
      <header
        className={`site-header app-header${menuOpen ? " is-menu-open" : ""}`}
      >
        <div className="header wrap">
          <Link className="logo" href="/prehled" aria-label="FOLLICAD">
            <Image
              className="logo-img"
              src="/follicad-logo.png"
              alt="FOLLICAD"
              width={220}
              height={48}
              priority
            />
          </Link>

          <button
            className={`nav-toggle${menuOpen ? " is-open" : ""}`}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="app-nav"
            aria-label={menuOpen ? "Zavřít menu" : "Otevřít menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="nav-toggle-bar" aria-hidden="true" />
            <span className="nav-toggle-bar" aria-hidden="true" />
          </button>

          <nav
            id="app-nav"
            className={`nav${menuOpen ? " is-open" : ""}`}
            aria-label="Hlavní navigace"
          >
            {APP_NAV.map(renderLink)}
            <div className="nav-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  closeMenu();
                  onLogout();
                }}
              >
                Odhlásit se
              </button>
            </div>
          </nav>
        </div>
      </header>

      {menuOpen ? (
        <button
          className="nav-backdrop"
          type="button"
          aria-label="Zavřít menu"
          onClick={closeMenu}
        />
      ) : null}
    </>
  );
}
