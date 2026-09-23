"use client";

import PhotoCompareSlider from "@/components/app/PhotoCompareSlider";
import {
  DURATION_OPTIONS,
  EXPECTATION_OPTIONS,
  FAMILY_OPTIONS,
  HEALTH_OPTIONS,
  PRIOR_CARE_OPTIONS,
  SEX_OPTIONS,
  THINNING_OPTIONS,
  evaluateResult,
  hasCompleteScreening,
  scorePercent,
  type ResultCategory,
  type ScreeningAnswers,
} from "@/lib/screening/config";
import {
  loadAnswers,
  loadAuthUser,
  loadUserAnswers,
} from "@/lib/screening/storage";
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
import { useEffect, useMemo, useRef, useState } from "react";

function optionLabel<T extends string>(
  options: { id: T; label: string }[],
  value?: T
) {
  if (!value) return "-";
  return options.find((option) => option.id === value)?.label ?? "-";
}

function screeningRows(answers: ScreeningAnswers) {
  return [
    { label: "Věk", value: answers.age?.trim() || "-" },
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

function formatPhotoDate(iso: string) {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateInputToIso(value: string) {
  const [y, m, day] = value.split("-").map(Number);
  if (!y || !m || !day) return new Date().toISOString();
  return new Date(y, m - 1, day, 12, 0, 0).toISOString();
}

function isoToDateInput(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function resolveScreeningAnswers(): ScreeningAnswers {
  const auth = loadAuthUser();
  if (auth?.email) {
    const stored = loadUserAnswers(auth.email);
    if (hasCompleteScreening(stored) || Object.keys(stored).length > 0) {
      return stored;
    }
  }
  return loadAnswers();
}

const MINI_RING = 88;
const MINI_STROKE = 8;
const MINI_RADIUS = (MINI_RING - MINI_STROKE) / 2;
const MINI_CIRC = 2 * Math.PI * MINI_RADIUS;

function MiniScoreRing({
  percent,
  tone,
}: {
  percent: number;
  tone: ResultCategory["id"];
}) {
  const value = Math.min(100, Math.max(0, percent));
  const offset = MINI_CIRC * (1 - value / 100);

  return (
    <div className={`profile-score-ring tone-${tone}`} aria-hidden="true">
      <svg
        width={MINI_RING}
        height={MINI_RING}
        viewBox={`0 0 ${MINI_RING} ${MINI_RING}`}
      >
        <circle
          className="profile-score-track"
          cx={MINI_RING / 2}
          cy={MINI_RING / 2}
          r={MINI_RADIUS}
          fill="none"
          strokeWidth={MINI_STROKE}
        />
        <circle
          className="profile-score-progress"
          cx={MINI_RING / 2}
          cy={MINI_RING / 2}
          r={MINI_RADIUS}
          fill="none"
          strokeWidth={MINI_STROKE}
          strokeDasharray={MINI_CIRC}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${MINI_RING / 2} ${MINI_RING / 2})`}
        />
      </svg>
      <div className="profile-score-value">
        <span className="profile-score-number">{value}</span>
        <span className="profile-score-unit">/ 100</span>
      </div>
    </div>
  );
}

export default function ProfilPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [answers, setAnswers] = useState<ScreeningAnswers>({});
  const [result, setResult] = useState<ResultCategory | null>(null);
  const [percent, setPercent] = useState(0);
  const [showScreeningDetail, setShowScreeningDetail] = useState(false);
  const [photos, setPhotos] = useState<CarePhoto[]>([]);
  const [photoDate, setPhotoDate] = useState(todayInputValue);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [compareId, setCompareId] = useState<string | null>(null);

  useEffect(() => {
    const storedAnswers = resolveScreeningAnswers();
    const evaluated = evaluateResult(storedAnswers);
    setAnswers(storedAnswers);
    setResult(evaluated);
    setPercent(scorePercent(storedAnswers));
    setPhotos(loadPhotos());
    setReady(true);
  }, []);

  const sortedPhotos = useMemo(
    () =>
      [...photos].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [photos]
  );

  const screeningReady = hasCompleteScreening(answers);

  const comparePair = useMemo(() => {
    if (sortedPhotos.length < 2) return null;
    const focus =
      sortedPhotos.find((photo) => photo.id === compareId) ??
      sortedPhotos[sortedPhotos.length - 1];
    const baseline =
      sortedPhotos.find((photo) => photo.id !== focus.id) ?? sortedPhotos[0];
    if (!focus || !baseline || focus.id === baseline.id) return null;
    const [before, after] =
      new Date(baseline.createdAt).getTime() <=
      new Date(focus.createdAt).getTime()
        ? [baseline, focus]
        : [focus, baseline];
    return { before, after };
  }, [compareId, sortedPhotos]);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const prepared = await preparePhotoFile(file);
      const next = addPhoto({
        id: `ph_${Date.now()}`,
        createdAt: dateInputToIso(photoDate),
        dataUrl: prepared.dataUrl,
        fileName: prepared.fileName,
      });
      setPhotos(next);
      setPhotoDate(todayInputValue());
      if (!compareId && next.length >= 2) {
        setCompareId(next[next.length - 1].id);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nahrání se nepovedlo."
      );
    } finally {
      setBusy(false);
    }
  };

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
      <div className="app-content profile-page">
        <h1>Můj profil</h1>
        <p className="app-lead">
          Váš screening a fotodokumentace vývoje na jednom místě.
        </p>

        <section
          className="summary-block profile-screening"
          aria-labelledby="profile-screening"
        >
          <h2 id="profile-screening">Screening / výsledek</h2>
          <p className="profile-section-lead">
            Orientační výsledek vstupního screeningu.
          </p>

          {screeningReady && result ? (
            <>
              <div className="profile-screening-summary">
                <MiniScoreRing percent={percent} tone={result.id} />
                <div className="profile-screening-copy">
                  <p className="profile-screening-score-label">
                    {percent} / 100
                  </p>
                  <p className="profile-screening-profile">
                    Profil: <strong>{result.profileLabel}</strong>
                  </p>
                  <p className="profile-screening-badge">{result.badge}</p>
                  <p>{result.summary}</p>
                </div>
              </div>

              <div className="flow-actions">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setShowScreeningDetail((open) => !open)}
                >
                  {showScreeningDetail
                    ? "Skrýt detail výsledku"
                    : "Zobrazit detail výsledku"}
                </button>
              </div>

              {showScreeningDetail ? (
                <div className="profile-screening-detail">
                  <p className="profile-detail-note">{result.interpretation}</p>
                  <dl className="journey-meta">
                    {screeningRows(answers).map((row) => (
                      <div key={row.label}>
                        <dt>{row.label}</dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </>
          ) : (
            <div className="profile-empty">
              <p>Výsledek screeningu zatím není dostupný.</p>
              <p className="meta-line">
                Po dokončení vstupního screeningu se zde zobrazí orientační
                skóre a profil.
              </p>
              <div className="flow-actions">
                <Link className="button" href="/dotaznik">
                  Dokončit screening
                </Link>
              </div>
            </div>
          )}
        </section>

        <section
          className="summary-block profile-photos"
          aria-labelledby="profile-photos"
        >
          <h2 id="profile-photos">Fotodokumentace vývoje</h2>
          <p className="profile-section-lead">
            Volitelná fotodokumentace pro manuální porovnání v čase. Nenahrazuje
            lékařské hodnocení.
          </p>

          <div className="profile-upload-panel">
            <div className="profile-upload-copy">
              <h3>Nahrát novou fotografii</h3>
              <p>
                Pro lepší porovnání doporučujeme stejný úhel a podobné světlo.
              </p>
            </div>

            <div className="profile-upload-controls">
              <div className="checkout-field">
                <label htmlFor="profile-photo-date">Datum snímku</label>
                <input
                  id="profile-photo-date"
                  className="app-input"
                  type="date"
                  value={photoDate}
                  max={todayInputValue()}
                  onChange={(e) => setPhotoDate(e.target.value)}
                />
              </div>

              <input
                ref={fileInputRef}
                id="profile-photo-file"
                className="photo-upload-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy || photos.length >= MAX_PHOTOS}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  await handleUpload(file);
                }}
              />

              <button
                className="button"
                type="button"
                disabled={busy || photos.length >= MAX_PHOTOS}
                onClick={() => fileInputRef.current?.click()}
              >
                {busy ? "Nahrávám…" : "Vybrat soubor"}
              </button>
            </div>

            <p className="profile-upload-info">
              JPG, PNG, WEBP · maximálně {MAX_PHOTOS} fotografií
              {photos.length > 0 ? ` · nahráno ${photos.length}` : ""}
            </p>
            {error ? <p className="app-error">{error}</p> : null}
          </div>

          {sortedPhotos.length > 0 ? (
            <div className="photo-grid-section">
              <div className="photo-grid-head">
                <h3>Nahrané fotografie</h3>
                <p className="meta-line">
                  {photos.length} / {MAX_PHOTOS}
                </p>
              </div>

              <ul className="photo-grid">
                {sortedPhotos.map((photo, index) => (
                  <li key={photo.id} className="photo-card profile-photo-card">
                    <div className="photo-card-media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.dataUrl}
                        alt={`Fotografie z ${formatPhotoDate(photo.createdAt)}`}
                      />
                    </div>
                    <div className="profile-photo-meta">
                      <p className="profile-photo-label">
                        Snímek {index + 1}
                      </p>
                      <label className="photo-card-date">
                        <span className="sr-only">Datum snímku</span>
                        <input
                          type="date"
                          className="photo-card-date-input"
                          value={isoToDateInput(photo.createdAt)}
                          max={todayInputValue()}
                          onChange={(e) => {
                            if (!e.target.value) return;
                            setPhotos(
                              replacePhoto(photo.id, {
                                createdAt: dateInputToIso(e.target.value),
                              })
                            );
                          }}
                        />
                      </label>
                    </div>
                    <div className="profile-photo-actions">
                      {sortedPhotos.length >= 2 ? (
                        <button
                          className="button secondary"
                          type="button"
                          onClick={() => setCompareId(photo.id)}
                        >
                          Porovnat
                        </button>
                      ) : null}
                      <label className="button secondary profile-replace-btn">
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
                              setPhotos(
                                replacePhoto(photo.id, {
                                  dataUrl: prepared.dataUrl,
                                  fileName: prepared.fileName,
                                })
                              );
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
                        className="button secondary"
                        type="button"
                        onClick={() => {
                          const next = deletePhoto(photo.id);
                          setPhotos(next);
                          if (compareId === photo.id) {
                            setCompareId(next[next.length - 1]?.id ?? null);
                          }
                        }}
                      >
                        Smazat
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="profile-empty profile-empty--photos">
              <p>Zatím nemáte nahrané žádné fotografie.</p>
              <p className="meta-line">
                Pravidelná fotodokumentace pomáhá sledovat vývoj v čase.
              </p>
            </div>
          )}

          {comparePair ? (
            <div className="photo-compare-view" aria-live="polite">
              <div className="photo-compare-head">
                <h3>Porovnání snímků</h3>
                <p className="meta-line">Přetáhněte linku mezi snímky</p>
              </div>
              <PhotoCompareSlider
                beforeSrc={comparePair.before.dataUrl}
                afterSrc={comparePair.after.dataUrl}
                beforeAlt={`Snímek z ${formatPhotoDate(comparePair.before.createdAt)}`}
                afterAlt={`Snímek z ${formatPhotoDate(comparePair.after.createdAt)}`}
                beforeCaption={formatPhotoDate(comparePair.before.createdAt)}
                afterCaption={formatPhotoDate(comparePair.after.createdAt)}
              />
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
