"use client";

import {
  hydrateScreeningForUser,
  saveEmail,
  verifyLogin,
} from "@/lib/screening/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import "./login-modal.css";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const router = useRouter();
  const titleId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) return;
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
  }, [open]);

  if (!open) return null;

  const submit = () => {
    const user = verifyLogin(email, password);
    if (!user) {
      setError(
        "Neplatný e-mail nebo heslo. Účet musí být nejdřív vytvořený po screeningu."
      );
      return;
    }
    hydrateScreeningForUser(user.email);
    saveEmail(user.email);
    onClose();
    router.push("/prehled");
  };

  return (
    <div className="login-modal-layer" role="presentation">
      <div
        className="login-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <span className="eyebrow">Přihlášení</span>
        <h1 id={titleId}>Vítejte zpátky</h1>
        <p>
          Přihlášením se vrátíte k uloženému profilu, objednávkám a dalším krokům
          péče.
        </p>

        <div className="login-modal-fields">
          <div className="login-modal-field">
            <label className="login-modal-label" htmlFor="login-modal-email">
              E-mail
            </label>
            <input
              id="login-modal-email"
              className="login-modal-input"
              type="email"
              autoComplete="email"
              placeholder="jan.novak@email.cz"
              value={email}
              onChange={(e) => {
                setError("");
                setEmail(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </div>
          <div className="login-modal-field">
            <label className="login-modal-label" htmlFor="login-modal-password">
              Heslo
            </label>
            <div className="login-modal-password">
              <input
                id="login-modal-password"
                className="login-modal-input login-modal-input--password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setError("");
                  setPassword(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
              />
              <button
                className="login-modal-password-toggle"
                type="button"
                aria-label={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9.3 3.1 11 7.5a11.6 11.6 0 0 1-4.1 5.1M6.1 6.1A11.6 11.6 0 0 0 1 12.5C2.7 16.9 7 20 12 20c1.7 0 3.3-.4 4.7-1"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M1 12.5C2.7 8.1 7 5 12 5s9.3 3.1 11 7.5C21.3 16.9 17 20 12 20S2.7 16.9 1 12.5Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12.5"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error ? <p className="login-modal-error">{error}</p> : null}
        </div>

        <div className="login-modal-actions">
          <button
            className="button secondary"
            type="button"
            onClick={onClose}
          >
            Zpět
          </button>
          <button className="button" type="button" onClick={submit}>
            Přihlásit se
          </button>
        </div>

        <div className="login-modal-alt">
          <p>Ještě nemáte účet?</p>
          <Link
            className="button secondary"
            href="/dotaznik"
            onClick={onClose}
          >
            Zahájit screening
          </Link>
        </div>
      </div>
    </div>
  );
}
