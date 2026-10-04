import { describe, it, expect } from "vitest";
import {
  computeBundle,
  computeBoxSize,
  computePanelHeight,
  computeFullResult,
  getAddOns,
  getPadRecommendation,
  getTimelineBanner,
} from "@/lib/structural-engine";
import type { NewCustomerData, BundleName } from "@/lib/types";

/**
 * PATH 1 (NEW CUSTOMER) — EXHAUSTIVE TEST SUITE
 *
 * Covers every deterministic branch of the Path 1 quiz logic:
 *   1. Bundle routing — all 6 (zones × branchAnswer) combinations
 *   2. Box size mapping — all 4 dam sizes
 *   3. Panel height resolution — small / medium / large / xl × user choice × Play Yard override
 *   4. Pad recommendation per bundle
 *   5. Timeline banners — all 5 timeline values
 *   6. Add-on filtering — exclusion of bundleIncludes per bundle
 *   7. computeFullResult end-to-end — XL routing, Play Yard override, full payload shape
 */

// Convenience baseline factory
function baseData(overrides: Partial<NewCustomerData> = {}): NewCustomerData {
  return {
    timeline: "preparing",
    dueDate: null,
    breed: "Labrador Retriever",
    experience: "first",
    litterSize: "average",
    containment: "calm",
    zones: 1,
    branchAnswer: false,
    damSize: "16_40",
    panelHeight: "18",
    hasWindow: null,
    ...overrides,
  };
}

// ============================================================
// 1. BUNDLE ROUTING — computeBundle()
// ============================================================
describe("Path 1 — computeBundle()  (zones × branchAnswer matrix)", () => {
  const matrix: Array<{ zones: 1 | 2 | 3; branch: boolean; expected: BundleName }> = [
    { zones: 1, branch: false, expected: "Starter" },
    { zones: 1, branch: true,  expected: "Essential" },
    { zones: 2, branch: false, expected: "Pro" },
    { zones: 2, branch: true,  expected: "Elite" },
    { zones: 3, branch: false, expected: "Play Yard" },
    { zones: 3, branch: true,  expected: "Condo" },
  ];

  matrix.forEach(({ zones, branch, expected }) => {
    it(`zones=${zones}, branchAnswer=${branch} → ${expected}`, () => {
      expect(computeBundle(baseData({ zones, branchAnswer: branch }))).toBe(expected);
    });
  });

  it("falls back to Starter when zones is null (defensive)", () => {
    const data = baseData({ zones: null as any, branchAnswer: null });
    expect(computeBundle(data)).toBe("Starter");
  });

  it("bundle is independent of damSize (XL routes through same matrix)", () => {
    (["under_16", "16_40", "40_90", "over_90"] as const).forEach((damSize) => {
      expect(computeBundle(baseData({ damSize, zones: 3, branchAnswer: true }))).toBe("Condo");
    });
  });

  it("bundle is independent of breed and experience", () => {
    expect(
      computeBundle(baseData({ breed: "Chihuahua", experience: "kennel", zones: 2, branchAnswer: false }))
    ).toBe("Pro");
  });

  it("bundle is independent of timeline", () => {
    (["preparing", "due_7_days", "born_0_3", "born_1_plus"] as const).forEach((timeline) => {
      expect(computeBundle(baseData({ timeline, zones: 1, branchAnswer: true }))).toBe("Essential");
    });
  });
});

// ============================================================
// 2. BOX SIZE — computeBoxSize()
// ============================================================
describe("Path 1 — computeBoxSize()  (damSize → boxSize)", () => {
  it("under_16 → 28", () => expect(computeBoxSize("under_16")).toBe("28"));
  it("16_40 → 38",   () => expect(computeBoxSize("16_40")).toBe("38"));
  it("40_90 → 48",   () => expect(computeBoxSize("40_90")).toBe("48"));
  it("over_90 → 48", () => expect(computeBoxSize("over_90")).toBe("48"));
});

