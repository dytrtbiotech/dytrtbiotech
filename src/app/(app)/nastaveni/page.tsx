"use client";

import {
  loadAuthUser,
  updateAuthProfile,
  type AuthUser,
} from "@/lib/screening/storage";
import { clearOrder, loadOrder, updateOrder } from "@/lib/order/storage";
import { clearPhotos } from "@/lib/photos/storage";
import Link from "next/link";
import { useEffect, useState } from "react";

function splitName(fullName?: string) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export default function NastaveniPage() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const auth = loadAuthUser();
    const order = loadOrder();
    const name = splitName(auth?.fullName || order?.fullName || "");
    setUser(auth);
    setFirstName(name.firstName);
    setLastName(name.lastName);
    setPhone(auth?.phone || order?.phone || "");
    setReady(true);
  }, []);

  if (!ready || !user) {
    return <div className="app-loading">Načítání…</div>;
  }

  return (
    <>
      <header className="app-topbar">
        <div>
          <p className="app-topbar-kicker">Klientská aplikace</p>
          <p className="app-topbar-title">Nastavení</p>
        </div>
      </header>
      <div className="app-content">
        <h1>Nastavení</h1>
        <p className="app-lead">
          Údaje účtu pro návrat do aplikace. Ostré ověření e-mailu a reset hesla
          doplníme s produkční autentizací.
        </p>

        <section className="summary-block" aria-labelledby="settings-personal">
          <h2 id="settings-personal">Osobní údaje</h2>
          <div className="checkout-fields">
            <div className="checkout-field">
              <label htmlFor="settings-first-name">Jméno</label>
              <input
                id="settings-first-name"
                className="app-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div className="checkout-field">
              <label htmlFor="settings-last-name">Příjmení</label>
              <input
                id="settings-last-name"
                className="app-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
            <div className="checkout-field">
              <label htmlFor="settings-email">E-mail</label>
              <input
                id="settings-email"
                className="app-input"
                value={user.email}
                readOnly
              />
            </div>
            <div className="checkout-field">
              <label htmlFor="settings-phone">Telefon</label>
              <input
                id="settings-phone"
                className="app-input"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>
          {error ? <p className="app-error">{error}</p> : null}
          {message ? <p className="settings-ok">{message}</p> : null}
          <div className="flow-actions">
            <button
              className="button"
              type="button"
              onClick={() => {
                const fullName = [firstName.trim(), lastName.trim()]
                  .filter(Boolean)
                  .join(" ");
                if (!fullName) {
                  setError("Zadejte jméno a příjmení.");
                  setMessage("");
                  return;
                }
                setError("");
                const next = updateAuthProfile({
                  fullName,
                  phone: phone.trim() || undefined,
                });
                if (next) setUser(next);
                const order = loadOrder();
                if (order) {
                  updateOrder({
                    fullName,
                    phone: phone.trim() || order.phone,
                  });
                }
                setMessage("Údaje jsou uložené.");
              }}
            >
              Uložit změny
            </button>
          </div>
        </section>

        <section className="flow-card">
          <h2>Demo data</h2>
          <p>
            Pro vývoj můžete vymazat objednávky a fotografie. Účet zůstane
            přihlášený.
          </p>
          <div className="flow-actions">
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                clearOrder();
                clearPhotos();
                setMessage("Objednávky a fotografie jsou smazané.");
              }}
            >
              Vymazat objednávky a fotografie
            </button>
            <Link className="text-link" href="/prehled">
              Zpět na přehled
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
