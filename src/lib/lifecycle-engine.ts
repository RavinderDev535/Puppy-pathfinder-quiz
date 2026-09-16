import { ExistingCustomerData, LifecycleResult, LifecycleRecommendation, TimelineBanner } from "./types";

/**
 * LIFECYCLE ENGINE — Existing customers only
 * URLs use production Shopify (www.ezwhelp.com) — see Excel Sheets 4 + 6.
 */

const PROD = "https://www.ezwhelp.com";

// ===== VARIANT-AWARE URL HELPERS =====

function getBoxSizeKey(boxSize: ExistingCustomerData["boxSize"]): "28" | "38" | "48" {
  if (boxSize === "28" || boxSize === "38" || boxSize === "48") return boxSize;
  // "48xl" represents the XL/Giant 48×76 box. Floor dimension is still 48,
  // so non-pad URLs (Add-On Room, Mess Hall) use the "48" key. Pad URLs are
  // routed via isXLBox() below and resolve to XL variants instead.
  if (boxSize === "48xl") return "48";
  return "38"; // default for "unsure"
}

function isXLBox(boxSize: ExistingCustomerData["boxSize"], _boxHeight: ExistingCustomerData["boxHeight"]): boolean {
  // The frontend now signals XL explicitly via the "48xl" boxSize token
  // (BoxConfigSelector emits this when the customer picks 48×76 Tall).
  // When true, pad helpers resolve to XL variants (50.5"×80.5" Quick Dry,
  // 50"×80" Slip Resistant) and Stage C omits Traction Pad (no XL SKU).
  return boxSize === "48xl";
}

function getQuickDryPadUrl(boxSize: ExistingCustomerData["boxSize"], boxHeight?: ExistingCustomerData["boxHeight"]): string {
  if (isXLBox(boxSize, boxHeight)) {
    return `${PROD}/products/ezwhelp-reusable-quick-dry-pad-2-pack?variant=46535234355442`;
  }
  const size = getBoxSizeKey(boxSize);
  const variants: Record<string, string> = {
    "28": `${PROD}/products/ezwhelp-reusable-quick-dry-pad-2-pack?variant=46535234257138`,
    "38": `${PROD}/products/ezwhelp-reusable-quick-dry-pad-2-pack?variant=46535234289906`,
    "48": `${PROD}/products/ezwhelp-reusable-quick-dry-pad-2-pack?variant=46535234322674`,
  };
  return variants[size];
}

function getSlipResistantPadUrl(boxSize: ExistingCustomerData["boxSize"], boxHeight?: ExistingCustomerData["boxHeight"]): string {
  if (isXLBox(boxSize, boxHeight)) {
    return `${PROD}/products/black-white-slip-resistant-paw-print-pad-mat-2-pack?variant=44373750087922`;
  }
  const size = getBoxSizeKey(boxSize);
  const variants: Record<string, string> = {
    "28": `${PROD}/products/black-white-slip-resistant-paw-print-pad-mat-2-pack?variant=43769299075314`,
    "38": `${PROD}/products/black-white-slip-resistant-paw-print-pad-mat-2-pack?variant=43769300418802`,
    "48": `${PROD}/products/black-white-slip-resistant-paw-print-pad-mat-2-pack?variant=43769303040242`,
  };
  return variants[size];
}

// Traction Pad: NO XL SKU — caller must skip when isXLBox(boxSize, boxHeight) is true.
function getTractionPadUrl(boxSize: ExistingCustomerData["boxSize"]): string {
  const size = getBoxSizeKey(boxSize);
  const variants: Record<string, string> = {
    "28": `${PROD}/products/ezwhelp-traction-pad?variant=43956779909362`,
    "38": `${PROD}/products/ezwhelp-traction-pad?variant=43956779942130`,
    "48": `${PROD}/products/ezwhelp-traction-pad?variant=43956779974898`,
  };
  return variants[size];
}

function getAcrylicDoorUrl(boxHeight: ExistingCustomerData["boxHeight"]): string {
  // Single Shopify product, two variants — pick by box height.
  // 18" → 44460059263218, 28" TALL → 44460059295986
  const variantId = boxHeight === "28" ? "44460059295986" : "44460059263218";
  return `${PROD}/products/acrylic-glass-door-set-for-ezclassic-whelping-boxes?variant=${variantId}`;
}

