"use client";

import {
  CARE_PROGRAM,
  createEmptyVisits,
  formatCzk,
  getConsultationOutcomeMeta,
  getDoctor,
  isProgramUnlocked,
  visitStatusLabel,
  type CareVisit,
  type OrderDraft,
} from "@/lib/order/config";
import { loadOrder, markCarePaid, setVisitStatus } from "@/lib/order/storage";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function PlanPecePage() {
  const [ready, setReady] = useState(false);
  const [order, setOrder] = useState<OrderDraft | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [visitDate, setVisitDate] = useState("");
  const [visitNote, setVisitNote] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setOrder(loadOrder());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  if (!ready) {
    return <div className="app-loading">Načítání…</div>;
  }

  const doctor = getDoctor(order?.doctorId);
  const status = order?.status;
  const visits: CareVisit[] =
    order?.visits?.length ? order.visits : createEmptyVisits();
  const unlocked = isProgramUnlocked(order);
  const outcomeMeta = getConsultationOutcomeMeta(order?.consultationOutcome);
  const outcomeLocked =
    Boolean(order?.consultationOutcome) &&
    order?.consultationOutcome !== "recommended" &&
    !unlocked;

  return (
    <>
      <header className="app-topbar">
        <div>
          <p className="app-topbar-kicker">Klientská aplikace</p>
          <p className="app-topbar-title">Program</p>
        </div>
      </header>
      <div className="app-content">
        <h1>Program</h1>

        {!unlocked && !outcomeLocked ? (
          <>
            <p className="app-lead">
              Program se odemkne až po konzultaci, pokud nahlásíte, že vám lékař
              doporučil pokračovat. Aplikace sama vhodnost nevyhodnocuje.
            </p>
            <div className="flow-actions">
              <Link className="button" href="/konzultace">
                Ke konzultaci
              </Link>
              <Link className="text-link" href="/prehled">
                Zpět na přehled
              </Link>
            </div>
          </>
        ) : null}

        {outcomeLocked ? (
          <>
            <p className="app-lead">
              Program zůstává zamčený podle vámi nahlášeného závěru konzultace.
            </p>
            <section className="flow-card">
              <h2>Nahlášený závěr</h2>
              <p className="journey-strong">{outcomeMeta?.label}</p>
              <p>
                {outcomeMeta?.lockedBody ||
                  "Nákup programu teď není dostupný."}
              </p>
              <p className="flow-note">
                Zdroj: informace, kterou jste zadali vy — ne automatické
                hodnocení aplikace.
              </p>
              <div className="flow-actions">
                <Link className="button secondary" href="/konzultace">
                  Upravit závěr konzultace
                </Link>
              </div>
            </section>
          </>
        ) : null}

        {status === "continue_approved" ||
        (unlocked &&
          status !== "care_paid" &&
          status !== "care_completed") ? (
          <>
            <p className="app-lead app-lead--nowrap">
              Program je odemčený podle vámi nahlášeného závěru konzultace.
              Níže je pracovní náhled - samotný nákup připravíme v další fázi.
            </p>

            <section className="summary-block care-offer">
              <h2>{CARE_PROGRAM.name}</h2>
              <p className="summary-price">
                {formatCzk(CARE_PROGRAM.priceCzk)}
              </p>
              <p>
                {CARE_PROGRAM.sessions} aplikací · cca{" "}
                {CARE_PROGRAM.durationMonths} měsíců
                {doctor ? ` · ${doctor.name}, ${doctor.city}` : ""}
              </p>
              <ul className="instruction-list">
                {CARE_PROGRAM.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <div className="order-actions">
              <Link className="button secondary" href="/prehled">
                Zpět
              </Link>
              <button
                className="button"
                type="button"
                onClick={() => {
                  markCarePaid();
                  refresh();
                }}
              >
                Simulovat platbu (demo)
              </button>
            </div>
          </>
        ) : null}

        {status === "care_paid" || status === "care_completed" ? (
          <>
            <p className="app-lead">
              {status === "care_completed"
                ? "Program máte uzavřený. Níže je historie návštěv."
                : "Platba za program byla přijata. Domluvte si návštěvy s ordinací a evidujte je zde."}
            </p>

            <section className="summary-block">
              <h2>{CARE_PROGRAM.name}</h2>
              {order?.careOrderNumber ? (
                <p>Objednávka programu: {order.careOrderNumber}</p>
              ) : null}
              {doctor ? (
                <p>
                  Ordinace: {doctor.name} · {doctor.contact}
                </p>
              ) : null}
              <p className="meta-line">
                Termíny nejsou automaticky rezervované. Intervaly určuje
                ordinace.
              </p>
            </section>

            <section className="visits-section" aria-labelledby="visits-title">
              <h2 id="visits-title">Návštěvy 1–{CARE_PROGRAM.sessions}</h2>
              <ol className="visit-list">
                {visits.map((visit) => (
                  <li key={visit.index} className="visit-card">
                    <div className="visit-card-head">
                      <h3>Návštěva {visit.index}</h3>
                      <span
                        className={`visit-badge visit-badge--${visit.status}`}
                      >
                        {visitStatusLabel(visit.status)}
                      </span>
                    </div>
                    {visit.scheduledAt ? (
                      <p>Nahlášený termín: {visit.scheduledAt}</p>
                    ) : (
                      <p>Datum zatím není zadané.</p>
                    )}
                    {visit.note ? <p>{visit.note}</p> : null}
                    {visit.completedAt ? (
                      <p className="meta-line">
                        Absolvováno:{" "}
                        {new Date(visit.completedAt).toLocaleString("cs-CZ")}
                      </p>
                    ) : null}

                    {status === "care_paid" && visit.status !== "completed" ? (
                      <div className="flow-actions">
                        <button
                          className="text-link"
                          type="button"
                          onClick={() => {
                            setEditingIndex(visit.index);
                            setVisitDate(
                              visit.scheduledAt?.replace(" ", "T") ?? ""
                            );
                            setVisitNote(visit.note ?? "");
                            setError("");
                          }}
                        >
                          Nahlásit / upravit termín
                        </button>
                        {visit.status === "user_reported" ? (
                          <button
                            className="button secondary"
                            type="button"
                            onClick={() => {
                              setVisitStatus(visit.index, "completed", {
                                scheduledAt: visit.scheduledAt,
                                note: visit.note,
                              });
                              refresh();
                            }}
                          >
                            Označit jako absolvované
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {editingIndex === visit.index ? (
                      <div className="visit-edit">
                        <div className="checkout-fields">
                          <div className="checkout-field">
                            <label htmlFor={`visit-date-${visit.index}`}>
                              Termín (zadáno vámi)
                            </label>
                            <input
                              id={`visit-date-${visit.index}`}
                              className="app-input"
                              type="datetime-local"
                              value={visitDate}
                              onChange={(e) => setVisitDate(e.target.value)}
                            />
                          </div>
                          <div className="checkout-field">
                            <label htmlFor={`visit-note-${visit.index}`}>
                              Poznámka
                            </label>
                            <input
                              id={`visit-note-${visit.index}`}
                              className="app-input"
                              value={visitNote}
                              onChange={(e) => setVisitNote(e.target.value)}
                            />
                          </div>
                        </div>
                        {error ? <p className="app-error">{error}</p> : null}
                        <div className="flow-actions">
                          <button
                            className="button"
                            type="button"
                            onClick={() => {
                              if (!visitDate) {
                                setError("Zadejte termín návštěvy.");
                                return;
                              }
                              setError("");
                              setVisitStatus(visit.index, "user_reported", {
                                scheduledAt: visitDate.replace("T", " "),
                                note: visitNote,
                              });
                              setEditingIndex(null);
                              refresh();
                            }}
                          >
                            Uložit termín
                          </button>
                          <button
                            className="text-link"
                            type="button"
                            onClick={() => setEditingIndex(null)}
                          >
                            Zrušit
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>

            <section className="flow-card">
              <h2>Moje fotografie</h2>
              <p>
                Volitelná fotodokumentace s náhledem a manuálním porovnáním
                snímků. Nahrání není podmínkou péče.
              </p>
              <Link className="button" href="/fotografie">
                Otevřít fotografie
              </Link>
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}
