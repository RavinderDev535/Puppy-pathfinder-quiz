import { BREED_LIST } from "./breed-data";

/**
 * CONFIDENCE SCORING ENGINE
 * 
 * Combines multiple signals (breed, weight, litter size, containment)
 * to determine the best box size category with confidence scoring.
 * 
 * Categories: Small, Medium, Large, XL/Giant
 * Each signal contributes weighted points to categories.
 */

export type SizeCategory = "small" | "medium" | "large" | "xl";

export interface ScoringInput {
  breed: string;
  damSize: "under_16" | "16_40" | "40_90" | "over_90" | null;
  litterSize: "small" | "average" | "large" | null;
  containment: "calm" | "active" | null;
}

export interface ScoringResult {
  scores: Record<SizeCategory, number>;
  recommended: SizeCategory;
  boxSize: "28" | "38" | "48";
  panelHeight: "18" | "28";
  hasConflict: boolean;
  confidenceMessage: string | null;
}

// ===== BREED → SIZE MAPPING =====

const breedSizeMap: Record<string, SizeCategory> = {};

// Small breeds
const smallBreeds = [
  "Affenpinscher", "Bichon Frise", "Brussels Griffon", "Cairn Terrier", "Cavalier King Charles Spaniel",
  "Chihuahua", "Chinese Crested", "Coton de Tulear", "Dachshund", "English Toy Spaniel",
  "Italian Greyhound", "Japanese Chin", "Maltese", "Manchester Terrier (Toy)", "Papillon",
  "Pomeranian", "Poodle Toy", "Pug", "Schipperke", "Shih Tzu", "Silky Terrier",
  "Skye Terrier", "Toy Fox Terrier", "Yorkshire Terrier",
];

const mediumBreeds = [
  "American Eskimo", "American Water Spaniel", "Australian Cattle Dog", "Australian Shepherd",
  "Australian Terrier", "Basenji", "Basset Hound", "Beagle", "Bearded Collie", "Bedlington Terrier",
  "Belgian Malinois", "Belgian Sheepdog", "Belgian Tervuren", "Border Collie", "Border Terrier",
  "Boston Terrier", "Brittany", "Bull Terrier", "Canaan Dog", "Cardigan Welsh Corgi",
  "Chinese Shar Pei", "Clumber Spaniel", "Cocker Spaniel-American", "Cocker Spaniel-English",
  "Collie (Rough)", "Collie (Smooth)", "Dandie Dinmont Terrier", "English Springer Spaniel",
  "Field Spaniel", "Finnish Spitz", "Fox Terrier – Smooth", "Fox Terrier – Wirehair",
  "French Bulldog", "German Pinscher", "Glen Imaal Terrier", "Harrier", "Ibizan Hound",
  "Irish Terrier", "Jack Russell Terrier", "Keeshond", "Kerry Blue Terrier",
  "Lakeland Terrier", "Manchester Terrier (Standard)", "Norwegian Elkhound",
  "Nova Scotia Duck Tolling Retriever", "Petit Basset Griffon Vendeen", "Poodle Miniature",
  "Polish Lowland Sheepdog", "Puli", "Sealyham Terrier", "Shetland Sheepdog (Sheltie)",
  "Shiba Inu", "Soft-Coated Wheaten Terrier", "Staffordshire Bull Terrier",
  "Standard Schnauzer", "Sussex Spaniel", "Tibetan Spaniel", "Tibetan Terrier",
  "Welsh Springer Spaniel", "Welsh Terrier", "West Highland White Terrier", "Whippet",
  "Wirehaired Pointing Griffon",
];

const largeBreeds = [
  "Airedale Terrier", "Akita", "Alaskan Malamute", "American Foxhound",
  "American Staffordshire Terrier", "Anatolian Sheepdog", "Beauceron",
  "Bernese Mountain Dog", "Black and Tan Coonhound", "Black Russian Terrier",
  "Bloodhound", "Borzoi", "Bouvier des Flandres", "Boxer", "Briard", "Bulldog",
  "Bullmastiff", "Chesapeake Bay Retriever", "Chow Chow", "Curly Coated Retriever",
  "Dalmatian", "Doberman Pinscher", "English Foxhound", "English Setter",
  "Flat Coated Retriever", "German Shepherd Dog", "German Shorthaired Pointer",
  "German Wirehaired Pointer", "Giant Schnauzer", "Golden Retriever", "Gordon Setter",
  "Greyhound", "Irish Setter", "Irish Water Spaniel", "Komondor", "Kuvasz",
  "Labrador Retriever", "Old English Sheepdog (Bobtail)", "Otter Hound",
  "Pharaoh Hound", "Plott Hound", "Pointer", "Poodle Standard",
  "Portuguese Water Dog", "Redbone Coonhound", "Rhodesian Ridgeback",
  "Rottweiler", "Samoyed", "Scottish Deerhound", "Siberian Husky",
  "Spinone Italiano", "Vizsla", "Weimaraner",
];