function getAcrylicDoorImageUrl(boxHeight: ExistingCustomerData["boxHeight"]): string {
  return boxHeight === "28"
    ? "https://cdn.shopify.com/s/files/1/0626/9389/files/EZClassicTallBoxAcrylicDoorSet.jpg?v=1757336594"
    : "https://cdn.shopify.com/s/files/1/0626/9389/products/AcrylicGlassdoorsetparts.jpg?v=1762459133";
}

// Heat Pad — Excel Sheet 4 (Large/Medium/Small variants).
function getHeatPadUrl(boxSize: ExistingCustomerData["boxSize"]): string {
  const size = getBoxSizeKey(boxSize);
  const variants: Record<string, string> = {
    "28": `${PROD}/products/heat-pad-for-whelping-boxes?variant=51758374814068`, // Small 12x18
    "38": `${PROD}/products/heat-pad-for-whelping-boxes?variant=51758374781300`, // Medium 18x27
    "48": `${PROD}/products/heat-pad-for-whelping-boxes?variant=51758374748532`, // Large 23x35
  };
  return variants[size];
}

// Heat Combo — single Shopify product. Include the default-variant ID so the
// cart-permalink builder doesn't silently drop the item on Proceed to Checkout
// (the builder filters items down to those with `variant=<id>` in the URL).
function getHeatComboUrl(_boxSize: ExistingCustomerData["boxSize"]): string {
  return `${PROD}/products/heating-combo-for-classic-value-box-size-3838-or-4848?variant=34363696131`;
}

// Returns a single Add-On Room recommendation per Arya's spec sheet 4
// (Path 2 stages C and D each list one Add-On Room, not two).
// Variant is chosen by combining height + hasWindow:
//   - hasWindow === "no"  → recommend the WINDOWED variant (adds visibility
//     to a box that currently lacks it — ⭐ Recommended)
//   - hasWindow === "yes" → recommend the matching SOLID variant (customer
//     already has visibility; expand with a matching solid-panel room)
function getAddOnRoomSKUs(height: ExistingCustomerData["boxHeight"], hasWindow: ExistingCustomerData["hasWindow"], boxSize: ExistingCustomerData["boxSize"]): LifecycleRecommendation[] {
  const isTall = height === "28";
  const ownsWindowed = hasWindow === "yes";
  const size = getBoxSizeKey(boxSize);

  // hasWindow === "no" → recommend a WINDOWED add-on (gives visibility);
  // hasWindow === "yes" → recommend the matching SOLID add-on.
  const wantWindowed = !ownsWindowed;

  if (wantWindowed) {
    if (isTall) {
      const tallWindowedVariants: Record<string, string> = {
        "38": `${PROD}/products/ezclassic-tall-windowed-add-on-room?variant=46569886122226`,
        "48": `${PROD}/products/ezclassic-tall-windowed-add-on-room?variant=46569886154994`,
      };
      const tallWindowedImages: Record<string, string> = {
        "38": "https://cdn.shopify.com/s/files/1/0626/9389/files/38TALLWindowedAddon.jpg?v=1762462789",
        "48": "https://cdn.shopify.com/s/files/1/0626/9389/files/48TALLWindowedAddon.jpg?v=1757336534",
      };
      return [{
        name: "EZclassic TALL Windowed Add-On Room",
        description: "⭐ Recommended — adds visibility to your non-windowed box",
        url: tallWindowedVariants[size] || tallWindowedVariants["38"],
        imageUrl: tallWindowedImages[size] || tallWindowedImages["38"],
        category: "space_growth",
      }];
    }
    const windowedVariants: Record<string, string> = {
      "28": `${PROD}/products/ezclassic-windowed-add-on-room?variant=46569870393586`,
      "38": `${PROD}/products/ezclassic-windowed-add-on-room?variant=46569870426354`,
      "48": `${PROD}/products/ezclassic-windowed-add-on-room?variant=46569870459122`,
    };
    const windowedImages: Record<string, string> = {
      "28": "https://cdn.shopify.com/s/files/1/0626/9389/files/28WindowedAddonRoom.jpg?v=1757336535",
      "38": "https://cdn.shopify.com/s/files/1/0626/9389/files/38WindowedAddonRoom.jpg?v=1757336536",
      "48": "https://cdn.shopify.com/s/files/1/0626/9389/files/IMG_4723.jpg?v=1762462789",
    };
    return [{
      name: "EZclassic Windowed Add-On Room",
      description: "⭐ Recommended — see your puppies without opening the box",
      url: windowedVariants[size],
      imageUrl: windowedImages[size],
      category: "space_growth",
    }];
  }

  // ownsWindowed === true: recommend the matching solid-panel add-on
  if (isTall) {
    const tallVariants: Record<string, string> = {
      "38": `${PROD}/products/ezclassic-tall-28-add-on-room-1?variant=44453457428722`,
      "48": `${PROD}/products/ezclassic-tall-28-add-on-room-1?variant=44453457461490`,
    };
    const tallImages: Record<string, string> = {
      "38": "https://cdn.shopify.com/s/files/1/0626/9389/products/a-Tall3838Add-On1.jpg?v=1762462438",
      "48": "https://cdn.shopify.com/s/files/1/0626/9389/products/a-Tall4848Add-On2.jpg?v=1757336568",
    };
    return [{
      name: "EZclassic TALL Add-On Room",
      description: "Tall 28\" add-on room for expanded space",
      url: tallVariants[size] || tallVariants["38"],
      imageUrl: tallImages[size] || tallImages["38"],
      category: "space_growth",
    }];
  }
  const standardVariants: Record<string, string> = {
    "28": `${PROD}/products/ezclassic-add-on-room?variant=31184998400077`,
    "38": `${PROD}/products/ezclassic-add-on-room?variant=31184998432845`,
    "48": `${PROD}/products/ezclassic-add-on-room?variant=31184998465613`,
  };
  const standardImages: Record<string, string> = {
    "28": "https://cdn.shopify.com/s/files/1/0626/9389/products/28Add-onsmall.jpg?v=1762458299",
    "38": "https://cdn.shopify.com/s/files/1/0626/9389/products/38Add-onsmall.jpg?v=1757336603",
    "48": "https://cdn.shopify.com/s/files/1/0626/9389/products/48Add-onsmall.jpg?v=1757336603",
  };
  return [{
    name: "EZclassic Add-On Room",
    description: "Add-on room for expanded space",
    url: standardVariants[size],
    imageUrl: standardImages[size],
    category: "space_growth",
  }];
}

