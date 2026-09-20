"use client";

import { ORDER_STEPS } from "@/lib/order/config";

type Props = {
  stepIndex: number;
  stepLabel: string;
};

export default function OrderFlowStepper({ stepIndex, stepLabel }: Props) {
  const current = stepIndex + 1;
  const total = ORDER_STEPS.length;

  return (
    <div className="order-flow-stepper">
      <div
        className="order-flow-segments"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={`Krok ${current} ze ${total}: ${stepLabel}`}
      >
        {ORDER_STEPS.map((step, index) => {
          const filled = index <= stepIndex;
          let state = "is-upcoming";
          if (index < stepIndex) state = "is-done";
          if (index === stepIndex) state = "is-current";
          return (
            <span
              key={step.id}
              className={`order-flow-segment ${state}`}
              aria-hidden="true"
            >
              <span
                className="order-flow-segment-fill"
                style={{ transform: `scaleX(${filled ? 1 : 0})` }}
              />
            </span>
          );
        })}
      </div>
      <div className="order-flow-stepper-meta">
        <span className="order-flow-stepper-name">{stepLabel}</span>
        <span className="order-flow-stepper-count">
          Krok {current} ze {total}
        </span>
      </div>
    </div>
  );
}
