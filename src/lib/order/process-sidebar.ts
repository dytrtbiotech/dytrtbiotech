import {
  isProgramUnlocked,
  type OrderDraft,
} from "@/lib/order/config";

export type ProcessPhaseId =
  | "screening"
  | "lab"
  | "hairscope"
  | "consult"
  | "program";

export type ProcessPhaseState = "done" | "current" | "upcoming";

export type ProcessPhase = {
  id: ProcessPhaseId;
  label: string;
  state: ProcessPhaseState;
};

export const PROCESS_PHASES = [
  { id: "screening", label: "Screening" },
  { id: "lab", label: "Laboratorní vyšetření" },
  { id: "hairscope", label: "Analýza vlasů" },
  { id: "consult", label: "Konzultace" },
  { id: "program", label: "Program" },
] as const satisfies ReadonlyArray<{ id: ProcessPhaseId; label: string }>;

const PHASE_ORDER: ProcessPhaseId[] = [
  "screening",
  "lab",
  "hairscope",
  "consult",
  "program",
];

/** Authenticated guided-flow routes that use the process sidebar. */
export function shouldUseProcessSidebar(
  pathname: string,
  order: OrderDraft | null
): boolean {
  if (pathname.startsWith("/objednavka")) return true;
  if (pathname.startsWith("/hairscope")) return true;
  if (pathname.startsWith("/konzultace")) return true;
  if (pathname.startsWith("/plan-pece")) return isProgramUnlocked(order);
  return false;
}

function currentPhaseFromPath(pathname: string): ProcessPhaseId | null {
  if (pathname.startsWith("/objednavka")) return "lab";
  if (pathname.startsWith("/hairscope")) return "hairscope";
  if (pathname.startsWith("/konzultace")) return "consult";
  if (pathname.startsWith("/plan-pece")) return "program";
  return null;
}

/**
 * Process sidebar states for authenticated guided routes.
 * Current step follows the route; earlier steps are completed; later stay upcoming.
 */
export function getProcessSidebarPhases(
  pathname: string,
  _order: OrderDraft | null
): ProcessPhase[] {
  const current = currentPhaseFromPath(pathname) ?? "lab";
  const currentIndex = PHASE_ORDER.indexOf(current);
  const programDone =
    _order?.status === "care_paid" || _order?.status === "care_completed";

  return PROCESS_PHASES.map((phase) => {
    const index = PHASE_ORDER.indexOf(phase.id);

    if (index < currentIndex) {
      return { ...phase, state: "done" as const };
    }
    if (index === currentIndex) {
      if (phase.id === "program" && programDone) {
        return { ...phase, state: "done" as const };
      }
      return { ...phase, state: "current" as const };
    }
    return { ...phase, state: "upcoming" as const };
  });
}

/** Screening flow (pre-auth): Screening stays current for the whole flow. */
export function getScreeningProcessPhases(): ProcessPhase[] {
  return PROCESS_PHASES.map((phase) => {
    if (phase.id === "screening") {
      return { ...phase, state: "current" as const };
    }
    return { ...phase, state: "upcoming" as const };
  });
}

export type LabOrderSubstep = {
  stepIndex: number;
  stepLabel: string;
};

/** Substeps inside the lab order flow (sidebar meta + top stepper). */
export function getLabOrderSubstep(pathname: string): LabOrderSubstep {
  if (pathname.includes("/objednavka/lekar")) {
    return { stepIndex: 1, stepLabel: "Výběr lékaře" };
  }
  if (pathname.includes("/objednavka/souhrn")) {
    return { stepIndex: 2, stepLabel: "Souhrn objednávky" };
  }
  return { stepIndex: 0, stepLabel: "Výběr vyšetření" };
}
