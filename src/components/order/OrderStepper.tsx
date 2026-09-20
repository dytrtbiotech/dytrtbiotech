import { ORDER_STEPS, type OrderStepId } from "@/lib/order/config";
import Link from "next/link";

export default function OrderStepper({ current }: { current: OrderStepId }) {
  const currentIndex = ORDER_STEPS.findIndex((s) => s.id === current);

  return (
    <nav className="order-stepper" aria-label="Postup objednávky">
      <ol className="order-stepper-list">
        {ORDER_STEPS.map((step, index) => {
          const state =
            index < currentIndex
              ? "done"
              : index === currentIndex
                ? "current"
                : "upcoming";
          return (
            <li key={step.id} className={`order-step order-step--${state}`}>
              {index < currentIndex ? (
                <Link href={step.href}>{step.label}</Link>
              ) : (
                <span>{step.label}</span>
              )}
              {index < ORDER_STEPS.length - 1 ? (
                <span className="order-step-sep" aria-hidden="true">
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="sr-only">
        Krok {currentIndex + 1} ze {ORDER_STEPS.length}:{" "}
        {ORDER_STEPS[currentIndex]?.label}
      </p>
    </nav>
  );
}
