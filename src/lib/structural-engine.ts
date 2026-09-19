import { NewCustomerData, BundleName, BundleResult, AddOn, TimelineBanner } from "./types";
import { computeConfidenceScores, type ScoringInput } from "./confidence-engine";

/**
 * STRUCTURAL ENGINE — Deterministic bundle routing
 * 
 * Bundle depends ONLY on: zones + branch answer
 * Timeline NEVER changes bundle.
 * Breed/experience NEVER change bundle.
 * Dam size → box size (config only)
 * Panel height → config only
 */
export function computeBundle(data: NewCustomerData): BundleName {
  // Bundle is determined ONLY by the quiz answers (zones + branchAnswer).
  // Dam size never overrides bundle routing — XL dogs route through the same
  // matrix and the backend (or frontend results screen) decides whether the
  // resulting bundle is buyable for XL or requires a custom inquiry.
  const { zones, branchAnswer } = data;

  if (zones === 1 && branchAnswer === false) return "Starter";
  if (zones === 1 && branchAnswer === true) return "Essential";
  if (zones === 2 && branchAnswer === false) return "Pro";
  if (zones === 2 && branchAnswer === true) return "Elite";
  if (zones === 3 && branchAnswer === false) return "Play Yard";
  if (zones === 3 && branchAnswer === true) return "Condo";

  return "Starter";
}

export function computeBoxSize(damSize: NewCustomerData["damSize"]): "28" | "38" | "48" {
  if (damSize === "under_16") return "28";
  if (damSize === "16_40") return "38";
  return "48"; // 40_90 and over_90
}

export function computePanelHeight(
  damSize: NewCustomerData["damSize"],
  selectedHeight: NewCustomerData["panelHeight"],
  zones?: NewCustomerData["zones"],
  branchAnswer?: NewCustomerData["branchAnswer"]
): "18" | "28" {
  // Small → always standard
  if (damSize === "under_16") return "18";
  // XL/Giant → always tall
  if (damSize === "over_90") return "28";
  // Play Yard layout → standard
  if (zones === 3 && branchAnswer === false) return "18";
  // Medium / Large → user-selected
  return selectedHeight || "18";
}

// ===== VARIANT-AWARE URL HELPERS =====
// All URLs use production Shopify (www.ezwhelp.com) — see Excel Sheets 4 + 6.

const PROD = "https://www.ezwhelp.com";

export function getPadUrl(boxSize: "28" | "38" | "48", isXL?: boolean): string {
  if (isXL) {
    return `${PROD}/products/ezwhelp-reusable-quick-dry-pad-2-pack?variant=46535234355442`;
  }
  const variants: Record<string, string> = {
    "28": `${PROD}/products/ezwhelp-reusable-quick-dry-pad-2-pack?variant=46535234257138`,
    "38": `${PROD}/products/ezwhelp-reusable-quick-dry-pad-2-pack?variant=46535234289906`,
    "48": `${PROD}/products/ezwhelp-reusable-quick-dry-pad-2-pack?variant=46535234322674`,
  };
  return variants[boxSize];
}

// Traction Pad: NO XL SKU — caller must omit when isXL is true.
function getTractionPadUrl(boxSize: "28" | "38" | "48"): string {
  const variants: Record<string, string> = {
    "28": `${PROD}/products/ezwhelp-traction-pad?variant=43956779909362`,
    "38": `${PROD}/products/ezwhelp-traction-pad?variant=43956779942130`,
    "48": `${PROD}/products/ezwhelp-traction-pad?variant=43956779974898`,
  };
  return variants[boxSize];
}

function getSlipResistantPadUrl(boxSize: "28" | "38" | "48", isXL?: boolean): string {
  if (isXL) {
    return `${PROD}/products/black-white-slip-resistant-paw-print-pad-mat-2-pack?variant=44373750087922`;
  }
  const variants: Record<string, string> = {
    "28": `${PROD}/products/black-white-slip-resistant-paw-print-pad-mat-2-pack?variant=43769299075314`,
    "38": `${PROD}/products/black-white-slip-resistant-paw-print-pad-mat-2-pack?variant=43769300418802`,
    "48": `${PROD}/products/black-white-slip-resistant-paw-print-pad-mat-2-pack?variant=43769303040242`,
  };
  return variants[boxSize];
}

