"use client";

import { useEffect, useRef, useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Je screening opravdu zdarma?",
    answer:
      "Ano. Screening i orientační výsledek jsou zdarma. Vyšetření, konzultaci i program péče si vybíráte až později, pokud budete chtít.",
  },
  {
    question: "Proč po mně chcete e-mail?",
    answer:
      "E-mail slouží k zobrazení výsledku a možnosti se později vrátit. Marketingové zprávy jsou samostatný a dobrovolný souhlas.",
  },
  {
    question: "Musím po screeningu něco objednat?",
    answer:
      "Nemusíte. Můžete si jen prohlédnout výsledek. Žádné vyšetření ani program se nespouští automaticky.",
  },
  {
    question: "Co zvládnu online a kam musím osobně?",
    answer:
      "Online projdete screeningem, případně analýzou vlasů. Osobně absolvujete odběr v laboratoři a konzultaci u lékaře.",
  },
  {
    question: "Uvidím v aplikaci výsledky z laboratoře?",
    answer:
      "Laboratorní výsledky jdou přímo lékaři. Ve svém přehledu uvidíte stav objednávky a další krok.",
  },
  {
    question: "Nahrazuje to návštěvu lékaře?",
    answer:
      "Ne. Screening a analýza dávají jen orientační informace. O dalším postupu rozhoduje lékař při konzultaci.",
  },
  {
    question: "Můžu se k tomu vrátit později?",
    answer:
      "Ano. Po registraci najdete uložený postup ve svém přehledu a můžete navázat, kdy budete chtít.",
  },
];

function FaqRow({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const update = () => {
      setHeight(open ? el.scrollHeight : 0);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, item.answer]);

  return (
    <div className={`faq-item${open ? " is-open" : ""}`}>
      <button
        className="faq-trigger"
        type="button"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span>{item.question}</span>
        <span className="faq-icon" aria-hidden="true" />
      </button>
      <div className="faq-panel" style={{ height }}>
        <div className="faq-panel-inner" ref={innerRef}>
          <p>{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section
      className="section wrap"
      id="otazky"
      aria-labelledby="faq-title"
    >
      <div className="faq-layout">
        <div className="faq-intro">
          <span className="eyebrow">Než začnete</span>
          <h2 id="faq-title">
            Co by vás
            <br />
            mohlo zajímat
          </h2>
          <p>Krátké odpovědi, které se hodí znát před prvním krokem.</p>
        </div>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, index) => (
            <FaqRow
              key={item.question}
              item={item}
              open={openIndex === index}
              onToggle={() =>
                setOpenIndex((current) => (current === index ? -1 : index))
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
