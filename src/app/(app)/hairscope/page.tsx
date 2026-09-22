"use client";

import {
  getDoctor,
  isHairScopeAvailable,
  type OrderDraft,
} from "@/lib/order/config";
import { loadOrder, setHairScopeStatus } from "@/lib/order/storage";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function HairScopePage() {
  const [ready, setReady] = useState(false);
  const [order, setOrder] = useState<OrderDraft | null>(null);
  const [started, setStarted] = useState(false);

  const refresh = useCallback(() => {
    setOrder(loadOrder());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  if (!ready) {
    return <div className="app-loading">Načítání…</div>;
  }

  const status = order?.hairScopeStatus ?? "not_started";
  const doctor = getDoctor(order?.doctorId);
  const available = isHairScopeAvailable(order);

  return (
    <>
      <header className="app-topbar">
        <div>
          <p className="app-topbar-kicker">Průběh péče</p>
          <p className="app-topbar-title">Analýza vlasů</p>
        </div>
      </header>
      <div className="app-content">
        <h1>Analýza vlasů</h1>
        <p className="app-lead app-lead--nowrap">
          Obrazová analýza je volitelný krok během čekání na laboratorní
          výsledky. Nenahrazuje vyšetření ani konzultaci
          {doctor ? ` u ${doctor.name}` : ""}.
        </p>

        {!available ? (
          <section className="flow-card">
            <p>
              Analýza vlasů se odemkne po dokončení objednávky laboratorního
              vyšetření. Mezitím můžete pokračovat v průběhu péče.
            </p>
            <div className="flow-actions">
              <Link className="button" href="/prubeh-pece">
                Zpět na průběh péče
              </Link>
              <Link className="text-link" href="/objednavka/panel">
                Dokončit objednávku
              </Link>
            </div>
          </section>
        ) : status === "completed" ? (
          <section className="flow-card">
            <div className="flow-card-head">
              <h2>Analýza dokončena</h2>
              {order?.hairScopeCompletedAt ? (
                <p className="meta-line flow-card-meta">
                  Dokončeno:{" "}
                  {new Date(order.hairScopeCompletedAt).toLocaleString("cs-CZ", {
                    day: "numeric",
                    month: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              ) : null}
            </div>
            <p>
              V demu zatím neukazujeme medicínský výstup. Místo pro napojení
              HairScope widgetu je připravené - ostrá integrace přijde později.
            </p>
            <div className="hairscope-demo-frame" aria-hidden="true">
              HairScope widget - brzy
            </div>
            <div className="flow-actions">
              <Link className="button" href="/prubeh-pece">
                Zpět na průběh péče
              </Link>
              <Link className="button secondary" href="/prehled">
                Přehled
              </Link>
            </div>
          </section>
        ) : status === "skipped" ? (
          <section className="flow-card">
            <h2>Přeskočeno</h2>
            <p>
              Analýzu jste zatím přeskočili. Laboratorní proces tím není
              blokovaný, můžete se k ní vrátit kdykoli.
            </p>
            <div className="flow-actions">
              <button
                className="button"
                type="button"
                onClick={() => {
                  setHairScopeStatus("not_started");
                  setStarted(false);
                  refresh();
                }}
              >
                Spustit přesto
              </button>
              <Link className="button secondary" href="/prubeh-pece">
                Průběh péče
              </Link>
            </div>
          </section>
        ) : !started ? (
          <section className="flow-card">
            <h2>Než začnete</h2>
            <ul className="instruction-list">
              <li>Dobré světlo a neutrální pozadí</li>
              <li>Podporované zařízení s kamerou (podle budoucího widgetu)</li>
              <li>O povolení kamery požádáme až po kliknutí na start</li>
            </ul>
            <div className="flow-actions">
              <button
                className="button"
                type="button"
                onClick={() => setStarted(true)}
              >
                Spustit analýzu
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  setHairScopeStatus("skipped");
                  refresh();
                }}
              >
                Zatím přeskočit
              </button>
            </div>
          </section>
        ) : (
          <section className="flow-card">
            <h2>Připraveno k integraci</h2>
            <p>
              Widget HairScope tu zatím není napojený. Pro pokračování v demu
              můžete analýzu označit jako dokončenou, nebo se k ní vrátit později.
            </p>
            <div className="hairscope-demo-frame" aria-hidden="true">
              HairScope widget - brzy
            </div>
            <div className="flow-actions">
              <button
                className="button"
                type="button"
                onClick={() => {
                  setHairScopeStatus("completed");
                  refresh();
                }}
              >
                Označit jako dokončené (demo)
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  setHairScopeStatus("skipped");
                  refresh();
                }}
              >
                Dokončit později
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
