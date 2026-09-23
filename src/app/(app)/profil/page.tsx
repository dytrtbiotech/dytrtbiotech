"use client";

import PhotoCompareSlider from "@/components/app/PhotoCompareSlider";
import ResultCard from "@/components/screening/ResultCard";
import {
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
  hydrateScreeningForUser,
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
    hydrateScreeningForUser(auth.email);
    const stored = loadUserAnswers(auth.email);
    if (Object.keys(stored).length > 0) return stored;
  }
  return loadAnswers();
}

export default function ProfilPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [answers, setAnswers] = useState<ScreeningAnswers>({});
  const [result, setResult] = useState<ResultCategory | null>(null);
  const [percent, setPercent] = useState(0);
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

        {screeningReady && result ? (
          <section className="profile-screening" aria-labelledby="profile-screening">
            <ResultCard
              compact
              result={result}
              percent={percent}
              answers={answers}
              titleId="profile-screening"
            />
          </section>
        ) : (
          <section
            className="summary-block profile-screening"
            aria-labelledby="profile-screening"
          >
            <h2 id="profile-screening">Screening / výsledek</h2>
            <p className="profile-section-lead">
              Orientační výsledek vstupního screeningu.
            </p>
            <div className="profile-empty">
              <p>Výsledek screeningu zatím není dostupný.</p>
              <p className="meta-line">
                Pokud jste screening už prošli, spusťte ho znovu — výsledek se
                uloží k účtu a zobrazí se tady.
              </p>
              <div className="flow-actions">
                <Link className="button" href="/dotaznik">
                  Spustit screening
                </Link>
              </div>
            </div>
          </section>
        )}

        <section
          className="summary-block profile-photos"
          aria-labelledby="profile-photos"
        >
          <div className="profile-photos-head">
            <div>
              <h2 id="profile-photos">Fotodokumentace vývoje</h2>
              <p className="profile-section-lead">
                Volitelná fotodokumentace pro manuální porovnání v čase.
              </p>
            </div>
            {photos.length > 0 ? (
              <p className="meta-line profile-photos-count">
                {photos.length} / {MAX_PHOTOS}
              </p>
            ) : null}
          </div>

          <div className="profile-upload-row">
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
              {busy ? "Nahrávám…" : "Nahrát fotografii"}
            </button>
          </div>
          <p className="profile-upload-info">
            Stejný úhel a podobné světlo · JPG, PNG, WEBP · max. {MAX_PHOTOS}{" "}
            fotografií
          </p>
          {error ? <p className="app-error">{error}</p> : null}

          {sortedPhotos.length > 0 ? (
            <ul className="photo-grid profile-photo-grid">
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
                    <div>
                      <p className="profile-photo-label">Snímek {index + 1}</p>
                      <p className="meta-line">
                        {formatPhotoDate(photo.createdAt)}
                      </p>
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
          ) : (
            <p className="profile-photos-empty">
              Zatím žádné fotografie. Pravidelná dokumentace pomáhá sledovat
              vývoj v čase.
            </p>
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