const xlBreeds = [
  "Great Dane", "Great Pyrenees", "Great Swiss Mountain Dog", "Irish Wolfhound",
  "Mastiff", "Neopolitan Mastiff", "Newfoundland", "Saint Bernard", "Saluki",
  "Tibetan Mastiff",
];

smallBreeds.forEach(b => { breedSizeMap[b.toLowerCase()] = "small"; });
mediumBreeds.forEach(b => { breedSizeMap[b.toLowerCase()] = "medium"; });
largeBreeds.forEach(b => { breedSizeMap[b.toLowerCase()] = "large"; });
xlBreeds.forEach(b => { breedSizeMap[b.toLowerCase()] = "xl"; });

export function getBreedSize(breed: string): SizeCategory | null {
  if (!breed) return null;
  return breedSizeMap[breed.toLowerCase()] || null;
}

// ===== WEIGHT → SIZE =====

function getWeightSize(damSize: ScoringInput["damSize"]): SizeCategory | null {
  if (!damSize) return null;
  const map: Record<string, SizeCategory> = {
    under_16: "small",
    "16_40": "medium",
    "40_90": "large",
    over_90: "xl",
  };
  return map[damSize] || null;
}

// ===== SCORING =====

export function computeConfidenceScores(input: ScoringInput): ScoringResult {
  const scores: Record<SizeCategory, number> = { small: 0, medium: 0, large: 0, xl: 0 };

  // 1. Breed signal (+40)
  const breedSize = getBreedSize(input.breed);
  if (breedSize) {
    scores[breedSize] += 40;
  }

  // 2. Weight signal (+60) — strongest signal
  const weightSize = getWeightSize(input.damSize);
  if (weightSize) {
    scores[weightSize] += 60;
  }

  // 3. Litter size signal
  if (input.litterSize && breedSize) {
    if (input.litterSize === "average") {
      scores[breedSize] += 10;
    } else if (input.litterSize === "large") {
      // Size-up: add points to next category
      const sizeOrder: SizeCategory[] = ["small", "medium", "large", "xl"];
      const idx = sizeOrder.indexOf(breedSize);
      const nextSize = sizeOrder[Math.min(idx + 1, sizeOrder.length - 1)];
      scores[nextSize] += 20;
    }
    // small litter → no change
  } else if (input.litterSize === "large" && weightSize) {
    // If no breed but weight exists, size-up from weight
    const sizeOrder: SizeCategory[] = ["small", "medium", "large", "xl"];
    const idx = sizeOrder.indexOf(weightSize);
    const nextSize = sizeOrder[Math.min(idx + 1, sizeOrder.length - 1)];
    scores[nextSize] += 20;
  }

  // 4. Determine winner with tie-breaker (prefer larger)
  const sizeOrder: SizeCategory[] = ["small", "medium", "large", "xl"];
  let recommended: SizeCategory = "medium"; // fallback
  let maxScore = -1;

  // Iterate in reverse (xl first) so ties favor larger
  for (let i = sizeOrder.length - 1; i >= 0; i--) {
    const cat = sizeOrder[i];
    if (scores[cat] > maxScore) {
      maxScore = scores[cat];
      recommended = cat;
    }
  }

  // Tie-breaker: if two categories within 10 points, prefer larger
  for (let i = sizeOrder.length - 1; i >= 0; i--) {
    const cat = sizeOrder[i];
    if (cat !== recommended && scores[cat] >= maxScore - 10 && sizeOrder.indexOf(cat) > sizeOrder.indexOf(recommended)) {
      recommended = cat;
      break;
    }
  }

  // 5. Map to box size
  const boxSizeMap: Record<SizeCategory, "28" | "38" | "48"> = {
    small: "28",
    medium: "38",
    large: "48",
    xl: "48",
  };

  // 6. Determine panel height
  let panelHeight: "18" | "28" = "18";
  if (recommended === "xl") {
    panelHeight = "28"; // Always tall for XL
  } else if (recommended === "small") {
    panelHeight = "18"; // Always standard for small
  } else if (input.containment === "active") {
    panelHeight = "28"; // Active/jumper → tall
  }

  // 7. Detect conflict
  const hasConflict = breedSize !== null && weightSize !== null && breedSize !== weightSize;

  // 8. Confidence message
  let confidenceMessage: string | null = null;
  if (hasConflict) {
    if (sizeOrder.indexOf(recommended) > sizeOrder.indexOf(breedSize!)) {
      confidenceMessage = "We've sized up your setup to match your dog's weight and litter size.";
    } else if (sizeOrder.indexOf(recommended) < sizeOrder.indexOf(breedSize!)) {
      confidenceMessage = "Adjusted to your dog's actual weight for a better fit.";
    }
  }
  if (input.litterSize === "large" && !confidenceMessage) {
    confidenceMessage = "With a larger litter expected, we've sized up your setup to give puppies room to grow.";
  }

  return {
    scores,
    recommended,
    boxSize: boxSizeMap[recommended],
    panelHeight,
    hasConflict,
    confidenceMessage,
  };
}