function getAcrylicDoorUrl(panelHeight: "18" | "28"): string {
  // Single Shopify product, two variants — pick by box height.
  // 18" → 44460059263218, 28" TALL → 44460059295986
  const variantId = panelHeight === "28" ? "44460059295986" : "44460059263218";
  return `${PROD}/products/acrylic-glass-door-set-for-ezclassic-whelping-boxes?variant=${variantId}`;
}

function getAcrylicDoorImageUrl(panelHeight: "18" | "28"): string {
  return panelHeight === "28"
    ? "https://cdn.shopify.com/s/files/1/0626/9389/files/EZClassicTallBoxAcrylicDoorSet.jpg?v=1757336594"
    : "https://cdn.shopify.com/s/files/1/0626/9389/products/AcrylicGlassdoorsetparts.jpg?v=1762459133";
}

function getAddOnRoomUrl(boxSize: "28" | "38" | "48", panelHeight: "18" | "28"): string {
  if (panelHeight === "28") {
    // TALL slug: ezclassic-tall-28-add-on-room-1 — Excel Sheet 8. No 28x28x28 SKU.
    const tallVariants: Record<string, string> = {
      "38": `${PROD}/products/ezclassic-tall-28-add-on-room-1?variant=44453457428722`,
      "48": `${PROD}/products/ezclassic-tall-28-add-on-room-1?variant=44453457461490`,
    };
    return tallVariants[boxSize] || tallVariants["38"];
  }
  const standardVariants: Record<string, string> = {
    "28": `${PROD}/products/ezclassic-add-on-room?variant=31184998400077`,
    "38": `${PROD}/products/ezclassic-add-on-room?variant=31184998432845`,
    "48": `${PROD}/products/ezclassic-add-on-room?variant=31184998465613`,
  };
  return standardVariants[boxSize];
}

function getAddOnRoomImageUrl(boxSize: "28" | "38" | "48", panelHeight: "18" | "28"): string {
  if (panelHeight === "28") {
    const tallImages: Record<string, string> = {
      "38": "https://cdn.shopify.com/s/files/1/0626/9389/products/a-Tall3838Add-On1.jpg?v=1762462438",
      "48": "https://cdn.shopify.com/s/files/1/0626/9389/products/a-Tall4848Add-On2.jpg?v=1757336568",
    };
    return tallImages[boxSize] || tallImages["38"];
  }
  const standardImages: Record<string, string> = {
    "28": "https://cdn.shopify.com/s/files/1/0626/9389/products/28Add-onsmall.jpg?v=1762458299",
    "38": "https://cdn.shopify.com/s/files/1/0626/9389/products/38Add-onsmall.jpg?v=1757336603",
    "48": "https://cdn.shopify.com/s/files/1/0626/9389/products/48Add-onsmall.jpg?v=1757336603",
  };
  return standardImages[boxSize];
}

function getWindowedAddOnRoomUrl(boxSize: "28" | "38" | "48", panelHeight: "18" | "28"): string {
  if (panelHeight === "28") {
    // TALL Windowed slug: ezclassic-tall-windowed-add-on-room — Excel Sheet 8.
    const tallVariants: Record<string, string> = {
      "38": `${PROD}/products/ezclassic-tall-windowed-add-on-room?variant=46569886122226`,
      "48": `${PROD}/products/ezclassic-tall-windowed-add-on-room?variant=46569886154994`,
    };
    return tallVariants[boxSize] || tallVariants["38"];
  }
  const standardVariants: Record<string, string> = {
    "28": `${PROD}/products/ezclassic-windowed-add-on-room?variant=46569870393586`,
    "38": `${PROD}/products/ezclassic-windowed-add-on-room?variant=46569870426354`,
    "48": `${PROD}/products/ezclassic-windowed-add-on-room?variant=46569870459122`,
  };
  return standardVariants[boxSize];
}

