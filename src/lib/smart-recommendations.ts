import { getBreedSize } from "./confidence-engine";
import { getBreedRecommendation } from "./breed-box-sizes";
import { NewCustomerData, ExistingCustomerData } from "./types";
import { recommendSpaceLayout, getDamSizeClass, damSizeClassFromBreed, recommendBundle, recommendHeat } from "./timeline-recommendation-engine";

/**
 * SMART RECOMMENDATIONS ENGINE
 * 
 * For each quiz step, intelligently recommends one option value
 * based on previously collected inputs. Returns the recommended
 * value and a short reason string.
 * 
 * Breed-based recommendations now use the breed-box-sizes mapping
 * for primary/secondary box sizes and panel height requirements.
 */

export interface SmartRecommendation {
  value: string;
  reason: string;
  badgeLabel?: string; // Custom badge text (defaults to "Best fit")
}

/** Multiple recommendations for a single step (e.g. primary + secondary) */
export interface SmartRecommendationSet {
  primary: SmartRecommendation;
  secondary?: SmartRecommendation;
  tertiary?: SmartRecommendation;
}

// ===== NEW CUSTOMER RECOMMENDATIONS =====

export function getNewCustomerRecommendation(
  stepId: string,
  data: NewCustomerData
): SmartRecommendation | null {
  switch (stepId) {
    case "damSize":
      // For damSize, primary recommendation only (secondary via getNewCustomerRecommendationSet)
      return getNewCustomerRecommendationSet(stepId, data)?.primary ?? null;
    case "containment":
      return recommendContainment(data);
    case "panelHeight":
      return recommendPanelHeight(data);
    case "zones":
      return recommendZones(data);
    case "branchAnswer":
      return recommendBranchAnswer(data);
    default:
      return null;
  }
}

/**
 * Get full recommendation set (primary + optional secondary) for a step.
 * Used by damSize to show both "Primary size" and "Secondary size" badges.
 */
export function getNewCustomerRecommendationSet(
  stepId: string,
  data: NewCustomerData
): SmartRecommendationSet | null {
  if (stepId === "damSize") return recommendDamSizeSet(data);
  const single = getNewCustomerRecommendation(stepId, data);
  return single ? { primary: single } : null;
}

// ===== EXISTING CUSTOMER RECOMMENDATIONS =====

export function getExistingCustomerRecommendation(
  stepId: string,
  data: ExistingCustomerData
): SmartRecommendation | null {
  if (stepId === "damSize") {
    return getExistingCustomerRecommendationSet(stepId, data)?.primary ?? null;
  }
  return null;
}

/**
 * Get full recommendation set for existing customer steps.
 * Dam size shows primary + secondary breed-based badges.
 */
export function getExistingCustomerRecommendationSet(
  stepId: string,
  data: ExistingCustomerData
): SmartRecommendationSet | null {
  if (stepId === "damSize" && data.breed) {
    return recommendDamSizeSetFromBreed(data.breed);
  }
  return null;
}

// ===== SHARED: Breed → Dam Size recommendation set =====

function recommendDamSizeSetFromBreed(breed: string): SmartRecommendationSet | null {
  if (!breed) return null;

  const breedRec = getBreedRecommendation(breed);

  const boxToDamSize: Record<string, string> = {
    "28x28": "under_16",
    "38x38": "16_40",
    "48x48": "40_90",
    "48x76": "over_90",
  };
  const boxToLabel: Record<string, string> = {
    "28x28": "Small (28×28 box)",
    "38x38": "Medium (38×38 box)",
    "48x48": "Large (48×48 box)",
    "48x76": "XL/Giant (48×76 box)",
  };

  if (breedRec) {
    const primary = breedRec.primaryBoxRecommendation;
    const secondary = breedRec.secondaryBoxRecommendation;
    const primaryDamSize = boxToDamSize[primary];

    if (!primaryDamSize) return null;

    const result: SmartRecommendationSet = {
      primary: {
        value: primaryDamSize,
        reason: `${breed} typically fits ${boxToLabel[primary]}`,
        badgeLabel: "Primary size",
      },
    };

    if (secondary) {
      const secondaryDamSize = boxToDamSize[secondary];
      if (secondaryDamSize && secondaryDamSize !== primaryDamSize) {
        result.secondary = {
          value: secondaryDamSize,
          reason: `Also compatible — ${breed} can use ${boxToLabel[secondary]}`,
          badgeLabel: "Secondary size",
        };
      }
    }

    const tertiary = breedRec.oversizedFallback;
    if (tertiary) {
      const tertiaryDamSize = boxToDamSize[tertiary];
      if (tertiaryDamSize && tertiaryDamSize !== primaryDamSize && tertiaryDamSize !== boxToDamSize[secondary ?? ""]) {
        result.tertiary = {
          value: tertiaryDamSize,
          reason: `Extra room option — ${breed} can also use ${boxToLabel[tertiary]}`,
          badgeLabel: "Oversized option",
        };
      }
    }

    return result;
  }

  // Fallback to confidence engine breed size
  const breedSize = getBreedSize(breed);
  if (!breedSize) return null;

  const sizeToValue: Record<string, string> = {
    small: "under_16",
    medium: "16_40",
    large: "40_90",
    xl: "over_90",
  };

  return {
    primary: {
      value: sizeToValue[breedSize],
      reason: `Based on ${breed} typical size`,
      badgeLabel: "Primary size",
    },
  };
}

