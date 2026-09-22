"use client";

import FaqSection from "@/components/FaqSection";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type DialogKey = "login" | "privacy";

const dialogContents: Record<
  DialogKey,
  { title: string; body: ReactNode }
> = {
  login: {
    title: "Vítejte zpátky.",
    body: (
      <>
        <p>
          Přihlášení vás v aplikaci vrátí k uloženému profilu, objednávkám a
          dalším krokům péče.
        </p>
        <p>
          Tento náhled ještě neobsahuje přihlášení ani uživatelské účty.
        </p>
      </>
    ),
  },
  privacy: {
    title: "Vaše soukromí.",
    body: (
      <>
        <p>
          V tomto pracovním náhledu nevybíráme e-maily ani odpovědi ze
          screeningu. Odkaz na reference otevírá samostatný web.
        </p>
        <p>
          Před spuštěním aplikace zde budou úplné informace provozovatele o
          zpracování údajů, jejich uchování a vašich právech.
        </p>
      </>
    ),
  },
};

function ExternalArrowIcon() {
  return (
    <svg className="arrow" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  );
}

function TickIcon() {
  return (
    <span className="tick">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="m3 8 3 3 7-7" />
      </svg>
    </span>
  );
}

export default function LandingPage() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeDialog, setActiveDialog] = useState<DialogKey>("login");
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setHeaderScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openDialog = useCallback((key: DialogKey) => {
    setActiveDialog(key);
    dialogRef.current?.showModal();
  }, []);

  const closeDialog = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onClick = (e: MouseEvent) => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      ) {
        dialog.close();
      }
    };

    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, []);

  const content = dialogContents[activeDialog];

  return (
    <>
      <a className="skip-link" href="#obsah">
        Přejít k obsahu
      </a>

      <header
        className={`site-header${headerScrolled ? " is-scrolled" : ""}`}
      >
        <div className="header wrap">
          <a className="logo" href="#" aria-label="FOLLICAD - úvodní stránka">
            <Image
              className="logo-img"
              src="/follicad-logo.png"
              alt="FOLLICAD"
              width={220}
              height={48}
              priority
            />
          </a>
          <nav className="nav" aria-label="Hlavní navigace">
            <a href="#jak-to-funguje">Jak to funguje</a>
            <a
              href="https://www.stemaesthetic.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Reference ↗
            </a>
            <div className="nav-actions">
              <Link className="button secondary" href="/prihlaseni">
                Přihlásit se
              </Link>
              <Link className="button" href="/dotaznik">
                Zahájit screening
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main id="obsah">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow">První krok k péči o vaše vlasy</span>
            <h1 id="hero-title">
              <span>Poznejte své vlasy.</span>
              <span>
                <em>Začněte u sebe.</em>
              </span>
            </h1>
            <p className="hero-desc">
              Krátký screening vám pomůže zorientovat se ve vašem vlasovém
              profilu a možnostech další péče.
            </p>
            <div className="hero-meta">
              <span>7 částí</span>
              <span className="meta-separator" aria-hidden="true" />
              <span>Screening zdarma</span>
            </div>
            <div className="hero-actions">
              <Link className="button" href="/dotaznik">
                Zahájit screening
              </Link>
              <a
                className="button secondary"
                href="https://www.stemaesthetic.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Prohlédnout reference <ExternalArrowIcon />
              </a>
            </div>
            <p className="email-note">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m4 7 8 6 8-6" />
              </svg>
              Pro zobrazení výsledku vás na konci požádáme o e-mail.
            </p>
          </div>
          <div className="hero-image">
            <Image
              src="/dytrthero.webp"
              alt="Muž si rukou prohrabuje krátké hnědé vlasy"
              width={1024}
              height={1280}
              priority
            />
            <span className="image-caption">Péče začíná porozuměním.</span>
          </div>
        </section>

        <section
          className="wrap process"
          aria-labelledby="now-title"
          id="jak-to-funguje"
        >
          <div className="process-intro">
            <h2 id="now-title">Jak to začne</h2>
            <p>
              Nejprve krátký screening. Výsledek si zobrazíte zdarma a až potom
              se rozhodnete, zda chcete pokračovat.
            </p>
          </div>

          <div className="process-board">
            <svg
              className="process-wave"
              viewBox="0 0 100 100"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M2.9 50C16 86 34 86 50 50C66 14 84 14 97.1 50"
                stroke="currentColor"
                strokeWidth="1.4"
                pathLength="100"
                strokeDasharray="6 8"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <ol className="process-steps">
              <li className="process-step">
                <div className="process-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M8 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.5 9h5M9.5 12.5h5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h3>Projdete screeningem</h3>
                <p>
                  Pár otázek o vašich vlasech a dosavadní péči. Zabere jen
                  několik minut.
                </p>
              </li>

              <li className="process-step">
                <div className="process-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="8"
                      r="3.2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M5.5 19c1.4-3.2 3.8-4.8 6.5-4.8s5.1 1.6 6.5 4.8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h3>Uvidíte své shrnutí</h3>
                <p>
                  Po zadání e-mailu vám zobrazíme orientační výsledek vašich
                  odpovědí.
                </p>
              </li>

              <li className="process-step">
                <div className="process-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12h12.5M13 6.5 18.5 12 13 17.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3>Rozhodnete se sami</h3>
                <p>
                  Pokračovat nemusíte. Další kroky si vybíráte až ve chvíli, kdy
                  sami chcete.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section className="section wrap next-steps" aria-labelledby="journey-title">
          <div className="next-steps-intro">
            <span className="eyebrow">Volitelné pokračování</span>
            <h2 id="journey-title">Když budete chtít jít dál</h2>
            <p>
              Další kroky si volíte postupně. Vždy předem víte, co vás čeká a
              kolik daná služba stojí.
            </p>
          </div>

          <ol className="next-steps-grid">
            <li className="next-step-card">
              <span className="pill-label">Osobně</span>
              <h3>Laboratorní vyšetření</h3>
              <p>
                Vyberete si rozsah vyšetření a lékaře, kterému budou výsledky
                předány.
              </p>
            </li>
            <li className="next-step-card">
              <span className="pill-label">Online</span>
              <h3>Analýza vlasů</h3>
              <p>
                Pomocí telefonu doplníte obrazovou analýzu vlasů a pokožky.
              </p>
            </li>
            <li className="next-step-card">
              <span className="pill-label">Osobně</span>
              <h3>Konzultace s lékařem</h3>
              <p>
                Po předání výsledků si domluvíte konzultaci u zvoleného lékaře.
              </p>
            </li>
            <li className="next-step-card">
              <span className="pill-label">Osobně</span>
              <h3>Program péče</h3>
              <p>
                Pokud se po konzultaci rozhodnete pokračovat, zobrazíme navazující
                program a jeho podmínky.
              </p>
            </li>
          </ol>

          <div className="profile-banner">
            <div>
              <h3>Vše na jednom místě</h3>
              <p>
                Po registraci uvidíte svůj postup, instrukce i kontakty
                přehledně u sebe. Nemusíte nic dohledávat.
              </p>
            </div>
            <ul className="profile-points">
              <li>
                <TickIcon />
                Uložený profil a další krok
              </li>
              <li>
                <TickIcon />
                Instrukce k vyšetření a kontakt na lékaře
              </li>
              <li>
                <TickIcon />
                Plán péče a volitelné fotografie
              </li>
            </ul>
          </div>
        </section>

        <section
          className="section pricing"
          id="cena"
          aria-labelledby="price-title"
        >
          <div className="wrap">
            <div className="section-heading">
              <span className="eyebrow">Přehledně od začátku</span>
              <h2 id="price-title">
                <span className="heading-line">Začněte zdarma.</span>
                <br />
                <span className="heading-line">
                  O pokračování se rozhodnete později.
                </span>
              </h2>
              <p className="intro-text">
                Screening vás k ničemu nezavazuje. Placené služby si vybíráte až
                v dalších krocích - vždy s cenou předem.
              </p>
            </div>
            <div className="prices">
              <article className="price-card featured">
                <span className="price-caption">Váš první krok</span>
                <h3>Screening a profil</h3>
                <p className="price">Zdarma</p>
                <p className="price-copy">
                  Sedm částí screeningu a orientační shrnutí vašich odpovědí.
                  Pro zobrazení výsledku stačí zadat e-mail.
                </p>
              </article>
              <article className="price-card">
                <span className="price-caption">Doplnění vašeho profilu</span>
                <h3>Vyšetření a konzultace</h3>
                <p className="price">Podle panelu a zvolené ordinace</p>
                <p className="price-copy">
                  Cenu laboratorního panelu uvidíte při výběru. Podmínky a cenu
                  osobní konzultace si ověříte u konkrétního lékaře.
                </p>
              </article>
              <article className="price-card">
                <span className="price-caption">Po osobním posouzení</span>
                <h3>Program péče</h3>
                <p className="price">Cena a rozsah před objednávkou</p>
                <p className="price-copy">
                  K programu se rozhodujete až na základě dalšího postupu s
                  lékařem. Před objednáním dostanete přehled toho, co zahrnuje
                  a kolik stojí.
                </p>
              </article>
            </div>
            <p className="price-footnote">
              Screening ani obrazová analýza nenahrazují osobní posouzení
              lékařem. Samotným vyplněním nevzniká objednávka vyšetření ani
              programu.
            </p>
          </div>
        </section>

        <FaqSection />

        <section className="closing wrap" aria-labelledby="closing-title">
          <div className="closing-copy">
            <h2 id="closing-title">Pár otázek. Jasnější představa.</h2>
            <p>
              Zdarma a bez automatické objednávky. Pro zobrazení výsledku
              budete potřebovat e-mail.
            </p>
          </div>
          <div className="closing-cta">
            <Link className="button" href="/dotaznik">
              Zahájit screening
            </Link>
          </div>
        </section>
      </main>

      <footer className="footer wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#" className="logo">
              FOLLICAD
            </a>
            <p>DYTRT Biotech, s.r.o.</p>
          </div>
          <div className="footer-links">
            <a href="#jak-to-funguje">Jak to funguje</a>
            <a
              href="https://www.stemaesthetic.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Reference ↗
            </a>
            <a href="#otazky">Časté otázky</a>
            <button
              className="plain-button"
              type="button"
              onClick={() => openDialog("privacy")}
            >
              Ochrana soukromí
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © 2026 FOLLICAD. Informace na této stránce slouží k orientaci a
            nenahrazují osobní konzultaci s lékařem.
          </p>
          <span className="demo-label">Pracovní náhled stránky</span>
        </div>
      </footer>

      <dialog
        ref={dialogRef}
        id="preview-dialog"
        aria-labelledby="dialog-title"
      >
        <button
          className="dialog-close"
          aria-label="Zavřít"
          type="button"
          onClick={closeDialog}
        >
          ×
        </button>
        <div className="dialog-content">
          <span className="eyebrow" id="dialog-eyebrow">
            Náhled úvodní stránky
          </span>
          <h2 id="dialog-title">{content.title}</h2>
          <div id="dialog-body">{content.body}</div>
          <button className="button" type="button" onClick={closeDialog}>
            Zpět na stránku
          </button>
        </div>
      </dialog>
    </>
  );
}
