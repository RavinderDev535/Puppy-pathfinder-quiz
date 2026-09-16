import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { getMeadowScene, type MeadowScene } from "@/lib/meadow-scene";
import BundleSlideshow from "@/components/BundleSlideshow";
import XLInquirySlideshow from "@/components/XLInquirySlideshow";
import ezwhelpLogo from "@/assets/ezwhelp-logo.png";
import xlWindowBox1 from "@/assets/xl-window-box-1.png";
import xlWindowBox2 from "@/assets/xl-window-box-2.png";
import xlCustomBundleHero from "@/assets/xl-custom-bundle-hero.png";

import BreedSelector from "@/components/BreedSelector";
import BoxConfigSelector from "@/components/BoxConfigSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, ChevronDown, ChevronRight, Truck, CheckCircle2, Volume2, VolumeX, Wrench, PawPrint, Award, Trophy, Building2, Check, RotateCcw, Shield, Maximize2, Droplets, MonitorSmartphone, ShoppingCart, Flame, Move, Heart, Headset } from "lucide-react";
import { playSelect, playNext, playCelebration, playBack, playHover, playMilestone, playPop, playWhoosh, playReward, playTypeTick, playButtonClick, toggleMute, isMuted } from "@/lib/sounds";
import { motion, AnimatePresence } from "framer-motion";
import PawCelebration from "@/components/PawCelebration";
import { CustomerType, NewCustomerData, ExistingCustomerData } from "@/lib/types";
import {
  gateStep,
  newCustomerDataSteps,
  spaceSetupStep,
  step2AQuestion,
  step2BQuestion,
  step2CQuestion,
  containmentStep,
  panelHeightStep,
  windowStep,
  existingCustomerDataSteps,
  existingCustomerBoxSteps,
  emailStep,
} from "@/lib/quiz-config";
import { computeFullResult } from "@/lib/structural-engine";

import { computeLifecycleResult } from "@/lib/lifecycle-engine";
import { getNewCustomerRecommendation, getExistingCustomerRecommendation, getNewCustomerRecommendationSet, getExistingCustomerRecommendationSet } from "@/lib/smart-recommendations";
import type { SmartRecommendationSet } from "@/lib/smart-recommendations";
import { getBreedRecommendation } from "@/lib/breed-box-sizes";
import { initQuizSession, trackAnswer, trackSubmit, trackProductClick, resetTracking, getSessionId } from "@/lib/quiz-tracking";
import { submitPath1, submitPath2, type Path1Response, type Path2Response } from "@/lib/backend-api";
import type { QuizStep } from "@/lib/types";
import CartReviewScreen, { type CartReviewItem } from "@/components/CartReviewScreen";

// ===== Bundle links & images (variant-aware) =====
const bundleImages: Record<string, string> = {
  Starter: "https://www.ezwhelp.com/cdn/shop/files/StarterBundleImage.jpg?v=1762462561&width=600",
  Essential: "https://www.ezwhelp.com/cdn/shop/files/EssentialBundleImage.jpg?v=1762462560&width=600",
  Pro: "https://www.ezwhelp.com/cdn/shop/files/ProBundleImage.jpg?v=1762462562&width=600",
  Elite: "https://www.ezwhelp.com/cdn/shop/files/EliteBundleImage.jpg?v=1762462563&width=600",
  "Play Yard": "https://www.ezwhelp.com/cdn/shop/files/EZC3838withPlayYardsmall.jpg?v=1762462564&width=600",
  Condo: "https://www.ezwhelp.com/cdn/shop/files/28x28PlayYardSize-5.jpg?v=1762463441&width=600",
};

/** Variant-specific images for bundles that have different photos per size */
const bundleVariantImages: Record<string, Record<string, string>> = {
  Starter: {
    "28-18": "https://www.ezwhelp.com/cdn/shop/files/EZC2828compressed_057b739a-7bae-41d6-bf28-421c9be3c6e3.jpg?v=1757336559&width=600",
    "38-18": "https://www.ezwhelp.com/cdn/shop/files/EZC3838compressed_3c0d3bcc-2a06-4c6e-ab31-f9baa7845c79.jpg?v=1757336560&width=600",
    "38-28": "https://www.ezwhelp.com/cdn/shop/files/Blk_Starter_38_Tall.jpg?v=1757336560&width=600",
    "48-18": "https://www.ezwhelp.com/cdn/shop/files/EZC4848compressed_3de65923-f540-4a33-84fa-38b2737c3565.jpg?v=1757336560&width=600",
    "48-28": "https://www.ezwhelp.com/cdn/shop/files/Blk_Starter_48_Tall.jpg?v=1757336560&width=600",
  },
  Essential: {
    "28-18": "https://www.ezwhelp.com/cdn/shop/files/EZC2828compressed_e4725d2e-64fe-495d-bf31-2b6eabb8bd75.jpg?v=1757336562&width=600",
    "38-18": "https://www.ezwhelp.com/cdn/shop/files/EZC3838compressed_828790fd-bf03-4d61-b577-1c1310ecd2ca.jpg?v=1757336562&width=600",
    "38-28": "https://www.ezwhelp.com/cdn/shop/files/Blk_Essential_38_Tall.jpg?v=1757336562&width=600",
    "48-18": "https://www.ezwhelp.com/cdn/shop/files/EZC4848compressed_97ce1175-32e8-4b3b-8d30-a2591634e962.jpg?v=1757336562&width=600",
    "48-28": "https://www.ezwhelp.com/cdn/shop/files/Blk_Essential_48_Tall.jpg?v=1757336563&width=600",
  },
  Pro: {
    "28-18": "https://www.ezwhelp.com/cdn/shop/files/28x28_compressed.jpg?v=1757336556&width=600",
    "38-18": "https://www.ezwhelp.com/cdn/shop/files/38x38_compressed.jpg?v=1757336557&width=600",
    "38-28": "https://www.ezwhelp.com/cdn/shop/files/Blk_Pro_38_Tall.jpg?v=1757336557&width=600",
    "48-18": "https://www.ezwhelp.com/cdn/shop/files/48x48_compressed.jpg?v=1757336557&width=600",
    "48-28": "https://www.ezwhelp.com/cdn/shop/files/Blk_Pro_48_Tall.jpg?v=1757336557&width=600",
  },
  Elite: {
    "28-18": "https://www.ezwhelp.com/cdn/shop/files/28x28_compressed_d6687380-d2a2-4d40-a75a-be00826d94a8.jpg?v=1757336554&width=600",
    "38-18": "https://www.ezwhelp.com/cdn/shop/files/38x38_compressed_1a5dcd47-4f01-47b7-8ea3-eeba6cff83a5.jpg?v=1757336554&width=600",
    "38-28": "https://www.ezwhelp.com/cdn/shop/files/Blk_Elite_38_Tall.jpg?v=1757336554&width=600",
    "48-18": "https://www.ezwhelp.com/cdn/shop/files/48x48_compressed_4f6bc69e-ddce-419f-96c0-234072f22b31.jpg?v=1757336554&width=600",
    "48-28": "https://www.ezwhelp.com/cdn/shop/files/Blk_Elite_48_Tall.jpg?v=1757336555&width=600",
  },
  Condo: {
    "28-18": "https://www.ezwhelp.com/cdn/shop/files/28x28PlayYardSize-5.jpg?v=1762463441&width=600",
    "38-18": "https://www.ezwhelp.com/cdn/shop/files/38x38PlayYardSize-4.jpg?v=1757336507&width=600",
    "38-28": "https://www.ezwhelp.com/cdn/shop/files/TALL_38x38_Condo_Set_-_2.jpg?v=1757336508&width=600",
    "48-18": "https://www.ezwhelp.com/cdn/shop/files/48x48PlayYardSize-6.jpg?v=1757336508&width=600",
    "48-28": "https://www.ezwhelp.com/cdn/shop/files/TALL_48x48_Condo_Set_-_10.jpg?v=1757336508&width=600",
  },
};

function getBundleImage(bundle: string, boxSize: string, panelHeight: string): string {
  const key = `${boxSize}-${panelHeight}`;
  const variantImage = bundleVariantImages[bundle]?.[key];
  if (variantImage) return variantImage;
  return bundleImages[bundle] || bundleImages["Starter"];
}

type VariantKey = string; // "boxSize-panelHeight" e.g. "38-28"

const PROD_BASE = "https://www.ezwhelp.com";

