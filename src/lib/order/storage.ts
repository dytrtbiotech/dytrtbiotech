import {
  createEmptyVisits,
  type CareVisit,
  type ConsultationOutcome,
  type HairScopeStatus,
  type OrderDraft,
  type OrderStatus,
  type PanelId,
  type VisitStatus,
} from "./config";
import { loadAuthUser } from "@/lib/screening/storage";

export const ORDER_KEY = "follicad_order_draft";

const DEFAULT_ORDER = (): OrderDraft => ({
  status: "draft_panel",
  hairScopeStatus: "not_started",
  updatedAt: new Date().toISOString(),
});

const LOCKED: OrderStatus[] = [
  "paid_preparing",
  "ready_for_collection",
  "collection_reported",
  "results_with_doctor",
  "consultation_reported",
  "continue_approved",
  "care_paid",
  "care_completed",
];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function orderKeyForEmail(email: string) {
  return `${ORDER_KEY}:${normalizeEmail(email)}`;
}

function currentOrderKey() {
  const auth = loadAuthUser();
  if (!auth?.email) return null;
  return orderKeyForEmail(auth.email);
}

/** Removes legacy unscoped draft that leaked between accounts. */
function clearLegacyOrder() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ORDER_KEY);
}

export function loadOrder(): OrderDraft | null {
  if (typeof window === "undefined") return null;
  clearLegacyOrder();
  const key = currentOrderKey();
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as OrderDraft;
  } catch {
    return null;
  }
}

export function saveOrder(order: OrderDraft) {
  if (typeof window === "undefined") return;
  const key = currentOrderKey();
  if (!key) return;
  const next = { ...order, updatedAt: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify(next));
}

export function updateOrder(patch: Partial<OrderDraft>) {
  const current = loadOrder() ?? DEFAULT_ORDER();
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  saveOrder(next);
  return next;
}

export function selectPanel(panelId: PanelId) {
  const current = loadOrder();
  const status: OrderStatus = current?.doctorId
    ? "draft_checkout"
    : "draft_doctor";
  return updateOrder({
    panelId,
    status: current && LOCKED.includes(current.status) ? current.status : status,
  });
}

export function selectDoctor(doctorId: string) {
  const current = loadOrder() ?? DEFAULT_ORDER();
  return updateOrder({
    doctorId,
    status: LOCKED.includes(current.status) ? current.status : "draft_checkout",
  });
}

export function saveCheckoutDetails(input: {
  fullName: string;
  phone: string;
}) {
  return updateOrder({
    fullName: input.fullName,
    phone: input.phone,
    status: "draft_checkout",
  });
}

export function markOrderPaid() {
  const current = loadOrder() ?? DEFAULT_ORDER();
  const orderNumber =
    current.orderNumber ??
    `FC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  return updateOrder({
    status: "paid_preparing",
    orderNumber,
    paidAt: new Date().toISOString(),
    hairScopeStatus: current.hairScopeStatus ?? "not_started",
  });
}

/** Demo-only: simulates laboratory documents becoming ready. */
export function markDocumentsReady() {
  const current = loadOrder() ?? DEFAULT_ORDER();
  const collectionRef =
    current.collectionRef ?? `DEMO-${String(Date.now()).slice(-8)}`;
  return updateOrder({
    status: "ready_for_collection",
    documentsReadyAt: new Date().toISOString(),
    collectionRef,
  });
}

export function markCollectionReported() {
  return updateOrder({
    status: "collection_reported",
    collectionReportedAt: new Date().toISOString(),
  });
}

/** Demo-only: simulates results handed to the doctor. */
export function markResultsWithDoctor() {
  return updateOrder({
    status: "results_with_doctor",
    resultsDeliveredAt: new Date().toISOString(),
  });
}

/** Uživatel označí, že má rezervovanou konzultaci (termín volitelný). */
export function reportConsultationBooked(input?: {
  consultationAt?: string;
  consultationNote?: string;
}) {
  const consultationAt = input?.consultationAt?.trim();
  return updateOrder({
    status: "consultation_reported",
    consultationBookedAt: new Date().toISOString(),
    consultationAt: consultationAt || undefined,
    consultationNote: input?.consultationNote?.trim() || undefined,
  });
}

/** @deprecated Use reportConsultationBooked */
export function reportConsultation(input: {
  consultationAt: string;
  consultationNote?: string;
}) {
  return reportConsultationBooked(input);
}

export function markConsultationAttended() {
  return updateOrder({
    consultationAttendedAt: new Date().toISOString(),
  });
}

/**
 * Uživatel nahlásí závěr od lékaře.
 * Program se odemkne pouze při „recommended“.
 */
export function reportConsultationOutcome(outcome: ConsultationOutcome) {
  const now = new Date().toISOString();
  if (outcome === "recommended") {
    return updateOrder({
      consultationOutcome: outcome,
      consultationOutcomeAt: now,
      status: "continue_approved",
      continueApprovedAt: now,
    });
  }
  return updateOrder({
    consultationOutcome: outcome,
    consultationOutcomeAt: now,
    status: "consultation_reported",
    continueApprovedAt: undefined,
  });
}

export function markCarePaid() {
  const current = loadOrder() ?? DEFAULT_ORDER();
  const careOrderNumber =
    current.careOrderNumber ??
    `CP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  return updateOrder({
    status: "care_paid",
    careOrderNumber,
    carePaidAt: new Date().toISOString(),
    visits: current.visits?.length ? current.visits : createEmptyVisits(),
  });
}

export function updateVisit(
  index: number,
  patch: Partial<Pick<CareVisit, "status" | "scheduledAt" | "completedAt" | "note">>
) {
  const current = loadOrder() ?? DEFAULT_ORDER();
  const visits = (current.visits?.length
    ? current.visits
    : createEmptyVisits()
  ).map((visit) =>
    visit.index === index
      ? {
          ...visit,
          ...patch,
        }
      : visit
  );

  const allDone = visits.every(
    (v) => v.status === "completed" || v.status === "cancelled"
  );

  return updateOrder({
    visits,
    status:
      allDone && current.status === "care_paid"
        ? "care_completed"
        : current.status,
  });
}

export function setVisitStatus(
  index: number,
  status: VisitStatus,
  extra?: { scheduledAt?: string; note?: string }
) {
  return updateVisit(index, {
    status,
    scheduledAt: extra?.scheduledAt,
    note: extra?.note,
    completedAt: status === "completed" ? new Date().toISOString() : undefined,
  });
}

export function setHairScopeStatus(status: HairScopeStatus) {
  return updateOrder({
    hairScopeStatus: status,
    hairScopeCompletedAt:
      status === "completed" ? new Date().toISOString() : undefined,
  });
}

export function clearOrder() {
  if (typeof window === "undefined") return;
  clearLegacyOrder();
  const key = currentOrderKey();
  if (key) localStorage.removeItem(key);
}

/** Wipe care progress for a given account (e.g. right before registration). */
export function clearOrderForEmail(email: string) {
  if (typeof window === "undefined") return;
  clearLegacyOrder();
  localStorage.removeItem(orderKeyForEmail(email));
}
