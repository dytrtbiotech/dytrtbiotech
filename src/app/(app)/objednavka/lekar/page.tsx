"use client";

import { DEMO_DOCTORS } from "@/lib/order/config";
import { loadOrder, selectDoctor } from "@/lib/order/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function DoctorPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [hasPanel, setHasPanel] = useState(false);

  useEffect(() => {
    const order = loadOrder();
    setHasPanel(Boolean(order?.panelId));
    if (order?.doctorId) setSelected(order.doctorId);
    setReady(true);
  }, []);

  const doctors = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEMO_DOCTORS;
    return DEMO_DOCTORS.filter(
      (d) =>
        d.city.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q)
    );
  }, [query]);

  if (!ready) {
    return <div className="app-loading">Načítání…</div>;
  }

  if (!hasPanel) {
    return (
      <>
        <h1>Nejdřív vyberte panel</h1>
        <p className="app-lead">
          Výběr lékaře navazuje na laboratorní vyšetření.
        </p>
        <Link className="button" href="/objednavka/panel">
          Vybrat panel
        </Link>
      </>
    );
  }

  return (
    <>
      <h1>Vyberte lékaře pro svou konzultaci</h1>
      <p className="app-lead app-lead--nowrap">
        Tomuto lékaři budou předány výsledky laboratorního vyšetření. Seznam je ukázkové demo - neobjednávejte podle něj v ostrém provozu.
      </p>

      <div className="doctor-search">
        <label className="screening-label" htmlFor="doctor-query">
          Hledat podle města nebo jména
        </label>
        <div className="doctor-search-field">
          <svg
            className="doctor-search-icon"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden="true"
            focusable="false"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M20 20l-3.5-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            id="doctor-query"
            className="app-input doctor-search-input"
            type="search"
            placeholder="Např. Praha"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="doctor-grid" role="radiogroup" aria-label="Lékaři">
        {doctors.map((doctor) => {
          const isSelected = selected === doctor.id;
          return (
            <button
              key={doctor.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`doctor-card${isSelected ? " is-selected" : ""}`}
              onClick={() => setSelected(doctor.id)}
            >
              <div className="doctor-card-head">
                <h2>{doctor.name}</h2>
                <span className="demo-badge">Demo</span>
              </div>
              <p className="doctor-specialty">{doctor.specialty}</p>
              <p className="doctor-address">
                {doctor.address}
                <br />
                {doctor.city}
              </p>
              <p className="doctor-contact">{doctor.contact}</p>
              <p className="doctor-note">{doctor.consultationNote}</p>
            </button>
          );
        })}
      </div>

      {doctors.length === 0 ? (
        <p className="app-empty">
          Pro zadané hledání jsme nenašli žádného lékaře. Upravte město nebo
          jméno.
        </p>
      ) : null}

      <div className="order-actions order-actions--doctor">
        <Link className="button order-back" href="/objednavka/panel">
          Zpět k panelu
        </Link>
        <p className="doctor-choice-notice">
          Lékaře po předání výsledků už nepůjde změnit. Vyberte ho prosím
          pečlivě.
        </p>
        <button
          className="button"
          type="button"
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            selectDoctor(selected);
            router.push("/objednavka/souhrn");
          }}
        >
          Potvrdit lékaře a pokračovat
        </button>
      </div>
    </>
  );
}
