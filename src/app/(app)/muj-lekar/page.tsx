"use client";

import { getDoctor } from "@/lib/order/config";
import { loadOrder } from "@/lib/order/storage";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MujLekarPage() {
  const [ready, setReady] = useState(false);
  const [hasPanel, setHasPanel] = useState(false);
  const [doctorId, setDoctorId] = useState<string | undefined>();

  useEffect(() => {
    const order = loadOrder();
    setHasPanel(Boolean(order?.panelId));
    setDoctorId(order?.doctorId);
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="app-loading">Načítání…</div>;
  }

  const doctor = getDoctor(doctorId);

  return (
    <>
      <header className="app-topbar">
        <div>
          <p className="app-topbar-kicker">Klientská aplikace</p>
          <p className="app-topbar-title">Můj lékař</p>
        </div>
      </header>
      <div className="app-content">
        <h1>Můj lékař</h1>
        {!hasPanel ? (
          <>
            <p className="app-lead">
              Lékaře vybíráte až po volbě laboratorního panelu.
            </p>
            <Link className="button" href="/objednavka/panel">
              Vybrat panel
            </Link>
          </>
        ) : !doctor ? (
          <>
            <p className="app-lead">
              Zatím nemáte zvoleného lékaře. Tomuto lékaři budou předány
              výsledky vyšetření.
            </p>
            <Link className="button" href="/objednavka/lekar">
              Vybrat lékaře
            </Link>
          </>
        ) : (
          <>
            <p className="app-lead">
              Výsledky laboratorního vyšetření předáme tomuto lékaři.
            </p>
            <section className="summary-block">
              <div className="doctor-card-head">
                <h2>{doctor.name}</h2>
                <span className="demo-badge">Demo</span>
              </div>
              <p>{doctor.specialty}</p>
              <p>
                {doctor.address}
                <br />
                {doctor.city}
              </p>
              <p>{doctor.contact}</p>
              <p className="doctor-note">{doctor.consultationNote}</p>
            </section>
            <Link className="text-link" href="/objednavka/lekar">
              Změnit lékaře
            </Link>
          </>
        )}
      </div>
    </>
  );
}
