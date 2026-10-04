/**
 * BREED → WHELPING BOX SIZE + PANEL HEIGHT MAPPING
 *
 * Each breed maps to a primary and optional secondary box size recommendation,
 * plus panel height requirements and whether alternatives are locked.
 *
 * SIZE ORDER (smallest → largest): 28×28, 38×38, 48×48, 48×76
 *
 * PANEL HEIGHT RULES:
 * - Standard (18"): 28×28, 38×38, 48×48
 * - Tall (28"): 48×76 (required for giant breeds, optional for flexible large breeds)
 *
 * SELECTION RULES:
 * - Single size → primary only, no alternatives
 * - Dual size → smaller primary, larger secondary
 * - Tall Required → 48×76 only, no smaller options shown
 * - Tall Recommended → 48×48 primary + 48×76 secondary, height chooseable
 * - 3 sizes → smallest primary, next secondary, largest oversized fallback
 *
 * OVERRIDE: Weight/user inputs always override breed defaults when they conflict.
 */

export type BoxSizeString = "28x28" | "38x38" | "48x48" | "48x76";

export type PanelHeightRequirement = "standard_only" | "tall_only" | "standard_or_tall";

export interface BreedBoxRecommendation {
  primaryBoxRecommendation: BoxSizeString;
  secondaryBoxRecommendation: BoxSizeString | null;
  oversizedFallback?: BoxSizeString | null;
  panelHeight: PanelHeightRequirement;
  /** If true, user cannot choose alternative sizes (single-size or tall-locked breeds) */
  sizeLocked: boolean;
}

export interface BreedBoxMapping {
  compatibleSizes: BoxSizeString[];
  primaryBoxSize: BoxSizeString;
  alternateBoxSizes: BoxSizeString[];
}

// ===== BREED CATEGORIES =====

/** 28×28 Primary, 38×38 Secondary — Standard panels */
const SMALL_BREEDS_WITH_SECONDARY = [
  "Affenpinscher", "American Eskimo", "Australian Terrier", "Basenji", "Beagle",
  "Bedlington Terrier", "Bichon Frise", "Border Terrier", "Boston Terrier",
  "Brussels Griffon", "Cairn Terrier", "Cardigan Welsh Corgi",
  "Cavalier King Charles Spaniel", "Coton de Tulear", "Dachshund",
  "Dandie Dinmont Terrier", "English Toy Spaniel", "Fox Terrier – Smooth",
  "Fox Terrier – Wirehair", "German Pinscher", "Glen Imaal Terrier",
  "Lakeland Terrier", "Manchester Terrier (Standard)", "Poodle Miniature",
  "Puli", "Schipperke", "Scottish Terrier", "Sealyham Terrier",
  "Shetland Sheepdog (Sheltie)", "Shiba Inu", "Shih Tzu", "Silky Terrier",
  "Skye Terrier", "Tibetan Spaniel", "Tibetan Terrier",
  "Welsh Terrier", "West Highland White Terrier",
];

/** 28×28 Primary only — Standard panels, size locked */
const SMALL_BREEDS_SINGLE = [
  "Chihuahua", "Chinese Crested", "Italian Greyhound", "Jack Russell Terrier",
  "Maltese", "Manchester Terrier (Toy)", "Papillon",
  "Pomeranian", "Poodle Toy", "Toy Fox Terrier", "Yorkshire Terrier",
];

/** 38×38 Primary only — Standard panels */
const MEDIUM_BREEDS = [
  "Airedale Terrier", "American Staffordshire Terrier", "American Water Spaniel",
  "Australian Cattle Dog", "Bearded Collie", "Border Collie", "Brittany",
  "Bull Terrier", "Canaan Dog", "Chinese Shar Pei", "Chow Chow",
  "Cocker Spaniel-American", "Cocker Spaniel-English", "English Springer Spaniel",
  "Field Spaniel", "Finnish Spitz", "Flat Coated Retriever", "French Bulldog",
  "Harrier", "Ibizan Hound", "Irish Terrier", "Irish Water Spaniel",
  "Keeshond", "Kerry Blue Terrier", "Norwegian Elkhound",
  "Petit Basset Griffon Vendeen", "Plott Hound", "Pointer",
  "Polish Lowland Sheepdog", "Portuguese Water Dog", "Pug",
  "Redbone Coonhound", "Saluki", "Siberian Husky",
  "Soft-Coated Wheaten Terrier", "Staffordshire Bull Terrier",
  "Standard Schnauzer", "Sussex Spaniel", "Vizsla",
  "Welsh Springer Spaniel", "Whippet", "Wirehaired Pointing Griffon",
  "Nova Scotia Duck Tolling Retriever",
];

