"use client";

import {
  COLLECTION_INSTRUCTIONS,
  formatCzk,
  getDoctor,
  getNextTask,
  getPanel,
  isPaidStatus,
  statusLabel,
  type OrderDraft,
} from "@/lib/order/config";
import {
  loadOrder,
  markCollectionReported,
  markDocumentsReady,
  markResultsWithDoctor,
} from "@/lib/order/storage";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function VysetreniPage() {
  const [ready, setReady] = useState(false);
  const [order, setOrder] = useState<OrderDraft | null>(null);

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

  const panel = getPanel(order?.panelId);
  const doctor = getDoctor(order?.doctorId);
  const task = getNextTask(order);
  const paid = isPaidStatus(order?.status);

  return (
    <>
      <header className="app-topbar">
        <div>
          <p className="app-topbar-kicker">Klientská aplikace</p>
          <p className="app-topbar-title">Vyšetření</p>
        </div>
      </header>
      <div className="app-content">
        <h1>Laboratorní vyšetření</h1>
        {!panel ? (
          <>
            <p className="app-lead">
              Zatím nemáte vybraný panel. Začněte výběrem laboratorního
              vyšetření.
            </p>
            <Link className="button" href="/objednavka/panel">
              Vybrat panel
            </Link>
          </>
        ) : (
          <>
            <p className="app-lead">
              Odběr probíhá na místě u SYNLABu. Domácí odběr v této verzi
              nenabízíme.
            </p>

            <section className="summary-block">
              <h2>{panel.name}</h2>
              <p className="summary-price">{formatCzk(panel.priceCzk)}</p>
              {doctor ? <p>Lékař pro výsledky: {doctor.name}</p> : null}
              {order?.orderNumber ? <p>Objednávka: {order.orderNumber}</p> : null}
              <p>Stav: {statusLabel(order?.status)}</p>
              {order?.updatedAt ? (
                <p className="meta-line">
                  Aktualizace:{" "}
                  {new Date(order.updatedAt).toLocaleString("cs-CZ")}
                </p>
              ) : null}
            </section>

            {!paid && task.href && task.ctaLabel ? (
              <Link className="button" href={task.href}>
                {task.ctaLabel}
              </Link>
            ) : null}

            {order?.status === "paid_preparing" ? (
              <section className="flow-card">
                <h2>Platba přijata</h2>
                <p>
                  Připravujeme podklady k odběru. V ostrém provozu by stav přišel
                  z laboratoře. Pro demo můžete připravenost nasimulovat.
                </p>
                <div className="flow-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      markDocumentsReady();
                      refresh();
                    }}
                  >
                    Simulovat připravené podklady
                  </button>
                  <Link className="text-link" href="/hairscope">
                    Mezitím HairScope
                  </Link>
                </div>
              </section>
            ) : null}

            {order?.status === "ready_for_collection" ? (
              <section className="flow-card">
                <h2>Podklady k odběru jsou připravené</h2>
                {order.collectionRef ? (
                  <p>
                    Referenční kód (demo):{" "}
                    <strong className="mono">{order.collectionRef}</strong>
                  </p>
                ) : null}
                <p className="flow-note">
                  Nejde o skutečný kód SYNLABu — jen ukázka pro průchod demem.
                </p>
                <h3>Instrukce</h3>
                <ul className="instruction-list">
                  {COLLECTION_INSTRUCTIONS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="flow-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      markCollectionReported();
                      refresh();
                    }}
                  >
                    Odběr jsem absolvoval/a
                  </button>
                  <Link className="text-link" href="/hairscope">
                    Doplnit HairScope
                  </Link>
                </div>
              </section>
            ) : null}

            {order?.status === "collection_reported" ? (
              <section className="flow-card">
                <h2>Čekáme na výsledky</h2>
                <p>
                  Odběr evidujeme podle vašeho oznámení. To není doklad o
                  dokončení vyšetření ani o předání výsledků. V demu můžete
                  předání lékaři nasimulovat.
                </p>
                <div className="flow-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      markResultsWithDoctor();
                      refresh();
                    }}
                  >
                    Simulovat předání lékaři
                  </button>
                  <Link className="text-link" href="/hairscope">
                    HairScope
                  </Link>
                </div>
              </section>
            ) : null}

            {order?.status === "results_with_doctor" ||
            order?.status === "consultation_reported" ||
            order?.status === "continue_approved" ||
            order?.status === "care_paid" ||
            order?.status === "care_completed" ? (
              <section className="flow-card">
                <h2>Výsledky u lékaře</h2>
                <p>
                  Laboratorní hodnoty v aplikaci nezobrazujeme. Další krok je
                  konzultace u zvoleného lékaře.
                </p>
                <Link className="button" href="/konzultace">
                  Přejít ke konzultaci
                </Link>
              </section>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