function getWindowedAddOnRoomImageUrl(boxSize: "28" | "38" | "48", panelHeight: "18" | "28"): string {
  if (panelHeight === "28") {
    const tallImages: Record<string, string> = {
      "38": "https://cdn.shopify.com/s/files/1/0626/9389/files/38TALLWindowedAddon.jpg?v=1762462789",
      "48": "https://cdn.shopify.com/s/files/1/0626/9389/files/48TALLWindowedAddon.jpg?v=1757336534",
    };
    return tallImages[boxSize] || tallImages["38"];
  }
  const standardImages: Record<string, string> = {
    "28": "https://cdn.shopify.com/s/files/1/0626/9389/files/28WindowedAddonRoom.jpg?v=1757336535",
    "38": "https://cdn.shopify.com/s/files/1/0626/9389/files/38WindowedAddonRoom.jpg?v=1757336536",
    "48": "https://cdn.shopify.com/s/files/1/0626/9389/files/IMG_4723.jpg?v=1762462789",
  };
  return standardImages[boxSize];
}

function getMessHallImageUrl(boxSize: "28" | "38" | "48", panelHeight: "18" | "28"): string {
  if (panelHeight === "28") {
    const tallImages: Record<string, string> = {
      "38": "https://cdn.shopify.com/s/files/1/0626/9389/files/TALL38x38FeedingStationAdd-OnSet-1.jpg?v=1762463323",
      "48": "https://cdn.shopify.com/s/files/1/0626/9389/files/TALL48x48FeedingStationAdd-OnSet-3.jpg?v=1757336514",
    };
    return tallImages[boxSize] || tallImages["38"];
  }
  const standardImages: Record<string, string> = {
    "28": "https://cdn.shopify.com/s/files/1/0626/9389/files/28x28FeedingStationAdd-OnSet-4.jpg?v=1757336515",
    "38": "https://cdn.shopify.com/s/files/1/0626/9389/files/38x38FeedingStationAdd-OnSet-5.jpg?v=1757336515",
    "48": "https://cdn.shopify.com/s/files/1/0626/9389/files/48x48FeedingStationAdd-OnSet-1.jpg?v=1757336516",
  };
  return standardImages[boxSize] || standardImages["38"];
}

function getMessHallUrl(boxSize: "28" | "38" | "48", panelHeight: "18" | "28"): string {
  const isTall = panelHeight === "28";
  // TALL slug: tall-ezclassic-mess-hall-add-on-room-set-tall-28-height. No 28x28x28 SKU.
  const tallVariants: Record<string, string> = {
    "38": `${PROD}/products/tall-ezclassic-mess-hall-add-on-room-set-tall-28-height?variant=51764660830580`,
    "48": `${PROD}/products/tall-ezclassic-mess-hall-add-on-room-set-tall-28-height?variant=51764660863348`,
  };
  const standardVariants: Record<string, string> = {
    "28": `${PROD}/products/ezclassic-mess-hall-add-on-room-set-standard-18-height?variant=51764621410676`,
    "38": `${PROD}/products/ezclassic-mess-hall-add-on-room-set-standard-18-height?variant=51764621443444`,
    "48": `${PROD}/products/ezclassic-mess-hall-add-on-room-set-standard-18-height?variant=51764621476212`,
  };
  const variants = isTall ? tallVariants : standardVariants;
  return variants[boxSize] || Object.values(variants)[0];
}

// ===== PAD RECOMMENDATION LABEL =====

const padMap: Record<BundleName, string> = {
  Starter: "2-Pack Extra Pads",
  Essential: "2-Pack Extra Pads",
  Pro: "Bulk Pad Pack",
  Elite: "Bulk Backup Pad Pack",
  "Play Yard": "Extra Pads Recommended",
  Condo: "Extra Pads Recommended",
};

