// ===== QUIZ TYPES =====

export type CustomerType = "new" | "existing" | null;

// New customer data
export interface NewCustomerData {
  // Data collection (no routing effect)
  timeline: "preparing" | "due_7_days" | "born_0_3" | "born_1_plus" | null;
  dueDate: string | null;
  breed: string;
  experience: "first" | "1_2" | "3_5" | "6_plus" | "kennel" | null;
  litterSize: "small" | "average" | "large" | null;
  containment: "calm" | "active" | null;

  // Routing questions
  zones: 1 | 2 | 3 | null;
  branchAnswer: boolean | null;
  damSize: "under_16" | "16_40" | "40_90" | "over_90" | null;
  panelHeight: "18" | "28" | null;
  // XL/Giant path only: asked for every XL outcome, but only changes routing
  // for Play Yard (Window vs Solid). Stored regardless. Null on non-XL paths.
  hasWindow: "yes" | "no" | null;
}

export type BundleName = "Starter" | "Essential" | "Pro" | "Elite" | "Play Yard" | "Condo";

export interface BundleResult {
  bundle: BundleName;
  boxSize: "28" | "38" | "48";
  panelHeight: "18" | "28";
  padRecommendation: string;
  timelineBanner: TimelineBanner;
  addOns: AddOn[];
  confidenceMessage: string | null;
}

export interface TimelineBanner {
  headline: string;
  emphasis: string[];
  tone: string;
}

export type AddOnCategory = "warmth_safety" | "space_growth" | "hygiene_comfort" | "monitoring_tools";

export interface AddOn {
  name: string;
  description: string;
  priority: number;
  url?: string;
  imageUrl?: string;
  category?: AddOnCategory;
}


// Existing customer data
export interface ExistingCustomerData {
  breed: string;
  damSize: "under_16" | "16_40" | "40_90" | "over_90" | null;
  experience: "first" | "1_2" | "3_5" | "6_plus" | "kennel" | null;
  // "48xl" represents the 48×76 XL/Giant box (auto-tall). Backend uses this
  // token to auto-detect the XL path and resolve XL pad variants.
  boxSize: "28" | "38" | "48" | "48xl" | "unsure" | null;
  boxHeight: "18" | "28" | "unsure" | null;
  hasWindow: "yes" | "no" | "unsure" | null;
  stage: "preparing" | "born_0_3" | "1_2_weeks" | "3_plus_weeks" | null;
  dueDate: string | null;
}

export interface LifecycleResult {
  stage: string;
  stageLabel: string;
  banner: TimelineBanner;
  primaryRecommendations: LifecycleRecommendation[];
  conditionalRecommendations: LifecycleRecommendation[];
}

export interface LifecycleRecommendation {
  name: string;
  description: string;
  sku?: string;
  url?: string;
  imageUrl?: string;
  category?: AddOnCategory;
}


// Quiz step definition
export interface QuizStep {
  id: string;
  question: string;
  subtitle?: string;
  guidance?: string;
  type: "select" | "text" | "date" | "email" | "breed" | "boxConfig";
  options?: { label: string; value: string; description?: string }[];
  optional?: boolean;
  showIf?: (data: any) => boolean;
}
