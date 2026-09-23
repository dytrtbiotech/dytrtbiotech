import type { ScreeningAnswers, ScreeningStep } from "./config";

export const SESSION_KEY = "follicad_quiz_session";
export const ANSWERS_KEY = "follicad_quiz_answers";
export const STEP_KEY = "follicad_quiz_step";
export const EMAIL_KEY = "follicad_quiz_email";
export const AUTH_KEY = "follicad_auth_user";
export const USER_ANSWERS_PREFIX = "follicad_user_answers:";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function userAnswersKey(email: string) {
  return `${USER_ANSWERS_PREFIX}${normalizeEmail(email)}`;
}

export function ensureSessionId() {
  if (typeof window === "undefined") return "";
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `q_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

export function loadAnswers(): ScreeningAnswers {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(ANSWERS_KEY);
    return raw ? (JSON.parse(raw) as ScreeningAnswers) : {};
  } catch {
    return {};
  }
}

export function saveAnswers(answers: ScreeningAnswers) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
}

export function loadStep(): ScreeningStep | null {
  if (typeof window === "undefined") return null;
  return (sessionStorage.getItem(STEP_KEY) as ScreeningStep | null) ?? null;
}

export function saveStep(step: ScreeningStep) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STEP_KEY, step);
}

export function loadEmail() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(EMAIL_KEY) ?? "";
}

export function saveEmail(email: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(EMAIL_KEY, email);
}

/** Clears quiz progress only (not auth). Handy for local UI testing. */
export function clearScreeningProgress() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ANSWERS_KEY);
  sessionStorage.removeItem(STEP_KEY);
  sessionStorage.removeItem(EMAIL_KEY);
}

export function saveUserAnswers(email: string, answers: ScreeningAnswers) {
  if (typeof window === "undefined") return;
  localStorage.setItem(userAnswersKey(email), JSON.stringify(answers));
}

export function loadUserAnswers(email: string): ScreeningAnswers {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(userAnswersKey(email));
    return raw ? (JSON.parse(raw) as ScreeningAnswers) : {};
  } catch {
    return {};
  }
}

/** Bind screening answers to the account (prefer explicit answers over session). */
export function bindScreeningToUser(
  email: string,
  answers?: ScreeningAnswers
) {
  if (typeof window === "undefined") return;
  const payload = answers ?? loadAnswers();
  saveUserAnswers(email, payload);
  saveAnswers(payload);
  saveEmail(email.trim());
}

/** Restore this account's screening into the current session. */
export function hydrateScreeningForUser(email: string) {
  if (typeof window === "undefined") return;
  const answers = loadUserAnswers(email);
  if (Object.keys(answers).length > 0) {
    saveAnswers(answers);
  } else {
    sessionStorage.removeItem(ANSWERS_KEY);
  }
  saveEmail(email.trim());
}

export type AuthUser = {
  email: string;
  fullName?: string;
  phone?: string;
  /** Demo only — not for production auth. */
  password?: string;
  createdAt: string;
};

export function loadAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function saveAuthUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearAuthUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
}

export function verifyLogin(email: string, password: string): AuthUser | null {
  const user = loadAuthUser();
  if (!user) return null;
  if (user.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
    return null;
  }
  if (!user.password || user.password !== password) return null;
  return user;
}

export function updateAuthProfile(patch: Partial<AuthUser>) {
  const current = loadAuthUser();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveAuthUser(next);
  return next;
}
