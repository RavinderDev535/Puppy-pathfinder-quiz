import { BundleName, NewCustomerData } from "./types";
import { getBreedSize, SizeCategory } from "./confidence-engine";

/**
 * TIMELINE RECOMMENDATION ENGINE
 * 
 * Recommends space layout, heat setup, and best-fit bundle
 * based on breeding stage, breed, dam size, and experience.
 */

// ===== DAM SIZE CLASS =====

export type DamSizeClass = "small" | "medium" | "large" | "giant";

export function getDamSizeClass(damSize: NewCustomerData["damSize"]): DamSizeClass {
  switch (damSize) {
    case "under_16": return "small";
    case "16_40": return "medium";
    case "40_90": return "large";
    case "over_90": return "giant";
    default: return "medium";
  }
}

export function damSizeClassFromBreed(breed: string): DamSizeClass | null {
  const breedSize = getBreedSize(breed);
  if (!breedSize) return null;
  const map: Record<SizeCategory, DamSizeClass> = {
    small: "small",
    medium: "medium",
    large: "large",
    xl: "giant",
  };
  return map[breedSize];
}

// ===== BOX SIZE DIRECTION =====

export type BoxSizeDirection = "28x28" | "38x38" | "48x48" | "48x76";

export function getBoxSizeDirection(damClass: DamSizeClass): { primary: BoxSizeDirection; alternates: BoxSizeDirection[] } {
  switch (damClass) {
    case "small":
      return { primary: "28x28", alternates: ["38x38"] };
    case "medium":
      return { primary: "38x38", alternates: [] };
    case "large":
      return { primary: "48x48", alternates: [] };
    case "giant":
      return { primary: "48x76", alternates: [] };
  }
}

// ===== SPACE LAYOUT RECOMMENDATION =====
// Now driven by timeline × experience matrix (not litter size)

export type SpaceLevel = "single" | "whelping_plus_room" | "full_layout";

export interface SpaceRecommendation {
  level: SpaceLevel;
  label: string;
  reason: string;
}

type ExperienceLevel = "first" | "1_2" | "3_5" | "6_plus" | "kennel" | null;

export function recommendSpaceLayout(
  timeline: NewCustomerData["timeline"],
  _litterSize: NewCustomerData["litterSize"],
  _damClass: DamSizeClass,
  experience?: ExperienceLevel
): SpaceRecommendation {
  // Single whelping area ONLY when: preparing + first litter
  if (timeline === "preparing" && (experience === "first" || !experience)) {
    return {
      level: "single",
      label: "Single whelping area",
      reason: "Single whelping area is enough when getting started",
    };
  }

  if (timeline === "preparing") {
    if (experience === "6_plus" || experience === "kennel") {
      return {
        level: "full_layout",
        label: "Full layout + extra room & mess hall",
        reason: "Experienced breeders benefit from a full layout for future-ready setup",
      };
    }
    return {
      level: "whelping_plus_room",
      label: "Whelping area + extra room",
      reason: "Extra room helps experienced breeders stay organized",
    };
  }

  if (timeline === "due_7_days") {
    return {
      level: "whelping_plus_room",
      label: "Whelping area + extra room",
      reason: "Puppies arriving soon — have extra space ready",
    };
  }

  if (timeline === "born_0_3") {
    return {
      level: "whelping_plus_room",
      label: "Whelping area + extra room",
      reason: "Extra room supports near-term growth for newborns",
    };
  }

  if (timeline === "born_1_plus") {
    if (experience === "3_5" || experience === "6_plus" || experience === "kennel") {
      return {
        level: "full_layout",
        label: "Full layout + extra room & mess hall",
        reason: "Growing puppies need room to move, eat, and play",
      };
    }
    return {
      level: "whelping_plus_room",
      label: "Whelping area + extra room",
      reason: "Growing puppies need extra room for development",
    };
  }

  return {
    level: "whelping_plus_room",
    label: "Whelping area + extra room",
    reason: "Extra room supports a growing litter",
  };
}

// ===== HEAT RECOMMENDATION =====

export type HeatAdvice = "optional" | "recommended" | "strongly_recommended";