/** 38×38 Primary + 48×48 Secondary — Standard panels */
const MEDIUM_WITH_LARGE_SECONDARY = [
  "Australian Shepherd", "Dalmatian", "Pharaoh Hound", "Samoyed",
];

/** 48×48 Primary only — Standard panels */
const LARGE_BREEDS = [
  "Afghan Hound", "Alaskan Malamute", "American Foxhound", "Basset Hound",
  "Beauceron", "Belgian Malinois", "Belgian Sheepdog", "Belgian Tervuren",
  "Black And Tan Coonhound", "Bouvier des Flandres", "Briard",
  "Chesapeake Bay Retriever", "Clumber Spaniel",
  "Collie (Rough)", "Collie (Smooth)", "Curly Coated Retriever", "Doberman Pinscher",
  "English Foxhound", "English Setter", "German Shorthaired Pointer",
  "German Wirehaired Pointer", "Giant Schnauzer", "Golden Retriever",
  "Gordon Setter", "Irish Setter", "Komondor", "Labrador Retriever",
  "Old English Sheepdog (Bobtail)", "Rhodesian Ridgeback",
  "Weimaraner",
];

/** 48×48 Primary + 48×76 Secondary — Standard OR Tall (user chooses) */
const FLEXIBLE_LARGE_BREEDS = [
  "Boxer", "Greyhound", "Poodle Standard", "Scottish Deerhound", "Spinone Italiano",
];

/** 48×76 Tall ONLY — no smaller options, size locked */
const TALL_REQUIRED_BREEDS = [
  "Akita", "Anatolian Sheepdog", "Bernese Mountain Dog", "Black Russian Terrier",
  "Bloodhound", "Borzoi", "Bullmastiff", "German Shepherd Dog",
  "Great Dane", "Great Pyrenees", "Great Swiss Mountain Dog", "Irish Wolfhound",
  "Kuvasz", "Mastiff", "Neopolitan Mastiff", "Newfoundland", "Otter Hound",
  "Rottweiler", "Saint Bernard", "Tibetan Mastiff",
];

// ===== SPECIAL CASES =====

/** Bulldog: 38×38 primary, 48×48 secondary, 48×76 oversized fallback */
const BULLDOG_ENTRY: BreedBoxRecommendation = {
  primaryBoxRecommendation: "38x38",
  secondaryBoxRecommendation: "48x48",
  oversizedFallback: "48x76",
  panelHeight: "standard_or_tall",
  sizeLocked: false,
};

// ===== ADDITIONAL BREEDS with unique mappings =====

/** (Removed — these breeds are now in SMALL_BREEDS_SINGLE) */
const EXTRA_SMALL_WITH_SECONDARY: string[] = [];

// ===== BUILD LOOKUP MAPS =====

const breedRecommendationMap = new Map<string, BreedBoxRecommendation>();
const breedBoxMap = new Map<string, BreedBoxMapping>();

function register(breed: string, rec: BreedBoxRecommendation) {
  const key = breed.toLowerCase();
  breedRecommendationMap.set(key, rec);

  const sizes: BoxSizeString[] = [rec.primaryBoxRecommendation];
  if (rec.secondaryBoxRecommendation) sizes.push(rec.secondaryBoxRecommendation);
  if (rec.oversizedFallback) sizes.push(rec.oversizedFallback);

  breedBoxMap.set(key, {
    compatibleSizes: sizes,
    primaryBoxSize: sizes[0],
    alternateBoxSizes: sizes.slice(1),
  });
}

