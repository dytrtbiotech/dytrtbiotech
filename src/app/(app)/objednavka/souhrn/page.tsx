"use client";

import {
  formatCzk,
  getDoctor,
  getNextTask,
  getPanel,
  isPaidStatus,
} from "@/lib/order/config";
import {
  loadOrder,
  markOrderPaid,
  saveCheckoutDetails,
} from "@/lib/order/storage";
import { loadAuthUser, loadEmail } from "@/lib/screening/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [panelId, setPanelId] = useState<string | undefined>();
  const [doctorId, setDoctorId] = useState<string | undefined>();
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const order = loadOrder();
    const auth = loadAuthUser();
    setEmail(loadEmail() || auth?.email || "");
    setFullName(order?.fullName || auth?.fullName || "");
    setPhone(order?.phone || auth?.phone || "");
    setPanelId(order?.panelId);
    setDoctorId(order?.doctorId);
    setStatus(order?.status ?? "");
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="app-loading">Načítání…</div>;
  }

  const panel = getPanel(panelId as never);
  const doctor = getDoctor(doctorId);

  if (!panel) {
    return (
      <>
        <h1>Nejdřív vyberte panel</h1>
        <Link className="button" href="/objednavka/panel">
          Vybrat panel
        </Link>
      </>
    );
  }

  if (!doctor) {
    return (
      <>
        <h1>Nejdřív vyberte lékaře</h1>
        <Link className="button" href="/objednavka/lekar">
          Vybrat lékaře
        </Link>
      </>
    );
  }

  if (isPaidStatus(status as never)) {
    const task = getNextTask(loadOrder());
    return (
      <>
        <h1>Objednávka už běží</h1>
        <p className="app-lead">{task.body}</p>
        {task.href && task.ctaLabel ? (
          <Link className="button" href={task.href}>
            {task.ctaLabel}
          </Link>
        ) : (
          <Link className="button" href="/prehled">
            Zpět na přehled
          </Link>
        )}
      </>
    );
  }

  const pay = () => {
    if (!fullName.trim()) {
      setError("Zadejte jméno a příjmení.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      setError("Zadejte telefonní číslo.");
      return;
    }
    setError("");
    saveCheckoutDetails({
      fullName: fullName.trim(),
      phone: phone.trim(),
    });
    markOrderPaid();
    router.push("/prehled");
  };

  return (
    <>
      <h1>Souhrn objednávky</h1>
      <p className="app-lead app-lead--nowrap">
        Zkontrolujte údaje. Platba v této verzi je simulovaná - kartové údaje se
        nikam nezadávají.
      </p>

      <div className="checkout-layout">
        <section
          className="summary-block checkout-details"
          aria-labelledby="summary-details"
        >
          <h2 id="summary-details">Vaše údaje</h2>
          <div className="checkout-fields">
            <div className="checkout-field">
              <label htmlFor="checkout-name">Jméno a příjmení</label>
              <input
                id="checkout-name"
                className="app-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="checkout-field">
              <label htmlFor="checkout-email">E-mail</label>
              <input
                id="checkout-email"
                className="app-input"
                type="email"
                value={email}
                readOnly
              />
            </div>
            <div className="checkout-field">
              <label htmlFor="checkout-phone">Telefon</label>
              <input
                id="checkout-phone"
                className="app-input"
                type="tel"
                inputMode="tel"
                placeholder="+420 …"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>
          {error ? <p className="app-error">{error}</p> : null}
          <p className="checkout-legal">
            Pokračováním potvrzujete údaje objednávky a souhlasíte s předáním
            potřebných informací laboratoři a zvolenému lékaři. Ostré platební a
            právní znění doplníme později.
          </p>
          <Link className="text-link checkout-back" href="/objednavka/lekar">
            Zpět
          </Link>
        </section>

        <aside
          className="summary-block checkout-summary"
          aria-labelledby="checkout-summary-title"
        >
          <h2 id="checkout-summary-title">Shrnutí objednávky</h2>

          <div className="checkout-summary-section">
            <div className="summary-block-head">
              <h3>Laboratorní vyšetření</h3>
              <Link href="/objednavka/panel">Upravit</Link>
            </div>
            <p className="summary-strong">{panel.name}</p>
            <p className="summary-price">{formatCzk(panel.priceCzk)}</p>
          </div>

          <div className="checkout-summary-section">
            <div className="summary-block-head">
              <h3>Lékař</h3>
              <Link href="/objednavka/lekar">Upravit</Link>
            </div>
            <p className="summary-strong">{doctor.name}</p>
            <p>
              {doctor.specialty} · {doctor.city}
            </p>
          </div>

          <div className="checkout-summary-total">
            <div className="checkout-summary-total-row">
              <span>Celkem k úhradě</span>
              <strong className="summary-price">
                {formatCzk(panel.priceCzk)}
              </strong>
            </div>
            <p className="checkout-summary-note">
              Cena laboratorního panelu. Konzultace u lékaře se řeší zvlášť.
            </p>
          </div>

          <button className="button checkout-summary-cta" type="button" onClick={pay}>
            Objednat a zaplatit {formatCzk(panel.priceCzk)}
          </button>
        </aside>
      </div>
    </>
  );
}
