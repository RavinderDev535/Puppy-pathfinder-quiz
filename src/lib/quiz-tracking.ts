/**
 * QUIZ TRACKING
 *
 * Client-side session + funnel event tracking for the EZWhelp Pulse dashboard.
 *
 * Lifecycle: a session_id is minted on first interaction and persisted in
 * sessionStorage so it survives reloads within a tab but resets on tab close
 * — the correct semantics for per-visit funnel attribution. The same id is
 * sent on every funnel event AND embedded in the final quiz submission, which
 * is how the backend links a session row to its completed submission row.
 *
 * All event dispatches are fire-and-forget:
 *   - Tracking failures are warned, never surfaced to the user.
 *   - Submissions never block on tracking — the submit POST is independent.
 *   - For events that fire during page navigation (added_to_cart →
 *     Shopify redirect, checkout_started), we use sendBeacon so the
 *     request is not cancelled mid-flight.
 *
 * Public function signatures match the previous module exactly, so call
 * sites in EZWhelpQuiz.tsx don't need to change.
 */

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/quiz`;
const SESSION_STORAGE_KEY = "ezw_quiz_session_id";

type EventType =
  | "quiz_started"
  | "step_completed"
  | "quiz_completed"
  | "added_to_cart"
  | "checkout_started";

type PathKey = "path1" | "path2";

interface EventPayload {
  session_id: string;
  event_type: EventType;
  path?: PathKey;
  question_id?: string;
  email?: string;
  event_data?: Record<string, unknown>;
}

// --- Session id -----------------------------------------------------------

function generateUuid(): string {
  // Browsers in secure contexts (HTTPS, localhost) all have crypto.randomUUID.
  // The manual fallback exists purely so this works in odd dev setups (file://,
  // very old browsers) — production callers will always hit the fast path.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function readSession(): string | null {
  try {
    return typeof window !== "undefined"
      ? window.sessionStorage.getItem(SESSION_STORAGE_KEY)
      : null;
  } catch {
    // sessionStorage can throw in private browsing modes — treat as no session.
    return null;
  }
}

function writeSession(id: string): void {
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    }
  } catch {
    // Non-fatal — we'll just keep generating a new id per call, which is
    // worse for analytics but doesn't break the quiz.
  }
}

function clearSession(): void {
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    /* non-fatal */
  }
}

/** Get the current session id, minting one if this is a fresh visit. */
export function getSessionId(): string {
  let id = readSession();
  if (!id) {
    id = generateUuid();
    writeSession(id);
  }
  return id;
}

// --- Event dispatch -------------------------------------------------------

// added_to_cart and checkout_started fire immediately before the user is
// navigated away to Shopify — sendBeacon is the correct primitive for those.
// Other events use fetch with keepalive (still survives unload, but allows a
// response so we can warn on 5xx in dev).
const BEACON_EVENTS: ReadonlySet<EventType> = new Set([
  "added_to_cart",
  "checkout_started",
]);

function dispatch(payload: EventPayload): void {
  const url = `${API_BASE}/event`;
  const body = JSON.stringify(payload);

  if (
    BEACON_EVENTS.has(payload.event_type) &&
    typeof navigator !== "undefined" &&
    typeof navigator.sendBeacon === "function"
  ) {
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
      // Beacon was rejected (quota etc.) — fall through to fetch.
    } catch {
      // Some browsers throw on CSP / mime-type issues — fall through.
    }
  }

  // keepalive keeps the request alive across page unload (up to 64KB per spec).
  // No await — tracking should never block UX, and we don't care about the
  // response unless it surfaces a bug worth logging.
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch((err) => {
    if (typeof console !== "undefined") {
      console.warn(`[quiz-tracking] ${payload.event_type} dispatch failed:`, err);
    }
  });
}

// --- Public API (signatures match the legacy module) ----------------------

let lastQuestionId: string | undefined;
let activePath: PathKey | undefined;

/**
 * Mint (or reuse) a session and fire the quiz_started event.
 * Returns the session id synchronously — the network call is fire-and-forget.
 * The legacy signature returned Promise<string | null>; the new one returns
 * Promise<string> for the same call shape but never resolves to null.
 */
export async function initQuizSession(path: "new" | "existing"): Promise<string> {
  const id = getSessionId();
  activePath = path === "existing" ? "path2" : "path1";
  dispatch({ session_id: id, event_type: "quiz_started", path: activePath });
  return id;
}

/** Fire step_completed after every answer selection. */
export function trackAnswer(questionId: string, _answerKey?: string): void {
  lastQuestionId = questionId;
  dispatch({
    session_id: getSessionId(),
    event_type: "step_completed",
    question_id: questionId,
    ...(activePath ? { path: activePath } : {}),
  });
}

/**
 * Fire quiz_completed when the user submits. Backend will also update the
 * session row when the submit POST lands — this client-side event is the
 * earlier signal (fires before the submit promise resolves).
 */
export function trackSubmit(email?: string): void {
  dispatch({
    session_id: getSessionId(),
    event_type: "quiz_completed",
    question_id: lastQuestionId,
    ...(activePath ? { path: activePath } : {}),
    ...(email ? { email } : {}),
  });
}

/** Bundle/product CTA click — counted as added_to_cart for the funnel. */
export function trackProductClick(productId: string, position: number): void {
  dispatch({
    session_id: getSessionId(),
    event_type: "added_to_cart",
    ...(activePath ? { path: activePath } : {}),
    event_data: { product_id: productId, position },
  });
}

/** Explicit add-to-cart action (separate from a product CTA click). */
export function trackAddToCart(productId: string): void {
  dispatch({
    session_id: getSessionId(),
    event_type: "added_to_cart",
    ...(activePath ? { path: activePath } : {}),
    event_data: { product_id: productId },
  });
}

/** Fire when the user is redirected to Shopify checkout. */
export function trackCheckout(): void {
  dispatch({
    session_id: getSessionId(),
    event_type: "checkout_started",
    ...(activePath ? { path: activePath } : {}),
  });
}

/**
 * Reset client state — mints a fresh session id on next access. Use when the
 * user restarts the quiz from scratch so the new run is attributed separately.
 */
export function resetTracking(): void {
  clearSession();
  lastQuestionId = undefined;
  activePath = undefined;
}

/**
 * Legacy alias kept for backwards compatibility. The "attempt id" concept
 * has been replaced by the session id; both refer to the same identifier.
 */
export function getAttemptId(): string {
  return getSessionId();
}
