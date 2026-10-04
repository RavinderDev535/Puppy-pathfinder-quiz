import { describe, it, expect } from "vitest";
import {
  getBreedRecommendation,
  getPrimaryBoxSize,
  getSecondaryBoxSize,
  getCompatibleBoxSizes,
} from "@/lib/breed-box-sizes";
import type { BreedBoxRecommendation } from "@/lib/breed-box-sizes";

describe("Breed Box Recommendation API", () => {
  // === Single size breeds ===
  it("Chihuahua → 28x28 only, standard, size locked", () => {
    const rec = getBreedRecommendation("Chihuahua")!;
    expect(rec.primaryBoxRecommendation).toBe("28x28");
    expect(rec.secondaryBoxRecommendation).toBeNull();
    expect(rec.panelHeight).toBe("standard_only");
    expect(rec.sizeLocked).toBe(true);
  });

  it("Jack Russell Terrier → 28x28 only, standard, size locked", () => {
    const rec = getBreedRecommendation("Jack Russell Terrier")!;
    expect(rec.primaryBoxRecommendation).toBe("28x28");
    expect(rec.secondaryBoxRecommendation).toBeNull();
    expect(rec.sizeLocked).toBe(true);
  });

  // === Small with secondary ===
  it("Beagle → 28x28 primary, 38x38 secondary, standard", () => {
    const rec = getBreedRecommendation("Beagle")!;
    expect(rec.primaryBoxRecommendation).toBe("28x28");
    expect(rec.secondaryBoxRecommendation).toBe("38x38");
    expect(rec.panelHeight).toBe("standard_only");
    expect(rec.sizeLocked).toBe(false);
  });

  it("Affenpinscher → 28x28 primary, 38x38 secondary", () => {
    expect(getPrimaryBoxSize("Affenpinscher")).toBe("28x28");
    expect(getSecondaryBoxSize("Affenpinscher")).toBe("38x38");
  });

  // === Medium breeds ===
  it("French Bulldog → 38x38 only, standard", () => {
    const rec = getBreedRecommendation("French Bulldog")!;
    expect(rec.primaryBoxRecommendation).toBe("38x38");
    expect(rec.secondaryBoxRecommendation).toBeNull();
    expect(rec.panelHeight).toBe("standard_only");
  });

  // === Medium with large secondary ===
  it("Australian Shepherd → 38x38 primary, 48x48 secondary", () => {
    const rec = getBreedRecommendation("Australian Shepherd")!;
    expect(rec.primaryBoxRecommendation).toBe("38x38");
    expect(rec.secondaryBoxRecommendation).toBe("48x48");
    expect(rec.panelHeight).toBe("standard_only");
  });

  // === Large breeds ===
  it("Golden Retriever → 48x48 only, standard", () => {
    const rec = getBreedRecommendation("Golden Retriever")!;
    expect(rec.primaryBoxRecommendation).toBe("48x48");
    expect(rec.secondaryBoxRecommendation).toBeNull();
    expect(rec.panelHeight).toBe("standard_only");
  });

  // === Flexible large breeds (Standard OR Tall) ===
  it("Boxer → 48x48 primary, 48x76 secondary, standard_or_tall", () => {
    const rec = getBreedRecommendation("Boxer")!;
    expect(rec.primaryBoxRecommendation).toBe("48x48");
    expect(rec.secondaryBoxRecommendation).toBe("48x76");
    expect(rec.panelHeight).toBe("standard_or_tall");
    expect(rec.sizeLocked).toBe(false);
  });

  it("Poodle Standard → 48x48 primary, 48x76 secondary, standard_or_tall", () => {
    expect(getPrimaryBoxSize("Poodle Standard")).toBe("48x48");
    expect(getSecondaryBoxSize("Poodle Standard")).toBe("48x76");
  });

  it("Spinone Italiano → 48x48 primary, 48x76 secondary", () => {
    const rec = getBreedRecommendation("Spinone Italiano")!;
    expect(rec.primaryBoxRecommendation).toBe("48x48");
    expect(rec.secondaryBoxRecommendation).toBe("48x76");
  });

  // === Tall-required breeds ===
  it("Great Dane → 48x76 only, tall required, size locked", () => {
    const rec = getBreedRecommendation("Great Dane")!;
    expect(rec.primaryBoxRecommendation).toBe("48x76");
    expect(rec.secondaryBoxRecommendation).toBeNull();
    expect(rec.panelHeight).toBe("tall_only");
    expect(rec.sizeLocked).toBe(true);
  });

  it("German Shepherd Dog → 48x76 only, tall required", () => {
    const rec = getBreedRecommendation("German Shepherd Dog")!;
    expect(rec.primaryBoxRecommendation).toBe("48x76");
    expect(rec.panelHeight).toBe("tall_only");
    expect(rec.sizeLocked).toBe(true);
  });

  it("Rottweiler → tall required", () => {
    const rec = getBreedRecommendation("Rottweiler")!;
    expect(rec.panelHeight).toBe("tall_only");
    expect(rec.primaryBoxRecommendation).toBe("48x76");
  });

  // === Bulldog special case ===
  it("Bulldog → 38x38 primary, 48x48 secondary, 48x76 tertiary fallback", () => {
    const rec = getBreedRecommendation("Bulldog")!;
    expect(rec.primaryBoxRecommendation).toBe("38x38");
    expect(rec.secondaryBoxRecommendation).toBe("48x48");
    expect(rec.oversizedFallback).toBe("48x76");
    expect(rec.panelHeight).toBe("standard_or_tall");
    expect(rec.sizeLocked).toBe(false);
  });

  // === Scottish Terrier (now has mapping) ===
  it("Scottish Terrier → 28x28 primary, 38x38 secondary", () => {
    const rec = getBreedRecommendation("Scottish Terrier")!;
    expect(rec.primaryBoxRecommendation).toBe("28x28");
    expect(rec.secondaryBoxRecommendation).toBe("38x38");
  });

  // === Breeds that gained secondary sizes ===
  it("Bichon Frise → 28x28 primary, 38x38 secondary", () => {
    expect(getPrimaryBoxSize("Bichon Frise")).toBe("28x28");
    expect(getSecondaryBoxSize("Bichon Frise")).toBe("38x38");
  });

  it("Shih Tzu → 28x28 primary, 38x38 secondary", () => {
    expect(getPrimaryBoxSize("Shih Tzu")).toBe("28x28");
    expect(getSecondaryBoxSize("Shih Tzu")).toBe("38x38");
  });

  // === Case insensitive ===
  it("case-insensitive lookup", () => {
    expect(getPrimaryBoxSize("golden retriever")).toBe("48x48");
    expect(getPrimaryBoxSize("GREAT DANE")).toBe("48x76");
  });

  // === Unknown breed ===
  it("unknown breed → null", () => {
    expect(getBreedRecommendation("Unknown Breed")).toBeNull();
    expect(getPrimaryBoxSize("")).toBeNull();
  });

  // === All tall-required breeds are properly locked ===
  it.each([
    "Akita", "Anatolian Sheepdog", "Bernese Mountain Dog", "Bloodhound",
    "Borzoi", "Bullmastiff", "Great Pyrenees", "Irish Wolfhound",
    "Mastiff", "Neopolitan Mastiff", "Newfoundland", "Saint Bernard",
  ])("%s → tall_only + size locked", (breed) => {
    const rec = getBreedRecommendation(breed)!;
    expect(rec).not.toBeNull();
    expect(rec.panelHeight).toBe("tall_only");
    expect(rec.sizeLocked).toBe(true);
    expect(rec.primaryBoxRecommendation).toBe("48x76");
  });
});
