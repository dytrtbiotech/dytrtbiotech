"use client";

import {
  formatCzk,
  getDoctor,
  getJourneyPhases,
  getPanel,
  isHairScopeDone,
  isPaidStatus,
  journeyStateLabel,
  statusLabel,
  type JourneyPhase,
  type OrderDraft,
} from "@/lib/order/config";
import { loadOrder } from "@/lib/order/storage";
import { evaluateResult } from "@/lib/screening/config";
import { loadAnswers } from "@/lib/screening/storage";
import Link from "next/link";
import { useEffect, useState } from "react";

function hairScopeStatusLabel(order: OrderDraft | null) {
  switch (order?.hairScopeStatus) {
    case "completed":
      return "Dokončeno";
    case "skipped":
      return "Přeskočeno";
    default:
      return "Nezahájeno";
  }
}

export default function PrubehPecePage() {
  const [ready, setReady] = useState(false);
  const [order, setOrder] = useState<OrderDraft | null>(null);
  const [screeningTitle, setScreeningTitle] = useState("");
  const [screeningSummary, setScreeningSummary] = useState("");
  const [hasScreening, setHasScreening] = useState(false);

  useEffect(() => {
    const current = loadOrder();
    const answers = loadAnswers();
    const result = evaluateResult(answers);
    setOrder(current);
    setHasScreening(Object.keys(answers).length > 0);
    setScreeningTitle(result.title);
    setScreeningSummary(result.summary);
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="app-loading">Načítání…</div>;
  }

  const phases = getJourneyPhases(order);
  const panel = getPanel(order?.panelId);
  const doctor = getDoctor(order?.doctorId);
  const paid = isPaidStatus(order?.status);
  const hairDone = isHairScopeDone(order);
  const phaseById = Object.fromEntries(
    phases.map((phase) => [phase.id, phase])
  ) as Record<JourneyPhase["id"], JourneyPhase>;

  return (
    <>
      <header className="app-topbar">
        <div>
          <p className="app-topbar-kicker">Klientská aplikace</p>
          <p className="app-topbar-title">Průběh péče</p>
        </div>
      </header>
      <div className="app-content">
        <h1>Průběh péče</h1>
        <p className="app-lead">
          Celý váš proces na jednom místě - od screeningu po další postup.
        </p>

        <ol className="journey-timeline">
          <li
            className={`journey-step is-${phaseById.screening.state}`}
          >
            <div className="journey-rail" aria-hidden="true">
              <span className="journey-dot" />
              <span className="journey-line" />
            </div>
            <article className="journey-card">
              <div className="journey-card-head">
                <h2>Screening</h2>
                <span className="journey-badge">
                  {journeyStateLabel(phaseById.screening.state)}
                </span>
              </div>
              {hasScreening ? (
                <>
                  <p className="journey-strong">{screeningTitle}</p>
                  <p>{screeningSummary}</p>
                  <div className="journey-actions">
                    <Link className="button secondary" href="/profil">
                      Zobrazit výsledek screeningu
                    </Link>
                  </div>
                </>
              ) : (
                <p>
                  Screening k tomuto účtu zatím nemáme uložený. Pokud jste ho
                  právě dokončili, obnovte stránku.
                </p>
              )}
            </article>
          </li>

          <li className={`journey-step is-${phaseById.lab.state}`}>
            <div className="journey-rail" aria-hidden="true">
              <span className="journey-dot" />
              <span className="journey-line" />
            </div>
            <article className="journey-card">
              <div className="journey-card-head">
                <h2>Laboratorní vyšetření</h2>
                <span className="journey-badge">
                  {journeyStateLabel(phaseById.lab.state)}
                </span>
              </div>

              {!panel ? (
                <>
                  <p>
                    Zatím nemáte vybrané laboratorní vyšetření. Objednávku
                    dokončíte ve třech krátkých krocích.
                  </p>
                  <div className="journey-actions">
                    <Link className="button" href="/objednavka/panel">
                      Vybrat vyšetření
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <dl className="journey-meta">
                    <div>
                      <dt>Panel</dt>
                      <dd>{panel.name}</dd>
                    </div>
                    <div>
                      <dt>Cena</dt>
                      <dd>{formatCzk(panel.priceCzk)}</dd>
                    </div>
                    {order?.orderNumber ? (
                      <div>
                        <dt>Objednávka</dt>
                        <dd>{order.orderNumber}</dd>
                      </div>
                    ) : null}
                    {doctor ? (
                      <div>
                        <dt>Lékař</dt>
                        <dd>
                          {doctor.name} · {doctor.city}
                        </dd>
                      </div>
                    ) : (
                      <div>
                        <dt>Lékař</dt>
                        <dd>Zatím nevybrán</dd>
                      </div>
                    )}
                    <div>
                      <dt>Stav</dt>
                      <dd>{statusLabel(order?.status)}</dd>
                    </div>
                  </dl>

                  {order?.collectionRef ? (
                    <p className="meta-line">
                      Reference k odběru: {order.collectionRef}
                    </p>
                  ) : null}
                  {order?.documentsReadyAt ? (
                    <p className="meta-line">
                      Podklady připraveny:{" "}
                      {new Date(order.documentsReadyAt).toLocaleString("cs-CZ")}
                    </p>
                  ) : null}
                  {order?.collectionReportedAt ? (
                    <p className="meta-line">
                      Odběr nahlášen:{" "}
                      {new Date(order.collectionReportedAt).toLocaleString(
                        "cs-CZ"
                      )}
                    </p>
                  ) : null}
                  {order?.resultsDeliveredAt ? (
                    <p className="meta-line">
                      Výsledky předány:{" "}
                      {new Date(order.resultsDeliveredAt).toLocaleString(
                        "cs-CZ"
                      )}
                    </p>
                  ) : null}

                  {!paid ? (
                    <div className="journey-actions">
                      <Link
                        className="button"
                        href={
                          !order?.doctorId
                            ? "/objednavka/lekar"
                            : "/objednavka/souhrn"
                        }
                      >
                        Dokončit objednávku
                      </Link>
                    </div>
                  ) : (
                    <div className="journey-actions">
                      <Link className="button secondary" href="/vysetreni">
                        Detail vyšetření
                      </Link>
                    </div>
                  )}
                </>
              )}
            </article>
          </li>

          <li className={`journey-step is-${phaseById.hairscope.state}`}>
            <div className="journey-rail" aria-hidden="true">
              <span className="journey-dot" />
              <span className="journey-line" />
            </div>
            <article className="journey-card">
              <div className="journey-card-head">
                <h2>Analýza vlasů</h2>
                <span className="journey-badge">
                  {journeyStateLabel(phaseById.hairscope.state)}
                </span>
              </div>

              {phaseById.hairscope.state === "locked" ? (
                <p>
                  Analýza vlasů se odemkne po zaplacení laboratorního vyšetření.
                  Pak ji můžete dokončit během čekání na výsledky.
                </p>
              ) : hairDone ? (
                <>
                  <p>
                    Stav: {hairScopeStatusLabel(order)}
                    {order?.hairScopeCompletedAt
                      ? ` · ${new Date(
                          order.hairScopeCompletedAt
                        ).toLocaleString("cs-CZ")}`
                      : ""}
                  </p>
                  <p>
                    Analýza je dokončená. Detailní výstup bude dostupný po
                    napojení HairScope widgetu.
                  </p>
                  <div className="journey-actions">
                    <Link className="button secondary" href="/hairscope">
                      Zobrazit analýzu
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    Laboratorní vyšetření může běžet na pozadí. Analýzu vlasů
                    můžete doplnit teď — není povinná, ale pomůže k úplnějšímu
                    podkladu.
                  </p>
                  <div className="journey-actions">
                    <Link className="button" href="/hairscope">
                      Spustit analýzu
                    </Link>
                  </div>
                </>
              )}
            </article>
          </li>

          <li className={`journey-step is-${phaseById.consult.state}`}>
            <div className="journey-rail" aria-hidden="true">
              <span className="journey-dot" />
              <span className="journey-line" />
            </div>
            <article className="journey-card">
              <div className="journey-card-head">
                <h2>Konzultace</h2>
                <span className="journey-badge">
                  {journeyStateLabel(phaseById.consult.state)}
                </span>
              </div>

              {doctor ? (
                <p className="journey-strong">
                  {doctor.name} · {doctor.city}
                </p>
              ) : (
                <p>Lékař bude známý po dokončení objednávky.</p>
              )}

              {phaseById.consult.state === "locked" ? (
                <p>
                  Konzultaci otevřeme, až laboratoř předá výsledky zvolenému
                  lékaři.
                </p>
              ) : phaseById.consult.state === "done" ? (
                <>
                  <p>
                    Závěr konzultace je nahlášen
                    {order?.consultationOutcome
                      ? `: ${
                          order.consultationOutcome === "recommended"
                            ? "lékař doporučil pokračovat"
                            : "program zatím neodemyká"
                        }`
                      : ""}
                    . Zdroj: vaše zadání v aplikaci.
                  </p>
                  <div className="journey-actions">
                    <Link className="text-link" href="/konzultace">
                      Detail konzultace
                    </Link>
                  </div>
                </>
              ) : order?.consultationAttendedAt ? (
                <>
                  <p>
                    Konzultace proběhla. Nahlaste závěr podle informace od
                    lékaře — aplikace sama vhodnost nevyhodnocuje.
                  </p>
                  <div className="journey-actions">
                    <Link className="button" href="/konzultace">
                      Nahlásit závěr
                    </Link>
                  </div>
                </>
              ) : order?.status === "consultation_reported" ||
                order?.consultationBookedAt ? (
                <>
                  <p>
                    Rezervaci evidujeme
                    {order?.consultationAt
                      ? ` (termín ${order.consultationAt})`
                      : ""}
                    . Až konzultace proběhne, označte to v aplikaci.
                  </p>
                  <div className="journey-actions">
                    <Link className="button" href="/konzultace">
                      Otevřít konzultaci
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    Výsledky jsou u lékaře. Objednejte se přes rezervační systém
                    ordinace a v aplikaci označte rezervaci.
                  </p>
                  <div className="journey-actions">
                    <Link className="button" href="/konzultace">
                      Pokračovat ke konzultaci
                    </Link>
                  </div>
                </>
              )}
            </article>
          </li>

          <li className={`journey-step is-${phaseById.next.state}`}>
            <div className="journey-rail" aria-hidden="true">
              <span className="journey-dot" />
              <span className="journey-line" />
            </div>
            <article className="journey-card">
              <div className="journey-card-head">
                <h2>Program</h2>
                <span className="journey-badge">
                  {journeyStateLabel(phaseById.next.state)}
                </span>
              </div>

              {phaseById.next.state === "locked" ? (
                <p>
                  Program se odemkne jen pokud nahlásíte, že vám lékař doporučil
                  pokračovat. Jiné závěry program neotevírají.
                </p>
              ) : (
                <>
                  <p>
                    Program je odemčený podle vámi nahlášeného závěru
                    konzultace. Můžete si prohlédnout další postup.
                  </p>
                  <div className="journey-actions">
                    <Link className="button" href="/plan-pece">
                      Zobrazit program
                    </Link>
                  </div>
                </>
              )}
            </article>
          </li>
        </ol>
      </div>
    </>
  );
}