// HARD VALIDATION: every recommendation card MUST render an image.
// If a product is missing one, fall back to the EZWhelp logo and warn in dev.
const FALLBACK_REC_IMAGE = ezwhelpLogo;
function ensureRecImage(url: string | undefined | null, label?: string): string {
  if (url && typeof url === "string" && url.trim().length > 0) return url;
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[recommendations] missing image for "${label ?? "unknown product"}" — using fallback`);
  }
  return FALLBACK_REC_IMAGE;
}

const ORIGINAL_ADD_ON_IMAGES_BY_VARIANT: Record<string, string> = {
  "31184998400077": "https://cdn.shopify.com/s/files/1/0626/9389/products/28Add-onsmall.jpg?v=1762458299",
  "31184998432845": "https://cdn.shopify.com/s/files/1/0626/9389/products/38Add-onsmall.jpg?v=1757336603",
  "31184998465613": "https://cdn.shopify.com/s/files/1/0626/9389/products/48Add-onsmall.jpg?v=1757336603",
  "44453457428722": "https://cdn.shopify.com/s/files/1/0626/9389/products/a-Tall3838Add-On1.jpg?v=1762462438",
  "44453457461490": "https://cdn.shopify.com/s/files/1/0626/9389/products/a-Tall4848Add-On2.jpg?v=1757336568",
  "46569870393586": "https://cdn.shopify.com/s/files/1/0626/9389/files/28WindowedAddonRoom.jpg?v=1757336535",
  "46569870426354": "https://cdn.shopify.com/s/files/1/0626/9389/files/38WindowedAddonRoom.jpg?v=1757336536",
  "46569870459122": "https://cdn.shopify.com/s/files/1/0626/9389/files/IMG_4723.jpg?v=1762462789",
  "46569886122226": "https://cdn.shopify.com/s/files/1/0626/9389/files/38TALLWindowedAddon.jpg?v=1762462789",
  "46569886154994": "https://cdn.shopify.com/s/files/1/0626/9389/files/48TALLWindowedAddon.jpg?v=1757336534",
  "51764621410676": "https://cdn.shopify.com/s/files/1/0626/9389/files/28x28FeedingStationAdd-OnSet-4.jpg?v=1757336515",
  "51764621443444": "https://cdn.shopify.com/s/files/1/0626/9389/files/38x38FeedingStationAdd-OnSet-5.jpg?v=1757336515",
  "51764621476212": "https://cdn.shopify.com/s/files/1/0626/9389/files/48x48FeedingStationAdd-OnSet-1.jpg?v=1757336516",
  "51764660830580": "https://cdn.shopify.com/s/files/1/0626/9389/files/TALL38x38FeedingStationAdd-OnSet-1.jpg?v=1762463323",
  "51764660863348": "https://cdn.shopify.com/s/files/1/0626/9389/files/TALL48x48FeedingStationAdd-OnSet-3.jpg?v=1757336514",
  "44460059263218": "https://cdn.shopify.com/s/files/1/0626/9389/products/AcrylicGlassdoorsetparts.jpg?v=1762459133",
  "44460059295986": "https://cdn.shopify.com/s/files/1/0626/9389/files/EZClassicTallBoxAcrylicDoorSet.jpg?v=1757336594",
  "46535234257138": "https://cdn.shopify.com/s/files/1/0626/9389/files/EZWhelp-15.jpg?v=1762462705",
  "46535234289906": "https://cdn.shopify.com/s/files/1/0626/9389/files/EZWhelp-15.jpg?v=1762462705",
  "46535234322674": "https://cdn.shopify.com/s/files/1/0626/9389/files/EZWhelp-15.jpg?v=1762462705",
  "46535234355442": "https://cdn.shopify.com/s/files/1/0626/9389/files/EZWhelp-15.jpg?v=1762462705",
  "43769299075314": "https://cdn.shopify.com/s/files/1/0626/9389/products/BWPadTop_db316f59-7c2c-490a-9d3e-0cbe623619a8.jpg?v=1762459988",
  "43769300418802": "https://cdn.shopify.com/s/files/1/0626/9389/products/BWPadTop_db316f59-7c2c-490a-9d3e-0cbe623619a8.jpg?v=1762459988",
  "43769303040242": "https://cdn.shopify.com/s/files/1/0626/9389/products/BWPadTop_db316f59-7c2c-490a-9d3e-0cbe623619a8.jpg?v=1762459988",
  "44373750087922": "https://cdn.shopify.com/s/files/1/0626/9389/products/BWPadTop_db316f59-7c2c-490a-9d3e-0cbe623619a8.jpg?v=1762459988",
  "43956779909362": "https://cdn.shopify.com/s/files/1/0626/9389/files/TractionPadTopDown.jpg?v=1762462375",
  "43956779942130": "https://cdn.shopify.com/s/files/1/0626/9389/files/TractionPadTopDown.jpg?v=1762462375",
  "43956779974898": "https://cdn.shopify.com/s/files/1/0626/9389/files/TractionPadTopDown.jpg?v=1762462375",
};

const ORIGINAL_ADD_ON_IMAGES_BY_HANDLE: Record<string, string> = {
  "whelping-kit": "https://cdn.shopify.com/s/files/1/0626/9389/products/20160423_122211.jpg?v=1762457113",
  "fab-box-corner-seat": "https://cdn.shopify.com/s/files/1/0626/9389/products/CornerSeattop.jpg?v=1762457114",
  "ezwhelp-smart-whelping-box-wifi-camera-temperature-monitoring-system": "https://cdn.shopify.com/s/files/1/0626/9389/products/Contents3.jpg?v=1762459778",
  "ezwhelp-puppy-feeding-station-modular-2-pack": "https://cdn.shopify.com/s/files/1/0626/9389/products/FeedingStation1.jpg?v=1762459525",
  "newborn-puppy-collar-set-24-pack": "https://cdn.shopify.com/s/files/1/0626/9389/products/24collarsdetail.jpg?v=1762462056",
  "heating-combo-for-classic-value-box-size-3838-or-4848": "https://cdn.shopify.com/s/files/1/0626/9389/products/HeatLampComboEZclassic.jpg?v=1762457294",
  "ezwhelp-reusable-quick-dry-pad-2-pack": "https://cdn.shopify.com/s/files/1/0626/9389/files/EZWhelp-15.jpg?v=1762462705",
  "black-white-slip-resistant-paw-print-pad-mat-2-pack": "https://cdn.shopify.com/s/files/1/0626/9389/products/BWPadTop_db316f59-7c2c-490a-9d3e-0cbe623619a8.jpg?v=1762459988",
  "ezwhelp-traction-pad": "https://cdn.shopify.com/s/files/1/0626/9389/files/TractionPadTopDown.jpg?v=1762462375",
  "acrylic-glass-door-set-for-ezclassic-whelping-boxes": "https://cdn.shopify.com/s/files/1/0626/9389/products/AcrylicGlassdoorsetparts.jpg?v=1762459133",
  "ezclassic-add-on-room": "https://cdn.shopify.com/s/files/1/0626/9389/products/28Add-onsmall.jpg?v=1762458299",
  "ezclassic-windowed-add-on-room": "https://cdn.shopify.com/s/files/1/0626/9389/files/28WindowedAddonRoom.jpg?v=1757336535",
  "ezclassic-tall-28-add-on-room-1": "https://cdn.shopify.com/s/files/1/0626/9389/products/a-Tall3838Add-On1.jpg?v=1762462438",
  "ezclassic-tall-windowed-add-on-room": "https://cdn.shopify.com/s/files/1/0626/9389/files/38TALLWindowedAddon.jpg?v=1762462789",
  "ezclassic-mess-hall-add-on-room-set-standard-18-height": "https://cdn.shopify.com/s/files/1/0626/9389/files/28x28FeedingStationAdd-OnSet-4.jpg?v=1757336515",
  "tall-ezclassic-mess-hall-add-on-room-set-tall-28-height": "https://cdn.shopify.com/s/files/1/0626/9389/files/TALL38x38FeedingStationAdd-OnSet-1.jpg?v=1762463323",
};

function resolveOriginalAddOnImage(name?: string, url?: string, existing?: string | null): string {
  const variant = url?.match(/[?&]variant=(\d+)/)?.[1];
  if (variant && ORIGINAL_ADD_ON_IMAGES_BY_VARIANT[variant]) return ORIGINAL_ADD_ON_IMAGES_BY_VARIANT[variant];
  const handle = url?.match(/\/products\/([^?/#]+)/)?.[1];
  if (handle && ORIGINAL_ADD_ON_IMAGES_BY_HANDLE[handle]) return ORIGINAL_ADD_ON_IMAGES_BY_HANDLE[handle];

  const lower = name?.toLowerCase() || "";
  if (lower.includes("quick dry")) return ORIGINAL_ADD_ON_IMAGES_BY_HANDLE["ezwhelp-reusable-quick-dry-pad-2-pack"] || "https://cdn.shopify.com/s/files/1/0626/9389/files/EZWhelp-15.jpg?v=1762462705";
  if (lower.includes("slip resistant")) return "https://cdn.shopify.com/s/files/1/0626/9389/products/BWPadTop_db316f59-7c2c-490a-9d3e-0cbe623619a8.jpg?v=1762459988";
  if (lower.includes("traction")) return "https://cdn.shopify.com/s/files/1/0626/9389/files/TractionPadTopDown.jpg?v=1762462375";
  if (lower.includes("whelping kit")) return ORIGINAL_ADD_ON_IMAGES_BY_HANDLE["whelping-kit"];
  if (lower.includes("corner seat")) return ORIGINAL_ADD_ON_IMAGES_BY_HANDLE["fab-box-corner-seat"];
  if (lower.includes("wifi") || lower.includes("camera") || lower.includes("monitor")) return ORIGINAL_ADD_ON_IMAGES_BY_HANDLE["ezwhelp-smart-whelping-box-wifi-camera-temperature-monitoring-system"];
  if (lower.includes("feeding station")) return ORIGINAL_ADD_ON_IMAGES_BY_HANDLE["ezwhelp-puppy-feeding-station-modular-2-pack"];
  if (lower.includes("collar")) return ORIGINAL_ADD_ON_IMAGES_BY_HANDLE["newborn-puppy-collar-set-24-pack"];
  if (lower.includes("heat combo")) return ORIGINAL_ADD_ON_IMAGES_BY_HANDLE["heating-combo-for-classic-value-box-size-3838-or-4848"];
  if (lower.includes("acrylic")) return ORIGINAL_ADD_ON_IMAGES_BY_HANDLE["acrylic-glass-door-set-for-ezclassic-whelping-boxes"];
  if (lower.includes("mess hall")) return ORIGINAL_ADD_ON_IMAGES_BY_HANDLE["ezclassic-mess-hall-add-on-room-set-standard-18-height"];
  if (lower.includes("windowed") && lower.includes("add-on")) return ORIGINAL_ADD_ON_IMAGES_BY_HANDLE["ezclassic-windowed-add-on-room"];
  if (lower.includes("add-on room") || lower.includes("add-on")) return ORIGINAL_ADD_ON_IMAGES_BY_HANDLE["ezclassic-add-on-room"];
  return ensureRecImage(existing, name);
}

const bundleVariantUrls: Record<string, Record<VariantKey, string>> = {
  Starter: {
    "28-18": `${PROD_BASE}/products/bundles-ezclassic-starter-set?variant=44599571775730`,
    "38-18": `${PROD_BASE}/products/bundles-ezclassic-starter-set?variant=44599571841266`,
    "38-28": `${PROD_BASE}/products/bundles-ezclassic-starter-set?variant=51622182879604`,
    "48-18": `${PROD_BASE}/products/bundles-ezclassic-starter-set?variant=44599571906802`,
    "48-28": `${PROD_BASE}/products/bundles-ezclassic-starter-set?variant=51631290777972`,
  },
  Essential: {
    "28-18": `${PROD_BASE}/products/bundles-ezclassic-basic-set?variant=44599534649586`,
    "38-18": `${PROD_BASE}/products/bundles-ezclassic-basic-set?variant=44599534682354`,
    "38-28": `${PROD_BASE}/products/bundles-ezclassic-basic-set?variant=51639406395764`,
    "48-18": `${PROD_BASE}/products/bundles-ezclassic-basic-set?variant=44599534715122`,
    "48-28": `${PROD_BASE}/products/bundles-ezclassic-basic-set?variant=51639406461300`,
  },
  Pro: {
    "28-18": `${PROD_BASE}/products/copy-of-bundles-ezclassic-pro-set?variant=44599577542898`,
    "38-18": `${PROD_BASE}/products/copy-of-bundles-ezclassic-pro-set?variant=44599577608434`,
    "38-28": `${PROD_BASE}/products/copy-of-bundles-ezclassic-pro-set?variant=51639434019188`,
    "48-18": `${PROD_BASE}/products/copy-of-bundles-ezclassic-pro-set?variant=44599577673970`,
    "48-28": `${PROD_BASE}/products/copy-of-bundles-ezclassic-pro-set?variant=51639434084724`,
  },
  Elite: {
    "28-18": `${PROD_BASE}/products/bundles-ezclassic-elite-set?variant=44599584555250`,
    "38-18": `${PROD_BASE}/products/bundles-ezclassic-elite-set?variant=44599584620786`,
    "38-28": `${PROD_BASE}/products/bundles-ezclassic-elite-set?variant=51639459447156`,
    "48-18": `${PROD_BASE}/products/bundles-ezclassic-elite-set?variant=44599584686322`,
    "48-28": `${PROD_BASE}/products/bundles-ezclassic-elite-set?variant=51639459512692`,
  },
  "Play Yard": {
    "28-18": `${PROD_BASE}/products/bundles-ezclassic-play-yard-set?variant=44622308835570`,
    "38-18": `${PROD_BASE}/products/bundles-ezclassic-play-yard-set?variant=44622308901106`,
    "48-18": `${PROD_BASE}/products/bundles-ezclassic-play-yard-set?variant=44622308966642`,
  },
  Condo: {
    "28-18": `${PROD_BASE}/products/ezclassic-condo-bundle?variant=51849455403380`,
    "38-18": `${PROD_BASE}/products/ezclassic-condo-bundle?variant=51849455436148`,
    "38-28": `${PROD_BASE}/products/ezclassic-condo-bundle?variant=51849455501684`,
    "48-18": `${PROD_BASE}/products/ezclassic-condo-bundle?variant=51849455468916`,
    "48-28": `${PROD_BASE}/products/ezclassic-condo-bundle?variant=51849455534452`,
    "48-28-xl": `${PROD_BASE}/products/ezclassic-condo-bundle?variant=54325883732340`,
  },
};

// XL/Giant (90+ lbs) bundle URLs — all TALL 48"x76"x28". Live variants now
// exist for every outcome, so XL is a normal buyable path (no more Custom
// Inquiry). Play Yard is the only one that splits on the window answer.
// Mirrors the backend resolveXLBundleUrl; used only as the local/offline
// fallback since online the backend supplies shopify_cart_url.
const xlBundleUrls: Record<string, string | { window: string; solid: string }> = {
  Starter:     `${PROD_BASE}/products/bundles-ezclassic-starter-set?variant=54815127732596`,
  Essential:   `${PROD_BASE}/products/bundles-ezclassic-basic-set?variant=54815292293492`,
  Elite:       `${PROD_BASE}/products/bundles-ezclassic-elite-set?variant=54815248777588`,
  Pro:         `${PROD_BASE}/products/copy-of-bundles-ezclassic-pro-set?variant=54814982308212`,
  Condo:       `${PROD_BASE}/products/ezclassic-condo-bundle?variant=54325883732340`,
  "Play Yard": {
    window: `${PROD_BASE}/products/bundles-ezclassic-play-yard-set?variant=54818236694900`,
    solid:  `${PROD_BASE}/products/bundles-ezclassic-play-yard-set?variant=54818236662132`,
  },
};

function resolveXLBundleUrl(bundle: string, hasWindow?: string | null): string {
  const entry = xlBundleUrls[bundle];
  if (!entry) return "#";
  if (typeof entry === "string") return entry;
  const isWindow = hasWindow === "yes" || hasWindow === "true";
  return isWindow ? entry.window : entry.solid;
}

function getBundleUrl(
  bundle: string,
  boxSize: string,
  panelHeight: string,
  isXL?: boolean,
  hasWindow?: string | null,
): string {
  // XL/Giant: every outcome now has a live variant. Play Yard splits on window.
  if (isXL) {
    return resolveXLBundleUrl(bundle, hasWindow);
  }
  const key = `${boxSize}-${panelHeight}`;
  return bundleVariantUrls[bundle]?.[key] || bundleVariantUrls[bundle]?.["28-18"] || "#";
}

const bundleDescriptions: Record<string, string> = {
  Starter: "Everything you need to get started — a safe, warm, and comfortable space for your dog and her puppies.",
  Essential: "A complete starter setup plus breeder essentials — added tools, ID collars, and comfort for smoother, more confident litters.",
  Pro: "Built for growing litters — extra space, a feeding station, and enhanced hygiene so you can focus on what matters most.",
  Elite: "Our most complete setup — smart monitoring, safety upgrades, and full breeder support for total control and peace of mind.",
  Condo: "A structured multi-zone system with dedicated areas for rest, feeding, and movement — designed for organized, efficient whelping.",
  "Play Yard": "A flexible, expandable setup built for space and movement — ideal for active puppies and larger whelping environments.",
};

const bundleIncludesList: Record<string, string[]> = {
  Starter: ["Whelping box (rails, pad, liner)", "1 extra whelping pad", "Heat combo"],
  Essential: ["Whelping box (rails, pad, liner)", "1 extra whelping pad", "Heat combo", "Whelping kit", "Puppy collar set (24)", "Corner seat"],
  Pro: ["Whelping box (rails, pad, liner)", "2 whelping pads", "Heat combo", "Add-on room", "Combo liner (box + add-on)", "Whelping kit + collar set", "Corner seat + feeding station"],
  // Elite: "+ traction pad" removed per Arya's XL-Core-Bundles reference (2026-07-10) — no bundle at any size ships a traction pad.
  Elite: ["Whelping box (rails, pad, liner)", "3 whelping pads", "Heat combo", "Add-on room + combo liner", "Whelping kit + collar set", "Corner seat + 2 feeding stations", "Acrylic door", "WiFi camera + temperature monitor"],
  // Condo/Play Yard: "2 whelping pads" -> "1 extra whelping pad" per the same reference — 2 pads ship TOTAL, one is already counted in the "Whelping box" line.
  Condo: ["Whelping box (rails, pad, liner)", "1 extra whelping pad", "Heat combo", "Windowed room + mess hall", "Extra connector"],
  "Play Yard": ["Whelping box (rails, pad, liner)", "1 extra whelping pad", "2 add-on rooms", "Extra connector"],
};

// ===== Gate question — question → buttons → video (buttons always visible) =====

const GateQuestionCard: React.FC<{
  step: QuizStep;
  value: string | null;
  onSelect: (val: string) => void;
}> = ({ step, value, onSelect }) => (
  <div className="flex flex-col items-center">
    {/* Question — with ref for auto-scroll */}
    <h2
      id="gate-question"
      className="text-[24px] md:text-[40px] lg:text-[48px] font-display font-black text-center leading-[1.08] mb-3 md:mb-5"
      style={{ color: '#2D2316' }}
    >
      {step.question}
    </h2>

    {/* Soft, premium hint — calm and inviting */}
    <p
      className="text-center mb-4 md:mb-5 font-display font-semibold text-xs md:text-sm"
      style={{ color: '#A08968', letterSpacing: '0.02em' }}
    >
      Choose your path to begin
    </p>

    {/* Two path tiles — calm, premium, clearly differentiated by color + icon */}
    <div
      role="radiogroup"
      aria-labelledby="gate-question"
      className="w-full max-w-md mx-auto space-y-4 md:space-y-3 px-2"
    >
      {step.options?.map((opt, i) => {
        const isNew = opt.value === "no";
        const isSelected = value === opt.value;
        const accent = isNew ? '#D46A3A' : '#3E5C4A';
        const accentSoft = isNew ? '#F4A57A' : '#7FA08C';
        const tileBg = isNew ? '#FFF6EC' : '#EFF3EE';
        const selectedBg = isNew ? '#FFE9D5' : '#DCE6DD';
        const Icon = isNew ? PawPrint : Wrench;
        const badge = isNew ? 'NEW SETUP' : 'ADD-ONS';
        const showPointer = !value;
        return (
          <div key={opt.value} className="relative">
            {/* External "tap me" pointer — sits OUTSIDE the tile, gently nudges toward it */}
            {showPointer && (
              <motion.div
                aria-hidden="true"
                className="hidden sm:flex absolute top-1/2 -translate-y-1/2 items-center justify-center pointer-events-none"
                style={{
                  left: '-46px',
                  width: '34px',
                  height: '34px',
                  borderRadius: '999px',
                  background: `linear-gradient(135deg, ${accent} 0%, ${accentSoft} 100%)`,
                  boxShadow: `0 6px 16px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.35)`,
                }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: [0, 8, 0] }}
                transition={{
                  opacity: { duration: 0.4, delay: 0.3 + i * 0.1 },
                  x: { duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.35 },
                }}
              >
                <ChevronRight className="w-5 h-5" style={{ color: '#FFFBF6' }} strokeWidth={3} />
              </motion.div>
            )}
          <motion.button
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${badge}: ${opt.label}. ${opt.description}${isSelected ? '. Currently selected.' : ''}`}
            onClick={() => {
              playSelect();
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                try { navigator.vibrate(12); } catch { /* ignore */ }
              }
              onSelect(opt.value);
            }}
            onMouseEnter={() => playHover()}
            initial={{ opacity: 0, y: 12 }}
            animate={
              isSelected
                ? { opacity: 1, y: 0, scale: [1, 1.04, 0.98, 1] }
                : value
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 1, y: [0, -4, 0], scale: [1, 1.015, 1] }
            }
            transition={
              isSelected
                ? { scale: { duration: 0.42, times: [0, 0.35, 0.65, 1], ease: [0.34, 1.56, 0.64, 1] } }
                : value
                  ? { delay: 0.15 + i * 0.08, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }
                  : { y: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }, scale: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 } }
            }
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="path-tile relative w-full cursor-pointer flex flex-col items-center text-center touch-manipulation select-none active:opacity-95"
            style={{
              borderRadius: '22px',
              // Larger touch surface on mobile; tighter on desktop
              padding: isSelected ? '40px 22px 30px' : '28px 22px 30px',
              minHeight: '168px',
              WebkitTapHighlightColor: 'transparent',
              ['--tile-accent' as any]: accent,
              background: isSelected ? selectedBg : tileBg,
              border: `${isSelected ? '2px' : '1.5px'} solid ${isSelected ? accent : accentSoft + '99'}`,
              boxShadow: isSelected
                ? `0 0 0 4px ${accent}22, 0 8px 22px ${accent}38`
                : `0 2px 6px ${accent}15`,
              transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.25s ease, padding 0.2s ease',
              lineHeight: 1.3,
            }}
          >
            {/* "Selected" pill — anchored top-center, never overlaps content */}
            {isSelected && (
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.6, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 font-display font-bold text-[9px] tracking-wider whitespace-nowrap"
                style={{
                  top: '-10px',
                  background: accent,
                  color: '#FFFBF6',
                  borderRadius: '999px',
                  padding: '4px 10px 4px 7px',
                  letterSpacing: '0.08em',
                  lineHeight: 1,
                  boxShadow: `0 4px 10px ${accent}66`,
                  border: '2px solid #FFFBF6',
                }}
              >
                <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
                SELECTED
              </motion.div>
            )}
            {/* Highlighted badge — replaces the icon medallion. Solid pill in
                the path's accent color so the category reads instantly. */}
            <span
              aria-hidden="true"
              className="inline-block font-display font-black text-[13px] md:text-[15px] tracking-wider"
              style={{
                background: accent,
                color: '#FFFBF6',
                padding: '8px 18px',
                borderRadius: '999px',
                letterSpacing: '0.14em',
                lineHeight: 1.2,
                marginBottom: '12px',
                boxShadow: `0 6px 18px ${accent}66, inset 0 1px 0 rgba(255,255,255,0.25)`,
                textShadow: '0 1px 1px rgba(0,0,0,0.12)',
              }}
            >
              {badge}
            </span>

            <span
              className="block font-display font-black text-[15px] md:text-base"
              style={{ color: '#2D2316', lineHeight: 1.2 }}
            >
              {opt.label}
            </span>
            <span
              className="block text-[12px] md:text-[13px] font-medium max-w-[240px]"
              style={{ color: '#6B5B4A', lineHeight: 1.35, marginTop: '2px' }}
            >
              {opt.description}
            </span>
          </motion.button>
          </div>
        );
      })}
    </div>
  </div>
);




