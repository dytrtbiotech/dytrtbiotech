"use client";

import {
  hydrateScreeningForUser,
  loadAuthUser,
  saveEmail,
  verifyLogin,
} from "@/lib/screening/storage";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "../dotaznik/screening.css";

export default function PrihlaseniPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loadAuthUser()) {
      router.replace("/prehled");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return <div className="screening-loading">Načítání…</div>;
  }

  return (
    <div className="screening">
      <aside className="screening-aside" aria-label="Navigace">
        <Link className="screening-brand" href="/" aria-label="FOLLICAD">
          <Image
            className="screening-brand-img"
            src="/follicad-logo.png"
            alt="FOLLICAD"
            width={200}
            height={44}
            priority
          />
        </Link>
        <p className="screening-aside-note">Návrat k účtu</p>
      </aside>
      <div className="screening-main">
        <header className="screening-topbar">
          <Link className="screening-exit" href="/">
            Zpět na úvod
          </Link>
        </header>
        <main className="screening-stage">
          <div className="screening-content">
            <span className="eyebrow">Přihlášení</span>
            <h1>Vítejte zpátky</h1>
            <p className="screening-lead">
              Přihlášením se vrátíte k uloženému profilu, objednávkám a dalším
              krokům péče. V demu funguje účet vytvořený po screeningu.
            </p>

            <div className="screening-fields">
              <div className="screening-field">
                <label className="screening-label" htmlFor="login-email">
                  E-mail
                </label>
                <input
                  id="login-email"
                  className="screening-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setError("");
                    setEmail(e.target.value);
                  }}
                />
              </div>
              <div className="screening-field">
                <label className="screening-label" htmlFor="login-password">
                  Heslo
                </label>
                <input
                  id="login-password"
                  className="screening-input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setError("");
                    setPassword(e.target.value);
                  }}
                />
              </div>
              {error ? <p className="screening-error">{error}</p> : null}
            </div>

            <div className="screening-actions screening-actions--intro">
              <button
                className="button"
                type="button"
                onClick={() => {
                  const user = verifyLogin(email, password);
                  if (!user) {
                    setError(
                      "Neplatný e-mail nebo heslo. Účet musí být nejdřív vytvořený po screeningu."
                    );
                    return;
                  }
                  hydrateScreeningForUser(user.email);
                  saveEmail(user.email);
                  router.push("/prehled");
                }}
              >
                Přihlásit se
              </button>
              <Link className="screening-text-btn" href="/dotaznik">
                Nemám účet — zahájit screening
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
