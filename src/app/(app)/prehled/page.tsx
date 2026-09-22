"use client";

import {
  getCareProgress,
  getNextTask,
  type CareProgressStep,
  type NextTask,
  type OrderDraft,
} from "@/lib/order/config";
import { loadOrder } from "@/lib/order/storage";
import { loadAuthUser, loadEmail } from "@/lib/screening/storage";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PrehledPage() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [task, setTask] = useState<NextTask>(getNextTask(null));
  const [progress, setProgress] = useState<CareProgressStep[]>(
    getCareProgress(null)
  );

  useEffect(() => {
    const auth = loadAuthUser();
    const current: OrderDraft | null = loadOrder();
    setEmail(loadEmail() || auth?.email || "");
    setTask(getNextTask(current));
    setProgress(getCareProgress(current));
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="app-loading">Načítání…</div>;
  }

  const hasCta = Boolean(task.href && task.ctaLabel);

  return (
    <>
      <header className="app-topbar">
        <div>
          <p className="app-topbar-kicker">Klientská aplikace</p>
          <p className="app-topbar-title">Přehled</p>
        </div>
      </header>
      <div className="app-content">
        {email ? (
          <p className="app-welcome">Vítejte, {email}</p>
        ) : (
          <p className="app-welcome">Vítejte</p>
        )}
        <h1>Co mám udělat teď?</h1>

        <section
          className={`task-card${task.tone === "wait" ? " task-card--wait" : ""}`}
          aria-labelledby="task-title"
        >
          <h2 id="task-title">{task.title}</h2>
          {task.detail ? <p className="task-card-detail">{task.detail}</p> : null}
          <p>{task.body}</p>
          {hasCta ? (
            <div className="flow-actions">
              <Link className="button" href={task.href!}>
                {task.ctaLabel}
              </Link>
              {task.secondary ? (
                <Link className="text-link" href={task.secondary.href}>
                  {task.secondary.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="care-progress" aria-labelledby="progress-title">
          <div className="care-progress-head">
            <h2 id="progress-title" className="care-progress-title">
              Průběh péče
            </h2>
            <Link className="text-link care-progress-link" href="/prubeh-pece">
              Zobrazit průběh péče
            </Link>
          </div>
          <ol className="care-progress-track">
            {progress.map((step, index) => (
              <li
                key={step.id}
                className={`care-progress-step is-${step.state}`}
              >
                {index > 0 ? (
                  <span className="care-progress-connector" aria-hidden="true" />
                ) : null}
                <span className="care-progress-marker" aria-hidden="true">
                  {step.state === "done" ? (
                    <svg viewBox="0 0 16 16" width="12" height="12">
                      <path
                        d="M3.5 8.5 6.5 11.5 12.5 4.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>
                <span className="care-progress-label">{step.label}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