// ===== Reusable sub-components =====

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="w-full mb-3 md:mb-6">
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: '12px',
        borderRadius: '20px',
        background: '#E5D8C8',
        boxShadow: 'inset 0px 3px 5px rgba(0,0,0,0.12), inset 0px -2px 4px rgba(255,255,255,0.5)',
      }}
    >
      <motion.div
        className="h-full relative"
        style={{
          background: 'linear-gradient(180deg, #E8944A, #D46A3A)',
          borderRadius: '20px',
          boxShadow: '0px 2px 4px rgba(180,90,40,0.25), inset 0px 1px 2px rgba(255,255,255,0.3)',
        }}
        initial={false}
        animate={{ width: `${(current / total) * 100}%` }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
      </motion.div>
    </div>
  </div>
);

const GuidanceText = React.forwardRef<HTMLParagraphElement, { text?: string }>(({ text }, ref) =>
  text ? (
    <p ref={ref} className="text-xs text-muted-foreground font-medium text-center mt-4 px-2">💡 {text}</p>
  ) : null
);
GuidanceText.displayName = "GuidanceText";

const QuestionCard: React.FC<{
  step: QuizStep;
  value: string | null;
  onSelect: (val: string) => void;
  textValue?: string;
  onTextChange?: (val: string) => void;
  dateValue?: string;
  onDateChange?: (val: string) => void;
  emailValue?: string;
  onEmailChange?: (val: string) => void;
  breedValue?: string;
  onBreedChange?: (val: string) => void;
  onNext?: () => void;
  recommendation?: { value: string; reason: string; badgeLabel?: string } | null;
  recommendationSet?: SmartRecommendationSet | null;
  storedBreed?: string;
}> = ({ step, value, onSelect, textValue, onTextChange, dateValue, onDateChange, emailValue, onEmailChange, breedValue, onBreedChange, onNext, recommendation, recommendationSet, storedBreed }) => {
  // Build a map of value → recommendation info for multi-recommendation support
  const recsMap = useMemo(() => {
    const map = new Map<string, { badgeLabel: string; reason: string }>();
    if (recommendationSet) {
      map.set(recommendationSet.primary.value, {
        badgeLabel: recommendationSet.primary.badgeLabel || "Best fit",
        reason: recommendationSet.primary.reason,
      });
      if (recommendationSet.secondary) {
        map.set(recommendationSet.secondary.value, {
          badgeLabel: recommendationSet.secondary.badgeLabel || "Also fits",
          reason: recommendationSet.secondary.reason,
        });
      }
      if (recommendationSet.tertiary) {
        map.set(recommendationSet.tertiary.value, {
          badgeLabel: recommendationSet.tertiary.badgeLabel || "Oversized option",
          reason: recommendationSet.tertiary.reason,
        });
      }
    } else if (recommendation) {
      map.set(recommendation.value, {
        badgeLabel: recommendation.badgeLabel || "Best fit",
        reason: recommendation.reason,
      });
    }
    return map;
  }, [recommendation, recommendationSet]);

  // Compute visible options and dynamic heading for damSize
  const visibleOptions = useMemo(() => {
    if (step.type !== "select" || !step.options) return step.options || [];
    if (step.id === "damSize" && recsMap.size > 0) {
      return step.options.filter(opt => recsMap.has(opt.value));
    }
    return step.options;
  }, [step, recsMap]);

  const displayQuestion = useMemo(() => {
    if (step.id === "damSize" && recsMap.size > 0) {
      if (visibleOptions.length === 1) return "Confirm your dam's size";
      return "Select your dam's size";
    }
    return step.question;
  }, [step, recsMap, visibleOptions]);

  return (
  <div key={step.id} className={`storybook-question-content ${step.type === "breed" ? "storybook-breed-question" : ""}`}>
    
    <h2 className="text-[20px] md:text-[34px] lg:text-[38px] font-display font-black text-center leading-tight mb-1 md:mb-3" style={{ color: '#2D2316' }}>{displayQuestion}</h2>
    {step.subtitle && <p className="storybook-question-subtitle text-center mb-4 md:mb-6 font-bold text-xs md:text-base" style={{ color: '#6B5B4A' }}>{step.subtitle}</p>}
    {!step.subtitle && <div className="mb-4 md:mb-6" />}

    {step.type === "select" && step.options && (() => {
        return (
      <div className={`grid gap-2.5 md:gap-3 ${visibleOptions.length === 1 ? "grid-cols-1 max-w-sm mx-auto" : visibleOptions.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : visibleOptions.length <= 4 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
        {visibleOptions.map((opt, i) => {
          const isSelected = value === opt.value;
          const recInfo = recsMap.get(opt.value);
          const isRecommended = !!recInfo;
          const isPrimary = recommendationSet?.primary.value === opt.value;
          const accent = isPrimary ? '#B8860B' : isRecommended ? '#7B6B3A' : '#D46A3A';
          return (
            <motion.button
              key={opt.value}
              onClick={() => { playSelect(); onSelect(opt.value); }}
              onMouseEnter={() => playHover()}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              className={`duo-option ${isSelected ? "duo-option-selected" : ""} ${isRecommended ? "duo-option-recommended" : ""}`}
              style={{ '--pill-accent': accent, '--nudge-delay': `${i * 0.6}s` } as React.CSSProperties}
            >
              <div className="flex-1 min-w-0">
                {isRecommended && recInfo && (
                  <span className="inline-flex items-center gap-1 text-[10px] md:text-[11px] font-black uppercase tracking-wide mb-1 px-2 py-0.5 rounded-full"
                    style={{
                      background: isPrimary
                        ? 'linear-gradient(135deg, #FFF3E0, #FFE0B2)'
                        : 'linear-gradient(135deg, #F5F0E0, #E8E0C8)',
                      color: isPrimary ? '#8B6914' : '#6B5B3A',
                      border: `1px solid ${isPrimary ? '#E8C9A0' : '#D4C9A8'}`,
                    }}>
                    <Award className="w-3 h-3" /> {recInfo.badgeLabel}
                  </span>
                )}
                <span className="font-display font-extrabold text-sm md:text-base lg:text-lg text-left block leading-tight" style={{ color: '#2D2316' }}>{opt.label}</span>
                {opt.description && <span className="text-xs md:text-sm font-semibold block leading-snug mt-0.5" style={{ color: '#6B5B4A' }}>{opt.description}</span>}
                {isRecommended && recInfo && (
                  <span className="text-[10px] md:text-[11px] font-semibold block mt-1 italic" style={{ color: '#A08968' }}>
                    {recInfo.reason}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center"
                    style={{ background: accent }}
                  >
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
        );
      })()}


    {step.type === "text" && (
      <div className="storybook-field max-w-md mx-auto">
        <Input
          autoFocus
          placeholder="e.g., Golden Retriever"
          value={textValue || ""}
          onChange={(e) => { onTextChange?.(e.target.value); playTypeTick(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && textValue?.trim()) onNext?.(); }}
          className="text-center text-base md:text-lg h-12 md:h-14 rounded-2xl border font-bold bg-card focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          style={{ borderColor: '#D46A3A' }}
        />
        
      </div>
    )}

    {step.type === "date" && (
      <div className="storybook-field max-w-xs mx-auto">
        <Input
          type="date"
          min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)}
          value={dateValue || ""}
          onChange={(e) => onDateChange?.(e.target.value)}
          className="text-center text-base md:text-lg h-12 md:h-14 rounded-2xl border-2 font-bold focus:border-primary bg-card"
        />
      </div>
    )}

    {step.type === "email" && (
      <div className="storybook-field max-w-md mx-auto">
        <Input
          autoFocus
          type="email"
          placeholder="you@example.com"
          value={emailValue || ""}
          onChange={(e) => { onEmailChange?.(e.target.value); playTypeTick(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && emailValue && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) onNext?.(); }}
          className="text-center text-base md:text-lg h-12 md:h-14 rounded-2xl border font-bold bg-card focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          style={{ borderColor: '#D46A3A' }}
        />
      </div>
    )}

    {step.type === "breed" && (
      <BreedSelector
        value={breedValue || ""}
        onChange={(val) => onBreedChange?.(val)}
        onNext={onNext}
      />
    )}

    {step.type === "boxConfig" && (
      <BoxConfigSelector
        value={value || ""}
        onChange={(val) => onSelect(val)}
        onNext={onNext}
        breed={storedBreed}
      />
    )}
    <GuidanceText text={step.guidance} />
  </div>
  );
};

// ===== MAIN QUIZ COMPONENT =====

const EZWhelpQuiz: React.FC<{ onQuizStarted?: (started: boolean) => void; onQuizComplete?: (complete: boolean) => void; onPuppyProgress?: (count: number) => void; onSceneChange?: (scene: MeadowScene) => void }> = ({ onQuizStarted, onQuizComplete, onPuppyProgress, onSceneChange }) => {
  const [customerType, setCustomerType] = useState<CustomerType>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [showMoreAddOns, setShowMoreAddOns] = useState(false);
  
  const [gateAnswered, setGateAnswered] = useState(false);
  const [soundMuted, setSoundMuted] = useState(isMuted());

  const [newData, setNewData] = useState<NewCustomerData>({
    timeline: null, dueDate: null, breed: "", experience: null,
    litterSize: null, containment: null,
    zones: null, branchAnswer: null, damSize: null, panelHeight: null,
    hasWindow: null,
  });

  const [existingData, setExistingData] = useState<ExistingCustomerData>({
    breed: "", damSize: null, experience: null,
    boxSize: null, boxHeight: null, hasWindow: null, stage: null, dueDate: null,
  });

   const [selectedValue, setSelectedValue] = useState<string | null>(null);
   const [textValue, setTextValue] = useState("");
   const [dateValue, setDateValue] = useState("");
   const [emailValue, setEmailValue] = useState("");
   const [breedValue, setBreedValue] = useState("");
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Backend API state
  const [apiLoading, setApiLoading] = useState(false);
  // apiError state removed: page always renders from local fallback, banner was misleading. Errors log via console.error.
  const [path1Result, setPath1Result] = useState<Path1Response | null>(null);
  const [path2Result, setPath2Result] = useState<Path2Response | null>(null);

  // Cart review state
  const [showCartReview, setShowCartReview] = useState(false);
  const [cartReviewItems, setCartReviewItems] = useState<CartReviewItem[]>([]);
  const [cartReviewHeading, setCartReviewHeading] = useState<string>("Review Your Cart");
  const [cartReviewSubheading, setCartReviewSubheading] = useState<string>(
    "Uncheck anything you don't need before heading to checkout."
  );

  const openCartReview = useCallback(
    (items: CartReviewItem[], heading?: string, subheading?: string) => {
      playButtonClick();
      setCartReviewItems(items);
      if (heading) setCartReviewHeading(heading);
      if (subheading) setCartReviewSubheading(subheading);
      setShowCartReview(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    []
  );

  const closeCartReview = useCallback(() => {
    setShowCartReview(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const newCustomerStepList = useMemo((): QuizStep[] => {
    const steps: QuizStep[] = [];
    for (const step of newCustomerDataSteps) {
      if (step.showIf && !step.showIf(newData)) continue;
      steps.push(step);
    }

    // Containment question: only for Medium and Large dogs (not Small, not XL/Giant)
    const isMediumOrLarge = newData.damSize === "16_40" || newData.damSize === "40_90";
    if (isMediumOrLarge) {
      steps.push(containmentStep);
    }

    steps.push(spaceSetupStep);
    if (newData.zones === 1) steps.push(step2AQuestion);
    else if (newData.zones === 2) steps.push(step2BQuestion);
    else if (newData.zones === 3) steps.push(step2CQuestion);
    const isPlayYard = newData.zones === 3 && newData.branchAnswer === false;
    // Panel height is now determined by containment answer for medium/large,
    // so we no longer show the explicit panel height question for them.
    // Only show panelHeight if medium/large AND containment not answered yet (fallback, shouldn't happen)
    const breedRec = newData.breed ? getBreedRecommendation(newData.breed) : null;
    const isTallRequired = breedRec?.panelHeight === "tall_only";
    // Skip panelHeight step entirely — containment now drives height for medium/large
    const askPanelHeight = false;
    if (askPanelHeight) steps.push(panelHeightStep);
    // XL/Giant asks the window question for every outcome (only Play Yard's
    // Window-vs-Solid routing uses it, but the answer is stored for all).
    if (newData.damSize === "over_90") steps.push(windowStep);
    steps.push(emailStep);
    return steps;
  }, [newData.timeline, newData.zones, newData.branchAnswer, newData.damSize, newData.breed, newData.containment]);

  const existingStepList = useMemo((): QuizStep[] => {
    const steps: QuizStep[] = [...existingCustomerDataSteps].filter((step) => step.id !== "damSize");
    for (const step of existingCustomerBoxSteps) {
      if (step.showIf && !step.showIf(existingData)) continue;
      steps.push(step);
    }
    steps.push(emailStep);
    return steps;
  }, [existingData.stage]);

  const steps = !gateAnswered ? [gateStep] : customerType === "new" ? newCustomerStepList : existingStepList;
  const totalSteps = gateAnswered ? steps.length + 1 : 1;
  const globalStep = gateAnswered ? currentStep + 2 : 1;
  useEffect(() => {
    onPuppyProgress?.(gateAnswered ? currentStep + 1 + (isComplete ? 1 : 0) : 0);
  }, [gateAnswered, currentStep, isComplete, onPuppyProgress]);
  const currentQuizStep = steps[currentStep];
  useEffect(() => {
    onQuizComplete?.(isComplete);
  }, [isComplete, onQuizComplete]);

  useEffect(() => {
    onSceneChange?.(getMeadowScene(gateAnswered ? customerType : null, newData, existingData, isComplete));
  }, [customerType, gateAnswered, newData, existingData, isComplete, onSceneChange]);

  // If step list shrank (e.g. panelHeight removed when under_25), auto-complete
  useEffect(() => {
    if (gateAnswered && !isComplete && currentStep >= steps.length && steps.length > 0) {
      playCelebration();
      setIsComplete(true);
    }
  }, [currentStep, steps.length, gateAnswered, isComplete]);



  const getStoredValue = useCallback((stepId: string): string | null => {
    if (stepId === "ownsBox") return customerType === "new" ? "no" : customerType === "existing" ? "yes" : null;
    if (customerType === "new" || !gateAnswered) {
      const val = (newData as any)[stepId];
      if (val === null || val === undefined) return null;
      if (typeof val === "boolean") return val ? "true" : "false";
      return String(val);
    } else {
      const val = (existingData as any)[stepId];
      if (val === null || val === undefined) return null;
      return String(val);
    }
  }, [customerType, gateAnswered, newData, existingData]);

  const storeAnswer = useCallback((stepId: string, value: string) => {
    if (stepId === "ownsBox") {
      const path = value === "yes" ? "existing" : "new";
      setCustomerType(path === "existing" ? "existing" : "new");
      setGateAnswered(true);
      onQuizStarted?.(true);
      setCurrentStep(0);
      setSelectedValue(null);
      setTextValue("");
      setDateValue("");
      // Start backend quiz session (fire-and-forget)
      initQuizSession(path);
      trackAnswer("ownsBox", value);
      return;
    }

    // Track every answer to backend
    trackAnswer(stepId, value);

    if (customerType === "new") {
      setNewData((prev) => {
        const updated = { ...prev };
        switch (stepId) {
          case "timeline": updated.timeline = value as any; break;
          case "dueDate": updated.dueDate = value || null; break;
          case "breed": {
            updated.breed = value;
            // Auto-set panel height for tall-required breeds
            const breedRec = value ? getBreedRecommendation(value) : null;
            if (breedRec?.panelHeight === "tall_only") {
              updated.panelHeight = "28";
            }
            break;
          }
          case "experience": updated.experience = value as any; break;
          case "litterSize": updated.litterSize = value as any; break;
          case "containment": {
            updated.containment = value as any;
            // Auto-set panel height based on containment for medium/large
            if (updated.damSize === "16_40" || updated.damSize === "40_90") {
              updated.panelHeight = value === "active" ? "28" : "18";
            }
            break;
          }
          case "zones": updated.zones = parseInt(value) as any; updated.branchAnswer = null; break;
          case "branchAnswer": updated.branchAnswer = value === "true"; break;
          case "damSize": {
            updated.damSize = value as any;
            const breedRecForDam = updated.breed ? getBreedRecommendation(updated.breed) : null;
            if (breedRecForDam?.panelHeight === "tall_only") {
              // Tall-required breed → always 28" panels regardless of weight
              updated.panelHeight = "28";
            } else if (value === "under_16") {
              updated.panelHeight = "18";
            } else if (value === "over_90") {
              updated.panelHeight = "28";
            } else {
              updated.panelHeight = null;
            }
            break;
          }
          case "panelHeight": updated.panelHeight = value as any; break;
          case "hasWindow": updated.hasWindow = value as any; break;
        }
        return updated;
      });
    } else {
      setExistingData((prev) => {
        const updated = { ...prev };
        switch (stepId) {
          case "breed": updated.breed = value; break;
          case "experience": updated.experience = value as any; break;
          case "boxConfig": {
            const [size, height, window] = value.split("-");
            updated.boxSize = size as any;
            updated.boxHeight = height as any;
            updated.hasWindow = window as any;
            break;
          }
          case "stage": updated.stage = value as any; break;
          case "dueDate": updated.dueDate = value || null; break;
        }
        return updated;
      });
    }
  }, [customerType]);

  const selectedValueRef = useRef<string | null>(null);

const handleNext = useCallback((overrideVal?: string) => {
  if (!currentQuizStep) return;
  const stepId = currentQuizStep.id;
  const isText = currentQuizStep.type === "text";
  const isDate = currentQuizStep.type === "date";
  const isBreed = currentQuizStep.type === "breed";
  const val = overrideVal ?? (isText ? textValue : isDate ? dateValue : isBreed ? breedValue : currentQuizStep.type === "email" ? emailValue : selectedValueRef.current);

  if (!val && !currentQuizStep.optional) return;

  storeAnswer(stepId, val || "");

  if (stepId === "ownsBox") return;

  // Only clear fields if we are moving to another question (not the final submission)
  if (currentStep < steps.length - 1) {
    setSelectedValue(null);
    selectedValueRef.current = null;
    setTextValue("");
    setDateValue("");
    setEmailValue("");
    setBreedValue("");
  }

  if (currentStep < steps.length - 1) {
    const nextIdx = currentStep + 1;
    if (nextIdx === Math.floor(steps.length / 2)) {
      playMilestone();
    } else {
      playNext();
    }
    setDirection(1);
    setCurrentStep((s) => s + 1);
    const nextStep = steps[currentStep + 1];
    if (nextStep) {
      const stored = getStoredValue(nextStep.id);
      if (stored && nextStep.type === "select") { setSelectedValue(stored); selectedValueRef.current = stored; }
      if (stored && nextStep.type === "text") setTextValue(stored);
      if (stored && nextStep.type === "date") setDateValue(stored);
      if (stored && nextStep.type === "email") setEmailValue(stored);
      if (stored && nextStep.type === "breed") setBreedValue(stored);
    }
  } else {
    // FINAL STEP – submit to backend
    playCelebration();
    setIsComplete(true);
    setApiLoading(true);
    trackSubmit(emailValue || undefined);

    if (customerType === "new") {
      const localResult = computeFullResult(newData);
      const localBundle = localResult.bundle;
      const isXL = newData.damSize === "over_90";
      submitPath1({
        email: emailValue || "",   // ✅ emailValue is still intact
        breed: newData.breed,
        dam_size: newData.damSize || "",
        zones: newData.zones,
        feature: newData.branchAnswer,
        containment: newData.containment,
        // Klaviyo-only mirroring fields — don't affect routing. Pass everything
        // we have so backend can populate email merge tags.
        panel_height: newData.panelHeight,
        timeline: newData.timeline,
        due_date: newData.dueDate,
        experience: newData.experience,
        litter_size: newData.litterSize,
        has_window: newData.hasWindow, // XL path asks this; drives Play Yard Window vs Solid
        confidence_score: null, // TODO: wire confidence-engine output here
        confidence_label: null,
        // Implicit marketing consent — submit click is the consent action.
        subscribed: true,
        accepts_marketing: true,
        consent_method: "quiz_submission",
        consent_timestamp: new Date().toISOString(),
        session_id: getSessionId(),
      })
        .then((res) => { setPath1Result(res); setApiLoading(false); })
        .catch((err) => {
          console.error("[backend] Path 1 error:", err);
          // Backend offline fallback: XL is now a normal buyable path for every
          // outcome, so serve the real pre-filled cart + let the render fall back
          // to local add-ons. Play Yard splits Window vs Solid on the window answer.
          if (isXL) {
            setPath1Result({
              bundle: localBundle,
              shopify_cart_url: resolveXLBundleUrl(localBundle, newData.hasWindow),
              suggested_addons: [],
            });
            setApiLoading(false);
            return;
          }
          // Non-XL Path 1 failure: local computeFullResult fallback in render
          // path already gives the user a complete working page (bundle, cart URL,
          // categorised add-ons). No user-facing banner needed.
          setApiLoading(false);
        });
    } else if (customerType === "existing") {
      submitPath2({
        email: emailValue || "",
        breed: existingData.breed,
        box_size: existingData.boxSize || "",
        box_height: existingData.boxHeight || "",
        has_window: existingData.hasWindow || "",
        stage: existingData.stage || "",
        // Klaviyo-only mirroring fields.
        dam_size: existingData.damSize,
        due_date: existingData.dueDate,
        experience: existingData.experience,
        // Implicit marketing consent — submit click is the consent action.
        subscribed: true,
        accepts_marketing: true,
        consent_method: "quiz_submission",
        consent_timestamp: new Date().toISOString(),
        session_id: getSessionId(),
      })
        .then((res) => { setPath2Result(res); setApiLoading(false); })
        .catch((err) => {
          console.error("[backend] Path 2 error:", err);
          // Local computeLifecycleResult fallback renders the full page — no banner.
          setApiLoading(false);
        });
    }
  }
}, [currentQuizStep, textValue, dateValue, breedValue, emailValue, currentStep, steps, storeAnswer, getStoredValue, customerType, newData, existingData]);
  const handleSelectAndAdvance = useCallback((val: string) => {
    setSelectedValue(val);
    selectedValueRef.current = val;
    // boxConfig uses toggles — don't auto-advance, user taps Next
    if (currentQuizStep?.type === "boxConfig") return;
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = setTimeout(() => {
      handleNext(val);
      autoAdvanceRef.current = null;
    }, 400);
  }, [handleNext, currentQuizStep]);

  const handleBack = useCallback(() => {
    setDirection(-1);
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      const prevStep = steps[currentStep - 1];
      if (prevStep) {
        const stored = getStoredValue(prevStep.id);
        setSelectedValue(prevStep.type === "select" ? stored : null);
        setTextValue(prevStep.type === "text" ? (stored || "") : "");
        setDateValue(prevStep.type === "date" ? (stored || "") : "");
        setBreedValue(prevStep.type === "breed" ? (stored || "") : "");
      }
    } else if (gateAnswered) {
      setGateAnswered(false);
      onQuizStarted?.(false);
      setCurrentStep(0);
      const stored = getStoredValue("ownsBox");
      setSelectedValue(stored);
      setTextValue("");
      setDateValue("");
    }
  }, [currentStep, steps, getStoredValue, gateAnswered]);

  const handleRestart = useCallback(() => {
    setCustomerType(null);
    setGateAnswered(false);
    onQuizStarted?.(false);
    setCurrentStep(0);
    setIsComplete(false);
    setSelectedValue(null);
    setTextValue("");
    setDateValue("");
    setEmailValue("");
    setBreedValue("");
    setShowMoreAddOns(false);
    setPath1Result(null);
    setPath2Result(null);
    setApiLoading(false);

    resetTracking();
    setNewData({ timeline: null, dueDate: null, breed: "", experience: null, litterSize: null, containment: null, zones: null, branchAnswer: null, damSize: null, panelHeight: null, hasWindow: null });
    setExistingData({ breed: "", damSize: null, experience: null, boxSize: null, boxHeight: null, hasWindow: null, stage: null, dueDate: null });
  }, []);

  const canProceed = currentQuizStep?.optional || (
    currentQuizStep?.type === "select" ? !!selectedValue :
    currentQuizStep?.type === "text" ? textValue.trim().length > 0 :
    currentQuizStep?.type === "date" ? !!dateValue :
    currentQuizStep?.type === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue) :
    currentQuizStep?.type === "breed" ? breedValue.trim().length > 0 :
    currentQuizStep?.type === "boxConfig" ? !!selectedValue && selectedValue.split("-").length === 3 : false
  );

  const isFirstStep = !gateAnswered && currentStep === 0;
  const isLastStep = gateAnswered && currentStep === steps.length - 1;

  // Auto-scroll to question after 3 seconds on gate step
  useEffect(() => {
    if (isFirstStep) {
      const timer = setTimeout(() => {
        const el = document.getElementById("gate-question");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isFirstStep]);

  // Paw celebration state
  const [celebrationDone, setCelebrationDone] = useState(false);
  const handleCelebrationComplete = useCallback(() => { setCelebrationDone(true); playWhoosh(); }, []);

  // Reset celebration when quiz restarts; scroll to top when results appear
  useEffect(() => {
    if (!isComplete) setCelebrationDone(false);
    if (isComplete) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isComplete]);

  // Also scroll to top when celebration finishes and results are revealed
  useEffect(() => {
    if (celebrationDone && isComplete) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [celebrationDone, isComplete]);

  // ===== XL/Giant flag removed =====
  // Bundle/cart_url should never be swapped on the frontend based on damSize.
  // XL handling will be driven by backend response flags (e.g. requires_custom_inquiry).

  // Cart Review intercept — shown when user clicks a checkout CTA on results
  if (isComplete && showCartReview) {
    return (
      <CartReviewScreen
        items={cartReviewItems}
        heading={cartReviewHeading}
        subheading={cartReviewSubheading}
        onBack={closeCartReview}
      />
    );
  }

  // ===== RESULTS: Custom Inquiry (backend-driven, e.g. XL non-Condo) =====
  // Trigger is OWNED BY THE BACKEND via `requires_custom_inquiry: true`.
  // Frontend never decides this from damSize alone.
  if (isComplete && customerType === "new" && path1Result?.requires_custom_inquiry) {
    const inquiryBundle = path1Result.bundle || "Bundle";

    return (
      <>
        {!celebrationDone && <PawCelebration onComplete={handleCelebrationComplete} />}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: celebrationDone ? 1 : 0, y: celebrationDone ? 0 : 20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-5xl mx-auto px-3 md:px-6 pt-4 md:pt-8 pb-16"
        >
          {/* Logo */}
          <div className="flex justify-center mb-5 md:mb-7">
            <a href="https://www.ezwhelp.com/" target="_blank" rel="noopener noreferrer">
              <img src={ezwhelpLogo} alt="EZWhelp" className="h-8 md:h-10 object-contain opacity-50" />
            </a>
          </div>

          {/* HERO — Image + headline overlay */}
          <div
            className="duo-card overflow-hidden mb-5 md:mb-6 relative"
            style={{ boxShadow: '0 20px 50px -12px rgba(212,106,58,0.30), 0 8px 20px rgba(45,35,22,0.08)' }}
          >
            <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden">
              <img
                src={xlCustomBundleHero}
                alt="EZWhelp 48x76 XL custom whelping setup with chocolate Labrador and litter"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Soft gradient wash for legibility */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(253,240,231,0.10) 0%, rgba(253,240,231,0.55) 65%, rgba(253,240,231,0.92) 100%)',
                }}
              />
              {/* Trust pill — top */}
              <div className="absolute top-3 md:top-5 left-1/2 -translate-x-1/2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-display font-black uppercase tracking-wider"
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    color: '#B85528',
                    boxShadow: '0 4px 14px rgba(45,35,22,0.12)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <Award className="w-3 h-3 md:w-3.5 md:h-3.5" /> Custom XL Build · Concierge Service
                </span>
              </div>
              {/* Headline overlay — bottom */}
              <div className="absolute inset-x-0 bottom-0 px-5 md:px-10 pb-5 md:pb-8 text-center">
                <h1
                  className="text-2xl md:text-4xl lg:text-5xl font-display font-black leading-tight mb-2 md:mb-3"
                  style={{ color: '#2D2316', textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}
                >
                  Thank you for your request.
                </h1>
                <p
                  className="text-sm md:text-lg font-medium max-w-2xl mx-auto"
                  style={{ color: '#5A4A3A' }}
                >
                  Our support team will reach out shortly to design your custom <strong style={{ color: '#B85528' }}>{inquiryBundle}</strong> bundle, sized for giant breeds.
                </p>
              </div>
            </div>
          </div>

          {/* Contact card */}
          <div
            className="duo-card p-5 md:p-6 mb-5"
            style={{ background: 'linear-gradient(135deg, #FDF0E7 0%, #F8E4D2 100%)' }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Headset className="w-4 h-4" style={{ color: '#D46A3A' }} />
              <h3 className="text-sm md:text-base font-display font-black" style={{ color: '#2D2316' }}>
                Need to reach us sooner?
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-sm md:text-base">
              <a
                href="mailto:customer_service@ezwhelp.com"
                className="font-bold no-underline hover:underline"
                style={{ color: '#B85528' }}
              >
                customer_service@ezwhelp.com
              </a>
              <span className="hidden sm:inline" style={{ color: '#D46A3A' }}>•</span>
              <a
                href="tel:+17327237787"
                className="font-bold no-underline hover:underline"
                style={{ color: '#B85528' }}
              >
                (732) 723-7787
              </a>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 mb-5 text-xs md:text-sm" style={{ color: '#5A4A3A' }}>
            <span className="flex items-center gap-1.5"><Truck className="w-4 h-4" style={{ color: '#D46A3A' }} /> Free US Shipping</span>
            <span className="flex items-center gap-1.5"><Award className="w-4 h-4" style={{ color: '#D46A3A' }} /> Trusted by Breeders</span>
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" style={{ color: '#D46A3A' }} /> Premium Quality</span>
          </div>

          {/* Start Over */}
          <div className="flex justify-center">
            <Button
              onClick={handleRestart}
              variant="outline"
              className="rounded-2xl font-display font-black px-6 h-12"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Start Over
            </Button>
          </div>
        </motion.div>
      </>
    );
  }

  // ===== RESULTS: New customer — Standard bundles =====
  if (isComplete && customerType === "new") {
    const result = computeFullResult(newData);
    const visibleAddOns = result.addOns;

    // API-driven values (override local when available)
    const apiBundleName = path1Result?.bundle || result.bundle;
    // Cart URL: trust backend `shopify_cart_url` first; fall back to local size-aware
    // lookup based on the bundle the quiz routed to. No damSize-based bundle swapping.
    const apiCartUrl = path1Result?.shopify_cart_url || getBundleUrl(result.bundle, result.boxSize, result.panelHeight, newData.damSize === "over_90", newData.hasWindow);
    const apiAddOns = path1Result?.suggested_addons;
    const isSupportFollowup = path1Result?.support_followup === true && path1Result?.bundle !== "Condo";
    // XL/Giant always ships the TALL 48"x76"x28" box — derive the label from
    // the selected variant instead of the standard boxSize/boxSize/panelHeight
    // formula, which produces the wrong 48"x48"x28" for XL. Used everywhere
    // this size is shown: recommendation header AND the cart review screen.
    const boxSizeLabel = newData.damSize === "over_90"
      ? `48" x 76" x 28"`
      : `${result.boxSize}" x ${result.boxSize}" x ${result.panelHeight}"`;

    const ResultsContent = () => {

    return (
      <>
        {!celebrationDone && <PawCelebration onComplete={handleCelebrationComplete} />}
        <motion.div
          
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: celebrationDone ? 1 : 0, y: celebrationDone ? 0 : 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-2xl lg:max-w-3xl mx-auto px-3 md:px-6 pt-6 md:pt-10"
        >
        {/* Small centered logo — breathing room above the bundle */}
        <div className="flex justify-center mb-6 md:mb-8">
          <a href="https://www.ezwhelp.com/" target="_blank" rel="noopener noreferrer"><img src={ezwhelpLogo} alt="EZWhelp" className="h-8 md:h-10 object-contain opacity-50" /></a>
        </div>
        {/* Bundle Card — tappable to view details, with attention wiggle */}
        <motion.a
          href={apiCartUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackProductClick(`bundle-${apiBundleName}`, 0)}
          className="block duo-card overflow-hidden mb-3 md:mb-5 no-underline"
          animate={{
            rotate: [0, -0.8, 0.8, -0.5, 0.5, 0],
            scale: [1, 1.008, 1.008, 1.005, 1.005, 1],
          }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
          whileHover={{ scale: 1.02, y: -4, boxShadow: '0 18px 35px rgba(0,0,0,0.12)' }}
          whileTap={{ scale: 0.97 }}
          onMouseEnter={() => playHover()}
        >
          <BundleSlideshow
            bundle={result.bundle}
            boxSize={result.boxSize}
            panelHeight={result.panelHeight}
            alt={`${result.bundle} Bundle`}
          />
          <div className="p-4 md:p-6 lg:p-7">
            <h2 className="text-base md:text-xl lg:text-2xl font-display font-black text-foreground text-center">{apiBundleName} Bundle</h2>
            <p className="text-[11px] md:text-xs text-muted-foreground font-medium mt-0.5 md:mt-1 text-center">
              {boxSizeLabel} • {newData.zones} Zone{Number(newData.zones) > 1 ? "s" : ""} • {result.padRecommendation.replace("Extra ", "")}
            </p>
            {/* XL/Giant: Arya asked to remove the long bundle-description paragraph
                between the size line and What's Included (2026-07-10) — kept for
                all other dam sizes. */}
            {newData.damSize !== "over_90" && (
              <p className="text-[10px] md:text-xs text-muted-foreground/80 mt-2 md:mt-3 leading-relaxed text-center max-w-sm mx-auto">
                {bundleDescriptions[result.bundle]}
                {result.confidenceMessage && (
                  <span className="block mt-1 font-medium" style={{ color: '#6B5B4A' }}>{result.confidenceMessage}</span>
                )}
              </p>
            )}
            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border/40">
              <p className="text-[10px] md:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">What's Included</p>
              <ul className="text-[11px] md:text-xs text-foreground/80 space-y-1.5 list-none">
                {bundleIncludesList[result.bundle]?.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ background: '#FDF0E7', color: '#D46A3A' }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[10px] md:text-[11px] mt-3 md:mt-4 font-medium text-center" style={{ color: '#D46A3A' }}>Recommended for your breeding timeline</p>
          </div>
        </motion.a>

        {/* Tall box safety recommendation when containment = active */}
        {newData.containment === "active" && result.panelHeight === "28" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-3 md:mb-5 px-4 py-3 rounded-xl text-center"
            style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE' }}
          >
            <p className="text-xs md:text-sm font-semibold" style={{ color: '#1E40AF' }}>
              🛡️ Taller panels recommended for improved puppy safety and containment.
            </p>
          </motion.div>
        )}


        {/* Loading indicator while API responds */}
        {apiLoading && (
          <div className="text-center py-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-3 border-t-transparent rounded-full mx-auto mb-2"
              style={{ borderColor: '#D46A3A', borderTopColor: 'transparent' }}
            />
            <p className="text-xs font-display font-bold" style={{ color: '#8A6F4E' }}>Loading your personalized results…</p>
          </div>
        )}

        {/* API errors are not surfaced visually: the page already renders a complete
            result from local computeFullResult (bundle, cart URL, add-ons all fall
            back). Showing a red banner over a working page just creates panic.
            Errors still log via console.error for diagnostics. */}

        {/* Personalized Setup Support — shown for support_followup responses (e.g. Condo XL) */}
        {isSupportFollowup && (
          <div className="mb-3 md:mb-6">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, #E8DDD0 50%, transparent 100%)' }} />
              <Headset className="w-4 h-4" style={{ color: '#D46A3A' }} />
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, #E8DDD0 50%, transparent 100%)' }} />
            </div>
            <div
              className="duo-card p-5 md:p-7 text-center"
              style={{ background: 'linear-gradient(135deg, #FDF0E7 0%, #F8E4D2 100%)', border: '1.5px solid #E8DDD0' }}
            >
              <div className="flex items-center justify-center gap-2 mb-2 md:mb-3">
                <Headset className="w-4 h-4 md:w-5 md:h-5" style={{ color: '#D46A3A' }} />
                <h3 className="text-sm md:text-base font-display font-black" style={{ color: '#2D2316' }}>
                  Personalized Setup Support
                </h3>
              </div>
              <p className="text-xs md:text-sm leading-relaxed max-w-lg mx-auto" style={{ color: '#5A4A3A' }}>
                {path1Result?.message ||
                  "Because you have an XL/Giant dam, our support team will reach out within 24 hours to help you with recommended accessories and any custom setup needs."}
              </p>
            </div>
          </div>
        )}

        {/* API suggested add-ons (when available). Shown for both standard
            results AND XL Condo (support_followup) — XL Condo customers get
            the support-team callout AND the suggested add-on list per spec
            sheet 3 XL Exceptions. */}
        {apiAddOns && apiAddOns.length > 0 && (
          <div className="mb-3 md:mb-6">
            <h3 className="font-display font-bold text-foreground text-xs md:text-base mb-0.5 md:mb-1">Complete Your Setup</h3>
            <p className="text-[10px] md:text-xs text-muted-foreground font-medium mb-2 md:mb-4">Breeders who add these report smoother litters</p>
            <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
              {apiAddOns.map((addon, idx) => (
                <motion.a
                  key={addon.name}
                  href={addon.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="duo-card px-2.5 py-2.5 md:px-3 md:py-3 flex items-center gap-2.5 md:gap-3 no-underline"
                  style={{ border: '1.5px solid #E8DDD0' }}
                  onMouseEnter={() => playPop()}
                  whileHover={{ scale: 1.03, y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.1)' }}
                  whileTap={{ scale: 0.96 }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.3 }}
                >
                  <img
                    src={resolveOriginalAddOnImage(addon.name, addon.url, addon.image_url)}
                    alt={addon.name}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_REC_IMAGE; }}
                    className="w-11 h-11 md:w-14 md:h-14 rounded-lg md:rounded-xl object-cover shrink-0 bg-[#EFE6DA]"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="font-display font-bold text-foreground text-xs md:text-sm block">{addon.name}</span>
                  </span>
                  <button
                    className="shrink-0 font-display font-black text-[10px] md:text-[11px] uppercase px-3 md:px-4 h-7 md:h-8 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #C4A67A 0%, #B0926A 100%)',
                      color: '#FFF8F2',
                    }}
                  >View</button>
                </motion.a>
              ))}
            </div>
          </div>
        )}

        {/* Fallback: local add-ons when API has no results */}
        {(!apiAddOns || apiAddOns.length === 0) && !apiLoading && (
        <div className="mb-3 md:mb-6">
          <h3 className="font-display font-bold text-foreground text-xs md:text-base mb-0.5 md:mb-1">Complete Your Setup</h3>
          <p className="text-[10px] md:text-xs text-muted-foreground font-medium mb-2 md:mb-4">Breeders who add these report smoother litters</p>
          
          {(() => {
            const categoryOrder = [
              { key: "warmth_safety" as const, label: "Warmth & Safety", icon: <Shield className="w-3.5 h-3.5" /> },
              { key: "space_growth" as const, label: "Space & Growth", icon: <Maximize2 className="w-3.5 h-3.5" /> },
              { key: "hygiene_comfort" as const, label: "Hygiene & Comfort", icon: <Droplets className="w-3.5 h-3.5" /> },
              { key: "monitoring_tools" as const, label: "Monitoring & Tools", icon: <MonitorSmartphone className="w-3.5 h-3.5" /> },
            ];

            const grouped = categoryOrder
              .map(cat => ({
                ...cat,
                items: visibleAddOns
                  .filter(a => a.category === cat.key)
                  .sort((a, b) => a.priority - b.priority),
              }))
              .filter(cat => cat.items.length > 0)
              .sort((a, b) => Math.min(...a.items.map(i => i.priority)) - Math.min(...b.items.map(i => i.priority)));

            let globalIdx = 0;

            return grouped.map((group) => (
              <div key={group.key} className="mb-3 md:mb-4">
                <div className="flex items-center gap-1.5 mb-1.5 md:mb-2">
                  <span style={{ color: '#8A6F4E' }}>{group.icon}</span>
                  <span className="font-display font-bold text-[11px] md:text-xs uppercase tracking-wider" style={{ color: '#8A6F4E' }}>{group.label}</span>
                </div>
                <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
                  {group.items.map((addon) => {
                    const idx = globalIdx++;
                    const spotlightDuration = Math.max(8, visibleAddOns.length * 2.5);
                    const spotlightDelay = idx * (spotlightDuration / visibleAddOns.length);
                    return (
                      <motion.div
                        key={addon.name}
                        className="duo-card px-2.5 py-2.5 md:px-3 md:py-3 flex items-center gap-2.5 md:gap-3"
                        style={{
                          border: '1.5px solid #E8DDD0',
                          animation: `addonSpotlight ${spotlightDuration}s ease-in-out infinite`,
                          animationDelay: `${spotlightDelay}s`,
                        }}
                        onMouseEnter={() => playPop()}
                        whileHover={{ scale: 1.03, y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.7)' }}
                        whileTap={{ scale: 0.96, rotate: -1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <a href={addon.url || "#"} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <img
                            src={ensureRecImage(addon.imageUrl, addon.name)}
                            alt={addon.name}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_REC_IMAGE; }}
                            className="w-11 h-11 md:w-14 md:h-14 rounded-lg md:rounded-xl object-cover bg-[#EFE6DA]"
                            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                          />
                        </a>
                        <a href={addon.url || "#"} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 no-underline">
                          <span className="font-display font-bold text-foreground text-xs md:text-sm block">{addon.name}</span>
                          <span className="block text-[10px] md:text-[11px] text-muted-foreground font-medium mt-0.5">{addon.description}</span>
                        </a>
                        <div className="shrink-0 flex flex-col items-center gap-1">
                          <a href={addon.url || "#"} target="_blank" rel="noopener noreferrer">
                            <button
                              className="font-display font-black text-[10px] md:text-[11px] uppercase px-3 md:px-4 h-7 md:h-8 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                              style={{
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #C4A67A 0%, #B0926A 100%)',
                                color: '#FFF8F2',
                                animation: `addBtnGlow ${spotlightDuration}s ease-in-out infinite`,
                                animationDelay: `${spotlightDelay + 0.15}s`,
                              }}
                            >+ Add</button>
                          </a>
                          <a href={addon.url || "#"} target="_blank" rel="noopener noreferrer" className="text-[9px] md:text-[10px] font-bold no-underline hover:underline" style={{ color: '#8A6F4E' }}>Details</a>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
        )}

        {/* Fixed floating action bar — always visible with wiggle */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50"
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 25 }}
          style={{
            background: 'rgba(250,246,240,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 -4px 30px rgba(0,0,0,0.1)',
          }}
        >
              <div className="max-w-2xl lg:max-w-3xl mx-auto px-4 py-2.5 md:py-3 flex items-center gap-2.5">
                <a
                  href={apiCartUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackProductClick(`bundle-${apiBundleName}`, 0)}
                  className="flex-shrink-0 no-underline"
                >
                  <motion.button
                    onClick={() => playButtonClick()}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="font-display font-semibold text-[11px] md:text-xs h-10 md:h-11 px-3 md:px-4 flex items-center justify-center gap-1.5 overflow-hidden"
                    style={{
                      borderRadius: '12px',
                      background: 'transparent',
                      color: '#8A6F4E',
                      border: '1px solid rgba(196,166,122,0.4)',
                    }}
                  >
                    View Details
                  </motion.button>
                </a>
                <div className="flex-1 block">
                  <motion.button
                    onClick={() => {
                      const reviewItems: CartReviewItem[] = [
                        {
                          name: `${apiBundleName} Bundle`,
                          url: apiCartUrl,
                          imageUrl: bundleImages[result.bundle],
                          description: boxSizeLabel,
                          required: true,
                        },
                        ...((apiAddOns && apiAddOns.length > 0)
                          ? apiAddOns.map((a) => ({
                              name: a.name,
                              url: a.url || "",
                              imageUrl: resolveOriginalAddOnImage(a.name, a.url, a.image_url),
                            }))
                          : visibleAddOns.map((a) => ({
                              name: a.name,
                              url: a.url || "",
                              imageUrl: a.imageUrl,
                              description: a.description,
                            }))),
                      ];
                      openCartReview(reviewItems);
                    }}
                    animate={{
                      scale: [1, 1.03, 1],
                      rotate: [0, -1, 1, -0.5, 0.5, 0],
                    }}
                    transition={{
                      scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                      rotate: { duration: 0.8, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" },
                    }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    className="w-full font-display font-black text-[13px] md:text-sm h-10 md:h-11 flex items-center justify-center gap-2"
                    style={{
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #D46A3A 0%, #C4531A 100%)',
                      color: '#FFFFFF',
                      boxShadow: '0 3px 14px rgba(212,106,58,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Get Bundle
                  </motion.button>
                </div>
              </div>
              <div className="text-center pb-1.5 md:pb-2">
                <span className="text-[9px] md:text-[10px] font-bold" style={{ color: '#B5ADA3' }}>
                  Free Shipping • Secure Checkout
                </span>
              </div>
        </motion.div>

        {/* Start Over — at bottom, out of the way */}
        <div className="flex justify-center mt-6 md:mt-8 mb-4">
          <motion.button
            onClick={handleRestart}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="text-[11px] md:text-xs font-display font-semibold flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-colors duration-200"
            style={{
              background: 'transparent',
              color: '#A0876E',
              border: '1px solid rgba(196,166,122,0.25)',
            }}
          >
            <RotateCcw className="w-3 h-3 md:w-3.5 md:h-3.5" /> Start Over
          </motion.button>
        </div>

        {/* Spacer for fixed bar */}
        <div className="h-20 md:h-24" />

      </motion.div>
      </>
    );
    };

    return <ResultsContent />;
  }

  // ===== RESULTS: Existing customer =====
  if (isComplete && customerType === "existing") {
    const result = computeLifecycleResult(existingData);
    const allRecs = [...result.primaryRecommendations, ...result.conditionalRecommendations];

    // Group by category — unified warm palette
    const categoryOrder: { key: string; label: string; icon: React.ReactNode; color: string }[] = [
      { key: "warmth_safety", label: "Warmth & Safety", icon: <Flame className="w-4 h-4 md:w-5 md:h-5" />, color: "#D46A3A" },
      { key: "space_growth", label: "Space & Growth", icon: <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />, color: "#C4A67A" },
      { key: "hygiene_comfort", label: "Hygiene & Comfort", icon: <Droplets className="w-4 h-4 md:w-5 md:h-5" />, color: "#8A6F4E" },
      { key: "monitoring_tools", label: "Monitoring & Tools", icon: <MonitorSmartphone className="w-4 h-4 md:w-5 md:h-5" />, color: "#A0876E" },
    ];

    const grouped = categoryOrder
      .map((cat) => ({
        ...cat,
        items: allRecs.filter((r) => r.category === cat.key),
      }))
      .filter((cat) => cat.items.length > 0);

    // Fallback image lookup — backfill missing API image_url from local catalog
    const imageLookup = new Map<string, string>();
    allRecs.forEach((r) => {
      if (!r.imageUrl) return;
      const nameKey = r.name.trim().toLowerCase();
      imageLookup.set(nameKey, r.imageUrl);
      if (r.url) imageLookup.set(r.url.split("?")[0], r.imageUrl);
    });
    const resolveImage = (name?: string, url?: string, existing?: string): string => {
      const originalImage = resolveOriginalAddOnImage(name, url, existing);
      if (originalImage !== FALLBACK_REC_IMAGE) return originalImage;
      if (url) {
        const hit = imageLookup.get(url.split("?")[0]);
        if (hit) return hit;
      }
      if (name) {
        const hit = imageLookup.get(name.trim().toLowerCase());
        if (hit) return hit;
        const lower = name.toLowerCase();
        for (const [k, v] of imageLookup) {
          if (k.includes(lower) || lower.includes(k)) return v;
        }
      }
      return ensureRecImage(undefined, name);
    };

    return (
      <>
        {!celebrationDone && <PawCelebration onComplete={handleCelebrationComplete} />}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: celebrationDone ? 1 : 0, y: celebrationDone ? 0 : 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-2xl lg:max-w-3xl mx-auto px-3 md:px-6 pt-6 md:pt-10"
        >
        {/* Small centered logo — breathing room */}
        <div className="flex justify-center mb-6 md:mb-8">
          <a href="https://www.ezwhelp.com/" target="_blank" rel="noopener noreferrer"><img src={ezwhelpLogo} alt="EZWhelp" className="h-8 md:h-10 object-contain opacity-50" /></a>
        </div>

        {/* Header */}
        <div className="text-center mb-5 md:mb-7">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-black" style={{ color: '#5A4A3A' }}>Your Personalized Picks</h2>
          <p className="text-sm md:text-base font-display font-bold mt-1.5 md:mt-2 px-4" style={{ color: '#D46A3A' }}>{result.stageLabel}</p>
          <p className="text-xs md:text-sm text-muted-foreground font-medium mt-1">Curated for your box size &amp; breeding stage</p>
        </div>

        {/* Loading indicator while API responds */}
        {apiLoading && (
          <div className="text-center py-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-3 border-t-transparent rounded-full mx-auto mb-2"
              style={{ borderColor: '#8A6F4E', borderTopColor: 'transparent' }}
            />
            <p className="text-xs font-display font-bold" style={{ color: '#8A6F4E' }}>Loading your personalized results…</p>
          </div>
        )}

        {/* API errors are not surfaced visually: the page already renders complete
            recommendations from local computeLifecycleResult. Errors still log via
            console.error for diagnostics. */}

        {/* API recommended products (when available) */}
        {path2Result && path2Result.recommended_products && path2Result.recommended_products.length > 0 && (
          <div className="mb-5 md:mb-7">
            <div className="flex items-center gap-2.5 mb-2.5 md:mb-3.5">
              <span className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center" style={{ background: '#D46A3A18', color: '#D46A3A' }}>
                <Award className="w-4 h-4 md:w-5 md:h-5" />
              </span>
              <h3 className="font-display font-bold text-sm md:text-base lg:text-lg" style={{ color: '#5A4A3A' }}>Recommended For You</h3>
            </div>
            <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
              {path2Result.recommended_products.map((product, idx) => (
                <motion.a
                  key={product.name}
                  href={product.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => playPop()}
                  className="duo-card px-3 py-3 md:px-4 md:py-4 flex items-center gap-3 md:gap-4 no-underline transition-all duration-200 hover:translate-y-[-2px]"
                  style={{ border: '1.5px solid #E8DDD0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.3 }}
                >
                  <img
                    src={ensureRecImage(resolveImage(product.name, product.url, product.image_url), product.name)}
                    alt={product.name}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_REC_IMAGE; }}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover shrink-0 bg-[#EFE6DA]"
                    style={{ boxShadow: '0 3px 10px rgba(0,0,0,0.08)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-display font-bold text-sm md:text-base block" style={{ color: '#5A4A3A' }}>{product.name}</span>
                  </div>
                  <button
                    className="shrink-0 font-display font-black text-[11px] md:text-xs uppercase px-3.5 md:px-4 h-8 md:h-9 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #D46A3A 0%, #C4531Add 100%)',
                      color: '#FFF8F2',
                      boxShadow: '0 3px 10px rgba(212,106,58,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
                    }}
                  >View</button>
                </motion.a>
              ))}
            </div>
          </div>
        )}

        {/* Fallback: local categorized recommendations when API has no results */}
        {(!path2Result || !path2Result.recommended_products || path2Result.recommended_products.length === 0) && !apiLoading && (
        <>
        {grouped.map((cat, catIdx) => (
          <motion.div
            key={cat.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.12, duration: 0.35 }}
            className="mb-5 md:mb-7"
          >
            <div className="flex items-center gap-2.5 mb-2.5 md:mb-3.5">
              <span
                className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${cat.color}18`, color: cat.color }}
              >
                {cat.icon}
              </span>
              <h3 className="font-display font-bold text-sm md:text-base lg:text-lg" style={{ color: '#5A4A3A' }}>{cat.label}</h3>
            </div>
            <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
              {cat.items.map((rec) => (
                <a
                  key={rec.name}
                  href={rec.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => playPop()}
                  className="duo-card px-3 py-3 md:px-4 md:py-4 flex items-center gap-3 md:gap-4 no-underline transition-all duration-200 hover:translate-y-[-2px]"
                  style={{
                    border: '1.5px solid #E8DDD0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <img
                    src={ensureRecImage(rec.imageUrl, rec.name)}
                    alt={rec.name}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_REC_IMAGE; }}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover shrink-0 bg-[#EFE6DA]"
                    style={{ boxShadow: '0 3px 10px rgba(0,0,0,0.08)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-display font-bold text-sm md:text-base block" style={{ color: '#5A4A3A' }}>{rec.name}</span>
                    <span className="block text-xs md:text-sm text-muted-foreground font-medium mt-0.5">{rec.description}</span>
                  </div>
                  <button
                    className="shrink-0 font-display font-black text-[11px] md:text-xs uppercase px-3.5 md:px-4 h-8 md:h-9 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      borderRadius: '10px',
                      background: `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}dd 100%)`,
                      color: '#FFF8F2',
                      boxShadow: `0 3px 10px ${cat.color}25, inset 0 1px 0 rgba(255,255,255,0.15)`,
                    }}
                  >View</button>
                </a>
              ))}
            </div>
          </motion.div>
        ))}
        </>
        )}

        {/* Start Over — at bottom, above the fixed bar */}
        <div className="flex justify-center mt-6 md:mt-8">
          <motion.button
            onClick={handleRestart}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="text-[11px] md:text-xs font-display font-semibold flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-colors duration-200"
            style={{
              background: 'transparent',
              color: '#A0876E',
              border: '1px solid rgba(196,166,122,0.25)',
            }}
          >
            <RotateCcw className="w-3 h-3 md:w-3.5 md:h-3.5" /> Start Over
          </motion.button>
        </div>

        {/* Spacer for fixed bar */}
        <div className="h-20 md:h-24" />

        {/* Fixed floating action bar */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50"
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 25 }}
          style={{
            background: 'rgba(250,246,240,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 -4px 30px rgba(0,0,0,0.1)',
          }}
        >
          <div className="max-w-2xl lg:max-w-3xl mx-auto px-4 py-2.5 md:py-3">
            <motion.button
              onClick={() => {
                const apiProducts = path2Result?.recommended_products;
                const reviewItems: CartReviewItem[] = (apiProducts && apiProducts.length > 0)
                  ? apiProducts.map((p) => ({
                      name: p.name,
                      url: p.url || "",
                      imageUrl: resolveImage(p.name, p.url, p.image_url),
                    }))
                  : allRecs.map((r) => ({
                      name: r.name,
                      url: r.url || "",
                      imageUrl: r.imageUrl,
                      description: r.description,
                    }));
                openCartReview(
                  reviewItems,
                  "Review Your Recommendations",
                  "Uncheck anything you don't need before heading to checkout."
                );
              }}
              animate={{
                scale: [1, 1.03, 1],
                rotate: [0, -1, 1, -0.5, 0.5, 0],
              }}
              transition={{
                scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 0.8, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" },
              }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="w-full font-display font-black text-[13px] md:text-sm h-10 md:h-11 flex items-center justify-center gap-2"
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8A6F4E 0%, #6E5A3E 100%)',
                color: '#FFFFFF',
                boxShadow: '0 3px 14px rgba(138,111,78,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                letterSpacing: '0.02em',
              }}
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Shop Recommended Products
            </motion.button>
          </div>
          <div className="text-center pb-1.5 md:pb-2">
            <span className="text-[9px] md:text-[10px] font-bold" style={{ color: '#B5ADA3' }}>
              Free Shipping • Secure Checkout
            </span>
          </div>
        </motion.div>

      </motion.div>
      </>
    );
  }

  // ===== QUIZ QUESTIONS =====
  if (!currentQuizStep) return null;

  const stepKey = gateAnswered ? `${customerType}-${currentStep}` : "gate";

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div
      className={`story-quiz-card story-quiz-screen w-full max-w-[960px] mx-auto relative ${currentQuizStep.type === "breed" ? "storybook-breed-step-active" : ""}`}
      style={{
        borderRadius: '40px',
        background: '#F7F3EC',
        boxShadow: '0px 20px 40px rgba(0,0,0,0.08), inset 0px 3px 6px rgba(255,255,255,0.6), inset 0px -4px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Question area with stable min-height to prevent layout shifts */}
      <div className="min-h-[220px] md:min-h-[280px] flex flex-col justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={stepKey}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {currentQuizStep.id === "ownsBox" ? (
              <GateQuestionCard
                step={currentQuizStep}
                value={selectedValue}
                onSelect={handleSelectAndAdvance}
              />
            ) : (
              <QuestionCard
                step={currentQuizStep}
                value={selectedValue}
                onSelect={handleSelectAndAdvance}
                textValue={textValue}
                onTextChange={setTextValue}
                dateValue={dateValue}
                onDateChange={setDateValue}
                emailValue={emailValue}
                onEmailChange={setEmailValue}
                breedValue={breedValue}
                onBreedChange={setBreedValue}
                onNext={() => handleNext()}
                recommendation={
                  customerType === "new"
                    ? getNewCustomerRecommendation(currentQuizStep.id, newData)
                    : customerType === "existing"
                    ? getExistingCustomerRecommendation(currentQuizStep.id, existingData)
                    : null
                }
                recommendationSet={
                  customerType === "new"
                    ? getNewCustomerRecommendationSet(currentQuizStep.id, newData)
                    : customerType === "existing"
                    ? getExistingCustomerRecommendationSet(currentQuizStep.id, existingData)
                    : null
                }
                storedBreed={customerType === "existing" ? existingData.breed : customerType === "new" ? newData.breed : undefined}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {(currentQuizStep.type === "date" || currentQuizStep.type === "text" || currentQuizStep.type === "email" || currentQuizStep.type === "breed") && (
          <div className="flex flex-col items-center mt-5 md:mt-8 gap-3">
            <motion.button
              disabled={!canProceed}
              onClick={() => handleNext()}
              animate={currentQuizStep.type === "email" && canProceed ? { rotate: [0, -2, 2, -1.5, 1.5, 0] } : {}}
              transition={currentQuizStep.type === "email" ? { duration: 0.5, repeat: Infinity, repeatDelay: 3 } : {}}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="duo-btn font-display font-bold text-sm md:text-base px-10 md:px-12 disabled:opacity-40 transition-all h-11 md:h-14 flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              {currentQuizStep.type === "email" ? "See My Setup" : "Next"}
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Back & Restart navigation */}
      {!isFirstStep && (
        <div className="quiz-navigation mt-3 md:mt-5 pt-3 md:pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <ProgressBar current={globalStep} total={totalSteps} />
          <div className="flex items-center justify-center gap-5 md:gap-6 mt-2 md:mt-3">
            <button onClick={() => { playBack(); handleBack(); }} className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors font-bold">
              <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Back
            </button>
            <button onClick={handleRestart} className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors font-bold">
              <RotateCcw className="w-3 h-3 md:w-3.5 md:h-3.5" /> Restart
            </button>
          </div>
        </div>
      )}

      {/* EZWhelp logo at bottom of quiz card */}
      <div className="quiz-brand flex justify-center mt-5 md:mt-7 pb-2 md:pb-4">
        <a href="https://www.ezwhelp.com/" target="_blank" rel="noopener noreferrer"><img src={ezwhelpLogo} alt="EZWhelp" className="h-7 md:h-9 object-contain opacity-35" /></a>
      </div>

    </div>
  );
};

export default EZWhelpQuiz;
