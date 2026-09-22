export type PanelId = "basic" | "extended" | "complete";

export type LabPanel = {
  id: PanelId;
  name: string;
  priceCzk: number;
  collection: string;
  includes: string[];
  note?: string;
};

/** Pracovní ceny z návrhu — nepotvrzený ceník. */
export const LAB_PANELS: LabPanel[] = [
  {
    id: "basic",
    name: "Základní panel",
    priceCzk: 1490,
    collection: "Odběr na místě u SYNLABu",
    includes: [
      "Základní laboratorní parametry související s vlasy",
      "Předání výsledků zvolenému lékaři",
      "Instrukce k odběru v aplikaci",
    ],
  },
  {
    id: "extended",
    name: "Rozšířený panel",
    priceCzk: 4500,
    collection: "Odběr na místě u SYNLABu",
    includes: [
      "Širší sada laboratorních parametrů",
      "Předání výsledků zvolenému lékaři",
      "Instrukce k odběru v aplikaci",
    ],
  },
  {
    id: "complete",
    name: "Kompletní panel",
    priceCzk: 6200,
    collection: "Odběr na místě u SYNLABu",
    includes: [
      "Nejširší sada parametrů z aktuální nabídky",
      "Předání výsledků zvolenému lékaři",
      "Instrukce k odběru v aplikaci",
    ],
  },
];

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  city: string;
  address: string;
  contact: string;
  consultationNote: string;
  /** Externí rezervační systém ordinace — aplikace jen odkáže. */
  bookingUrl: string;
  demo: true;
};

/** Ukázková data — pouze pro vývojové demo. */
export const DEMO_DOCTORS: Doctor[] = [
  {
    id: "doc-praha-1",
    name: "MUDr. Jana Svobodová",
    specialty: "Dermatologie",
    city: "Praha",
    address: "Vinohradská 12, Praha 2",
    contact: "recepce@demo-ordinace.cz",
    consultationNote: "Cenu a termín konzultace potvrzuje ordinace.",
    bookingUrl: "https://example.com/rezervace/svobodova",
    demo: true,
  },
  {
    id: "doc-brno-1",
    name: "MUDr. Petr Novák",
    specialty: "Trichologie / dermatologie",
    city: "Brno",
    address: "Masarykova 8, Brno",
    contact: "+420 777 000 001",
    consultationNote: "Objednání probíhá přímo u ordinace po předání výsledků.",
    bookingUrl: "https://example.com/rezervace/novak",
    demo: true,
  },
  {
    id: "doc-ostrava-1",
    name: "Ordinace HairCare Demo",
    specialty: "Dermatologie",
    city: "Ostrava",
    address: "Nádražní 5, Ostrava",
    contact: "info@demo-haircare.cz",
    consultationNote: "Aktuální podmínky konzultace sdělí recepce.",
    bookingUrl: "https://example.com/rezervace/haircare",
    demo: true,
  },
];

/** Verdikt nahlášený uživatelem — aplikace nic nevyhodnocuje. */
export type ConsultationOutcome =
  | "recommended"
  | "not_recommended"
  | "needs_more_tests"
  | "unsure";

export const CONSULTATION_OUTCOMES: {
  id: ConsultationOutcome;
  label: string;
  lockedBody: string;
}[] = [
  {
    id: "recommended",
    label: "Lékař mi doporučil pokračovat",
    lockedBody: "",
  },
  {
    id: "not_recommended",
    label: "Lékař mi nedoporučil pokračovat",
    lockedBody:
      "Podle vámi nahlášeného závěru konzultace zatím program neotevíráme. Pokud se situace změní, upravte závěr na stránce konzultace.",
  },
  {
    id: "needs_more_tests",
    label: "Je potřeba doplnit další vyšetření",
    lockedBody:
      "Program zůstává zamčený, dokud nebude podle lékaře jasné pokračování. Po doplnění vyšetření můžete závěr konzultace aktualizovat.",
  },
  {
    id: "unsure",
    label: "Nejsem si jistý / potřebuji to ověřit",
    lockedBody:
      "Program zatím neotevíráme. Jakmile budete mít od lékaře jasný závěr, nahlaste ho v konzultaci.",
  },
];

