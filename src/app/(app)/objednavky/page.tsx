"use client";

import {
  CARE_PROGRAM,
  createEmptyVisits,
  formatCzk,
  getDoctor,
  getPanel,
  isPaidStatus,
  statusLabel,
  type OrderDraft,
} from "@/lib/order/config";
import { loadOrder } from "@/lib/order/storage";
import Link from "next/link";
import { useEffect, useState } from "react";

type ListedOrder = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  status: string;
  date?: string;
  href: string;
};

export default function ObjednavkyPage() {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<ListedOrder[]>([]);

  useEffect(() => {
    const order = loadOrder();
    setItems(buildOrders(order));
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="app-loading">Načítání…</div>;
  }

  return (
    <>
      <header className="app-topbar">
        <div>
          <p className="app-topbar-kicker">Klientská aplikace</p>
          <p className="app-topbar-title">Objednávky</p>
        </div>
      </header>
      <div className="app-content">
        <h1>Objednávky</h1>
        <p className="app-lead">
          Přehled laboratorní objednávky a programu péče. Detail laboratorních
          hodnot tu není.
        </p>

        {items.length === 0 ? (
          <section className="flow-card">
            <p>Zatím nemáte žádnou objednávku.</p>
            <Link className="button" href="/objednavka/panel">
              Vybrat laboratorní panel
            </Link>
          </section>
        ) : (
          <ul className="orders-list">
            {items.map((item) => (
              <li key={item.id} className="order-list-card">
                <div className="order-list-card-head">
                  <h2>{item.title}</h2>
                  <span className="demo-badge">{item.status}</span>
                </div>
                <p>{item.subtitle}</p>
                <p className="summary-price">{item.amount}</p>
                {item.date ? (
                  <p className="meta-line">
                    {new Date(item.date).toLocaleString("cs-CZ")}
                  </p>
                ) : null}
                <Link className="text-link" href={item.href}>
                  Otevřít detail
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function buildOrders(order: OrderDraft | null): ListedOrder[] {
  if (!order) return [];
  const items: ListedOrder[] = [];
  const panel = getPanel(order.panelId);
  const doctor = getDoctor(order.doctorId);

  if (panel && (isPaidStatus(order.status) || order.panelId)) {
    items.push({
      id: order.orderNumber ?? "lab-draft",
      title: panel.name,
      subtitle: doctor
        ? `Laboratoř · lékař ${doctor.name}`
        : "Laboratorní vyšetření",
      amount: formatCzk(panel.priceCzk),
      status: statusLabel(order.status),
      date: order.paidAt ?? order.updatedAt,
      href: isPaidStatus(order.status) ? "/vysetreni" : "/objednavka/souhrn",
    });
  }

  if (
    order.status === "care_paid" ||
    order.status === "care_completed" ||
    order.careOrderNumber
  ) {
    const visits = order.visits?.length
      ? order.visits
      : createEmptyVisits();
    const done = visits.filter((v) => v.status === "completed").length;
    items.push({
      id: order.careOrderNumber ?? "care",
      title: CARE_PROGRAM.name,
      subtitle: `${done} / ${CARE_PROGRAM.sessions} návštěv · ${
        doctor?.name ?? CARE_PROGRAM.provider
      }`,
      amount: formatCzk(CARE_PROGRAM.priceCzk),
      status:
        order.status === "care_completed" ? "Dokončeno" : "Program aktivní",
      date: order.carePaidAt,
      href: "/plan-pece",
    });
  }

  return items;
}
