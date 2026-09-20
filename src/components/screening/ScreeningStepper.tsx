"use client";

import {
  QUESTION_META,
  QUESTION_STEPS,
  isQuestionStep,
  type QuestionStep,
  type ScreeningStep,
} from "@/lib/screening/config";

type Props = {
  step: ScreeningStep;
};

export default function ScreeningStepper({ step }: Props) {
  if (!isQuestionStep(step)) return null;

  const index = QUESTION_STEPS.indexOf(step);
  const current = index + 1;
  const total = QUESTION_STEPS.length;
  const meta = QUESTION_META[step];

  return (
    <div className="screening-stepper">
      <div
        className="screening-segments"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={`Krok ${current} ze ${total}: ${meta.sectionLabel}`}
      >
        {QUESTION_STEPS.map((id, i) => {
          const filled = i <= index;
          let state = "is-upcoming";
          if (i < index) state = "is-done";
          if (i === index) state = "is-current";
          return (
            <span
              key={id}
              className={`screening-segment ${state}`}
              aria-hidden="true"
            >
              <span
                className="screening-segment-fill"
                style={{ transform: `scaleX(${filled ? 1 : 0})` }}
              />
            </span>
          );
        })}
      </div>
      <div className="screening-stepper-meta">
        <span className="screening-stepper-name">{meta.sectionLabel}</span>
        <span className="screening-stepper-count">
          Krok {current} ze {total}
        </span>
      </div>
    </div>
  );
}

export function questionStepAt(index: number): QuestionStep {
  return QUESTION_STEPS[index] ?? "q1";
}