/** Pracovní nabídka programu z návrhu — neověřený ceník. */
export const CARE_PROGRAM = {
  id: "follicad-6",
  name: "Navazující program FOLLICAD",
  sessions: 6,
  durationMonths: 6,
  priceCzk: 65000,
  provider: "Smluvní ordinace (demo)",
  includes: [
    "6 aplikací v období přibližně 6 měsíců",
    "Realizace u zvoleného lékaře / pracoviště",
    "Plán návštěv v aplikaci",
  ],
  notes: [
    "Cena konzultace se hradí ordinaci zvlášť, pokud není výslovně zahrnutá.",
    "Zaplacení programu negarantuje výsledek péče.",
    "Termíny se domlouvají s ordinací — aplikace je jen eviduje.",
  ],
} as const;

export type OrderStatus =
  | "draft_panel"
  | "draft_doctor"
  | "draft_checkout"
  | "paid_preparing"
  | "ready_for_collection"
  | "collection_reported"
  | "results_with_doctor"
  | "consultation_reported"
  | "continue_approved"
  | "care_paid"
  | "care_completed";

export type HairScopeStatus = "not_started" | "skipped" | "completed";

export type VisitStatus =
  | "unscheduled"
  | "user_reported"
  | "completed"
  | "cancelled";

export type CareVisit = {
  index: number;
  status: VisitStatus;
  scheduledAt?: string;
  completedAt?: string;
  note?: string;
};

export type OrderDraft = {
  panelId?: PanelId;
  doctorId?: string;
  fullName?: string;
  phone?: string;
  status: OrderStatus;
  orderNumber?: string;
  paidAt?: string;
  documentsReadyAt?: string;
  /** Demo reference only — not a real SYNLAB code. */
  collectionRef?: string;
  collectionReportedAt?: string;
  resultsDeliveredAt?: string;
  consultationAt?: string;
  consultationNote?: string;
  consultationBookedAt?: string;
  consultationAttendedAt?: string;
  /** Verdikt zadaný uživatelem — ne automatické hodnocení aplikace. */
  consultationOutcome?: ConsultationOutcome;
  consultationOutcomeAt?: string;
  continueApprovedAt?: string;
  careOrderNumber?: string;
  carePaidAt?: string;
  visits?: CareVisit[];
  hairScopeStatus?: HairScopeStatus;
  hairScopeCompletedAt?: string;
  updatedAt: string;
};

export const ORDER_STEPS = [
  { id: "panel", label: "Panel", href: "/objednavka/panel" },
  { id: "doctor", label: "Lékař", href: "/objednavka/lekar" },
  { id: "checkout", label: "Údaje a platba", href: "/objednavka/souhrn" },
] as const;

export type OrderStepId = (typeof ORDER_STEPS)[number]["id"];

export const COLLECTION_INSTRUCTIONS = [
  "Dostavte se na odběrové místo SYNLAB s dokladem totožnosti.",
  "Mějte u sebe e-mail / telefon z objednávky pro dohledání.",
  "Přesný postup nalačno a přípravy potvrdí laboratoř - zde je jen orientační návod z dema.",
  "Po odběru se můžete vrátit do aplikace a označit, že jste odběr absolvovali.",
] as const;

export function createEmptyVisits(count = CARE_PROGRAM.sessions): CareVisit[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i + 1,
    status: "unscheduled" as const,
  }));
}

export function getPanel(id?: PanelId) {
  return LAB_PANELS.find((p) => p.id === id);
}

export function getDoctor(id?: string) {
  return DEMO_DOCTORS.find((d) => d.id === id);
}