// 28×28 primary + 38×38 secondary
[...SMALL_BREEDS_WITH_SECONDARY, ...EXTRA_SMALL_WITH_SECONDARY].forEach(breed => {
  register(breed, {
    primaryBoxRecommendation: "28x28",
    secondaryBoxRecommendation: "38x38",
    panelHeight: "standard_only",
    sizeLocked: false,
  });
});

// 28×28 only
SMALL_BREEDS_SINGLE.forEach(breed => {
  register(breed, {
    primaryBoxRecommendation: "28x28",
    secondaryBoxRecommendation: null,
    panelHeight: "standard_only",
    sizeLocked: true,
  });
});

// 38×38 only
MEDIUM_BREEDS.forEach(breed => {
  register(breed, {
    primaryBoxRecommendation: "38x38",
    secondaryBoxRecommendation: null,
    panelHeight: "standard_only",
    sizeLocked: false,
  });
});

// 38×38 primary + 48×48 secondary
MEDIUM_WITH_LARGE_SECONDARY.forEach(breed => {
  register(breed, {
    primaryBoxRecommendation: "38x38",
    secondaryBoxRecommendation: "48x48",
    panelHeight: "standard_only",
    sizeLocked: false,
  });
});

// 48×48 only
LARGE_BREEDS.forEach(breed => {
  register(breed, {
    primaryBoxRecommendation: "48x48",
    secondaryBoxRecommendation: null,
    panelHeight: "standard_only",
    sizeLocked: false,
  });
});

// 48×48 primary + 48×76 secondary (flexible — user can choose Standard or Tall)
FLEXIBLE_LARGE_BREEDS.forEach(breed => {
  register(breed, {
    primaryBoxRecommendation: "48x48",
    secondaryBoxRecommendation: "48x76",
    panelHeight: "standard_or_tall",
    sizeLocked: false,
  });
});

// 48×76 Tall ONLY
TALL_REQUIRED_BREEDS.forEach(breed => {
  register(breed, {
    primaryBoxRecommendation: "48x76",
    secondaryBoxRecommendation: null,
    panelHeight: "tall_only",
    sizeLocked: true,
  });
});

// Bulldog special case (register both spellings)
register("Bulldog", BULLDOG_ENTRY);
register("Bull Dog", BULLDOG_ENTRY);

// Scottish Terrier — no mapping
// (not registered → getBreedRecommendation returns null)

// ===== PUBLIC API =====

/**
 * Get primary + secondary box size recommendation for a breed.
 * Returns null if breed not found or has no mapping.
 */
export function getBreedRecommendation(breed: string): BreedBoxRecommendation | null {
  if (!breed) return null;
  return breedRecommendationMap.get(breed.toLowerCase()) ?? null;
}

/**
 * Get box size mapping for a breed (legacy API).
 */
export function getBreedBoxSizes(breed: string): BreedBoxMapping | null {
  if (!breed) return null;
  return breedBoxMap.get(breed.toLowerCase()) ?? null;
}

/**
 * Get primary recommended box size for a breed.
 */
export function getPrimaryBoxSize(breed: string): BoxSizeString | null {
  return getBreedRecommendation(breed)?.primaryBoxRecommendation ?? null;
}

/**
 * Get secondary recommended box size for a breed.
 */
export function getSecondaryBoxSize(breed: string): BoxSizeString | null {
  return getBreedRecommendation(breed)?.secondaryBoxRecommendation ?? null;
}

/**
 * Get all compatible box sizes for a breed.
 */
export function getCompatibleBoxSizes(breed: string): BoxSizeString[] {
  return getBreedBoxSizes(breed)?.compatibleSizes ?? [];
}

/**
 * Filter breeds by a specific box size.
 */
export function getBreedsByBoxSize(size: BoxSizeString): string[] {
  const results: string[] = [];
  for (const [, entry] of breedRecommendationMap.entries()) {
    // We need breed names, iterate differently
  }
  // Use breedBoxMap which has case-lowered keys
  const allResults: string[] = [];
  breedBoxMap.forEach((mapping, key) => {
    if (mapping.compatibleSizes.includes(size)) {
      // Capitalize first letter of each word for display
      allResults.push(key);
    }
  });
  return allResults;
}
