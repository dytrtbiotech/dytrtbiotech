"use client";

import {
  DURATION_OPTIONS,
  EXPECTATION_OPTIONS,
  FAMILY_OPTIONS,
  HEALTH_OPTIONS,
  PRIOR_CARE_OPTIONS,
  SEX_OPTIONS,
  THINNING_OPTIONS,
  evaluateResult,
  scorePercent,
  type ScreeningAnswers,
} from "@/lib/screening/config";
import {
  loadAnswers,
  loadAuthUser,
  loadEmail,
  type AuthUser,
} from "@/lib/screening/storage";
import { createEmptyVisits, type OrderDraft } from "@/lib/order/config";
import { loadOrder } from "@/lib/order/storage";
import {
  MAX_PHOTOS,
  addPhoto,
  deletePhoto,
  loadPhotos,
  preparePhotoFile,
  replacePhoto,
  type CarePhoto,
} from "@/lib/photos/storage";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function splitName(fullName?: string) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function optionLabel<T extends string>(
  options: { id: T; label: string }[],
  value?: T
) {
  if (!value) return "—";
  return options.find((option) => option.id === value)?.label ?? "—";
}

function screeningRows(answers: ScreeningAnswers) {
  return [
    { label: "Věk", value: answers.age?.trim() || "—" },
    { label: "Pohlaví", value: optionLabel(SEX_OPTIONS, answers.sex) },
    {
      label: "Charakter změn",
      value: optionLabel(THINNING_OPTIONS, answers.thinning),
    },
    {
      label: "Doba trvání",
      value: optionLabel(DURATION_OPTIONS, answers.duration),
    },
    {
      label: "Rodinná anamnéza",
      value: optionLabel(FAMILY_OPTIONS, answers.family),
    },
    {
      label: "Dosavadní péče",
      value: optionLabel(PRIOR_CARE_OPTIONS, answers.priorCare),
    },
    {
      label: "Zdravotní kontext",
      value: optionLabel(HEALTH_OPTIONS, answers.health),
    },
    {
      label: "Očekávání",
      value: optionLabel(EXPECTATION_OPTIONS, answers.expectation),
    },
  ];
}

