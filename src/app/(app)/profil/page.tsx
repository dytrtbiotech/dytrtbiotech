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
          <div className="profile-photos-toolbar">
            <div className="profile-photos-intro">
              <h2 id="profile-photos">Fotodokumentace vývoje</h2>
              <p>
                Volitelná fotodokumentace pro manuální porovnání v čase.
              </p>
              <p className="profile-photos-helper">
                Pro nejlepší porovnání používejte podobný úhel a světlo · JPG,
                PNG, WEBP · max. {MAX_PHOTOS} fotografií
                {photos.length > 0 ? ` · nahráno ${photos.length}` : ""}
              </p>
            </div>

            <div className="profile-photos-controls">
              <div className="checkout-field profile-photos-date">
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
          </div>
          {error ? <p className="app-error">{error}</p> : null}

          <div className="profile-photos-divider" aria-hidden="true" />

          {sortedPhotos.length > 0 ? (
            <ul className="profile-photo-grid">
              {sortedPhotos.map((photo) => (
                <li key={photo.id} className="profile-photo-card">
                  <div className="profile-photo-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.dataUrl}
                      alt={`Fotografie z ${formatPhotoDate(photo.createdAt)}`}
                    />
                  </div>
                  <label className="profile-photo-date">
                    <span className="sr-only">Datum snímku</span>
                    <input
                      type="date"
                      className="profile-photo-date-input"
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
            <div className="profile-photos-empty">
              <svg
                className="profile-photos-empty-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M16 6.75C15.3096 6.75 14.75 7.30964 14.75 8C14.75 8.69036 15.3096 9.25 16 9.25C16.6904 9.25 17.25 8.69036 17.25 8C17.25 7.30964 16.6904 6.75 16 6.75ZM13.25 8C13.25 6.48122 14.4812 5.25 16 5.25C17.5188 5.25 18.75 6.48122 18.75 8C18.75 9.51878 17.5188 10.75 16 10.75C14.4812 10.75 13.25 9.51878 13.25 8Z"
                  fill="currentColor"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.9426 1.25H12.0574C14.3658 1.24999 16.1748 1.24998 17.5863 1.43975C19.031 1.63399 20.1711 2.03933 21.0659 2.93414C21.9607 3.82895 22.366 4.96897 22.5603 6.41371C22.75 7.82519 22.75 9.63423 22.75 11.9426V12.0574C22.75 14.3658 22.75 16.1748 22.5603 17.5863C22.366 19.031 21.9607 20.1711 21.0659 21.0659C20.1711 21.9607 19.031 22.366 17.5863 22.5603C16.1748 22.75 14.3658 22.75 12.0574 22.75H11.9426C9.63423 22.75 7.82519 22.75 6.41371 22.5603C4.96897 22.366 3.82895 21.9607 2.93414 21.0659C2.03933 20.1711 1.63399 19.031 1.43975 17.5863C1.24998 16.1748 1.24999 14.3658 1.25 12.0574V11.9426C1.24999 9.63423 1.24998 7.82519 1.43975 6.41371C1.63399 4.96897 2.03933 3.82895 2.93414 2.93414C3.82895 2.03933 4.96897 1.63399 6.41371 1.43975C7.82519 1.24998 9.63423 1.24999 11.9426 1.25ZM3.9948 20.0052C3.42514 19.4355 3.09825 18.6648 2.92637 17.3864C2.77289 16.2449 2.75296 14.7885 2.75038 12.8401L4.24546 11.5319C4.85958 10.9946 5.78515 11.0254 6.36216 11.6024L10.6519 15.8922C11.5968 16.8371 13.0843 16.9659 14.1776 16.1975L14.4758 15.988C15.334 15.3849 16.4951 15.4547 17.2747 16.1564L20.4983 19.0576C20.5334 19.0892 20.5706 19.1168 20.6095 19.1406C20.4478 19.4815 20.2487 19.7617 20.0052 20.0052C19.4355 20.5749 18.6648 20.9018 17.3864 21.0736C16.0864 21.2484 14.3782 21.25 12 21.25C9.62178 21.25 7.91356 21.2484 6.61358 21.0736C5.33517 20.9018 4.56445 20.5749 3.9948 20.0052ZM6.61358 2.92637C5.33517 3.09825 4.56445 3.42514 3.9948 3.9948C3.42514 4.56445 3.09825 5.33517 2.92637 6.61358C2.78124 7.69307 2.75552 9.05407 2.75098 10.8465L3.25771 10.4031C4.46613 9.34572 6.28741 9.40636 7.42282 10.5418L11.7125 14.8315C12.1421 15.261 12.8182 15.3196 13.3152 14.9703L13.6134 14.7607C15.0437 13.7555 16.9788 13.872 18.2782 15.0415L21.0522 17.5381C21.0596 17.4883 21.0667 17.4378 21.0736 17.3864C21.2484 16.0864 21.25 14.3782 21.25 12C21.25 9.62178 21.2484 7.91356 21.0736 6.61358C20.9018 5.33517 20.5749 4.56445 20.0052 3.9948C19.4355 3.42514 18.6648 3.09825 17.3864 2.92637C16.0864 2.75159 14.3782 2.75 12 2.75C9.62178 2.75 7.91356 2.75159 6.61358 2.92637Z"
                  fill="currentColor"
                />
              </svg>
              <p>Zatím nemáte nahrané žádné fotografie.</p>
              <p>
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
