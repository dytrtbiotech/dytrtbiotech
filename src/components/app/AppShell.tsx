"use client";

import AppHeader from "@/components/app/AppHeader";
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
  const [order, setOrder] = useState<OrderDraft | null>(null);

  useEffect(() => {
    const auth = loadAuthUser();
    if (!auth) {
      router.replace("/prihlaseni");
      return;
    }
    hydrateScreeningForUser(auth.email);
    setUser(auth);
    setOrder(loadOrder());
    setReady(true);
  }, [router, pathname]);

  if (!ready || !user) {
    return <div className="app-loading">Načítání…</div>;
  }

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
    <div className={`app-shell${processMode ? " is-process" : " is-header"}`}>
      {processMode ? (
        <ProcessSidebar
          phases={processPhases}
          currentMeta={processCurrentMeta}
          brandHref="/prehled"
          footer={
            <Link className="button secondary process-exit" href="/prehled">
              Zpět na přehled
            </Link>
          }
        />
      ) : (
        <AppHeader pathname={pathname} onLogout={logout} />
      )}
      <div className="app-main">{children}</div>
    </div>
  );
}
