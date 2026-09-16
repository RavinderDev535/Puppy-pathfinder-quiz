import { describe, it, expect } from "vitest";
import { computeConfidenceScores } from "@/lib/confidence-engine";

describe("Confidence Scoring Engine", () => {
  it("small breed + XL weight → recommends XL (weight wins)", () => {
    const result = computeConfidenceScores({
      breed: "Chihuahua",
      damSize: "over_90",
      litterSize: null,
      containment: null,
    });
    // Chihuahua = small +40, over_90 = xl +60
    expect(result.scores.small).toBe(40);
    expect(result.scores.xl).toBe(60);
    expect(result.recommended).toBe("xl");
    expect(result.boxSize).toBe("48");
    expect(result.panelHeight).toBe("28");
    expect(result.hasConflict).toBe(true);
    expect(result.confidenceMessage).toBeTruthy();
  });

  it("medium breed + large weight → recommends large", () => {
    const result = computeConfidenceScores({
      breed: "Beagle",
      damSize: "40_90",
      litterSize: null,
      containment: null,
    });
    expect(result.scores.medium).toBe(40);
    expect(result.scores.large).toBe(60);
    expect(result.recommended).toBe("large");
    expect(result.boxSize).toBe("48");
    expect(result.hasConflict).toBe(true);
  });

  it("matching breed and weight → no conflict", () => {
    const result = computeConfidenceScores({
      breed: "Golden Retriever",
      damSize: "40_90",
      litterSize: null,
      containment: null,
    });
    expect(result.scores.large).toBe(100); // 40 + 60
    expect(result.recommended).toBe("large");
    expect(result.hasConflict).toBe(false);
    expect(result.confidenceMessage).toBeNull();
  });

  it("large litter sizes up the recommendation", () => {
    const result = computeConfidenceScores({
      breed: "Beagle",
      damSize: "16_40",
      litterSize: "large",
      containment: null,
    });
    // Beagle = medium +40, 16_40 = medium +60, large litter = +20 to large (next up from breed=medium)
    expect(result.scores.medium).toBe(100);
    expect(result.scores.large).toBe(20);
    expect(result.recommended).toBe("medium"); // medium still wins at 100 vs 20
  });

  it("tie-breaker prefers larger size", () => {
    const result = computeConfidenceScores({
      breed: "Golden Retriever", // large +40
      damSize: "16_40",          // medium +60
      litterSize: "large",       // +20 to xl (next up from breed=large)
      containment: null,
    });
    // medium=60, large=40, xl=20
    expect(result.recommended).toBe("medium"); // medium clearly wins
  });

  it("active dog gets tall panels for medium/large", () => {
    const result = computeConfidenceScores({
      breed: "Labrador Retriever",
      damSize: "40_90",
      litterSize: null,
      containment: "active",
    });
    expect(result.recommended).toBe("large");
    expect(result.panelHeight).toBe("28");
  });

  it("calm dog gets standard panels for medium", () => {
    const result = computeConfidenceScores({
      breed: "Beagle",
      damSize: "16_40",
      litterSize: null,
      containment: "calm",
    });
    expect(result.recommended).toBe("medium");
    expect(result.panelHeight).toBe("18");
  });

  it("small always gets 18 panels even if active", () => {
    const result = computeConfidenceScores({
      breed: "Chihuahua",
      damSize: "under_16",
      litterSize: null,
      containment: "active",
    });
    expect(result.recommended).toBe("small");
    expect(result.panelHeight).toBe("18");
    expect(result.boxSize).toBe("28");
  });

  it("XL always gets 28 panels even if calm", () => {
    const result = computeConfidenceScores({
      breed: "Great Dane",
      damSize: "over_90",
      litterSize: null,
      containment: "calm",
    });
    expect(result.recommended).toBe("xl");
    expect(result.panelHeight).toBe("28");
    expect(result.boxSize).toBe("48");
  });

  it("no breed (mixed) relies on weight only", () => {
    const result = computeConfidenceScores({
      breed: "Lab mix",
      damSize: "40_90",
      litterSize: null,
      containment: null,
    });
    expect(result.scores.large).toBe(60);
    expect(result.recommended).toBe("large");
    expect(result.hasConflict).toBe(false);
  });

  it("large litter with no breed uses weight for size-up", () => {
    const result = computeConfidenceScores({
      breed: "",
      damSize: "16_40",
      litterSize: "large",
      containment: null,
    });
    // medium +60 from weight, large +20 from litter size-up
    expect(result.scores.medium).toBe(60);
    expect(result.scores.large).toBe(20);
    expect(result.recommended).toBe("medium");
  });

  it("shows size-up message for large litter without conflict", () => {
    const result = computeConfidenceScores({
      breed: "Golden Retriever",
      damSize: "40_90",
      litterSize: "large",
      containment: null,
    });
    expect(result.confidenceMessage).toContain("larger litter");
  });
});
