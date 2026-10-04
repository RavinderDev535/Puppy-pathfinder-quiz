/**
 * BACKEND API — Live quiz submission endpoints
 */

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/quiz`;
export interface Path1Payload {
  email: string;
  breed: string;
  dam_size: string;
  zones: number | null;
  feature: boolean | null;
  containment: string | null;
  // Optional — forwarded purely so the backend can mirror them into Klaviyo
  // event properties (email merge tags). Don't affect routing.
  panel_height?: string | null;
  timeline?: string | null;
  due_date?: string | null;
  experience?: string | null;
  // Backend mirrors verbatim into Klaviyo. Frontend captures categorical
  // "small" | "average" | "large", so type accepts both shapes — Arya's
  // spreadsheet example was a number, but our quiz doesn't ask for an exact
  // count. Email templates can branch on the value or display as-is.
  litter_size?: number | string | null;
  has_window?: string | null;
  confidence_score?: number | null;
  confidence_label?: string | null;
  // Marketing consent — implicit on submit. Backend mirrors into Klaviyo profile.
  subscribed?: boolean;
  accepts_marketing?: boolean;
  consent_method?: string;
  consent_timestamp?: string;
  // Funnel session id (from quiz-tracking). Backend uses this to link the
  // submission row to its quiz_sessions row for abandonment analysis.
  session_id?: string;
}

export interface Path1AddOn {
  name: string;
  url: string;
  image_url?: string;
}

export interface Path1Response {
  bundle: string;
  shopify_cart_url: string;
  suggested_addons: Path1AddOn[];
  /** When true, frontend renders the Custom Inquiry screen instead of standard results */
  requires_custom_inquiry?: boolean;
  /** When true, frontend renders normal bundle results but hides add-ons and shows a "Personalized Setup Support" block (e.g. Condo XL) */
  support_followup?: boolean;
  /** Optional message from backend shown on the Custom Inquiry / Support Followup screens */
  message?: string;
}

export async function submitPath1(payload: Path1Payload): Promise<Path1Response> {
  const res = await fetch(`${API_BASE}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[backend-api] Path 1 failed: ${res.status}`, text);
    throw new Error(`API error: ${res.status}`);
  }

  return res.json() as Promise<Path1Response>;
}

// ===== Path 2: Existing Customer =====

export interface Path2Payload {
  email: string;
  breed: string;
  box_size: string;
  box_height: string;
  has_window: string;
  stage: string;
  // Optional — Klaviyo property mirroring only.
  dam_size?: string | null;
  due_date?: string | null;
  experience?: string | null;
  is_xl?: boolean;
  // Marketing consent — implicit on submit. Backend mirrors into Klaviyo profile.
  subscribed?: boolean;
  accepts_marketing?: boolean;
  consent_method?: string;
  consent_timestamp?: string;
  // Funnel session id (from quiz-tracking). Backend uses this to link the
  // submission row to its quiz_sessions row for abandonment analysis.
  session_id?: string;
}

export interface Path2Product {
  name: string;
  url: string;
  image_url?: string;
}

export interface Path2Response {
  recommended_products: Path2Product[];
}

export async function submitPath2(payload: Path2Payload): Promise<Path2Response> {
  const res = await fetch(`${API_BASE}/path2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[backend-api] Path 2 failed: ${res.status}`, text);
    throw new Error(`API error: ${res.status}`);
  }

  return res.json() as Promise<Path2Response>;
}