function getMessHallSKUs(height: ExistingCustomerData["boxHeight"], boxSize: ExistingCustomerData["boxSize"]): LifecycleRecommendation[] {
  const isTall = height === "28";
  const size = getBoxSizeKey(boxSize);

  // Mess Hall — Excel Sheet 4. Standard slug includes "standard-18-height", TALL slug "tall-28-height".
  const standardVariants: Record<string, string> = {
    "28": `${PROD}/products/ezclassic-mess-hall-add-on-room-set-standard-18-height?variant=51764621410676`,
    "38": `${PROD}/products/ezclassic-mess-hall-add-on-room-set-standard-18-height?variant=51764621443444`,
    "48": `${PROD}/products/ezclassic-mess-hall-add-on-room-set-standard-18-height?variant=51764621476212`,
  };

  // No 28x28x28 TALL Mess Hall SKU exists.
  const tallVariants: Record<string, string> = {
    "38": `${PROD}/products/tall-ezclassic-mess-hall-add-on-room-set-tall-28-height?variant=51764660830580`,
    "48": `${PROD}/products/tall-ezclassic-mess-hall-add-on-room-set-tall-28-height?variant=51764660863348`,
  };

  const variants = isTall ? tallVariants : standardVariants;
  const url = variants[size] || Object.values(variants)[0];
  const standardImages: Record<string, string> = {
    "28": "https://cdn.shopify.com/s/files/1/0626/9389/files/28x28FeedingStationAdd-OnSet-4.jpg?v=1757336515",
    "38": "https://cdn.shopify.com/s/files/1/0626/9389/files/38x38FeedingStationAdd-OnSet-5.jpg?v=1757336515",
    "48": "https://cdn.shopify.com/s/files/1/0626/9389/files/48x48FeedingStationAdd-OnSet-1.jpg?v=1757336516",
  };
  const tallImages: Record<string, string> = {
    "38": "https://cdn.shopify.com/s/files/1/0626/9389/files/TALL38x38FeedingStationAdd-OnSet-1.jpg?v=1762463323",
    "48": "https://cdn.shopify.com/s/files/1/0626/9389/files/TALL48x48FeedingStationAdd-OnSet-3.jpg?v=1757336514",
  };
  const images = isTall ? tallImages : standardImages;

  return [{
    name: isTall ? "TALL EZclassic Mess Hall Add-On Room Set" : "EZclassic Mess Hall Add-On Room Set",
    description: isTall ? "Tall 28\" mess hall for feeding & weaning" : "Standard 18\" mess hall for feeding & weaning",
    url,
    imageUrl: images[size] || Object.values(images)[0],
    category: "space_growth",
  }];
}