export function getPadRecommendation(bundle: BundleName): string {
  return padMap[bundle];
}

// ===== TIMELINE OVERLAY ENGINE =====

export function getTimelineBanner(timeline: NewCustomerData["timeline"]): TimelineBanner {
  switch (timeline) {
    case "preparing":
      return {
        headline: "Get fully prepared before labor begins.",
        tone: "calm_preparedness",
        emphasis: ["setup completeness", "checklist", "tools if missing", "heat if missing", "pads always"],
      };
    case "due_7_days":
      return {
        headline: "Puppies arriving soon — prioritize readiness.",
        tone: "urgent_readiness",
        emphasis: ["urgency", "heat", "pads", "tools", "expedited shipping"],
      };
    case "born_0_3":
      return {
        headline: "Keep puppies warm, safe, and monitored.",
        tone: "warmth_safety",
        emphasis: ["heat stability", "monitoring", "hygiene", "pad rotation"],
      };
    case "born_1_plus":
      return {
        headline: "Support growing puppies safely.",
        tone: "growth_support",
        emphasis: ["traction", "expansion", "hygiene scaling", "connected room"],
      };
    default:
      return {
        headline: "Let's find your perfect whelping setup.",
        tone: "neutral",
        emphasis: ["pads", "completeness"],
      };
  }
}

// ===== ADD-ON ENGINE =====
// Rule 1: Bundle-specific suggested add-ons (primary driver)
// Rule 2: Exclude items already included in the bundle
// Rule 3: Size-aware variant URLs

/** Canonical add-on IDs used for matching */
type AddOnId =
  | "add_on_room"
  | "windowed_add_on_room"
  | "extra_pads"
  | "quick_dry_pads"
  | "slip_resistant_pads"
  | "whelping_kit"
  | "puppy_collar_set"
  | "corner_seat"
  | "acrylic_door"
  | "wifi_monitor"
  | "heat_combo"
  | "traction_pad"
  | "puppy_feeding_station"
  | "mess_hall";

/** Items included in each bundle (should NOT appear as add-ons) */
const bundleIncludes: Record<BundleName, AddOnId[]> = {
  Starter: ["extra_pads", "heat_combo"],
  Essential: ["extra_pads", "heat_combo", "whelping_kit", "puppy_collar_set", "corner_seat"],
  Pro: ["extra_pads", "heat_combo", "add_on_room", "whelping_kit", "puppy_collar_set", "corner_seat", "puppy_feeding_station"],
  Elite: ["extra_pads", "heat_combo", "add_on_room", "whelping_kit", "puppy_collar_set", "corner_seat", "puppy_feeding_station", "acrylic_door", "traction_pad", "wifi_monitor"],
  "Play Yard": ["extra_pads", "add_on_room"],
  Condo: ["extra_pads", "heat_combo", "windowed_add_on_room", "mess_hall"],
};

/** Bundle-specific suggested add-ons in priority order */
const bundleSuggestedAddOns: Record<BundleName, AddOnId[]> = {
  Starter: ["whelping_kit", "puppy_collar_set", "corner_seat", "puppy_feeding_station", "wifi_monitor", "traction_pad", "quick_dry_pads", "slip_resistant_pads"],
  Essential: ["puppy_feeding_station", "wifi_monitor", "traction_pad", "acrylic_door", "quick_dry_pads", "slip_resistant_pads"],
  Pro: ["acrylic_door", "traction_pad", "wifi_monitor", "puppy_feeding_station", "quick_dry_pads", "slip_resistant_pads"],
  // Elite per spec sheet 3 (count column): 3 items — Add-On Room, Quick Dry,
  // Slip Resistant. Mess Hall is not part of Elite's add-on list.
  Elite: ["add_on_room", "quick_dry_pads", "slip_resistant_pads"],
  "Play Yard": ["wifi_monitor", "traction_pad", "puppy_feeding_station", "quick_dry_pads", "slip_resistant_pads"],
  Condo: ["wifi_monitor", "traction_pad", "puppy_feeding_station", "corner_seat", "quick_dry_pads", "slip_resistant_pads"],
};

