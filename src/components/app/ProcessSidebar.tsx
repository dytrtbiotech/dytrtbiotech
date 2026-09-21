"use client";

import type { ProcessPhase } from "@/lib/order/process-sidebar";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type ProcessSidebarProps = {
  phases: ProcessPhase[];
  currentMeta?: string;
  brandHref?: string;
  footer?: ReactNode;
};

function PhaseCheckIcon() {
  return (
    <svg
      className="process-phase-check"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path
        d="M3.2 8.2 6.4 11.4 12.8 4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProcessSidebar({
  phases,
  currentMeta,
  brandHref = "/prehled",
  footer,
}: ProcessSidebarProps) {
  return (
    <aside className="process-aside" aria-label="Průběh procesu">
      <Link className="process-brand" href={brandHref} aria-label="FOLLICAD">
        <Image
          className="process-brand-img"
          src="/follicad-logo.png"
          alt="FOLLICAD"
          width={200}
          height={44}
          priority
        />
      </Link>

      <ol className="process-phases">
        {phases.map((phase, index) => {
          const stateClass =
            phase.state === "done"
              ? " is-done"
              : phase.state === "current"
                ? " is-active"
                : " is-upcoming";

          return (
            <li key={phase.id} className={`process-phase${stateClass}`}>
              <span className="process-phase-index" aria-hidden="true">
                {phase.state === "done" ? <PhaseCheckIcon /> : index + 1}
              </span>
              <span className="process-phase-copy">
                <span className="process-phase-label">{phase.label}</span>
                {phase.state === "current" && currentMeta ? (
                  <span className="process-phase-meta">{currentMeta}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>

      {footer}
    </aside>
  );
}