export interface HeatRecommendation {
  advice: HeatAdvice;
  label: string;
  reason: string;
  showWarningIfDeclined: boolean;
}

export function recommendHeat(timeline: NewCustomerData["timeline"]): HeatRecommendation {
  switch (timeline) {
    case "preparing":
      return {
        advice: "optional",
        label: "Optional — recommend planning ahead",
        reason: "Heat isn't urgent yet, but planning ahead saves stress later",
        showWarningIfDeclined: false,
      };
    case "due_7_days":
      return {
        advice: "strongly_recommended",
        label: "Strongly recommend heat combo",
        reason: "Puppies arriving soon — heat source should be ready",
        showWarningIfDeclined: true,
      };
    case "born_0_3":
      return {
        advice: "strongly_recommended",
        label: "Best fit: include heat combo",
        reason: "Newborn puppies cannot regulate body temperature in the first two weeks",
        showWarningIfDeclined: true,
      };
    case "born_1_plus":
      return {
        advice: "recommended",
        label: "Recommended based on environment",
        reason: "Still beneficial depending on room temperature and puppy development",
        showWarningIfDeclined: false,
      };
    default:
      return {
        advice: "optional",
        label: "Optional",
        reason: "Include heat combo for consistent warmth",
        showWarningIfDeclined: false,
      };
  }
}

// ===== BUNDLE RECOMMENDATION MATRIX =====

export interface BundleRecommendation {
  primary: BundleName;
  secondary: BundleName;
  reason: string;
}

type TimelineKey = "preparing" | "due_7_days" | "born_0_3" | "born_1_plus";

const bundleMatrix: Record<TimelineKey, Record<DamSizeClass, [BundleName, BundleName]>> = {
  preparing: {
    small: ["Starter", "Essential"],
    medium: ["Essential", "Starter"],
    large: ["Essential", "Pro"],
    giant: ["Pro", "Essential"],
  },
  due_7_days: {
    small: ["Essential", "Starter"],
    medium: ["Essential", "Pro"],
    large: ["Pro", "Essential"],
    giant: ["Pro", "Elite"],
  },
  born_0_3: {
    small: ["Essential", "Starter"],
    medium: ["Essential", "Pro"],
    large: ["Pro", "Elite"],
    giant: ["Elite", "Pro"],
  },
  born_1_plus: {
    small: ["Pro", "Essential"],
    medium: ["Pro", "Elite"],
    large: ["Elite", "Condo"],
    giant: ["Condo", "Play Yard"],
  },
};

const bundleReasons: Record<TimelineKey, string> = {
  preparing: "You're getting ready — this setup covers the essentials without overbuying",
  due_7_days: "Puppies arriving soon — prioritize a complete, ready-to-go setup",
  born_0_3: "Newborn safety is the priority — warmth, hygiene, and monitoring matter most",
  born_1_plus: "Growing puppies need more space and feeding support as they develop",
};

export function recommendBundle(
  timeline: NewCustomerData["timeline"],
  damClass: DamSizeClass,
  litterSize?: NewCustomerData["litterSize"],
  experience?: ExperienceLevel
): BundleRecommendation {
  const tKey: TimelineKey = timeline || "preparing";
  const pair = bundleMatrix[tKey]?.[damClass] || bundleMatrix.preparing.medium;

  let primary = pair[0];
  let secondary = pair[1];

  // Experience-based upgrade: experienced breeders lean toward premium
  if (experience === "3_5" || experience === "6_plus" || experience === "kennel") {
    const upgradeMap: Partial<Record<BundleName, BundleName>> = {
      Starter: "Essential",
      Essential: "Pro",
      Pro: "Elite",
      Elite: "Condo",
      Condo: "Play Yard",
    };
    if (upgradeMap[primary]) {
      secondary = primary;
      primary = upgradeMap[primary]!;
    }
  }

  // Large litter upgrade (kept for future use)
  if (litterSize === "large") {
    const upgradeMap: Partial<Record<BundleName, BundleName>> = {
      Starter: "Essential",
      Essential: "Pro",
      Pro: "Elite",
      Elite: "Condo",
      Condo: "Play Yard",
    };
    if (upgradeMap[primary]) {
      secondary = primary;
      primary = upgradeMap[primary]!;
    }
  }

  return {
    primary,
    secondary,
    reason: bundleReasons[tKey] || bundleReasons.preparing,
  };
}