// ============================================================
// 3. PANEL HEIGHT — computePanelHeight()
// ============================================================
describe("Path 1 — computePanelHeight()", () => {
  it("Small (under_16) always returns 18 regardless of user choice", () => {
    expect(computePanelHeight("under_16", "28")).toBe("18");
    expect(computePanelHeight("under_16", "18")).toBe("18");
    expect(computePanelHeight("under_16", null)).toBe("18");
  });

  it("XL/Giant (over_90) always returns 28 regardless of user choice", () => {
    expect(computePanelHeight("over_90", "18")).toBe("28");
    expect(computePanelHeight("over_90", "28")).toBe("28");
    expect(computePanelHeight("over_90", null)).toBe("28");
  });

  it("Medium (16_40) honors the user's selection", () => {
    expect(computePanelHeight("16_40", "18")).toBe("18");
    expect(computePanelHeight("16_40", "28")).toBe("28");
  });

  it("Large (40_90) honors the user's selection", () => {
    expect(computePanelHeight("40_90", "18")).toBe("18");
    expect(computePanelHeight("40_90", "28")).toBe("28");
  });

  it("Medium/Large default to 18 when no panelHeight provided", () => {
    expect(computePanelHeight("16_40", null)).toBe("18");
    expect(computePanelHeight("40_90", null)).toBe("18");
  });

  it("Play Yard layout (zones=3, branchAnswer=false) forces standard 18 even for Large", () => {
    expect(computePanelHeight("40_90", "28", 3, false)).toBe("18");
  });

  it("Play Yard layout still respects XL hard rule (over_90 → 28)", () => {
    // over_90 is checked before the play yard branch
    expect(computePanelHeight("over_90", "18", 3, false)).toBe("28");
  });

  it("Condo layout (zones=3, branchAnswer=true) does NOT force standard", () => {
    expect(computePanelHeight("40_90", "28", 3, true)).toBe("28");
  });
});

// ============================================================
// 4. PAD RECOMMENDATION LABEL — getPadRecommendation()
// ============================================================
describe("Path 1 — getPadRecommendation()", () => {
  const cases: Array<[BundleName, string]> = [
    ["Starter",   "2-Pack Extra Pads"],
    ["Essential", "2-Pack Extra Pads"],
    ["Pro",       "Bulk Pad Pack"],
    ["Elite",     "Bulk Backup Pad Pack"],
    ["Play Yard", "Extra Pads Recommended"],
    ["Condo",     "Extra Pads Recommended"],
  ];
  cases.forEach(([bundle, label]) => {
    it(`${bundle} → "${label}"`, () => expect(getPadRecommendation(bundle)).toBe(label));
  });
});

// ============================================================
// 5. TIMELINE BANNER — getTimelineBanner()
// ============================================================
describe("Path 1 — getTimelineBanner()", () => {
  it("preparing → calm_preparedness tone", () => {
    const b = getTimelineBanner("preparing");
    expect(b.tone).toBe("calm_preparedness");
    expect(b.headline).toMatch(/prepared/i);
  });
  it("due_7_days → urgent_readiness tone", () => {
    const b = getTimelineBanner("due_7_days");
    expect(b.tone).toBe("urgent_readiness");
    expect(b.headline).toMatch(/soon/i);
  });
  it("born_0_3 → warmth_safety tone", () => {
    const b = getTimelineBanner("born_0_3");
    expect(b.tone).toBe("warmth_safety");
    expect(b.headline).toMatch(/warm/i);
  });
  it("born_1_plus → growth_support tone", () => {
    const b = getTimelineBanner("born_1_plus");
    expect(b.tone).toBe("growth_support");
  });
  it("null → neutral fallback", () => {
    const b = getTimelineBanner(null);
    expect(b.tone).toBe("neutral");
  });
});

