"use client";

import OrderFlowStepper from "@/components/order/OrderFlowStepper";
import { getLabOrderSubstep } from "@/lib/order/process-sidebar";
import { usePathname } from "next/navigation";

export default function OrderFlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { stepIndex, stepLabel } = getLabOrderSubstep(pathname);

  return (
    <>
      <header className="app-topbar has-stepper">
        <OrderFlowStepper stepIndex={stepIndex} stepLabel={stepLabel} />
      </header>
      <div className="app-content">{children}</div>
    </>
  );
}
