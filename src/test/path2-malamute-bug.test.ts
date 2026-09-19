import { describe, it, expect } from "vitest";
import { computeLifecycleResult } from "@/lib/lifecycle-engine";
import { ExistingCustomerData } from "@/lib/types";

/**
 * REGRESSION TEST — Alaskan Malamute, 48×48 box, Tall (28") panels.
 *
 * Pre-fix bug: BoxConfigSelector's hydration logic upgraded any "48-28-..."
 * value back to "48xl" internal state, so 48×48 Tall customers (Large
 * breeds like Alaskan Malamute) were silently routed to the XL path and
 * received 48×76 pad variants (50.5"×80.5") instead of 48×48 pads.
 *
 * After fix (BoxConfigSelector 2026-05-11):
 *   - "48-28-..." stays as 48×48 + Tall (boxSize="48", boxHeight="28")
 *   - "48xl-..." continues to mean true XL Giant
 */
describe("Path 2 — Alaskan Malamute pad fix", () => {
  const malamuteWithTallPanels: ExistingCustomerData = {
    breed: "Alaskan Malamute",
    damSize: "40_90",
    experience: "1_2",
    boxSize: "48", // After fix: 48×48 + Tall → boxSize="48", NOT "48xl"
    boxHeight: "28",
    hasWindow: "yes",
    stage: "preparing",
    dueDate: null,
  };

  it("recommends 48×48 LARGE pads (not XL) for a Malamute on a 48×48 Tall box", () => {
    const result = computeLifecycleResult(malamuteWithTallPanels);
    const padNames = [...result.primaryRecommendations, ...result.conditionalRecommendations]
      .filter((r) => r.name.toLowerCase().includes("pad"))
      .map((r) => r.name);
    // No XL pad strings should appear — 50.5/80.5 (XL Quick Dry) or 50"x80" (XL Slip)
    expect(padNames.join(" | ")).not.toMatch(/50\.5|80\.5|50"x80/);
  });

  it("Quick Dry pad resolves to LARGE 48×48 variant 46535234322674", () => {
    const result = computeLifecycleResult(malamuteWithTallPanels);
    const quickDry = result.primaryRecommendations.find((r) => r.name.includes("Quick Dry"));
    expect(quickDry?.url).toContain("variant=46535234322674");
  });

  it("Slip Resistant pad resolves to LARGE 48×48 variant 43769303040242", () => {
    const result = computeLifecycleResult(malamuteWithTallPanels);
    const slip = result.primaryRecommendations.find((r) => r.name.includes("Slip Resistant"));
    expect(slip?.url).toContain("variant=43769303040242");
  });

  it("regression: explicit boxSize='48xl' still routes to XL pads (true Giant customers)", () => {
    // Sanity check: actual 48×76 XL Giant customers must still get XL pads.
    const realXL: ExistingCustomerData = {
      ...malamuteWithTallPanels,
      boxSize: "48xl",
    };
    const result = computeLifecycleResult(realXL);
    const quickDry = result.primaryRecommendations.find((r) => r.name.includes("Quick Dry"));
    expect(quickDry?.url).toContain("variant=46535234355442"); // XL pad SKU
  });

  it("control: Standard 18\" 48×48 returns 48×48 LARGE pads", () => {
    const malamuteStandard: ExistingCustomerData = {
      ...malamuteWithTallPanels,
      boxHeight: "18",
    };
    const result = computeLifecycleResult(malamuteStandard);
    const quickDry = result.primaryRecommendations.find((r) => r.name.includes("Quick Dry"));
    expect(quickDry?.url).toContain("variant=46535234322674");
  });
});