// ============================================================
// 6. ADD-ON FILTERING — getAddOns()
// ============================================================
describe("Path 1 — getAddOns()  (per-bundle suggestions, includes excluded)", () => {
  // Expected suggested IDs (in priority order) AFTER applying the "explicitly allowed" rule.
  // explicitlyAllowed = items present in BOTH bundleSuggestedAddOns[bundle] AND bundleIncludes[bundle].
  // Per src/lib/structural-engine.ts:
  //   - Pro: puppy_feeding_station appears in both → KEPT in suggestions
  //   - Elite: add_on_room appears in both → KEPT in suggestions
  const expected: Record<BundleName, string[]> = {
    Starter:     ["Whelping Kit", "Puppy Collar Set (24 Pack)", "Corner Seat", "Puppy Feeding Station",
                  "Smart WiFi Camera + Temp Monitor", "Traction Pad", "Reusable Quick Dry Pads", "Reusable Slip Resistant Pads"],
    Essential:   ["Puppy Feeding Station", "Smart WiFi Camera + Temp Monitor", "Traction Pad",
                  "Acrylic Glass Door Set", "Reusable Quick Dry Pads", "Reusable Slip Resistant Pads"],
    Pro:         ["Acrylic Glass Door Set", "Traction Pad", "Smart WiFi Camera + Temp Monitor",
                  "Puppy Feeding Station", "Reusable Quick Dry Pads", "Reusable Slip Resistant Pads"],
    Elite:       ["Add-On Room", "Reusable Quick Dry Pads", "Reusable Slip Resistant Pads"],
    "Play Yard": ["Smart WiFi Camera + Temp Monitor", "Traction Pad", "Puppy Feeding Station",
                  "Reusable Quick Dry Pads", "Reusable Slip Resistant Pads"],
    Condo:       ["Smart WiFi Camera + Temp Monitor", "Traction Pad", "Puppy Feeding Station",
                  "Corner Seat", "Reusable Quick Dry Pads", "Reusable Slip Resistant Pads"],
  };

  (Object.keys(expected) as BundleName[]).forEach((bundle) => {
    it(`${bundle} returns the correct ordered add-on list`, () => {
      const result = getAddOns(bundle, "preparing", "38", "18", false);
      const namesStartWith = result.map((a) => a.name);
      // Each expected name must match the prefix of the actual returned name (since names include size suffix)
      expect(namesStartWith.length).toBe(expected[bundle].length);
      expected[bundle].forEach((expectedName, i) => {
        expect(namesStartWith[i]).toContain(expectedName);
      });
    });

    it(`${bundle} priority field is monotonically increasing from 1`, () => {
      const result = getAddOns(bundle, "preparing", "38", "18", false);
      result.forEach((addon, i) => expect(addon.priority).toBe(i + 1));
    });

    it(`${bundle} every add-on has a url, imageUrl, and category`, () => {
      const result = getAddOns(bundle, "preparing", "38", "18", false);
      result.forEach((a) => {
        expect(a.url).toBeTruthy();
        expect(a.imageUrl).toBeTruthy();
        expect(a.category).toBeTruthy();
      });
    });
  });

  // Bundle-include exclusion proofs
  it("Pro keeps puppy_feeding_station via 'explicitlyAllowed' rule (in both suggested AND includes)", () => {
    const names = getAddOns("Pro", "preparing", "38", "18").map((a) => a.name);
    expect(names.find((n) => n.includes("Puppy Feeding Station"))).toBeDefined();
  });

  it("Essential never returns whelping_kit / puppy_collar_set / corner_seat (all included)", () => {
    const names = getAddOns("Essential", "preparing", "38", "18").map((a) => a.name);
    expect(names.find((n) => n.includes("Whelping Kit"))).toBeUndefined();
    expect(names.find((n) => n.includes("Puppy Collar Set"))).toBeUndefined();
    expect(names.find((n) => n.includes("Corner Seat"))).toBeUndefined();
  });

  it("Elite explicitly re-allows add_on_room even though it is included", () => {
    const names = getAddOns("Elite", "preparing", "38", "18").map((a) => a.name);
    expect(names.find((n) => n.includes("Add-On Room"))).toBeDefined();
  });

  it("Condo never returns windowed_add_on_room or mess_hall (both included)", () => {
    const names = getAddOns("Condo", "preparing", "38", "18").map((a) => a.name);
    expect(names.find((n) => n.includes("Windowed Add-On Room"))).toBeUndefined();
    expect(names.find((n) => n.includes("Mess Hall"))).toBeUndefined();
  });

  it("Play Yard never returns add_on_room (already includes 2)", () => {
    const names = getAddOns("Play Yard", "preparing", "38", "18").map((a) => a.name);
    expect(names.find((n) => /^Add-On Room/.test(n))).toBeUndefined();
  });
});