/** Build the full add-on catalog with variant-aware URLs */
function buildAddOnCatalog(boxSize: "28" | "38" | "48", panelHeight: "18" | "28", isXL?: boolean): Partial<Record<AddOnId, AddOn>> {
  const isTall = panelHeight === "28";
  const sizeLabel = isXL ? `48" x 76" x 28"` : `${boxSize}" x ${boxSize}" x ${panelHeight}"`;
  const addOnRoomName = `Add-On Room (${sizeLabel})`;
  const acrylicName = isTall ? `Acrylic Glass Door Set (28" Height)` : `Acrylic Glass Door Set (18" Height)`;
  const padSizeLabel = isXL ? `48x76` : `${boxSize}x${boxSize}`;

  return {
    add_on_room: {
      name: addOnRoomName,
      description: "Extra space as puppies grow",
      priority: 0,
      url: getAddOnRoomUrl(boxSize, panelHeight),
      imageUrl: getAddOnRoomImageUrl(boxSize, panelHeight),
      category: "space_growth",
    },
    windowed_add_on_room: {
      name: `Windowed Add-On Room (${sizeLabel})`,
      description: "Windowed add-on room for visibility",
      priority: 0,
      url: getWindowedAddOnRoomUrl(boxSize, panelHeight),
      imageUrl: getWindowedAddOnRoomImageUrl(boxSize, panelHeight),
      category: "space_growth",
    },
    extra_pads: {
      name: "Extra Whelping Pads",
      description: `Keep the whelping area clean and dry (${padSizeLabel} size)`,
      priority: 0,
      url: getPadUrl(boxSize),
      imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/files/EZWhelp-15.jpg?v=1762462705",
      category: "hygiene_comfort",
    },
    whelping_kit: {
      name: "Whelping Kit",
      description: "Essential tools for safe delivery",
      priority: 0,
      // Default-variant IDs included so the cart-permalink builder doesn't
      // silently drop these single-SKU items at "Proceed to Checkout".
      url: `${PROD}/products/whelping-kit?variant=19585620803`,
      imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/products/20160423_122211.jpg?v=1762457113",
      category: "warmth_safety",
    },
    puppy_collar_set: {
      name: "Puppy Collar Set (24 Pack)",
      description: "Identify and track each puppy from birth",
      priority: 0,
      url: `${PROD}/products/newborn-puppy-collar-set-24-pack?variant=42500795302130`,
      imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/products/24collarsdetail.jpg?v=1762462056",
      category: "monitoring_tools",
    },
    corner_seat: {
      name: "Corner Seat",
      description: "Comfortable monitoring during labor",
      priority: 0,
      url: `${PROD}/products/fab-box-corner-seat?variant=19585780739`,
      imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/products/CornerSeattop.jpg?v=1762457114",
      category: "hygiene_comfort",
    },
    acrylic_door: {
      name: acrylicName,
      description: "Check on pups without opening the box",
      priority: 0,
      url: getAcrylicDoorUrl(panelHeight),
      imageUrl: getAcrylicDoorImageUrl(panelHeight),
      category: "monitoring_tools",
    },
    wifi_monitor: {
      name: "Smart WiFi Camera + Temp Monitor",
      description: "24/7 remote monitoring with temperature alerts",
      priority: 0,
      url: `${PROD}/products/ezwhelp-smart-whelping-box-wifi-camera-temperature-monitoring-system?variant=40664559386819`,
      imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/products/Contents3.jpg?v=1762459778",
      category: "monitoring_tools",
    },
    // Traction Pad has NO XL SKU (Excel Sheet 6) — omit for XL boxes.
    ...(isXL ? {} : {
      traction_pad: {
        name: "Traction Pad",
        description: `Non-slip surface for pups (${padSizeLabel} size)`,
        priority: 0,
        url: getTractionPadUrl(boxSize),
        imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/files/TractionPadTopDown.jpg?v=1762462375",
        category: "space_growth",
      } as AddOn,
    }),
    puppy_feeding_station: {
      name: "Puppy Feeding Station",
      description: "Modular feeding setup for weaning puppies",
      priority: 0,
      url: `${PROD}/products/ezwhelp-puppy-feeding-station-modular-2-pack?variant=40357908545731`,
      imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/products/FeedingStation1.jpg?v=1762459525",
      category: "space_growth",
    },
    mess_hall: {
      name: `Mess Hall Add-On (${sizeLabel})`,
      description: "Separate feeding area for weaning",
      priority: 0,
      url: getMessHallUrl(boxSize, panelHeight),
      imageUrl: getMessHallImageUrl(boxSize, panelHeight),
      category: "space_growth",
    },
    quick_dry_pads: {
      name: `Reusable Quick Dry Pads (${padSizeLabel})`,
      description: `Fast-drying, reusable pads for easy cleanup`,
      priority: 0,
      url: getPadUrl(boxSize, isXL),
      imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/files/EZWhelp-15.jpg?v=1762462705",
      category: "hygiene_comfort",
    },
    slip_resistant_pads: {
      name: `Reusable Slip Resistant Pads (${padSizeLabel})`,
      description: `Non-slip paw print pads for added grip`,
      priority: 0,
      url: getSlipResistantPadUrl(boxSize, isXL),
      imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/products/BWPadTop_db316f59-7c2c-490a-9d3e-0cbe623619a8.jpg?v=1762459988",
      category: "hygiene_comfort",
    },
  };
}