export function formatCzk(amount: number) {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function visitStatusLabel(status: VisitStatus) {
  switch (status) {
    case "user_reported":
      return "Termín nahlášen vámi";
    case "completed":
      return "Absolvováno";
    case "cancelled":
      return "Zrušeno";
    default:
      return "Zatím nenaplánováno";
  }
}

export function isPaidStatus(status?: OrderStatus) {
  return (
    status === "paid_preparing" ||
    status === "ready_for_collection" ||
    status === "collection_reported" ||
    status === "results_with_doctor" ||
    status === "consultation_reported" ||
    status === "continue_approved" ||
    status === "care_paid" ||
    status === "care_completed"
  );
}

export function statusLabel(status?: OrderStatus) {
  switch (status) {
    case "paid_preparing":
      return "Připravujeme podklady k odběru";
    case "ready_for_collection":
      return "Podklady k odběru jsou připravené";
    case "collection_reported":
      return "Čekáme na předání výsledků lékaři";
    case "results_with_doctor":
      return "Výsledky předány lékaři";
    case "consultation_reported":
      return "Konzultace v průběhu";
    case "continue_approved":
      return "Program odemčen podle nahlášeného závěru";
    case "care_paid":
      return "Program zaplacen — plán péče aktivní";
    case "care_completed":
      return "Péče dokončena";
    case "draft_checkout":
    case "draft_doctor":
    case "draft_panel":
      return "Rozpracovaná objednávka";
    default:
      return "Bez objednávky";
  }
}

export type NextTask = {
  title: string;
  body: string;
  ctaLabel?: string;
  href?: string;
  tone?: "default" | "wait";
  /** Optional context line under the title (e.g. selected doctor). */
  detail?: string;
  secondary?: { label: string; href: string };
};

export type CareProgressState = "done" | "current" | "upcoming";

export type CareProgressStep = {
  id: "screening" | "lab" | "hairscope" | "consult" | "next";
  label: string;
  state: CareProgressState;
};

function hairScopeDone(order: OrderDraft | null) {
  return (
    order?.hairScopeStatus === "completed" ||
    order?.hairScopeStatus === "skipped"
  );
}

function isWaitingOnLab(status?: OrderStatus) {
  return (
    status === "paid_preparing" ||
    status === "ready_for_collection" ||
    status === "collection_reported"
  );
}

export function getConsultationOutcomeMeta(outcome?: ConsultationOutcome) {
  return CONSULTATION_OUTCOMES.find((item) => item.id === outcome);
}

/** Program se odemkne jen po nahlášení „lékař doporučil pokračovat“. */
export function isProgramUnlocked(order: OrderDraft | null) {
  if (!order) return false;
  if (
    order.status === "continue_approved" ||
    order.status === "care_paid" ||
    order.status === "care_completed"
  ) {
    return true;
  }
  return order.consultationOutcome === "recommended";
}

export function isConsultationUnlocked(order: OrderDraft | null) {
  const status = order?.status;
  return (
    status === "results_with_doctor" ||
    status === "consultation_reported" ||
    status === "continue_approved" ||
    status === "care_paid" ||
    status === "care_completed"
  );
}

function hasConsultationOutcome(order: OrderDraft | null) {
  return Boolean(order?.consultationOutcome);
}

export function getCareProgress(order: OrderDraft | null): CareProgressStep[] {
  const status = order?.status;
  const paid = isPaidStatus(status);
  const hairDone = hairScopeDone(order);
  const labDone =
    status === "results_with_doctor" ||
    status === "consultation_reported" ||
    status === "continue_approved" ||
    status === "care_paid" ||
    status === "care_completed";
  const consultDone = hasConsultationOutcome(order);
  const nextDone = status === "care_paid" || status === "care_completed";
  const programOpen = isProgramUnlocked(order);

  let focus: CareProgressStep["id"] = "lab";
  if (nextDone || programOpen) {
    focus = "next";
  } else if (
    status === "results_with_doctor" ||
    status === "consultation_reported"
  ) {
    focus = "consult";
  } else if (paid && !hairDone) {
    focus = "hairscope";
  } else {
    focus = "lab";
  }

  const resolve = (
    id: CareProgressStep["id"],
    done: boolean
  ): CareProgressState => {
    if (done) return "done";
    if (id === focus) return "current";
    return "upcoming";
  };

  return [
    { id: "screening", label: "Screening", state: "done" },
    {
      id: "lab",
      label: "Laboratorní vyšetření",
      state: labDone
        ? "done"
        : paid || focus === "lab"
          ? "current"
          : "upcoming",
    },
    {
      id: "hairscope",
      label: "Analýza vlasů",
      state: resolve("hairscope", hairDone),
    },
    {
      id: "consult",
      label: "Konzultace",
      state: resolve("consult", consultDone),
    },
    {
      id: "next",
      label: "Program",
      state: resolve("next", nextDone),
    },
  ];
}

export function getNextTask(order: OrderDraft | null): NextTask {
  const draftIncomplete =
    !order ||
    !order.panelId ||
    !order.doctorId ||
    order.status === "draft_panel" ||
    order.status === "draft_doctor" ||
    order.status === "draft_checkout";

  if (draftIncomplete) {
    const href = !order?.panelId
      ? "/objednavka/panel"
      : !order.doctorId
        ? "/objednavka/lekar"
        : "/objednavka/souhrn";
    return {
      title: "Dokončete objednávku",
      body: "Dokončete výběr vyšetření a lékaře a potvrďte objednávku. Bez toho nemůžeme spustit další kroky péče.",
      ctaLabel: "Pokračovat v objednávce",
      href,
    };
  }

  const hairPending = !hairScopeDone(order);

  // After payment, recommend HairScope while the lab process is still running.
  if (isHairScopeAvailable(order) && hairPending && isWaitingOnLab(order.status)) {
    return {
      title: "Dokončete analýzu vlasů",
      body: "Laboratorní vyšetření už běží. Mezitím můžete doplnit obrazovou analýzu vlasů — pomůže k úplnějšímu podkladu pro konzultaci.",
      ctaLabel: "Spustit analýzu vlasů",
      href: "/hairscope",
    };
  }

  if (isWaitingOnLab(order.status)) {
    return {
      title: "V tuto chvíli nemusíte nic dělat",
      body: "Čekáme na dokončení laboratorního vyšetření a předání výsledků vašemu lékaři. Ozveme se, až bude čas domluvit konzultaci.",
      tone: "wait",
    };
  }

  if (order.status === "results_with_doctor") {
    const doctor = getDoctor(order.doctorId);
    return {
      title: "Domluvte si konzultaci",
      body: "Výsledky jsou u lékaře. Objednejte se přes rezervační systém ordinace a v aplikaci označte, že máte rezervaci.",
      detail: doctor ? `${doctor.name} · ${doctor.city}` : undefined,
      ctaLabel: "Pokračovat ke konzultaci",
      href: "/konzultace",
    };
  }

  if (order.status === "consultation_reported") {
    if (!order.consultationAttendedAt) {
      return {
        title: "Po konzultaci označte absolvování",
        body: "Rezervaci evidujeme. Až konzultace proběhne, označte to v aplikaci a nahlaste závěr od lékaře.",
        ctaLabel: "Otevřít konzultaci",
        href: "/konzultace",
      };
    }
    if (!order.consultationOutcome) {
      return {
        title: "Nahlaste závěr konzultace",
        body: "Vyberte možnost podle informace, kterou jste dostali od lékaře. Aplikace sama vhodnost nevyhodnocuje.",
        ctaLabel: "Nahlásit závěr",
        href: "/konzultace",
      };
    }
    const meta = getConsultationOutcomeMeta(order.consultationOutcome);
    return {
      title: "Program zatím není odemčený",
      body:
        meta?.lockedBody ||
        "Podle nahlášeného závěru konzultace program zůstává zamčený.",
      tone: "wait",
      ctaLabel: "Detail konzultace",
      href: "/konzultace",
    };
  }

  if (order.status === "continue_approved") {
    return {
      title: "Prohlédněte si program",
      body: "Podle vámi nahlášeného závěru konzultace je program odemčený. Nákup připravíme v další fázi.",
      ctaLabel: "Zobrazit program",
      href: "/plan-pece",
    };
  }

  if (order.status === "care_paid") {
    const nextVisit = (order.visits ?? []).find(
      (v) => v.status === "unscheduled" || v.status === "user_reported"
    );
    return {
      title: nextVisit
        ? `Domluvte / zkontrolujte návštěvu ${nextVisit.index}`
        : "Sledujte plán péče",
      body: "Program je aktivní. Termíny domlouváte s ordinací a v aplikaci je jen evidujete.",
      ctaLabel: "Otevřít plán péče",
      href: "/plan-pece",
    };
  }

  return {
    title: "Péče je dokončená",
    body: "Všechny návštěvy programu máte uzavřené.",
    tone: "wait",
  };
}

export type JourneyPhaseId =
  | "screening"
  | "lab"
  | "hairscope"
  | "consult"
  | "next";

export type JourneyPhaseState = "done" | "current" | "waiting" | "locked";

export type JourneyPhase = {
  id: JourneyPhaseId;
  label: string;
  state: JourneyPhaseState;
};

export function journeyStateLabel(state: JourneyPhaseState) {
  switch (state) {
    case "done":
      return "Dokončeno";
    case "current":
      return "Aktuální";
    case "waiting":
      return "Čeká";
    case "locked":
      return "Zatím nedostupné";
  }
}

export function isHairScopeDone(order: OrderDraft | null) {
  return hairScopeDone(order);
}

/** Unlocked after laboratory order is paid. */
export function isHairScopeAvailable(order: OrderDraft | null) {
  return Boolean(order && isPaidStatus(order.status));
}

/** Phase states for the unified care journey timeline. */
export function getJourneyPhases(order: OrderDraft | null): JourneyPhase[] {
  const status = order?.status;
  const paid = isPaidStatus(status);
  const hairDone = hairScopeDone(order);
  const labDone =
    status === "results_with_doctor" ||
    status === "consultation_reported" ||
    status === "continue_approved" ||
    status === "care_paid" ||
    status === "care_completed";
  const consultReady = isConsultationUnlocked(order);
  const consultDone = hasConsultationOutcome(order);
  const programOpen = isProgramUnlocked(order);

  let labState: JourneyPhaseState;
  if (labDone) labState = "done";
  else if (paid) labState = "waiting";
  else labState = "current";

  let hairState: JourneyPhaseState;
  if (hairDone) hairState = "done";
  else if (isHairScopeAvailable(order)) hairState = "current";
  else hairState = "locked";

  let consultState: JourneyPhaseState;
  if (consultDone) consultState = "done";
  else if (
    status === "results_with_doctor" ||
    status === "consultation_reported"
  ) {
    consultState = "current";
  } else if (consultReady) consultState = "done";
  else consultState = "locked";

  let nextState: JourneyPhaseState;
  if (status === "care_completed") nextState = "done";
  else if (status === "care_paid") nextState = "current";
  else if (programOpen) nextState = "current";
  else nextState = "locked";

  return [
    { id: "screening", label: "Screening", state: "done" },
    { id: "lab", label: "Laboratorní vyšetření", state: labState },
    { id: "hairscope", label: "Analýza vlasů", state: hairState },
    { id: "consult", label: "Konzultace", state: consultState },
    { id: "next", label: "Program", state: nextState },
  ];
}