// ============================================================
// 7. ADD-ON SIZE-AWARE LABELLING
// ============================================================
describe("Path 1 — getAddOns() size labelling", () => {
  it("Standard size 38 produces '38x38' pad labels", () => {
    const addons = getAddOns("Starter", "preparing", "38", "18", false);
    const pad = addons.find((a) => a.name.includes("Quick Dry Pads"));
    expect(pad?.name).toContain("38x38");
  });

  it("Small size 28 produces '28x28' pad labels", () => {
    const addons = getAddOns("Starter", "preparing", "28", "18", false);
    const pad = addons.find((a) => a.name.includes("Quick Dry Pads"));
    expect(pad?.name).toContain("28x28");
  });

  it("Large size 48 produces '48x48' pad labels", () => {
    const addons = getAddOns("Starter", "preparing", "48", "18", false);
    const pad = addons.find((a) => a.name.includes("Quick Dry Pads"));
    expect(pad?.name).toContain("48x48");
  });

  it("XL flag produces '48x76' pad labels regardless of boxSize arg", () => {
    const addons = getAddOns("Condo", "preparing", "48", "28", true);
    const pad = addons.find((a) => a.name.includes("Quick Dry Pads"));
    expect(pad?.name).toContain("48x76");
  });

  it("Tall panel (28) produces 28\" Acrylic Door label", () => {
    const addons = getAddOns("Pro", "preparing", "38", "28", false);
    const door = addons.find((a) => a.name.includes("Acrylic"));
    expect(door?.name).toContain("28\"");
  });

  it("Standard panel (18) produces 18\" Acrylic Door label", () => {
    const addons = getAddOns("Pro", "preparing", "38", "18", false);
    const door = addons.find((a) => a.name.includes("Acrylic"));
    expect(door?.name).toContain("18\"");
  });
});

// ============================================================
// 8. END-TO-END — computeFullResult()
// ============================================================
describe("Path 1 — computeFullResult() end-to-end", () => {
  it("Small dog + Starter route → 28\" box, 18\" panels", () => {
    const r = computeFullResult(
      baseData({ damSize: "under_16", breed: "Chihuahua", zones: 1, branchAnswer: false })
    );
    expect(r.bundle).toBe("Starter");
    expect(r.boxSize).toBe("28");
    expect(r.panelHeight).toBe("18");
    expect(r.padRecommendation).toBe("2-Pack Extra Pads");
    expect(r.addOns.length).toBeGreaterThan(0);
  });

  it("Medium dog + Pro route + tall containment → 38\" box, 28\" panels", () => {
    const r = computeFullResult(
      baseData({
        damSize: "16_40",
        breed: "Border Collie",
        zones: 2,
        branchAnswer: false,
        panelHeight: "28",
        containment: "active",
      })
    );
    expect(r.bundle).toBe("Pro");
    expect(r.boxSize).toBe("38");
    expect(r.panelHeight).toBe("28");
  });

  it("Large dog + Elite route → 48\" box, user-chosen panel respected", () => {
    const r = computeFullResult(
      baseData({ damSize: "40_90", breed: "Labrador Retriever", zones: 2, branchAnswer: true, panelHeight: "28" })
    );
    expect(r.bundle).toBe("Elite");
    expect(r.boxSize).toBe("48");
    expect(r.panelHeight).toBe("28");
  });

  it("Large dog + Play Yard route → panel forced to 18 even if user picked 28", () => {
    const r = computeFullResult(
      baseData({ damSize: "40_90", zones: 3, branchAnswer: false, panelHeight: "28" })
    );
    expect(r.bundle).toBe("Play Yard");
    expect(r.boxSize).toBe("48");
    expect(r.panelHeight).toBe("18");
  });

  it("XL dog (over_90) on any bundle → 48\" box, panel=28 (Play Yard exception forces 18)", () => {
    (["Starter", "Essential", "Pro", "Elite", "Play Yard", "Condo"] as const).forEach((targetBundle) => {
      const routing: Record<typeof targetBundle, { z: 1|2|3; b: boolean }> = {
        Starter: { z: 1, b: false },
        Essential: { z: 1, b: true },
        Pro: { z: 2, b: false },
        Elite: { z: 2, b: true },
        "Play Yard": { z: 3, b: false },
        Condo: { z: 3, b: true },
      };
      const { z, b } = routing[targetBundle];
      const r = computeFullResult(
        baseData({ damSize: "over_90", breed: "Great Dane", zones: z, branchAnswer: b })
      );
      expect(r.bundle).toBe(targetBundle);
      expect(r.boxSize).toBe("48");
      // computeFullResult applies the Play Yard override (zones=3 + branchAnswer=false → 18)
      // AFTER the confidence engine — so XL + Play Yard ends up at 18, not 28.
      const expectedPanel = (targetBundle === "Play Yard") ? "18" : "28";
      expect(r.panelHeight).toBe(expectedPanel);
    });
  });

  it("XL Condo result includes 48x76 pad labels (XL flag propagates to add-ons)", () => {
    const r = computeFullResult(
      baseData({ damSize: "over_90", breed: "Great Dane", zones: 3, branchAnswer: true })
    );
    const pad = r.addOns.find((a) => a.name.includes("Quick Dry Pads"));
    expect(pad?.name).toContain("48x76");
  });

  it("Result payload always exposes bundle, boxSize, panelHeight, padRecommendation, timelineBanner, addOns", () => {
    const r = computeFullResult(baseData());
    expect(r).toHaveProperty("bundle");
    expect(r).toHaveProperty("boxSize");
    expect(r).toHaveProperty("panelHeight");
    expect(r).toHaveProperty("padRecommendation");
    expect(r).toHaveProperty("timelineBanner");
    expect(r).toHaveProperty("addOns");
    expect(Array.isArray(r.addOns)).toBe(true);
  });
});

