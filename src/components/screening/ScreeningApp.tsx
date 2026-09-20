"use client";

import ChoiceGroup from "@/components/screening/ChoiceGroup";
import ResultCard from "@/components/screening/ResultCard";
import ScreeningStepper from "@/components/screening/ScreeningStepper";
import {
  DURATION_OPTIONS,
  EXPECTATION_OPTIONS,
  FAMILY_OPTIONS,
  HEALTH_OPTIONS,
  PRIOR_CARE_OPTIONS,
  QUESTION_META,
  QUESTION_STEPS,
  SEX_OPTIONS,
  THINNING_OPTIONS,
  evaluateResult,
  isQuestionStep,
  scorePercent,
  type DurationBand,
  type Expectation,
  type FamilyHistory,
  type HealthContext,
  type PriorCare,
  type ScreeningAnswers,
  type ScreeningStep,
  type SexOption,
  type ThinningPattern,
} from "@/lib/screening/config";
import {
  bindScreeningToUser,
  ensureSessionId,
  clearScreeningProgress,
  loadAnswers,
  loadEmail,
  loadStep,
  saveAnswers,
  saveAuthUser,
  saveEmail,
  saveStep,
} from "@/lib/screening/storage";
import { clearOrderForEmail } from "@/lib/order/storage";
import { clearPhotosForEmail } from "@/lib/photos/storage";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const PHASES = [
  { id: "screening", label: "Screening" },
  { id: "laborator", label: "Laboratorní vyšetření" },
  { id: "analyza", label: "Analýza vlasů" },
  { id: "konzultace", label: "Konzultace" },
  { id: "pece", label: "Plán péče" },
] as const;

function phaseProgressLabel(step: ScreeningStep) {
  if (step === "intro") return "Úvod";
  if (isQuestionStep(step)) {
    const index = QUESTION_STEPS.indexOf(step) + 1;
    return `Krok ${index} ze ${QUESTION_STEPS.length}`;
  }
  if (step === "email" || step === "result") return "Výsledek";
  if (step === "register") return "Účet";
  return "";
}

function validateEmail(email: string) {
  const value = email.trim();
  if (!value) return "Zadejte e-mail.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Zadejte platný e-mail.";
  }
  return "";
}

function validateQ1(answers: ScreeningAnswers) {
  const errors: { age?: string; sex?: string } = {};
  const ageRaw = answers.age?.trim() ?? "";
  if (!ageRaw) errors.age = "Zadejte věk.";
  else if (!/^\d+$/.test(ageRaw)) errors.age = "Věk musí být celé číslo.";
  else {
    const age = Number(ageRaw);
    if (age < 18 || age > 90) {
      errors.age = "Zadejte věk v rozmezí 18 až 90 let.";
    }
  }
  if (!answers.sex) errors.sex = "Vyberte jednu z možností.";
  return errors;
}

function canContinueStep(step: ScreeningStep, answers: ScreeningAnswers) {
  if (step === "q1") return Object.keys(validateQ1(answers)).length === 0;
  if (step === "q2") return Boolean(answers.thinning);
  if (step === "q3") return Boolean(answers.duration);
  if (step === "q4") return Boolean(answers.family);
  if (step === "q5") return Boolean(answers.priorCare);
  if (step === "q6") return Boolean(answers.health);
  if (step === "q7") return Boolean(answers.expectation);
  return false;
}

