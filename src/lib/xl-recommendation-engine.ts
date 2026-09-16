/**
 * XL / Giant Breed Internal Recommendation Engine
 *
 * Computes stage-based product recommendations for XL/Giant (90+ lbs) users.
 * This data is stored internally for follow-up workflows and future UI expansion.
 * It does NOT drive bundle routing — it is a separate recommendation layer.
 */

// ===== XL Product Catalog =====

export interface XLProduct {
  name: string;
  category: XLProductCategory;
  sizeNote?: string;
  url?: string;
  imageUrl?: string;
}

export type XLProductCategory =
  | "primary_box"
  | "expansion"
  | "pads"
  | "heat"
  | "monitoring"
  | "accessories";

export const XL_PRIMARY_BOX: XLProduct = {
  name: '48" x 76" x 28"TALL EZclassic TALL Whelping Box w/Rails',
  category: "primary_box",
  sizeNote: "48x76x28 Tall — XL/Giant only",
  url: "https://www.ezwhelp.com/products/ezclassic-tall-28-whelping-box?variant=44453457395954",
  imageUrl: "https://www.ezwhelp.com/cdn/shop/files/Blk_Starter_48_Tall.jpg?v=1757336560&width=600",
};

const XL_PRODUCTS: Record<string, XLProduct> = {
  addon_room: {
    name: '48" x 48" x 28"TALL Add-on',
    category: "expansion",
    sizeNote: "48x48x28 Tall",
    url: "https://www.ezwhelp.com/products/ezclassic-tall-28-add-on-room-1?variant=44453457461490",
    imageUrl: "https://www.ezwhelp.com/cdn/shop/products/a-Tall4848Add-On1.jpg?v=1757336568&width=400",
  },
  windowed_addon: {
    name: '48" x 48" x 28"TALL Windowed Add-on',
    category: "expansion",
    sizeNote: "48x48x28 Tall",
    url: "https://www.ezwhelp.com/products/ezclassic-tall-windowed-add-on-room?variant=46569886154994",
    imageUrl: "https://www.ezwhelp.com/cdn/shop/files/48TALLWindowedAddon.jpg?v=1757336534&width=400",
  },
  mess_hall: {
    name: 'TALL Mess Hall Add-On Room Set - Tall 28" height',
    category: "expansion",
    sizeNote: "48x48x28 Tall",
    url: "https://www.ezwhelp.com/products/tall-ezclassic-mess-hall-add-on-room-set-tall-28-height?variant=51764660863348",
    imageUrl: "https://www.ezwhelp.com/cdn/shop/files/TALL48x48FeedingStationAdd-OnSet-1.jpg?v=1757336513&width=400",
  },
  quick_dry_pad: {
    name: "Reusable Quick Dry Pads",
    category: "pads",
    sizeNote: "48x76 — largest available for XL box",
    url: "https://www.ezwhelp.com/products/ezwhelp-reusable-quick-dry-pad-2-pack?variant=46535234355442",
  },
  slip_resistant_pad: {
    name: "Reusable Slip Resistant Pads",
    category: "pads",
    sizeNote: "48x76 — largest available for XL box",
    url: "https://www.ezwhelp.com/products/black-white-slip-resistant-paw-print-pad-mat-2-pack?variant=44373750087922",
  },
  traction_pad: {
    name: "Traction Pad",
    category: "pads",
    sizeNote: "49x49 — largest available traction pad",
    url: "https://www.ezwhelp.com/products/ezwhelp-traction-pad?variant=43956779974898",
    imageUrl: "https://www.ezwhelp.com/cdn/shop/files/TractionPadTopDown.jpg?v=1762462375&width=400",
  },
  heat_combo: {
    name: "Heat Combo",
    category: "heat",
  },
  heat_pad: {
    name: "Heat Pad",
    category: "heat",
    sizeNote: "48x48 — largest supported heat pad size",
  },
  whelping_kit: {
    name: "Whelping Kit",
    category: "accessories",
  },
  corner_seat: {
    name: "Corner Seat",
    category: "accessories",
  },
  acrylic_door: {
    name: "Acrylic Door",
    category: "accessories",
  },
  wifi_monitoring: {
    name: "WiFi Monitoring System",
    category: "monitoring",
  },
  feeding_station: {
    name: "Feeding Station",
    category: "accessories",
  },
};

// ===== Stage types =====

export type XLStage = "A" | "B" | "C" | "D";

export interface XLRecommendationResult {
  stage: XLStage;
  stageLabel: string;
  primaryBox: XLProduct;
  recommendations: XLProduct[];
  conditionalNotes: string[];
}