// ===== BUNDLE CONTENTS =====

export interface BundleContents {
  name: BundleName;
  items: string[];
}

export const bundleContentsMap: Record<BundleName, string[]> = {
  Starter: [
    "EZclassic Whelping Box (Rails + Pad + Liner)",
    "1 Extra Whelping Pad",
    "Heat Combo",
  ],
  Essential: [
    "EZclassic Whelping Box (Rails + Pad + Liner)",
    "1 Extra Whelping Pad",
    "Heat Combo",
    "Whelping Kit",
    "Puppy Collar Set (24 pack)",
    "Corner Seat",
  ],
  Pro: [
    "EZclassic Whelping Box (Rails + Pad + Liner)",
    "2 Extra Whelping Pads total",
    "Heat Combo",
    "1 Add-On Room",
    "Combo Liner (Box + Add-on)",
    "Whelping Kit",
    "Puppy Collar Set (24 pack)",
    "Corner Seat",
    "1 Puppy Feeding Station",
  ],
  Elite: [
    "EZclassic Whelping Box (Rails + Pad + Liner)",
    "3 Extra Whelping Pads total",
    "Heat Combo",
    "1 Add-On Room",
    "Combo Liner (Box + Add-on)",
    "Whelping Kit",
    "Puppy Collar Set (24 pack)",
    "Corner Seat",
    "2 Puppy Feeding Stations",
    "Acrylic Glass Door",
    "Traction Pad",
    "Smart WiFi Camera + Temp Monitor",
  ],
  Condo: [
    "EZclassic Whelping Box (Rails + Pad + Liner)",
    "1 Extra Pad (2 total)",
    "Heat Combo",
    "1 Windowed Add-On Room",
    "1 Mess Hall",
    "1 Extra Post / Panel Connector",
  ],
  "Play Yard": [
    "EZclassic Whelping Box (Rails + Pad + Liner)",
    "1 Extra Pad (2 total)",
    "2 Add-On Rooms",
    "1 Extra Post / Panel Connector",
    // No Heat Combo
  ],
};

// ===== FULL TIMELINE RECOMMENDATION =====

export interface TimelineRecommendationResult {
  timeline: {
    value: TimelineKey;
    label: string;
  };
  damSizeClass: DamSizeClass;
  boxDirection: { primary: BoxSizeDirection; alternates: BoxSizeDirection[] };
  spaceLayout: SpaceRecommendation;
  heat: HeatRecommendation;
  bundle: BundleRecommendation;
  bundleContents: string[];
  disclaimerNote: string;
}

const timelineLabels: Record<TimelineKey, string> = {
  preparing: "Getting ready",
  due_7_days: "Set up soon",
  born_0_3: "Keep warm & safe",
  born_1_plus: "Support growth",
};

export const RECOMMENDATION_DISCLAIMER =
  "This recommendation is based on breeding stage, breed-standard size, and expected litter needs. Actual setup may vary depending on litter size, breeder preference, confirmed puppy count, room temperature, and whether the breeder wants a roomier layout.";

export function computeTimelineRecommendation(data: NewCustomerData): TimelineRecommendationResult {
  const timeline: TimelineKey = data.timeline || "preparing";
  const damClass = data.damSize
    ? getDamSizeClass(data.damSize)
    : (data.breed ? damSizeClassFromBreed(data.breed) : null) || "medium";

  const boxDirection = getBoxSizeDirection(damClass);
  const spaceLayout = recommendSpaceLayout(timeline, data.litterSize, damClass, data.experience);
  const heat = recommendHeat(timeline);
  const bundle = recommendBundle(timeline, damClass, data.litterSize, data.experience);
  const contents = bundleContentsMap[bundle.primary] || [];

  return {
    timeline: { value: timeline, label: timelineLabels[timeline] },
    damSizeClass: damClass,
    boxDirection,
    spaceLayout,
    heat,
    bundle,
    bundleContents: contents,
    disclaimerNote: RECOMMENDATION_DISCLAIMER,
  };
}