export default function ScreeningApp() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<ScreeningStep>("intro");
  const [answers, setAnswers] = useState<ScreeningAnswers>({});
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    age?: string;
    sex?: string;
  }>({});
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [resultUnlocked, setResultUnlocked] = useState(false);
  const ageHoldRef = useRef<{
    timeout: ReturnType<typeof setTimeout> | null;
    interval: ReturnType<typeof setInterval> | null;
  }>({ timeout: null, interval: null });

  const isDev = process.env.NODE_ENV === "development";

  const stopAgeHold = useCallback(() => {
    const hold = ageHoldRef.current;
    if (hold.timeout) clearTimeout(hold.timeout);
    if (hold.interval) clearInterval(hold.interval);
    hold.timeout = null;
    hold.interval = null;
  }, []);

  const bumpAge = useCallback((delta: number) => {
    setAnswers((prev) => {
      const fallback = delta > 0 ? 17 : 19;
      const current = Number(prev.age || fallback);
      const next = Math.min(90, Math.max(18, current + delta));
      return { ...prev, age: String(next) };
    });
  }, []);

  const startAgeHold = useCallback(
    (delta: number) => {
      stopAgeHold();
      bumpAge(delta);
      ageHoldRef.current.timeout = setTimeout(() => {
        ageHoldRef.current.interval = setInterval(() => {
          bumpAge(delta);
        }, 55);
      }, 380);
    },
    [bumpAge, stopAgeHold]
  );

  useEffect(() => () => stopAgeHold(), [stopAgeHold]);

  useEffect(() => {
    ensureSessionId();

    // Při vývoji neobnovovat progres, ať jde znovu testovat zámek výsledku.
    if (isDev) {
      clearScreeningProgress();
      setReady(true);
      return;
    }

    const savedAnswers = loadAnswers();
    const savedStep = loadStep();
    const savedEmail = loadEmail();
    setAnswers(savedAnswers);
    setEmail(savedEmail);
    if (savedEmail) setResultUnlocked(true);
    if (savedStep === "email") setStep("result");
    else if (savedStep) setStep(savedStep);
    setReady(true);
  }, [isDev]);

  useEffect(() => {
    if (!ready || isDev) return;
    saveAnswers(answers);
  }, [answers, ready, isDev]);

  useEffect(() => {
    if (!ready || isDev) return;
    saveStep(step);
  }, [step, ready, isDev]);

  const goTo = useCallback((next: ScreeningStep) => {
    setError("");
    setFieldErrors({});
    setStep(next);
  }, []);

  const questionIndex = isQuestionStep(step)
    ? QUESTION_STEPS.indexOf(step)
    : -1;

  const goBack = useCallback(() => {
    if (step === "q1") return goTo("intro");
    if (isQuestionStep(step) && questionIndex > 0) {
      return goTo(QUESTION_STEPS[questionIndex - 1]);
    }
    if (step === "email" || step === "result") return goTo("q7");
    if (step === "register") return goTo("result");
  }, [goTo, questionIndex, step]);

  const continueQuestion = useCallback(() => {
    if (step === "q1") {
      const errors = validateQ1(answers);
      setFieldErrors(errors);
      if (Object.keys(errors).length) return;
      return goTo("q2");
    }
    if (step === "q2" && !answers.thinning) {
      setError("Vyberte jednu z možností.");
      return;
    }
    if (step === "q3" && !answers.duration) {
      setError("Vyberte jednu z možností.");
      return;
    }
    if (step === "q4" && !answers.family) {
      setError("Vyberte jednu z možností.");
      return;
    }
    if (step === "q5" && !answers.priorCare) {
      setError("Vyberte jednu z možností.");
      return;
    }
    if (step === "q6" && !answers.health) {
      setError("Vyberte jednu z možností.");
      return;
    }
    if (step === "q7" && !answers.expectation) {
      setError("Vyberte jednu z možností.");
      return;
    }

    if (step === "q7") return goTo("result");
    if (isQuestionStep(step)) {
      const next = QUESTION_STEPS[questionIndex + 1];
      if (next) goTo(next);
    }
  }, [answers, goTo, questionIndex, step]);

  const unlockResult = useCallback(() => {
    const message = validateEmail(email);
    if (message) {
      setError(message);
      return;
    }
    saveEmail(email.trim());
    setResultUnlocked(true);
    setError("");
  }, [email]);

  const createAccount = useCallback(() => {
    const emailMessage = validateEmail(email);
    if (emailMessage) {
      setRegisterError(emailMessage);
      return;
    }
    if (!registerFirstName.trim() || !registerLastName.trim()) {
      setRegisterError("Zadejte jméno a příjmení.");
      return;
    }
    const phoneDigits = registerPhone.replace(/\D/g, "");
    if (phoneDigits.length < 9) {
      setRegisterError("Zadejte telefonní číslo.");
      return;
    }
    if (registerPassword.trim().length < 6) {
      setRegisterError("Heslo musí mít alespoň 6 znaků.");
      return;
    }

    const accountEmail = email.trim();
    clearOrderForEmail(accountEmail);
    clearPhotosForEmail(accountEmail);
    bindScreeningToUser(accountEmail);
    saveAuthUser({
      email: accountEmail,
      fullName: `${registerFirstName.trim()} ${registerLastName.trim()}`,
      phone: registerPhone.trim(),
      password: registerPassword,
      createdAt: new Date().toISOString(),
    });
    router.push("/objednavka/panel");
  }, [
    email,
    registerFirstName,
    registerLastName,
    registerPhone,
    registerPassword,
    router,
  ]);

  const resultLocked = step === "result" && !resultUnlocked;
  const registerOpen = step === "register";
  const overlayOpen = resultLocked || registerOpen;

  useEffect(() => {
    if (!overlayOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [overlayOpen]);

  if (!ready) {
    return <div className="screening-loading">Načítání…</div>;
  }

  const result = evaluateResult(answers);
  const percent = scorePercent(answers);
  const showStepper = isQuestionStep(step);
  const progressLabel = phaseProgressLabel(step);
  const canContinue = canContinueStep(step, answers);

  return (
    <div className={`screening${overlayOpen ? " is-locked" : ""}`}>
      <aside className="screening-aside" aria-label="Průběh">
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

        <ol className="screening-phases">
          {PHASES.map((phase, index) => {
            const active = phase.id === "screening";
            return (
              <li
                key={phase.id}
                className={`screening-phase${active ? " is-active" : ""}${index > 0 ? " is-upcoming" : ""}`}
              >
                <span className="screening-phase-index">
                  {index + 1}
                </span>
                <span className="screening-phase-copy">
                  <span className="screening-phase-label">{phase.label}</span>
                  {active ? (
                    <span className="screening-phase-meta">{progressLabel}</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>

        <Link className="screening-exit screening-exit--aside" href="/">
          Zpět na úvod
        </Link>
      </aside>

      <div className="screening-main">
        <header
          className={`screening-topbar${showStepper ? " has-stepper" : ""}`}
        >
          {!showStepper ? (
            <div className="screening-mobile-progress">
              <span className="screening-mobile-phase">Screening</span>
              <span className="screening-mobile-meta">{progressLabel}</span>
            </div>
          ) : (
            <ScreeningStepper step={step} />
          )}
          <Link className="screening-exit screening-exit--mobile" href="/">
            Zpět na úvod
          </Link>
        </header>

        <main className="screening-stage">
          <div className="screening-content">
          {step === "intro" ? (
            <section aria-labelledby="screening-intro-title">
              <span className="screening-kicker">
                Estetický screening · Humánní kmenové buňky
              </span>
              <h1 id="screening-intro-title">Pár otázek o vašich vlasech</h1>
              <p className="screening-lead screening-lead--wide">
                Projdete screeningem o sedmi krátkých částech. Odpovědi slouží k
                orientačnímu profilu. Můžete se vracet zpět a nic se neobjednává
                automaticky.
              </p>

              <ul className="screening-points">
                <li>
                  Další kroky péče (laboratoř, konzultace, program) jsou
                  volitelné a až po vašem rozhodnutí
                </li>
                <li>
                  Cena programu je pracovní údaj z nabídky, ne automatická
                  objednávka
                </li>
                <li>
                  Pro zobrazení výsledků bude potřeba zadat e-mail
                </li>
              </ul>

              <dl className="screening-stats" aria-label="Základní informace">
                <div className="screening-stat">
                  <dt>Otázek</dt>
                  <dd>7</dd>
                </div>
                <div className="screening-stat">
                  <dt>Celková délka</dt>
                  <dd>~12&nbsp;min</dd>
                </div>
                <div className="screening-stat">
                  <dt>Screening zdarma</dt>
                  <dd>100&nbsp;%</dd>
                </div>
              </dl>
              <p className="screening-legal">
                Pokračováním souhlasíte se zpracováním odpovědí za účelem
                vytvoření orientačního vlasového profilu. Podrobnosti doplníme
                podle finálního právního znění.
              </p>
              <div className="screening-actions screening-actions--intro">
                <button
                  className="button"
                  type="button"
                  onClick={() => goTo("q1")}
                >
                  Zahájit screening
                </button>
                <a
                  className="button screening-back"
                  href="https://www.stemaesthetic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Reference a výsledky
                </a>
              </div>
            </section>
          ) : null}

          {step === "q1" ? (
            <section aria-labelledby="screening-q-title">
              <h1 id="screening-q-title">{QUESTION_META.q1.title}</h1>
              <p className="screening-lead">{QUESTION_META.q1.lead}</p>
              <div className="screening-fields">
                <div className="screening-field">
                  <label className="screening-label" htmlFor="screening-age">
                    Věk
                  </label>
                  <div
                    className={`screening-age-control${fieldErrors.age ? " is-invalid" : ""}`}
                  >
                    <input
                      id="screening-age"
                      className="screening-input screening-input--age"
                      type="number"
                      inputMode="numeric"
                      min={18}
                      max={90}
                      step={1}
                      placeholder="Např. 34"
                      value={answers.age ?? ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, "");
                        setAnswers((prev) => ({ ...prev, age: value }));
                      }}
                    />
                    <div className="screening-age-steppers" aria-hidden="true">
                      <button
                        type="button"
                        className="screening-age-step"
                        tabIndex={-1}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          startAgeHold(1);
                        }}
                        onPointerUp={stopAgeHold}
                        onPointerLeave={stopAgeHold}
                        onPointerCancel={stopAgeHold}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2.5 7.5L6 4L9.5 7.5"
                            stroke="currentColor"
                            strokeWidth="1.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="screening-age-step"
                        tabIndex={-1}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          startAgeHold(-1);
                        }}
                        onPointerUp={stopAgeHold}
                        onPointerLeave={stopAgeHold}
                        onPointerCancel={stopAgeHold}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2.5 4.5L6 8L9.5 4.5"
                            stroke="currentColor"
                            strokeWidth="1.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {fieldErrors.age ? (
                    <p className="screening-error">{fieldErrors.age}</p>
                  ) : null}
                </div>
                <div className="screening-field">
                  <span className="screening-label">Pohlaví</span>
                  <ChoiceGroup
                    name="Pohlaví"
                    options={SEX_OPTIONS}
                    value={answers.sex}
                    columns={3}
                    error={fieldErrors.sex}
                    onChange={(id) =>
                      setAnswers((prev) => ({
                        ...prev,
                        sex: id as SexOption,
                      }))
                    }
                  />
                </div>
              </div>
            </section>
          ) : null}

          {step === "q2" ? (
            <section aria-labelledby="screening-q-title">
              <h1 id="screening-q-title">{QUESTION_META.q2.title}</h1>
              <p className="screening-lead">{QUESTION_META.q2.lead}</p>
              <ChoiceGroup
                name={QUESTION_META.q2.sectionLabel}
                options={THINNING_OPTIONS}
                value={answers.thinning}
                error={error}
                onChange={(id) => {
                  setError("");
                  setAnswers((prev) => ({
                    ...prev,
                    thinning: id as ThinningPattern,
                  }));
                }}
              />
            </section>
          ) : null}

          {step === "q3" ? (
            <section aria-labelledby="screening-q-title">
              <h1 id="screening-q-title">{QUESTION_META.q3.title}</h1>
              <p className="screening-lead">{QUESTION_META.q3.lead}</p>
              <ChoiceGroup
                name={QUESTION_META.q3.sectionLabel}
                options={DURATION_OPTIONS}
                value={answers.duration}
                error={error}
                onChange={(id) => {
                  setError("");
                  setAnswers((prev) => ({
                    ...prev,
                    duration: id as DurationBand,
                  }));
                }}
              />
            </section>
          ) : null}

          {step === "q4" ? (
            <section aria-labelledby="screening-q-title">
              <h1 id="screening-q-title">{QUESTION_META.q4.title}</h1>
              <p className="screening-lead">{QUESTION_META.q4.lead}</p>
              <ChoiceGroup
                name={QUESTION_META.q4.sectionLabel}
                options={FAMILY_OPTIONS}
                value={answers.family}
                error={error}
                onChange={(id) => {
                  setError("");
                  setAnswers((prev) => ({
                    ...prev,
                    family: id as FamilyHistory,
                  }));
                }}
              />
            </section>
          ) : null}

          {step === "q5" ? (
            <section aria-labelledby="screening-q-title">
              <h1 id="screening-q-title">{QUESTION_META.q5.title}</h1>
              <p className="screening-lead">{QUESTION_META.q5.lead}</p>
              <ChoiceGroup
                name={QUESTION_META.q5.sectionLabel}
                options={PRIOR_CARE_OPTIONS}
                value={answers.priorCare}
                error={error}
                onChange={(id) => {
                  setError("");
                  setAnswers((prev) => ({
                    ...prev,
                    priorCare: id as PriorCare,
                  }));
                }}
              />
            </section>
          ) : null}

          {step === "q6" ? (
            <section aria-labelledby="screening-q-title">
              <h1 id="screening-q-title">{QUESTION_META.q6.title}</h1>
              <p className="screening-lead">{QUESTION_META.q6.lead}</p>
              <ChoiceGroup
                name={QUESTION_META.q6.sectionLabel}
                options={HEALTH_OPTIONS}
                value={answers.health}
                error={error}
                onChange={(id) => {
                  setError("");
                  setAnswers((prev) => ({
                    ...prev,
                    health: id as HealthContext,
                  }));
                }}
              />
            </section>
          ) : null}

          {step === "q7" ? (
            <section aria-labelledby="screening-q-title">
              <h1 id="screening-q-title">{QUESTION_META.q7.title}</h1>
              <p className="screening-lead">{QUESTION_META.q7.lead}</p>
              <ChoiceGroup
                name={QUESTION_META.q7.sectionLabel}
                options={EXPECTATION_OPTIONS}
                value={answers.expectation}
                error={error}
                onChange={(id) => {
                  setError("");
                  setAnswers((prev) => ({
                    ...prev,
                    expectation: id as Expectation,
                  }));
                }}
              />
            </section>
          ) : null}

          {step === "result" || step === "register" ? (
            <section aria-labelledby="screening-result-title">
              {resultLocked ? (
                <div className="screening-result-preview" aria-hidden="true">
                  <ResultCard
                    result={result}
                    percent={percent}
                    answers={answers}
                    masked
                  />
                  <div className="screening-result-box">
                    <p>
                      Screening je hotový. Další péče v aplikaci začíná až po
                      vytvoření účtu. Laboratoř, konzultace ani plán péče tímto
                      nejsou dokončené.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <ResultCard
                    result={result}
                    percent={percent}
                    answers={answers}
                    titleId="screening-result-title"
                  />
                  <div className="screening-result-box">
                    <p>
                      Screening je hotový. Další péče v aplikaci začíná až po
                      vytvoření účtu. Laboratoř, konzultace ani plán péče tímto
                      nejsou dokončené.
                    </p>
                  </div>
                  {step === "result" ? (
                    <div className="screening-actions">
                      <button
                        className="button screening-back"
                        type="button"
                        onClick={goBack}
                      >
                        Zpět
                      </button>
                      <button
                        className="button"
                        type="button"
                        onClick={() => goTo("register")}
                      >
                        Vytvořit účet
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          ) : null}

          {step !== "intro" &&
          step !== "result" &&
          step !== "register" &&
          step !== "email" ? (
            <div className="screening-actions">
              <button
                className="button screening-back"
                type="button"
                onClick={goBack}
              >
                Zpět
              </button>
              <button
                className="button"
                type="button"
                onClick={continueQuestion}
                disabled={!canContinue}
              >
                Pokračovat
              </button>
            </div>
          ) : null}

          </div>
        </main>
      </div>

      {resultLocked ? (
        <div className="screening-result-lock-layer">
          <div className="screening-result-gate-panel">
            <span className="screening-result-lock-badge">
              <svg
                className="screening-result-lock-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12 15.5C12.8284 15.5 13.5 14.8284 13.5 14C13.5 13.1716 12.8284 12.5 12 12.5C11.1716 12.5 10.5 13.1716 10.5 14C10.5 14.8284 11.1716 15.5 12 15.5ZM8 6C8 3.79086 9.79086 2 12 2C14.2091 2 16 3.79086 16 6V7H16.75C18.5449 7 20 8.45507 20 10.25V17.75C20 19.5449 18.5449 21 16.75 21H7.25C5.45507 21 4 19.5449 4 17.75V10.25C4 8.45507 5.45507 7 7.25 7H8V6ZM12 3.5C10.6193 3.5 9.5 4.61929 9.5 6V7H14.5V6C14.5 4.61929 13.3807 3.5 12 3.5ZM7.25 8.5C6.2835 8.5 5.5 9.2835 5.5 10.25V17.75C5.5 18.7165 6.2835 19.5 7.25 19.5H16.75C17.7165 19.5 18.5 18.7165 18.5 17.75V10.25C18.5 9.2835 17.7165 8.5 16.75 8.5H7.25Z"
                  fill="currentColor"
                />
              </svg>
              Zamčeno
            </span>
            <h1 id="screening-result-title">Výsledek je připravený</h1>
            <p>
              Odemknete ho po zadání e-mailu. Screening už máme vyhodnocený.
              E-mail slouží k zobrazení a pozdějšímu návratu k profilu.
            </p>
            <div className="screening-result-gate-form">
              <label className="screening-label" htmlFor="screening-email">
                E-mail pro odemčení výsledku
              </label>
              <input
                id="screening-email"
                className={`screening-input${error ? " is-invalid" : ""}`}
                type="email"
                autoComplete="email"
                placeholder="jan.novak@email.cz"
                value={email}
                onChange={(e) => {
                  setError("");
                  setEmail(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") unlockResult();
                }}
              />
              {error ? <p className="screening-error">{error}</p> : null}
              <button
                className="button"
                type="button"
                onClick={unlockResult}
              >
                Zobrazit výsledek
              </button>
            </div>
          </div>
          <button
            className="button screening-back screening-result-lock-back"
            type="button"
            onClick={goBack}
          >
            Zpět
          </button>
        </div>
      ) : null}

      {registerOpen ? (
        <div className="screening-result-lock-layer">
          <div className="screening-result-gate-panel screening-register-panel">
            <span className="eyebrow">Vytvoření účtu</span>
            <h1 id="screening-register-title">Uložte si profil a pokračujte</h1>
            <p>
              Po registraci se dostanete do přehledu a můžete navázat dalšími
              kroky péče.
            </p>
            <div className="screening-fields screening-fields--register">
              <div className="screening-field">
                <label className="screening-label" htmlFor="register-first-name">
                  Jméno
                </label>
                <input
                  id="register-first-name"
                  className="screening-input"
                  type="text"
                  autoComplete="given-name"
                  value={registerFirstName}
                  onChange={(e) => {
                    setRegisterError("");
                    setRegisterFirstName(e.target.value);
                  }}
                />
              </div>
              <div className="screening-field">
                <label className="screening-label" htmlFor="register-last-name">
                  Příjmení
                </label>
                <input
                  id="register-last-name"
                  className="screening-input"
                  type="text"
                  autoComplete="family-name"
                  value={registerLastName}
                  onChange={(e) => {
                    setRegisterError("");
                    setRegisterLastName(e.target.value);
                  }}
                />
              </div>
              <div className="screening-field screening-field--full">
                <label className="screening-label" htmlFor="register-phone">
                  Telefon
                </label>
                <input
                  id="register-phone"
                  className="screening-input"
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  placeholder="+420 777 123 456"
                  value={registerPhone}
                  onChange={(e) => {
                    setRegisterError("");
                    setRegisterPhone(e.target.value.replace(/[^\d+\s]/g, ""));
                  }}
                />
              </div>
              <div className="screening-field screening-field--full">
                <label className="screening-label" htmlFor="register-email">
                  E-mail
                </label>
                <input
                  id="register-email"
                  className="screening-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setRegisterError("");
                    setEmail(e.target.value);
                  }}
                />
              </div>
              <div className="screening-field screening-field--full">
                <label className="screening-label" htmlFor="register-password">
                  Heslo
                </label>
                <div className="screening-password-control">
                  <input
                    id="register-password"
                    className="screening-input screening-input--password"
                    type={showRegisterPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={registerPassword}
                    onChange={(e) => {
                      setRegisterError("");
                      setRegisterPassword(e.target.value);
                    }}
                  />
                  <button
                    type="button"
                    className="screening-password-toggle"
                    aria-label={
                      showRegisterPassword ? "Skrýt heslo" : "Zobrazit heslo"
                    }
                    onClick={() => setShowRegisterPassword((prev) => !prev)}
                  >
                    {showRegisterPassword ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M3.28 2.22a.75.75 0 1 0-1.06 1.06l18.5 18.5a.75.75 0 1 0 1.06-1.06l-2.4-2.4A11.9 11.9 0 0 0 21.75 12S18.5 5.25 12 5.25c-1.67 0-3.14.43-4.4 1.1L3.28 2.22ZM7.1 7.98A7.7 7.7 0 0 1 12 6.75c4.8 0 7.55 4.55 8.42 5.87a.3.3 0 0 1 0 .3c-.5.76-1.64 2.28-3.37 3.43l-2.2-2.2a3.75 3.75 0 0 0-5.05-5.05L7.1 7.98Zm3.37 3.37 2.18 2.18a2.25 2.25 0 0 1-2.18-2.18Zm1.53 5.4 1.6 1.6c-.51.1-1.04.15-1.6.15-4.8 0-7.55-4.55-8.42-5.87a.3.3 0 0 1 0-.3c.34-.52.93-1.32 1.76-2.14l1.64 1.64A3.75 3.75 0 0 0 12 15.75c.34 0 .67-.04 1-.1Z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 5.25C5.5 5.25 2.25 12 2.25 12s3.25 6.75 9.75 6.75S21.75 12 21.75 12 18.5 5.25 12 5.25ZM12 15.75A3.75 3.75 0 1 1 12 8.25a3.75 3.75 0 0 1 0 7.5Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {registerError ? (
                <p className="screening-error screening-register-error">
                  {registerError}
                </p>
              ) : null}
            </div>
            <div className="screening-actions screening-actions--register">
              <button
                className="button screening-back"
                type="button"
                onClick={goBack}
              >
                Zpět
              </button>
              <button
                className="button"
                type="button"
                onClick={createAccount}
              >
                Vytvořit účet a pokračovat
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