export function getAddOns(
  bundle: BundleName,
  timeline: NewCustomerData["timeline"],
  boxSize: "28" | "38" | "48" = "38",
  panelHeight: "18" | "28" = "18",
  isXL?: boolean
): AddOn[] {
  const catalog = buildAddOnCatalog(boxSize, panelHeight, isXL);
  const excluded = new Set(bundleIncludes[bundle] || []);
  const suggestedList = bundleSuggestedAddOns[bundle] || [];

  // Items explicitly in both includes AND suggestions are allowed (e.g. Elite suggesting additional add-on room)
  const explicitlyAllowed = new Set(
    suggestedList.filter(id => bundleIncludes[bundle]?.includes(id))
  );

  const result: AddOn[] = [];
  suggestedList.forEach((id, index) => {
    if (!excluded.has(id) || explicitlyAllowed.has(id)) {
      const addon = catalog[id];
      if (addon) result.push({ ...addon, priority: index + 1 });
    }
  });

  return result;
}

// ===== MAIN RESULT COMPUTATION =====

export function computeFullResult(data: NewCustomerData): BundleResult {
  const bundle = computeBundle(data);

  // Use confidence scoring engine
  const scoringInput: ScoringInput = {
    breed: data.breed,
    damSize: data.damSize,
    litterSize: data.litterSize,
    containment: data.containment,
  };
  const confidence = computeConfidenceScores(scoringInput);

  const boxSize = confidence.boxSize;
  // Panel height: if user explicitly chose one (medium/large), use that; otherwise use confidence engine
  let panelHeight = confidence.panelHeight;
  if (data.panelHeight && (data.damSize === "16_40" || data.damSize === "40_90")) {
    panelHeight = data.panelHeight;
  }
  // Play Yard layout override
  if (data.zones === 3 && data.branchAnswer === false) {
    panelHeight = "18";
  }

  const isXL = data.damSize === "over_90";
  const padRecommendation = getPadRecommendation(bundle);
  const timelineBanner = getTimelineBanner(data.timeline);
  const addOns = getAddOns(bundle, data.timeline, boxSize, panelHeight, isXL);

  return { bundle, boxSize, panelHeight, padRecommendation, timelineBanner, addOns, confidenceMessage: confidence.confidenceMessage };
}
