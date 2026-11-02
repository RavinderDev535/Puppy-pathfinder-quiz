const PROD_BASE = "https://www.ezwhelp.com";
const bundleVariantUrls: Record<string, Record<string, string>> = {
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
    "38-28": `${PROD_BASE}/products/bundles-ezclassic-play-yard-set?variant=54777018810740`,
    "48-28": `${PROD_BASE}/products/bundles-ezclassic-play-yard-set?variant=54777018843508`,
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

export function resolveXLBundleUrl(bundle: string, hasWindow?: string | null): string {
  const entry = xlBundleUrls[bundle];
  if (!entry) return "#";
  if (typeof entry === "string") return entry;
  const isWindow = hasWindow === "yes" || hasWindow === "true";
  return isWindow ? entry.window : entry.solid;
}

export function getBundleUrl(
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
  return bundleVariantUrls[bundle]?.[key] || "#";
}


export const twoRoomCondoVariants: Record<string,string> = {
  '28-18':'55237173838196', '38-18':'55237173870964', '48-18':'55237173903732',
  '38-28':'55237173936500', '48-28':'55237173969268', '48-28-xl':'55237174002036',
};
export function twoRoomCondoLink(size:string,height:string,isXL=false) {
  const id=twoRoomCondoVariants[isXL?'48-28-xl':size+'-'+height];
  return {id:id || null,url:PROD_BASE+'/products/ezclassic-two-2-room-condo-bundle?'+(id?'variant='+id+'&':'')+'utm_source=quiz&utm_medium=recommendation&utm_campaign=find_my_whelping_box&utm_content=two_room_condo_strip'};
}
