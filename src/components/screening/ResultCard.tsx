"use client";

import type {
  ResultCategory,
  ResultFactor,
  ScreeningAnswers,
} from "@/lib/screening/config";
import { getResultFactors } from "@/lib/screening/config";
import { useEffect, useState } from "react";

type ResultCardProps = {
  result: ResultCategory;
  percent: number;
  answers: ScreeningAnswers;
  titleId?: string;
  /** Placeholder výsledku za zámkem - bez reálných hodnot. */
  masked?: boolean;
};

const RING_SIZE = 200;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;
const ANIM_MS = 1800;

const MASKED_FACTORS: ResultFactor[] = [
  { id: "thinning", label: "Vzorec výpadu", value: 0, max: 24, tone: "low" },
  { id: "duration", label: "Délka trvání", value: 0, max: 22, tone: "low" },
  { id: "family", label: "Genetická složka", value: 0, max: 20, tone: "low" },
  { id: "priorCare", label: "Profil péče", value: 0, max: 14, tone: "low" },
  { id: "health", label: "Zdravotní stav", value: 0, max: 14, tone: "low" },
  { id: "expectation", label: "Estetický cíl", value: 0, max: 6, tone: "low" },
];

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function useCountUp(target: number, active: boolean, duration = ANIM_MS) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }

    let start: number | null = null;
    let frame = 0;

    const tick = (now: number) => {
      if (start === null) start = now;
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * easeOutCubic(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, target]);

  return value;
}

function ScoreRing({
  percent,
  tone,
  masked,
  animate,
}: {
  percent: number;
  tone: ResultCategory["id"];
  masked?: boolean;
  animate: boolean;
}) {
  const target = masked ? 0 : Math.min(100, Math.max(0, percent));
  const shown = animate ? target : 0;
  const offset = RING_CIRC * (1 - shown / 100);
  const counted = useCountUp(target, !masked && animate);

  return (
    <div
      className={`screening-score-ring tone-${masked ? "masked" : tone}${masked ? " is-masked" : ""}`}
    >
      <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        <circle
          className="screening-score-track"
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          strokeWidth={RING_STROKE}
        />
        {!masked ? (
          <circle
            className="screening-score-progress"
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            strokeDasharray={RING_CIRC}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        ) : null}
      </svg>
      <div className="screening-score-value">
        {masked ? (
          <span className="screening-score-number is-masked">?</span>
        ) : (
          <>
            <span className="screening-score-number">{counted}</span>
            <span className="screening-score-unit">/ 100</span>
          </>
        )}
      </div>
    </div>
  );
}

function FactorBar({
  factor,
  masked,
  animate,
  index,
}: {
  factor: ResultFactor;
  masked?: boolean;
  animate: boolean;
  index: number;
}) {
  const ratio = masked
    ? 0
    : factor.max === 0
      ? 0
      : (factor.value / factor.max) * 100;
  const width = !masked && animate ? Math.min(100, Math.max(0, ratio)) : 0;

  return (
    <div className="screening-factor">
      <div className="screening-factor-top">
        <span className="screening-factor-label">{factor.label}</span>
        <span className="screening-factor-value">
          {masked ? "?/?" : `${factor.value}/${factor.max}`}
        </span>
      </div>
      <div className="screening-factor-track" aria-hidden="true">
        <span
          className={`screening-factor-fill tone-${masked ? "low" : factor.tone}`}
          style={{
            width: `${width}%`,
            transitionDelay: animate ? `${180 + index * 140}ms` : "0ms",
          }}
        />
      </div>
    </div>
  );
}

export default function ResultCard({
  result,
  percent,
  answers,
  titleId,
  masked = false,
}: ResultCardProps) {
  const factors = masked ? MASKED_FACTORS : getResultFactors(answers);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (masked) {
      setAnimate(false);
      return;
    }

    const frame = requestAnimationFrame(() => {
      setAnimate(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [masked, percent, answers]);

  return (
    <div
      className={`screening-result-panel tone-${masked ? "masked" : result.id}${animate ? " is-animated" : ""}`}
    >
      <div className="screening-result-panel-head">
        <p className="screening-result-panel-kicker">
          Fáze 1 dokončena · Orientační skóre
        </p>
        <h2 id={titleId} className="screening-result-panel-title">
          {result.title}
        </h2>
        <p className="screening-result-panel-summary">
          {masked
            ? "Orientační profil a faktorová analýza budou viditelné po odemčení výsledku."
            : result.summary}
        </p>
      </div>

      <div className="screening-result-grid">
        <div className="screening-result-score-col">
          <ScoreRing
            percent={percent}
            tone={result.id}
            masked={masked}
            animate={animate}
          />
          <p className="screening-result-profile">
            Profil: <strong>{masked ? "?" : result.profileLabel}</strong>
          </p>
          <span
            className={`screening-result-badge tone-${masked ? "masked" : result.id}`}
          >
            {masked ? "Skryto" : result.badge}
          </span>
          <p className="screening-result-note">
            {masked
              ? "Detaily profilu se zobrazí po zadání e-mailu."
              : result.note}
          </p>
        </div>

        <div className="screening-result-factors-col">
          <p className="screening-result-factors-title">Faktorová analýza</p>
          <div className="screening-factors">
            {factors.map((factor, index) => (
              <FactorBar
                key={factor.id}
                factor={factor}
                masked={masked}
                animate={animate}
                index={index}
              />
            ))}
          </div>
          <div className="screening-result-interpretation">
            <p className="screening-result-interpretation-title">
              Interpretace výsledků
            </p>
            <p>
              {masked
                ? "Shrnutí podle vašich odpovědí se odemkne spolu s celým výsledkem."
                : result.interpretation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
