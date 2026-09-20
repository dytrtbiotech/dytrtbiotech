"use client";

import {
  LAB_PANELS,
  formatCzk,
  type PanelId,
} from "@/lib/order/config";
import { loadOrder, selectPanel } from "@/lib/order/storage";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PanelPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<PanelId | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const order = loadOrder();
    if (order?.panelId) setSelected(order.panelId);
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="app-loading">Načítání…</div>;
  }

  return (
    <>
      <h1>Vyberte laboratorní vyšetření</h1>
      <p className="app-lead app-lead--nowrap">
        Vyberte rozsah laboratorního vyšetření. Odběr následně proběhne v odběrovém místě SYNLAB.
      </p>

      <div
        className="panel-grid"
        role="radiogroup"
        aria-label="Laboratorní panely"
      >
        {LAB_PANELS.map((panel) => {
          const isSelected = selected === panel.id;
          return (
            <button
              key={panel.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`panel-card${isSelected ? " is-selected" : ""}`}
              onClick={() => setSelected(panel.id)}
            >
              <div className="panel-card-head">
                <h2>{panel.name}</h2>
                <p className="panel-price">{formatCzk(panel.priceCzk)}</p>
              </div>
              <p className="panel-collection">Odběr v laboratoři</p>
              <div className="panel-params">
                <p className="panel-params-label">Obsah vyšetření</p>
                <ul className="panel-includes">
                  {panel.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </button>
          );
        })}
      </div>

      <div className="order-actions order-actions--end">
        <button
          className="button"
          type="button"
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            selectPanel(selected);
            router.push("/objednavka/lekar");
          }}
        >
          Pokračovat k výběru lékaře
        </button>
      </div>
    </>
  );
}
