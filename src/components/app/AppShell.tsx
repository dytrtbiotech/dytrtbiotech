"use client";

import AppSidebar from "@/components/app/AppSidebar";
import ProcessSidebar from "@/components/app/ProcessSidebar";
import {
  getLabOrderSubstep,
  getProcessSidebarPhases,
  shouldUseProcessSidebar,
} from "@/lib/order/process-sidebar";
import { loadOrder } from "@/lib/order/storage";
import {
  clearAuthUser,
  hydrateScreeningForUser,
  loadAuthUser,
  loadEmail,
  type AuthUser,
} from "@/lib/screening/storage";
import type { OrderDraft } from "@/lib/order/config";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "./process-sidebar.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<OrderDraft | null>(null);

  useEffect(() => {
    const auth = loadAuthUser();
    if (!auth) {
      router.replace("/prihlaseni");
      return;
    }
    hydrateScreeningForUser(auth.email);
    setUser(auth);
    setEmail(loadEmail() || auth.email);
    setOrder(loadOrder());
    setReady(true);
  }, [router, pathname]);

  if (!ready || !user) {
    return <div className="app-loading">Načítání…</div>;
  }

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

  const logout = () => {
    clearAuthUser();
    router.push("/");
  };

  const processMode = shouldUseProcessSidebar(pathname, order);
  const processPhases = processMode
    ? getProcessSidebarPhases(pathname, order)
    : [];
  const processCurrentMeta = pathname.startsWith("/objednavka")
    ? getLabOrderSubstep(pathname).stepLabel
    : undefined;

  return (
    <div className="app-shell">
      {processMode ? (
        <ProcessSidebar
          phases={processPhases}
          currentMeta={processCurrentMeta}
          brandHref="/prehled"
          footer={
            <Link className="process-exit" href="/prehled">
              Zpět na přehled
            </Link>
          }
        />
      ) : (
        <AppSidebar
          pathname={pathname}
          displayName={displayName}
          email={email}
          initials={initials}
          onLogout={logout}
        />
      )}
      <div className="app-main">{children}</div>
    </div>
  );
}