export default function ProfilPage() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<ScreeningAnswers>({});
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [percent, setPercent] = useState(0);
  const [showScreeningDetail, setShowScreeningDetail] = useState(false);
  const [order, setOrder] = useState<OrderDraft | null>(null);
  const [photos, setPhotos] = useState<CarePhoto[]>([]);
  const [visitIndex, setVisitIndex] = useState<number | "">("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [compareLeft, setCompareLeft] = useState("");
  const [compareRight, setCompareRight] = useState("");

  useEffect(() => {
    const auth = loadAuthUser();
    const storedAnswers = loadAnswers();
    const result = evaluateResult(storedAnswers);
    const list = loadPhotos();
    setUser(auth);
    setEmail(loadEmail() || auth?.email || "");
    setAnswers(storedAnswers);
    setTitle(result.title);
    setSummary(result.summary);
    setPercent(scorePercent(storedAnswers));
    setOrder(loadOrder());
    setPhotos(list);
    if (list[0]) setCompareLeft(list[0].id);
    if (list[1]) setCompareRight(list[1].id);
    setReady(true);
  }, []);

  const visits = useMemo(() => {
    if (order?.visits?.length) return order.visits;
    if (order?.status === "care_paid" || order?.status === "care_completed") {
      return createEmptyVisits();
    }
    return [];
  }, [order]);

  const { firstName, lastName } = splitName(user?.fullName);
  const hasScreening = Object.keys(answers).length > 0;
  const left = photos.find((p) => p.id === compareLeft) ?? photos[0];
  const right =
    photos.find((p) => p.id === compareRight) ??
    photos.find((p) => p.id !== left?.id) ??
    null;

  if (!ready) {
    return <div className="app-loading">Načítání…</div>;
  }

  return (
    <>
      <header className="app-topbar">
        <div>
          <p className="app-topbar-kicker">Klientská aplikace</p>
          <p className="app-topbar-title">Můj profil</p>
        </div>
      </header>
      <div className="app-content">
        <h1>Můj profil</h1>
        <p className="app-lead">
          Osobní údaje, výsledek screeningu a fotodokumentace vývoje.
        </p>

        <section className="summary-block" aria-labelledby="profile-personal">
          <div className="journey-card-head">
            <h2 id="profile-personal">Osobní údaje</h2>
            <Link className="text-link" href="/nastaveni">
              Upravit
            </Link>
          </div>
          <dl className="journey-meta">
            <div>
              <dt>Jméno</dt>
              <dd>{firstName || "—"}</dd>
            </div>
            <div>
              <dt>Příjmení</dt>
              <dd>{lastName || "—"}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{email || "—"}</dd>
            </div>
            <div>
              <dt>Telefon</dt>
              <dd>{user?.phone?.trim() || "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="summary-block" aria-labelledby="profile-screening">
          <h2 id="profile-screening">Screening / vstupní informace</h2>
          {hasScreening ? (
            <>
              <p className="summary-strong">{title}</p>
              <p>{summary}</p>
              <p className="meta-line">Orientační skóre: {percent} %</p>
              <div className="journey-actions">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setShowScreeningDetail((open) => !open)}
                >
                  {showScreeningDetail
                    ? "Skrýt detail odpovědí"
                    : "Zobrazit detail odpovědí"}
                </button>
              </div>
              {showScreeningDetail ? (
                <dl className="journey-meta" style={{ marginTop: 16 }}>
                  {screeningRows(answers).map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </>
          ) : (
            <p>
              Screening k tomuto účtu zatím nemáme uložený. Po dokončení
              screeningu se zde zobrazí výsledek.
            </p>
          )}
        </section>

        <section className="summary-block" aria-labelledby="profile-photos">
          <h2 id="profile-photos">Fotografie / vývoj</h2>
          <p>
            Volitelná fotodokumentace pro manuální porovnání v čase. Nenahrazuje
            lékařské hodnocení.
          </p>

          <div className="flow-card" style={{ marginTop: 16 }}>
            <h3 style={{ margin: "0 0 12px", font: "400 22px/1.2 var(--serif)" }}>
              Nahrát fotografii
            </h3>
            <ul className="instruction-list">
              <li>Stejný úhel a podobné světlo usnadní srovnání</li>
              <li>Podporujeme JPG, PNG a WEBP</li>
              <li>Nejvýše {MAX_PHOTOS} fotografií · nahrání je dobrovolné</li>
            </ul>

            <div className="checkout-fields">
              {visits.length > 0 ? (
                <div className="checkout-field">
                  <label htmlFor="profile-photo-visit">
                    Vazba na návštěvu (volitelné)
                  </label>
                  <select
                    id="profile-photo-visit"
                    className="app-input"
                    value={visitIndex}
                    onChange={(e) =>
                      setVisitIndex(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  >
                    <option value="">Bez vazby / jen datum</option>
                    {visits.map((visit) => (
                      <option key={visit.index} value={visit.index}>
                        Návštěva {visit.index}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="checkout-field">
                <label htmlFor="profile-photo-file">Soubor</label>
                <input
                  id="profile-photo-file"
                  className="app-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy || photos.length >= MAX_PHOTOS}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    setBusy(true);
                    setError("");
                    try {
                      const prepared = await preparePhotoFile(file);
                      const next = addPhoto({
                        id: `ph_${Date.now()}`,
                        visitIndex:
                          typeof visitIndex === "number"
                            ? visitIndex
                            : undefined,
                        createdAt: new Date().toISOString(),
                        dataUrl: prepared.dataUrl,
                        fileName: prepared.fileName,
                      });
                      setPhotos(next);
                      if (next.length === 1) setCompareLeft(next[0].id);
                      if (next.length >= 2) {
                        setCompareRight(next[next.length - 1].id);
                      }
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Nahrání se nepovedlo."
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </div>
            </div>
            {error ? <p className="app-error">{error}</p> : null}
            <p className="meta-line">
              Uloženo {photos.length} / {MAX_PHOTOS}
            </p>
          </div>

          {photos.length > 0 ? (
            <div className="photo-grid-section" style={{ marginTop: 20 }}>
              <h3 style={{ margin: "0 0 12px", font: "400 22px/1.2 var(--serif)" }}>
                Nahrané snímky
              </h3>
              <ul className="photo-grid">
                {photos.map((photo) => (
                  <li key={photo.id} className="photo-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.dataUrl} alt="" />
                    <div className="photo-card-meta">
                      <p>
                        {photo.visitIndex
                          ? `Návštěva ${photo.visitIndex}`
                          : "Bez návštěvy"}
                      </p>
                      <p className="meta-line">
                        {new Date(photo.createdAt).toLocaleString("cs-CZ")}
                      </p>
                      <div className="flow-actions">
                        <label className="text-link photo-replace">
                          Nahradit
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            hidden
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (!file) return;
                              try {
                                const prepared = await preparePhotoFile(file);
                                const next = replacePhoto(photo.id, {
                                  dataUrl: prepared.dataUrl,
                                  fileName: prepared.fileName,
                                  createdAt: new Date().toISOString(),
                                });
                                setPhotos(next);
                              } catch (err) {
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : "Nahrazení se nepovedlo."
                                );
                              }
                            }}
                          />
                        </label>
                        <button
                          className="text-link"
                          type="button"
                          onClick={() => {
                            const next = deletePhoto(photo.id);
                            setPhotos(next);
                          }}
                        >
                          Smazat
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {photos.length >= 2 ? (
            <div className="flow-card compare-card" style={{ marginTop: 20 }}>
              <h3 style={{ margin: "0 0 12px", font: "400 22px/1.2 var(--serif)" }}>
                Porovnání
              </h3>
              <p>
                Manuální srovnání prvního a pozdějšího snímku. Bez automatického
                skóre zlepšení.
              </p>
              <div className="compare-controls">
                <div className="checkout-field">
                  <label htmlFor="profile-compare-left">Vlevo</label>
                  <select
                    id="profile-compare-left"
                    className="app-input"
                    value={left?.id ?? ""}
                    onChange={(e) => setCompareLeft(e.target.value)}
                  >
                    {photos.map((photo, index) => (
                      <option key={photo.id} value={photo.id}>
                        #{index + 1}
                        {photo.visitIndex
                          ? ` · návštěva ${photo.visitIndex}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="checkout-field">
                  <label htmlFor="profile-compare-right">Vpravo</label>
                  <select
                    id="profile-compare-right"
                    className="app-input"
                    value={right?.id ?? ""}
                    onChange={(e) => setCompareRight(e.target.value)}
                  >
                    {photos.map((photo, index) => (
                      <option key={photo.id} value={photo.id}>
                        #{index + 1}
                        {photo.visitIndex
                          ? ` · návštěva ${photo.visitIndex}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="compare-stage">
                {left ? (
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={left.dataUrl} alt="Snímek vlevo" />
                    <figcaption>Vlevo</figcaption>
                  </figure>
                ) : null}
                {right ? (
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={right.dataUrl} alt="Snímek vpravo" />
                    <figcaption>Vpravo</figcaption>
                  </figure>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
