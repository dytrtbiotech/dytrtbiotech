"use client";

import {
  CONSULTATION_OUTCOMES,
  getConsultationOutcomeMeta,
  getDoctor,
  isConsultationUnlocked,
  isProgramUnlocked,
  type ConsultationOutcome,
  type OrderDraft,
} from "@/lib/order/config";
import {
  loadOrder,
  markConsultationAttended,
  reportConsultationBooked,
  reportConsultationOutcome,
} from "@/lib/order/storage";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function KonzultacePage() {
  const [ready, setReady] = useState(false);
  const [order, setOrder] = useState<OrderDraft | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [selectedOutcome, setSelectedOutcome] =
    useState<ConsultationOutcome | "">("");
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    const current = loadOrder();
    setOrder(current);
    if (current?.consultationAt) {
      const [storedDate = "", storedTime = ""] =
        current.consultationAt.split(" ");
      setDate(storedDate);
      setTime(storedTime.slice(0, 5));
    }
    if (current?.consultationNote) setNote(current.consultationNote);
    if (current?.consultationOutcome) {
      setSelectedOutcome(current.consultationOutcome);
    }
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  if (!ready) {
    return <div className="app-loading">Načítání…</div>;
  }

  const doctor = getDoctor(order?.doctorId);
  const unlocked = isConsultationUnlocked(order);
  const booked =
    order?.status === "consultation_reported" ||
    order?.status === "continue_approved" ||
    order?.status === "care_paid" ||
    order?.status === "care_completed" ||
    Boolean(order?.consultationBookedAt);
  const attended = Boolean(order?.consultationAttendedAt);
  const outcome = order?.consultationOutcome;
  const outcomeMeta = getConsultationOutcomeMeta(outcome);
  const programOpen = isProgramUnlocked(order);

  return (
    <>
      <header className="app-topbar">
        <div>
          <p className="app-topbar-kicker">Klientská aplikace</p>
          <p className="app-topbar-title">Konzultace</p>
        </div>
      </header>
      <div className="app-content">
        <h1>Konzultace s lékařem</h1>

        {!doctor ? (
          <>
            <p className="app-lead">Nejdřív je potřeba zvolit lékaře.</p>
            <Link className="button" href="/objednavka/lekar">
              Vybrat lékaře
            </Link>
          </>
        ) : !unlocked ? (
          <>
            <p className="app-lead">
              Konzultaci otevřeme, až budou laboratorní výsledky předány
              vybranému lékaři.
            </p>
            <section className="summary-block">
              <h2>{doctor.name}</h2>
              <p>
                {doctor.specialty} · {doctor.city}
              </p>
              <p>{doctor.contact}</p>
            </section>
            <Link className="button" href="/vysetreni">
              Stav vyšetření
            </Link>
          </>
        ) : (
          <>
            <p className="app-lead app-lead--nowrap">
              Rezervaci řešíte přímo u ordinace. Aplikace jen eviduje, co
              nahlásíte, sama nevhodnost ani vhodnost nevyhodnocuje.
            </p>

            <section className="summary-block consult-doctor">
              <div className="doctor-card-head">
                <h2>{doctor.name}</h2>
                <span className="demo-badge">Demo</span>
              </div>
              <p className="consult-doctor-line">
                {doctor.specialty} · {doctor.city}
              </p>
              <p className="consult-doctor-line">
                {doctor.address} · {doctor.contact}
              </p>
              <div className="flow-actions consult-doctor-actions">
                <a
                  className="button"
                  href={doctor.bookingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Otevřít rezervační systém
                </a>
              </div>
              <p className="flow-note consult-doctor-note">
                Odkaz vede na externí systém ordinace. Termín si domluvíte tam.
              </p>
            </section>

            {!booked ? (
              <section className="flow-card consult-booking">
                <h2>Mám rezervovanou konzultaci</h2>
                <p>
                  Po objednání u ordinace označte rezervaci zde. Datum je
                  volitelné.
                </p>
                <div className="consult-booking-row">
                  <div className="checkout-field">
                    <label htmlFor="consult-date">Datum (volitelné)</label>
                    <input
                      id="consult-date"
                      className="app-input"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="consult-time">Čas (volitelné)</label>
                    <input
                      id="consult-time"
                      className="app-input"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="consult-note">Poznámka (volitelné)</label>
                    <input
                      id="consult-note"
                      className="app-input"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Např. objednáno online"
                    />
                  </div>
                  <div className="consult-booking-cta">
                    <button
                      className="button"
                      type="button"
                      onClick={() => {
                        const consultationAt =
                          date && time
                            ? `${date} ${time}`
                            : date
                              ? date
                              : time
                                ? time
                                : undefined;
                        reportConsultationBooked({
                          consultationAt,
                          consultationNote: note,
                        });
                        refresh();
                      }}
                    >
                      Potvrdit konzultaci
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <section className="flow-card">
                <h2>Rezervace evidována</h2>
                <p>
                  Nahlášený termín:{" "}
                  <strong>{order?.consultationAt ?? "nezadáno"}</strong>
                </p>
                {order?.consultationNote ? <p>{order.consultationNote}</p> : null}
                <p className="flow-note">Zdroj: zadání uživatele v aplikaci.</p>

                {!attended ? (
                  <div className="flow-actions">
                    <button
                      className="button"
                      type="button"
                      onClick={() => {
                        markConsultationAttended();
                        refresh();
                      }}
                    >
                      Konzultace proběhla
                    </button>
                  </div>
                ) : (
                  <p className="meta-line">
                    Absolvování nahlášeno{" "}
                    {order?.consultationAttendedAt
                      ? new Date(order.consultationAttendedAt).toLocaleString(
                          "cs-CZ"
                        )
                      : ""}
                    .
                  </p>
                )}
              </section>
            )}

            {attended || outcome || programOpen ? (
              <section className="flow-card">
                <h2>Jaký byl závěr konzultace?</h2>
                <p>
                  Vyberte možnost podle informace, kterou jste dostali od
                  lékaře. Aplikace závěr sama nevyhodnocuje — pouze ho
                  zaznamená.
                </p>
                <div
                  className="outcome-list"
                  role="radiogroup"
                  aria-label="Závěr konzultace"
                >
                  {CONSULTATION_OUTCOMES.map((item) => {
                    const isSelected = selectedOutcome === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        className={`outcome-option${isSelected ? " is-selected" : ""}`}
                        onClick={() => {
                          setSelectedOutcome(item.id);
                          setError("");
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                {error ? <p className="app-error">{error}</p> : null}
                <div className="flow-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      if (!selectedOutcome) {
                        setError("Vyberte jednu z možností.");
                        return;
                      }
                      setError("");
                      reportConsultationOutcome(selectedOutcome);
                      refresh();
                    }}
                  >
                    Uložit závěr
                  </button>
                </div>

                {outcome ? (
                  <>
                    <p className="meta-line">
                      Nahlášeno: {outcomeMeta?.label}
                      {order?.consultationOutcomeAt
                        ? ` · ${new Date(
                            order.consultationOutcomeAt
                          ).toLocaleString("cs-CZ")}`
                        : ""}
                    </p>
                    {programOpen ? (
                      <div className="flow-actions">
                        <Link className="button" href="/plan-pece">
                          Pokračovat k programu
                        </Link>
                      </div>
                    ) : (
                      <p className="flow-note">
                        {outcomeMeta?.lockedBody ||
                          "Program zůstává zamčený podle nahlášeného závěru."}
                      </p>
                    )}
                  </>
                ) : null}
              </section>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
