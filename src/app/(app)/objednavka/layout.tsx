"use client";

import OrderFlowStepper from "@/components/order/OrderFlowStepper";
import { usePathname } from "next/navigation";

function resolveOrderChrome(pathname: string) {
  if (pathname.includes("/objednavka/lekar")) {
    return {
      title: "Lékař",
      stepIndex: 1,
      stepLabel: "Výběr lékaře",
      showStepper: true,
    };
  }
  if (pathname.includes("/objednavka/souhrn")) {
    return {
      title: "Údaje a platba",
      stepIndex: 2,
      stepLabel: "Souhrn objednávky",
      showStepper: true,
    };
  }
  return {
    title: "Laboratorní vyšetření",
    stepIndex: 0,
    stepLabel: "Výběr vyšetření",
    showStepper: true,
  };
}

export default function OrderFlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const chrome = resolveOrderChrome(pathname);

  return (
    <>
      <header className="app-topbar">
        <div>
          <p className="app-topbar-kicker">Objednávka</p>
          <p className="app-topbar-title">{chrome.title}</p>
        </div>
      </header>
      <div className="app-content">
        {chrome.showStepper ? (
          <OrderFlowStepper
            stepIndex={chrome.stepIndex}
            stepLabel={chrome.stepLabel}
          />
        ) : null}
        {children}
      </div>
    </>
  );
}
