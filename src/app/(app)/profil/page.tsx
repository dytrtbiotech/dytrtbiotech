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
    month: "long",
    year: "numeric",
  });
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

export default function ProfilPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
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

  useEffect(() => {
    const storedAnswers = loadAnswers();
    const result = evaluateResult(storedAnswers);
    setAnswers(storedAnswers);
    setTitle(result.title);
    setSummary(result.summary);
    setPercent(scorePercent(storedAnswers));
    setOrder(loadOrder());
    setPhotos(loadPhotos());
    setReady(true);
  }, []);

  const visits = useMemo(() => {
    if (order?.visits?.length) return order.visits;
    if (order?.status === "care_paid" || order?.status === "care_completed") {
      return createEmptyVisits();
    }
    return [];
  }, [order]);

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
        visitIndex: typeof visitIndex === "number" ? visitIndex : undefined,
        createdAt: new Date().toISOString(),
        dataUrl: prepared.dataUrl,
        fileName: prepared.fileName,
      });
      setPhotos(next);
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

            {visits.length > 0 ? (
              <div className="checkout-field photo-upload-visit">
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
                    </div>
                    <div className="photo-card-meta">
                      <p className="photo-card-date">
                        {formatPhotoDate(photo.createdAt)}
                      </p>
                      <p className="photo-card-visit">
                        {photo.visitIndex
                          ? `Návštěva ${photo.visitIndex}`
                          : "Bez vazby na návštěvu"}
                      </p>
                      <div className="photo-card-actions">
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
                            setPhotos(deletePhoto(photo.id));
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

          {firstPhoto && latestPhoto ? (
            <div className="photo-compare-view" aria-live="polite">
              <div className="photo-compare-head">
                <h3>Porovnání snímků</h3>
                <p className="meta-line">První nahraný · nejnovější</p>
              </div>
              <div className="compare-stage">
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={firstPhoto.dataUrl}
                    alt={`První snímek z ${formatPhotoDate(firstPhoto.createdAt)}`}
                  />
                  <figcaption>
                    <span className="photo-compare-label">První</span>
                    <span className="photo-compare-date">
                      {formatPhotoDate(firstPhoto.createdAt)}
                    </span>
                    <span className="photo-compare-visit">
                      {firstPhoto.visitIndex
                        ? `Návštěva ${firstPhoto.visitIndex}`
                        : "Bez vazby na návštěvu"}
                    </span>
                  </figcaption>
                </figure>
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={latestPhoto.dataUrl}
                    alt={`Nejnovější snímek z ${formatPhotoDate(latestPhoto.createdAt)}`}
                  />
                  <figcaption>
                    <span className="photo-compare-label">Nejnovější</span>
                    <span className="photo-compare-date">
                      {formatPhotoDate(latestPhoto.createdAt)}
                    </span>
                    <span className="photo-compare-visit">
                      {latestPhoto.visitIndex
                        ? `Návštěva ${latestPhoto.visitIndex}`
                        : "Bez vazby na návštěvu"}
                    </span>
                  </figcaption>
                </figure>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
