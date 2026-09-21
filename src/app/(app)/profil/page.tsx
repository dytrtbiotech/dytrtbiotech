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
import { loadAnswers } from "@/lib/screening/storage";
import {
  MAX_PHOTOS,
  addPhoto,
  deletePhoto,
  loadPhotos,
  preparePhotoFile,
  replacePhoto,
  type CarePhoto,
} from "@/lib/photos/storage";
import PhotoCompareSlider from "@/components/app/PhotoCompareSlider";
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

function UploadIcon() {
  return (
    <svg
      className="photo-upload-icon"
      viewBox="0 0 24 24"
      width="28"
      height="28"
      aria-hidden="true"
    >
      <path
        d="M12 16V5M12 5l-4 4M12 5l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 16.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReplaceIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M3 8a5 5 0 0 1 8.5-3.5M13 3.5V5H11.5M13 8a5 5 0 0 1-8.5 3.5M3 12.5V11H4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M3.5 4.5h9M6.5 4.5V3.5h3v1M5.5 4.5l.5 8h4l.5-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProfilPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [answers, setAnswers] = useState<ScreeningAnswers>({});
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [percent, setPercent] = useState(0);
  const [showScreeningDetail, setShowScreeningDetail] = useState(false);
  const [photos, setPhotos] = useState<CarePhoto[]>([]);
  const [photoDate, setPhotoDate] = useState(todayInputValue);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const storedAnswers = loadAnswers();
    const result = evaluateResult(storedAnswers);
    setAnswers(storedAnswers);
    setTitle(result.title);
    setSummary(result.summary);
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

  const hasScreening = Object.keys(answers).length > 0;
  const firstPhoto = sortedPhotos[0] ?? null;
  const latestPhoto =
    sortedPhotos.length >= 2 ? sortedPhotos[sortedPhotos.length - 1] : null;

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
          Screening, fotodokumentace a průběžný vývoj.
        </p>

        <section className="summary-block" aria-labelledby="profile-screening">
          <h2 id="profile-screening">Screening / vstupní informace</h2>
          {hasScreening ? (
            <>
              <p className="profile-screening-status">Dokončeno</p>
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
                    ? "Skrýt výsledek"
                    : "Zobrazit výsledek"}
                </button>
              </div>
              {showScreeningDetail ? (
                <dl className="journey-meta profile-screening-detail">
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
          <h2 id="profile-photos">Fotodokumentace vývoje</h2>
          <p>
            Volitelná fotodokumentace pro manuální porovnání v čase. Nenahrazuje
            lékařské hodnocení.
          </p>

          <div className="photo-upload-box">
            <UploadIcon />
            <h3 className="photo-upload-title">Nahrát fotografii</h3>
            <p className="photo-upload-helper">
              Pro lepší porovnání doporučujeme stejný úhel a podobné světlo.
            </p>

            <div className="checkout-field photo-upload-date">
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

            <p className="photo-upload-info">
              JPG, PNG, WEBP · maximálně {MAX_PHOTOS} fotografií
            </p>
            {error ? <p className="app-error">{error}</p> : null}
          </div>

          {photos.length > 0 ? (
            <div className="photo-grid-section">
              <div className="photo-grid-head">
                <h3>Nahrané snímky</h3>
                <p className="meta-line">
                  {photos.length} / {MAX_PHOTOS}
                </p>
              </div>

              <ul className="photo-grid">
                {sortedPhotos.map((photo) => (
                  <li key={photo.id} className="photo-card">
                    <div className="photo-card-media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.dataUrl} alt="" />
                      <div className="photo-card-actions">
                        <label
                          className="photo-card-action"
                          title="Nahradit"
                          aria-label="Nahradit fotografii"
                        >
                          <ReplaceIcon />
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
                          className="photo-card-action"
                          type="button"
                          title="Smazat"
                          aria-label="Smazat fotografii"
                          onClick={() => setPhotos(deletePhoto(photo.id))}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
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
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {firstPhoto && latestPhoto ? (
            <div className="photo-compare-view" aria-live="polite">
              <div className="photo-compare-head">
                <h3>Porovnání snímků</h3>
                <p className="meta-line">Přetáhněte linku mezi snímky</p>
              </div>
              <PhotoCompareSlider
                beforeSrc={firstPhoto.dataUrl}
                afterSrc={latestPhoto.dataUrl}
                beforeAlt={`První snímek z ${formatPhotoDate(firstPhoto.createdAt)}`}
                afterAlt={`Nejnovější snímek z ${formatPhotoDate(latestPhoto.createdAt)}`}
                beforeCaption={formatPhotoDate(firstPhoto.createdAt)}
                afterCaption={formatPhotoDate(latestPhoto.createdAt)}
              />
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
