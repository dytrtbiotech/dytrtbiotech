"use client";

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

export default function FotografiePage() {
  const [ready, setReady] = useState(false);
  const [order, setOrder] = useState<OrderDraft | null>(null);
  const [photos, setPhotos] = useState<CarePhoto[]>([]);
  const [visitIndex, setVisitIndex] = useState<number | "">("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [compareLeft, setCompareLeft] = useState<string>("");
  const [compareRight, setCompareRight] = useState<string>("");

  useEffect(() => {
    const list = loadPhotos();
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

  const careReady =
    order?.status === "care_paid" || order?.status === "care_completed";

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
          <p className="app-topbar-kicker">Plán péče</p>
          <p className="app-topbar-title">Moje fotografie</p>
        </div>
      </header>
      <div className="app-content">
        <h1>Moje fotografie</h1>
        <p className="app-lead app-lead--nowrap">
          Volitelná fotodokumentace pro manuální porovnání. Nenahrazuje
          potvrzení návštěvy a neslibuje procentuální zlepšení.
        </p>
        <div className="app-page-actions">
          <Link className="button secondary" href="/plan-pece">
            Zpět do programu
          </Link>
        </div>

        {!careReady ? (
          <section className="flow-card">
            <p>
              Fotografie se otevírají u aktivního plánu péče. Nejdřív dokončete
              program.
            </p>
            <Link className="button" href="/plan-pece">
              Otevřít plán péče
            </Link>
          </section>
        ) : (
          <>
            <section className="flow-card">
              <h2>Nahrát fotografii</h2>
              <ul className="instruction-list">
                <li>Stejný úhel a podobné světlo usnadní srovnání</li>
                <li>Podporujeme JPG, PNG a WEBP (HEIC zatím ne)</li>
                <li>
                  Nejvýše {MAX_PHOTOS} fotografií · nahrání je dobrovolné
                </li>
              </ul>

              <div className="checkout-fields">
                <div className="checkout-field">
                  <label htmlFor="photo-visit">Vazba na návštěvu (volitelné)</label>
                  <select
                    id="photo-visit"
                    className="app-input"
                    value={visitIndex}
                    onChange={(e) =>
                      setVisitIndex(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  >
                    <option value="">Bez vazby / jen datum</option>
                    {visits.map((v) => (
                      <option key={v.index} value={v.index}>
                        Návštěva {v.index}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="checkout-field">
                  <label htmlFor="photo-file">Soubor</label>
                  <input
                    id="photo-file"
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
            </section>

            {photos.length > 0 ? (
              <section className="photo-grid-section">
                <h2>Nahrané snímky</h2>
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
              </section>
            ) : null}

            {photos.length >= 2 ? (
              <section className="flow-card compare-card">
                <h2>Porovnání</h2>
                <p>
                  Manuální srovnání prvního a pozdějšího snímku. Bez automatického
                  skóre zlepšení.
                </p>
                <div className="compare-controls">
                  <div className="checkout-field">
                    <label htmlFor="compare-left">Vlevo</label>
                    <select
                      id="compare-left"
                      className="app-input"
                      value={left?.id ?? ""}
                      onChange={(e) => setCompareLeft(e.target.value)}
                    >
                      {photos.map((p, i) => (
                        <option key={p.id} value={p.id}>
                          #{i + 1}
                          {p.visitIndex ? ` · návštěva ${p.visitIndex}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="compare-right">Vpravo</label>
                    <select
                      id="compare-right"
                      className="app-input"
                      value={right?.id ?? ""}
                      onChange={(e) => setCompareRight(e.target.value)}
                    >
                      {photos.map((p, i) => (
                        <option key={p.id} value={p.id}>
                          #{i + 1}
                          {p.visitIndex ? ` · návštěva ${p.visitIndex}` : ""}
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
              </section>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