// ===== DAM SIZE (new customer) =====
function recommendDamSizeSet(data: NewCustomerData): SmartRecommendationSet | null {
  return recommendDamSizeSetFromBreed(data.breed);
}

// ===== CONTAINMENT =====

function recommendContainment(data: NewCustomerData): SmartRecommendation | null {
  const breedRec = data.breed ? getBreedRecommendation(data.breed) : null;

  // Active/athletic breeds
  const activeBreeds = [
    "australian shepherd", "border collie", "australian cattle dog", "jack russell terrier",
    "belgian malinois", "german shepherd dog", "siberian husky", "vizsla", "weimaraner",
    "dalmatian", "rhodesian ridgeback", "boxer", "doberman pinscher", "irish setter",
    "labrador retriever", "golden retriever", "brittany", "german shorthaired pointer",
  ];

  const breedLower = data.breed?.toLowerCase() || "";
  if (activeBreeds.includes(breedLower)) {
    return { value: "active", reason: `${data.breed} tends to be high-energy` };
  }

  // Tall-required breeds → always recommend active (tall panels needed)
  if (breedRec?.panelHeight === "tall_only") {
    return { value: "active", reason: `${data.breed} requires tall panels for safe containment` };
  }

  // Small/calm breeds
  const breedSize = data.breed ? getBreedSize(data.breed) : null;
  if (breedSize === "small" || breedSize === "xl") {
    return { value: "calm", reason: breedSize === "small" ? "Small breeds rarely jump out" : "Giant breeds are typically calm" };
  }

  return null;
}

// ===== PANEL HEIGHT =====
// Now uses breed recommendation for panel height guidance

function recommendPanelHeight(data: NewCustomerData): SmartRecommendation | null {
  const breedRec = data.breed ? getBreedRecommendation(data.breed) : null;

  // Tall-required breeds → always tall (this step may be skipped for them, but just in case)
  if (breedRec?.panelHeight === "tall_only") {
    return { value: "28", reason: `${data.breed} requires tall panels for safety` };
  }

  // Flexible large breeds (Boxer, Greyhound, etc.) → recommend tall
  if (breedRec?.panelHeight === "standard_or_tall") {
    return { value: "28", reason: `Tall panels recommended for ${data.breed}` };
  }

  // Active dog → tall
  if (data.containment === "active") {
    return { value: "28", reason: "Taller panels recommended for active dogs" };
  }

  // Large/XL weight → tall
  if (data.damSize === "40_90" || data.damSize === "over_90") {
    return { value: "28", reason: "Taller panels provide better containment for larger dogs" };
  }

  return { value: "18", reason: "Standard height works great for most setups" };
}

// ===== ZONES =====
// Uses timeline × experience matrix for space layout recommendation

type ExperienceLevel = "first" | "1_2" | "3_5" | "6_plus" | "kennel" | null;

