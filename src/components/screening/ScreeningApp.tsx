"use client";

import ChoiceGroup from "@/components/screening/ChoiceGroup";
import ResultCard from "@/components/screening/ResultCard";
import ScreeningStepper from "@/components/screening/ScreeningStepper";
import ProcessSidebar from "@/components/app/ProcessSidebar";
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
  hasCompleteScreening,
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
  hydrateScreeningForUser,
  loadAnswers,
  loadAuthUser,
  loadEmail,
  loadStep,
  saveAnswers,
  saveAuthUser,
  saveEmail,
  saveStep,
} from "@/lib/screening/storage";
import { clearOrderForEmail } from "@/lib/order/storage";
import { clearPhotosForEmail } from "@/lib/photos/storage";
import { getScreeningProcessPhases } from "@/lib/order/process-sidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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

    const auth = loadAuthUser();
    if (auth?.email) {
      // Přihlášený uživatel: vždy obnovit screening z účtu (i ve vývoji).
      hydrateScreeningForUser(auth.email);
      const savedAnswers = loadAnswers();
      const savedStep = loadStep();
      setAnswers(savedAnswers);
      setEmail(auth.email);
      if (hasCompleteScreening(savedAnswers)) {
        setResultUnlocked(true);
        setStep("result");
      } else if (savedStep && savedStep !== "email" && savedStep !== "register") {
        setStep(savedStep);
      }
      setReady(true);
      return;
    }

    // Host ve vývoji: čistý start kvůli testování zámku výsledku.
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

  // Odpovědi ukládáme vždy — i ve vývoji, jinak se při registraci ztratí.
  useEffect(() => {
    if (!ready) return;
    saveAnswers(answers);
  }, [answers, ready]);

  useEffect(() => {
    if (!ready) return;
    // Host ve vývoji neukládá krok (chce čistý start), účet ano.
    if (isDev && !loadAuthUser()) return;
    saveStep(step);
  }, [step, ready, isDev]);

  // Přihlášený uživatel po dokončení screeningu rovnou uloží výsledek k účtu.
  useEffect(() => {
    if (!ready || step !== "result") return;
    if (!hasCompleteScreening(answers)) return;
    const auth = loadAuthUser();
    if (!auth?.email) return;
    setResultUnlocked(true);
    setEmail(auth.email);
    bindScreeningToUser(auth.email, answers);
  }, [ready, step, answers]);

  const goTo = useCallback((next: ScreeningStep) => {
    setError("");
    setFieldErrors({});
    setStep(next);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step, ready]);

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

    if (step === "q7") {
      const auth = loadAuthUser();
      if (auth?.email) {
        setEmail(auth.email);
        setResultUnlocked(true);
      }
      return goTo("result");
    }
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
    bindScreeningToUser(accountEmail, answers);
    saveAuthUser({
      email: accountEmail,
      fullName: `${registerFirstName.trim()} ${registerLastName.trim()}`,
      phone: registerPhone.trim(),
      password: registerPassword,
      createdAt: new Date().toISOString(),
    });
    router.push("/objednavka/panel");
  }, [
    answers,
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
      <ProcessSidebar
        phases={getScreeningProcessPhases()}
        currentMeta={progressLabel}
        brandHref="/"
        footer={
          <Link className="button secondary process-exit" href="/">
            Zpět na úvod
          </Link>
        }
      />

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
          <Link
            className="button secondary screening-exit screening-exit--mobile"
            href="/"
          >
            Úvod
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
                      {loadAuthUser() ? (
                        <Link className="button" href="/prehled">
                          Zpět do aplikace
                        </Link>
                      ) : (
                        <>
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
                        </>
                      )}
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
            <h1 id="screening-result-title">Výsledek je připravený</h1>
            <p>
              Odemknete ho po zadání e-mailu. Screening už máme vyhodnocený.
              E-mail slouží k zobrazení a pozdějšímu návratu k profilu.
            </p>
            <div className="screening-result-gate-form">
              <label className="screening-label" htmlFor="screening-email">
                Zadejte e-mail pro odemčení výsledku
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
                  placeholder="Jan"
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
                  placeholder="Novák"
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
                  placeholder="123 456 789"
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
                  placeholder="jan@novak.cz"
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
                    placeholder="••••••••"
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
                          d="M2.21967 2.21967C1.9534 2.48594 1.9292 2.9026 2.14705 3.19621L2.21967 3.28033L6.25424 7.3149C4.33225 8.66437 2.89577 10.6799 2.29888 13.0644C2.1983 13.4662 2.4425 13.8735 2.84431 13.9741C3.24613 14.0746 3.6534 13.8305 3.75399 13.4286C4.28346 11.3135 5.59112 9.53947 7.33416 8.39452L9.14379 10.2043C8.43628 10.9258 8 11.9143 8 13.0046C8 15.2138 9.79086 17.0046 12 17.0046C13.0904 17.0046 14.0788 16.5683 14.8004 15.8608L20.7197 21.7803C21.0126 22.0732 21.4874 22.0732 21.7803 21.7803C22.0466 21.5141 22.0708 21.0974 21.8529 20.8038L21.7803 20.7197L15.6668 14.6055L15.668 14.604L14.4679 13.4061L11.598 10.5368L11.6 10.536L8.71877 7.65782L8.72 7.656L7.58672 6.52549L3.28033 2.21967C2.98744 1.92678 2.51256 1.92678 2.21967 2.21967ZM10.2041 11.2655L13.7392 14.8006C13.2892 15.2364 12.6759 15.5046 12 15.5046C10.6193 15.5046 9.5 14.3853 9.5 13.0046C9.5 12.3287 9.76824 11.7154 10.2041 11.2655ZM12 5.5C10.9997 5.5 10.0291 5.64807 9.11109 5.925L10.3481 7.16119C10.8839 7.05532 11.4364 7 12 7C15.9231 7 19.3099 9.68026 20.2471 13.4332C20.3475 13.835 20.7546 14.0794 21.1565 13.9791C21.5584 13.8787 21.8028 13.4716 21.7024 13.0697C20.5994 8.65272 16.6155 5.5 12 5.5ZM12.1947 9.00928L15.996 12.81C15.8942 10.7531 14.2472 9.10764 12.1947 9.00928Z"
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
                          d="M11.9999 9.00462C14.209 9.00462 15.9999 10.7955 15.9999 13.0046C15.9999 15.2138 14.209 17.0046 11.9999 17.0046C9.79073 17.0046 7.99987 15.2138 7.99987 13.0046C7.99987 10.7955 9.79073 9.00462 11.9999 9.00462ZM11.9999 10.5046C10.6192 10.5046 9.49987 11.6239 9.49987 13.0046C9.49987 14.3853 10.6192 15.5046 11.9999 15.5046C13.3806 15.5046 14.4999 14.3853 14.4999 13.0046C14.4999 11.6239 13.3806 10.5046 11.9999 10.5046ZM11.9999 5.5C16.6134 5.5 20.596 8.65001 21.701 13.0644C21.8016 13.4662 21.5574 13.8735 21.1556 13.9741C20.7537 14.0746 20.3465 13.8305 20.2459 13.4286C19.307 9.67796 15.9212 7 11.9999 7C8.07681 7 4.68997 9.68026 3.75273 13.4332C3.65237 13.835 3.24523 14.0794 2.84336 13.9791C2.44149 13.8787 2.19707 13.4716 2.29743 13.0697C3.40052 8.65272 7.38436 5.5 11.9999 5.5Z"
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
                Vytvořit účet
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