// ===== Timeline → Stage mapping =====

function mapTimelineToStage(
  timeline: "preparing" | "due_7_days" | "born_0_3" | "born_1_plus" | null
): XLStage {
  switch (timeline) {
    case "preparing":
    case "due_7_days":
      return "A";
    case "born_0_3":
      return "B";
    case "born_1_plus":
      // born_1_plus covers both C and D; default to C as the midpoint
      return "C";
    default:
      return "A";
  }
}

const STAGE_LABELS: Record<XLStage, string> = {
  A: "Preparing",
  B: "0–3 Days",
  C: "1–2 Weeks",
  D: "3+ Weeks",
};

// ===== Core engine =====

interface XLInput {
  timeline: "preparing" | "due_7_days" | "born_0_3" | "born_1_plus" | null;
  zones: 1 | 2 | 3 | null;
  hasWindow?: boolean;
  panelHeight?: "18" | "28" | null;
}

/**
 * Compute the full XL/Giant internal recommendation set.
 *
 * Stage determines lifecycle recommendation priority.
 * Window only determines whether Acrylic Door is eligible.
 * Height affects messaging only — not product eligibility.
 * No bundle routing happens here.
 */
export function computeXLRecommendation(input: XLInput): XLRecommendationResult {
  const stage = mapTimelineToStage(input.timeline);
  const hasWindow = input.hasWindow ?? false;
  const recs: XLProduct[] = [];
  const notes: string[] = [];

  switch (stage) {
    case "A": {
      // Preparing
      recs.push(
        XL_PRODUCTS.heat_combo,
        XL_PRODUCTS.whelping_kit,
        XL_PRODUCTS.corner_seat,
        XL_PRODUCTS.quick_dry_pad,
        XL_PRODUCTS.slip_resistant_pad,
      );
      if (!hasWindow) {
        recs.push(XL_PRODUCTS.acrylic_door);
      } else {
        notes.push("Acrylic Door excluded — box already has window");
      }
      break;
    }

    case "B": {
      // 0–3 Days. Spec sheet 4: Heat Combo + WiFi Camera + Quick Dry + Slip
      // (+ Acrylic Door if no window). Heat Pad and Add-On Room are NOT in
      // Stage B per spec — they belonged to a previous, broader engine layout.
      recs.push(
        XL_PRODUCTS.heat_combo,
        XL_PRODUCTS.wifi_monitoring,
        XL_PRODUCTS.quick_dry_pad,
        XL_PRODUCTS.slip_resistant_pad,
      );
      if (!hasWindow) {
        recs.push(XL_PRODUCTS.acrylic_door);
        notes.push("Acrylic Door eligible alongside monitoring — no window present");
      } else {
        notes.push("Acrylic Door excluded — box already has window");
      }
      break;
    }

    case "C": {
      // 1–2 Weeks. Spec sheet 4 XL: Add-On Room + Quick Dry + Slip = 3 items.
      // Traction Pad is OMITTED on XL path (no XL Traction SKU exists).
      // Add-On Room: pick windowed if customer doesn't already have a window.
      const xlAddonRoom = hasWindow ? XL_PRODUCTS.addon_room : XL_PRODUCTS.windowed_addon;
      recs.push(
        xlAddonRoom,
        XL_PRODUCTS.quick_dry_pad,
        XL_PRODUCTS.slip_resistant_pad,
      );
      break;
    }

    case "D": {
      // 3+ Weeks. Spec sheet 4: Add-On Room + Feeding Station + Mess Hall +
      // Quick Dry + Slip = 5 items. Single Add-On Room (variant by has_window).
      const xlAddonRoom = hasWindow ? XL_PRODUCTS.addon_room : XL_PRODUCTS.windowed_addon;
      recs.push(
        xlAddonRoom,
        XL_PRODUCTS.feeding_station,
        XL_PRODUCTS.mess_hall,
        XL_PRODUCTS.quick_dry_pad,
        XL_PRODUCTS.slip_resistant_pad,
      );
      break;
    }
  }

  // Height messaging note (not product eligibility)
  if (input.panelHeight === "28") {
    notes.push("Tall 28\" panels — all expansion products use matching 28\" height");
  }

  return {
    stage,
    stageLabel: STAGE_LABELS[stage],
    primaryBox: XL_PRIMARY_BOX,
    recommendations: recs,
    conditionalNotes: notes,
  };
}

/**
 * Convenience: get just the product names for logging / tracking.
 */
export function getXLRecommendationNames(result: XLRecommendationResult): string[] {
  return [result.primaryBox.name, ...result.recommendations.map((r) => r.name)];
}