function getZonesFromTimelineExperience(
  timeline: NewCustomerData["timeline"],
  experience: ExperienceLevel
): { zones: string; reason: string } {
  // Single whelping area ONLY when: preparing + first litter
  if (timeline === "preparing" && experience === "first") {
    return { zones: "1", reason: "Single whelping area is enough when getting started" };
  }

  // Preparing + experienced → 2 or 3 zones
  if (timeline === "preparing") {
    if (experience === "6_plus" || experience === "kennel") {
      return { zones: "3", reason: "Experienced breeders benefit from a full layout for future-ready setup" };
    }
    return { zones: "2", reason: "Extra room helps experienced breeders stay organized" };
  }

  // Due within 7 days → always 2 zones
  if (timeline === "due_7_days") {
    return { zones: "2", reason: "Puppies arriving soon — have extra space ready" };
  }

  // Just born (0–3 days) → always 2 zones
  if (timeline === "born_0_3") {
    return { zones: "2", reason: "Extra room supports near-term growth for newborns" };
  }

  // 1+ weeks old → experience-driven
  if (timeline === "born_1_plus") {
    if (experience === "3_5" || experience === "6_plus" || experience === "kennel") {
      return { zones: "3", reason: "Growing puppies need room to move, eat, and play" };
    }
    return { zones: "2", reason: "Growing puppies need extra room for development" };
  }

  return { zones: "2", reason: "Extra room supports a growing litter" };
}

function recommendZones(data: NewCustomerData): SmartRecommendation | null {
  const result = getZonesFromTimelineExperience(data.timeline, data.experience);
  return {
    value: result.zones,
    reason: result.reason,
  };
}

// ===== BRANCH ANSWER (breeder tools / monitoring / heating) =====

function recommendBranchAnswer(data: NewCustomerData): SmartRecommendation | null {
  // Zone 1 → breeder tools question
  if (data.zones === 1) {
    return { value: "true", reason: "Essential tools for first-time breeders" };
  }

  // Zone 2 → monitoring question
  if (data.zones === 2) {
    return recommendMonitoring(data);
  }

  // Zone 3 → heating question
  if (data.zones === 3) {
    const heatRec = recommendHeat(data.timeline);
    if (heatRec.advice === "strongly_recommended") {
      return { value: "true", reason: heatRec.reason };
    }
    return { value: "true", reason: "Consistent warmth supports healthy puppy development" };
  }

  return null;
}

// ===== SMART MONITORING RECOMMENDATION =====

function recommendMonitoring(data: NewCustomerData): SmartRecommendation | null {
  const timeline = data.timeline;
  const experience = data.experience;

  // WiFi monitoring as Best fit in most meaningful scenarios
  const recommendWifi =
    experience === "first" ||
    experience === "3_5" ||
    experience === "6_plus" ||
    experience === "kennel" ||
    timeline === "born_0_3" ||
    timeline === "born_1_plus";

  if (recommendWifi) {
    let reason = "Remote monitoring adds peace of mind";
    if (experience === "first") reason = "First-time breeders benefit from remote monitoring";
    else if (timeline === "born_0_3") reason = "Critical stage — monitor puppies remotely for safety";
    else if (timeline === "born_1_plus") reason = "Active puppies benefit from continuous monitoring";
    else if (experience === "3_5" || experience === "6_plus" || experience === "kennel") reason = "Professional-level monitoring for experienced breeders";
    return { value: "true", reason };
  }

  // Preparing + 1-2 litters: soft encouragement but no strong best-fit
  if (timeline === "preparing" && experience === "1_2") {
    return { value: "true", reason: "WiFi monitoring lets you check on puppies anytime" };
  }

  return null;
}

// ===== EXISTING CUSTOMER: DAM SIZE =====

function recommendExistingDamSize(data: ExistingCustomerData): SmartRecommendation | null {
  const breedSize = data.breed ? getBreedSize(data.breed) : null;
  if (!breedSize) return null;

  const sizeToValue: Record<string, string> = {
    small: "under_16",
    medium: "16_40",
    large: "40_90",
    xl: "over_90",
  };

  return {
    value: sizeToValue[breedSize],
    reason: `Typical weight range for ${data.breed}`,
  };
}

// ===== EXISTING CUSTOMER: BOX SIZE =====

function recommendBoxSize(data: ExistingCustomerData): SmartRecommendation | null {
  const breedSize = data.breed ? getBreedSize(data.breed) : null;
  if (!breedSize) return null;

  const sizeToBox: Record<string, string> = {
    small: "28",
    medium: "38",
    large: "48",
    xl: "48",
  };

  return {
    value: sizeToBox[breedSize],
    reason: `Most common box size for ${data.breed}`,
  };
}

// ===== EXISTING CUSTOMER: STAGE =====

function recommendStage(_data: ExistingCustomerData): SmartRecommendation | null {
  return null;
}