function getPadRecommendations(boxSize: ExistingCustomerData["boxSize"], boxHeight: ExistingCustomerData["boxHeight"], description: string): LifecycleRecommendation[] {
  const xl = isXLBox(boxSize, boxHeight);
  const padSizeLabel = xl ? "50.5x80.5" : `${getBoxSizeKey(boxSize)}x${getBoxSizeKey(boxSize)}`;
  const padSizeLabelSlip = xl ? "50x80" : padSizeLabel;
  return [
    {
      name: xl ? "Reusable Quick Dry Pads — 50.5\"x80.5\"" : "Reusable Quick Dry Pads",
      description: `${description} (${padSizeLabel} size)`,
      url: getQuickDryPadUrl(boxSize, boxHeight),
      imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/files/EZWhelp-15.jpg?v=1762462705",
      category: "hygiene_comfort",
    },
    {
      name: xl ? "Reusable Slip Resistant Pads — 50\"x80\"" : "Reusable Slip Resistant Pads",
      description: `Non-slip paw print pads for added grip (${padSizeLabelSlip} size)`,
      url: getSlipResistantPadUrl(boxSize, boxHeight),
      imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/products/BWPadTop_db316f59-7c2c-490a-9d3e-0cbe623619a8.jpg?v=1762459988",
      category: "hygiene_comfort",
    },
  ];
}

function getStageBanner(stage: ExistingCustomerData["stage"]): TimelineBanner {
  switch (stage) {
    case "preparing":
      return {
        headline: "Get your existing setup fully prepared before labor begins.",
        tone: "calm_preparedness",
        emphasis: ["heat", "whelping kit", "pads", "readiness"],
      };
    case "born_0_3":
      return {
        headline: "Keep your newborns warm, safe, and closely monitored.",
        tone: "warmth_safety",
        emphasis: ["heat stability", "monitoring", "hygiene"],
      };
    case "1_2_weeks":
      return {
        headline: "Time to expand — give growing puppies room to explore safely.",
        tone: "growth_support",
        emphasis: ["traction", "expansion", "hygiene"],
      };
    case "3_plus_weeks":
      return {
        headline: "Puppies are active now — support their development with the right space.",
        tone: "active_support",
        emphasis: ["expansion", "feeding", "mess hall", "hygiene"],
      };
    default:
      return {
        headline: "Let's find what your setup needs next.",
        tone: "neutral",
        emphasis: ["pads"],
      };
  }
}

