"use client";

import type { ChoiceBadgeTone } from "@/lib/screening/config";

type Option = {
  id: string;
  label: string;
  description?: string;
  badge?: { label: string; tone: ChoiceBadgeTone };
};

type Props = {
  options: Option[];
  value?: string;
  onChange: (id: string) => void;
  columns?: 1 | 2 | 3;
  error?: string;
  name: string;
};

export default function ChoiceGroup({
  options,
  value,
  onChange,
  columns = 1,
  error,
  name,
}: Props) {
  return (
    <div>
      <div
        className={`screening-options screening-options--${columns}`}
        role="radiogroup"
        aria-label={name}
      >
        {options.map((option) => {
          const selected = value === option.id;
          const rich = Boolean(option.badge || option.description);
          return (
            <button
              key={option.id}
              type="button"
              className={`screening-option${rich ? " is-rich" : ""}${selected ? " is-selected" : ""}`}
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
            >
              <span className="screening-option-head">
                <span className="screening-option-label">{option.label}</span>
                {option.badge ? (
                  <span
                    className={`screening-option-badge tone-${option.badge.tone}`}
                  >
                    {option.badge.label}
                  </span>
                ) : null}
              </span>
              {option.description ? (
                <span className="screening-option-desc">
                  {option.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {error ? <p className="screening-error">{error}</p> : null}
    </div>
  );
}