// ============================================================
// 9. EXHAUSTIVE 6 × 4 ROUTING MATRIX (24 combinations)
// ============================================================
describe("Path 1 — full 6 bundle × 4 dam size matrix (24 outcomes)", () => {
  const bundles: Array<{ name: BundleName; z: 1|2|3; b: boolean }> = [
    { name: "Starter",   z: 1, b: false },
    { name: "Essential", z: 1, b: true  },
    { name: "Pro",       z: 2, b: false },
    { name: "Elite",     z: 2, b: true  },
    { name: "Play Yard", z: 3, b: false },
    { name: "Condo",     z: 3, b: true  },
  ];
  // Breed must match damSize so the confidence engine's breed-vs-weight
  // tie-breaker doesn't size up. Use small litter to suppress litter sizing.
  const dams: Array<{ size: NewCustomerData["damSize"]; breed: string; box: "28"|"38"|"48" }> = [
    { size: "under_16", breed: "Chihuahua",          box: "28" },
    { size: "16_40",    breed: "Border Collie",      box: "38" },
    { size: "40_90",    breed: "Labrador Retriever", box: "48" },
    { size: "over_90",  breed: "Great Dane",         box: "48" },
  ];

  bundles.forEach(({ name, z, b }) => {
    dams.forEach(({ size, breed, box }) => {
      // Expected panel:
      //   - over_90 → 28 (XL hard rule), UNLESS Play Yard override (zones=3, branch=false) → 18
      //   - under_16 → 18 (Small hard rule)
      //   - medium/large → 18 (default user choice in baseData), unless Play Yard → 18 anyway
      const expectedPanel: "18" | "28" =
        size === "over_90" && name !== "Play Yard" ? "28" : "18";

      it(`${name} + damSize=${size} (${breed}) → bundle=${name}, box=${box}, panel=${expectedPanel}`, () => {
        const r = computeFullResult(
          baseData({ damSize: size, breed, zones: z, branchAnswer: b, panelHeight: "18", litterSize: "small" })
        );
        expect(r.bundle).toBe(name);
        expect(r.boxSize).toBe(box);
        expect(r.panelHeight).toBe(expectedPanel);
      });
    });
  });
});