export function computeLifecycleResult(data: ExistingCustomerData): LifecycleResult {
  const { stage, hasWindow, boxHeight, boxSize } = data;
  const banner = getStageBanner(stage);
  let primary: LifecycleRecommendation[] = [];
  let conditional: LifecycleRecommendation[] = [];

  const tractionUrl = getTractionPadUrl(boxSize);
  const acrylicUrl = getAcrylicDoorUrl(boxHeight);
  const acrylicImageUrl = getAcrylicDoorImageUrl(boxHeight);
  const acrylicName = boxHeight === "28" ? "TALL Acrylic Glass Door Set" : "Acrylic Glass Door Set";
  const heatComboUrl = getHeatComboUrl(boxSize);

  // Heat Pad — Path 2 Stage A + B (Excel Sheet 5). Direct-contact warmth on
  // top of Heat Combo's ambient heating. XL falls back to the Large variant
  // since no XL-specific Heat Pad SKU exists (Arya UAT 2026-05-11).
  const heatPadUrl = getHeatPadUrl(boxSize);
  const heatPadImage = "https://cdn.shopify.com/s/files/1/0626/9389/files/LargeHeatPad-1.jpg?v=1757336518";

  switch (stage) {
    case "preparing":
      primary = [
        { name: "Heat Combo", description: "Consistent warmth for newborn puppies", url: heatComboUrl, imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/products/HeatLampComboEZclassic.jpg?v=1762457294", category: "warmth_safety" },
        { name: "Heat Pad", description: "Direct surface warmth — pair with Heat Combo for stable temps before puppies arrive", url: heatPadUrl, imageUrl: heatPadImage, category: "warmth_safety" },
        { name: "Whelping Kit", description: "Essential delivery tools", url: `${PROD}/products/whelping-kit?variant=19585620803`, imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/products/20160423_122211.jpg?v=1762457113", category: "warmth_safety" },
        { name: "Corner Seat", description: "Comfortable monitoring during labor", url: `${PROD}/products/fab-box-corner-seat?variant=19585780739`, imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/products/CornerSeattop.jpg?v=1762457114", category: "warmth_safety" },
        ...getPadRecommendations(boxSize, boxHeight, "Keep the whelping area clean and dry"),
      ];
      if (hasWindow !== "yes") {
        conditional.push({
          name: acrylicName,
          description: "⭐ Since your box isn't windowed — add visibility without opening panels",
          url: acrylicUrl,
          imageUrl: acrylicImageUrl,
          category: "monitoring_tools",
        });
      }
      break;

    case "born_0_3":
      // Stage B (0–3 days): Heat Combo + Heat Pad + Smart WiFi Camera + Quick
      // Dry + Slip Resistant (+ Acrylic Door if no window). Heat Pad provides
      // direct surface warmth — critical in the first 72 hours when newborns
      // can't regulate body temperature. Add-On Room intentionally NOT here —
      // belongs to Stages C and D.
      primary = [
        { name: "Heat Combo", description: "Critical warmth for 0–3 day old puppies", url: heatComboUrl, imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/products/HeatLampComboEZclassic.jpg?v=1762457294", category: "warmth_safety" },
        { name: "Heat Pad", description: "Direct surface heat — newborns can't regulate body temperature in the first 72 hours", url: heatPadUrl, imageUrl: heatPadImage, category: "warmth_safety" },
        { name: "WiFi Monitoring System", description: "24/7 remote monitoring with temperature alerts", url: `${PROD}/products/ezwhelp-smart-whelping-box-wifi-camera-temperature-monitoring-system?variant=40664559386819`, imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/products/Contents3.jpg?v=1762459778", category: "monitoring_tools" },
        ...getPadRecommendations(boxSize, boxHeight, "Maintain hygiene with frequent pad changes"),
      ];
      if (hasWindow !== "yes") {
        conditional.push({
          name: acrylicName,
          description: "⭐ Your box isn't windowed — pair with monitoring for full visibility",
          url: acrylicUrl,
          imageUrl: acrylicImageUrl,
          category: "monitoring_tools",
        });
      }
      break;

    case "1_2_weeks":
      primary = [
        // Traction Pad has no XL variant — skip for XL boxes
        ...(isXLBox(boxSize, boxHeight)
          ? []
          : [{ name: "Traction Pad", description: "Non-slip surface as puppies start moving", url: tractionUrl, imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/files/TractionPadTopDown.jpg?v=1762462375", category: "hygiene_comfort" as const }]),
        ...getAddOnRoomSKUs(boxHeight, hasWindow, boxSize),
        ...getPadRecommendations(boxSize, boxHeight, "Scale up hygiene as puppies grow"),
      ];
      break;

    case "3_plus_weeks":
      primary = [
        ...getAddOnRoomSKUs(boxHeight, hasWindow, boxSize),
        { name: "Puppy Feeding Station", description: "Modular feeding setup for weaning puppies", url: `${PROD}/products/ezwhelp-puppy-feeding-station-modular-2-pack?variant=40357908545731`, imageUrl: "https://cdn.shopify.com/s/files/1/0626/9389/products/FeedingStation1.jpg?v=1762459525", category: "space_growth" },
        ...getMessHallSKUs(boxHeight, boxSize),
        ...getPadRecommendations(boxSize, boxHeight, "Keep up with active puppies"),
      ];
      break;
  }

  return {
    stage: stage || "unknown",
    stageLabel: stage === "preparing" ? "Getting Ready for Your Litter" : stage === "born_0_3" ? "Newborn Essentials — First 72 Hours" : stage === "1_2_weeks" ? "Supporting Early Growth — Weeks 1–2" : "Thriving Litter — 3+ Weeks",
    banner,
    primaryRecommendations: primary,
    conditionalRecommendations: conditional,
  };
}
