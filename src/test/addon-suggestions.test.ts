import { describe, it, expect } from "vitest";
import { getAddOns } from "@/lib/structural-engine";
import { BundleName } from "@/lib/types";

/**
 * ADD-ON SUGGESTION TESTS
 * 
 * For each bundle, verifies:
 * 1. Correct add-ons appear (by name)
 * 2. Incorrect add-ons do NOT appear (items already included in the bundle)
 * 3. Add-ons appear in the correct priority order
 */

function getAddOnNames(bundle: BundleName): string[] {
  return getAddOns(bundle, "due_7_days", "48", "28").map(a => a.name);
}

function containsName(names: string[], partial: string): boolean {
  return names.some(n => n.includes(partial));
}

// ===== STARTER BUNDLE =====
describe("Starter Bundle add-ons", () => {
  const names = getAddOnNames("Starter");

  it("shows exactly 8 suggested add-ons", () => {
    expect(names).toHaveLength(8);
  });

  it("includes Whelping Kit", () => {
    expect(names).toContain("Whelping Kit");
  });

  it("includes Puppy Collar Set (24 Pack)", () => {
    expect(names).toContain("Puppy Collar Set (24 Pack)");
  });

  it("includes Corner Seat", () => {
    expect(names).toContain("Corner Seat");
  });

  it("includes Puppy Feeding Station", () => {
    expect(names).toContain("Puppy Feeding Station");
  });

  it("includes Smart WiFi Camera + Temp Monitor", () => {
    expect(names).toContain("Smart WiFi Camera + Temp Monitor");
  });

  it("includes Traction Pad", () => {
    expect(names).toContain("Traction Pad");
  });

  it("includes Reusable Quick Dry Pads", () => {
    expect(containsName(names, "Reusable Quick Dry Pads")).toBe(true);
  });

  it("includes Reusable Slip Resistant Pads", () => {
    expect(containsName(names, "Reusable Slip Resistant Pads")).toBe(true);
  });

  it("does NOT include Extra Whelping Pads (already in bundle)", () => {
    expect(names).not.toContain("Extra Whelping Pads");
  });

  it("does NOT include Heat Combo (already in bundle)", () => {
    expect(names).not.toContain("Heat Combo");
  });

  it("shows add-ons in correct priority order", () => {
    expect(names[0]).toBe("Whelping Kit");
    expect(names[1]).toBe("Puppy Collar Set (24 Pack)");
    expect(names[2]).toBe("Corner Seat");
    expect(names[3]).toBe("Puppy Feeding Station");
  });
});

// ===== ESSENTIAL BUNDLE =====
describe("Essential Bundle add-ons", () => {
  const names = getAddOnNames("Essential");

  it("shows exactly 6 suggested add-ons", () => {
    expect(names).toHaveLength(6);
  });

  it("includes Puppy Feeding Station", () => {
    expect(names).toContain("Puppy Feeding Station");
  });

  it("includes Smart WiFi Camera + Temp Monitor", () => {
    expect(names).toContain("Smart WiFi Camera + Temp Monitor");
  });

  it("includes Traction Pad", () => {
    expect(names).toContain("Traction Pad");
  });

  it("includes Acrylic Glass Door Set (TALL variant for 28\" panels)", () => {
    expect(containsName(names, "Acrylic Glass Door")).toBe(true);
  });

  it("includes Reusable Quick Dry Pads", () => {
    expect(containsName(names, "Reusable Quick Dry Pads")).toBe(true);
  });

  it("includes Reusable Slip Resistant Pads", () => {
    expect(containsName(names, "Reusable Slip Resistant Pads")).toBe(true);
  });

  it("does NOT include Whelping Kit (already in bundle)", () => {
    expect(names).not.toContain("Whelping Kit");
  });

  it("does NOT include Puppy Collar Set (already in bundle)", () => {
    expect(names).not.toContain("Puppy Collar Set (24 Pack)");
  });

  it("does NOT include Corner Seat (already in bundle)", () => {
    expect(names).not.toContain("Corner Seat");
  });
});

// ===== PRO BUNDLE =====
describe("Pro Bundle add-ons", () => {
  const names = getAddOnNames("Pro");

  it("shows exactly 6 suggested add-ons", () => {
    expect(names).toHaveLength(6);
  });

  it("includes Acrylic Glass Door Set", () => {
    expect(containsName(names, "Acrylic Glass Door")).toBe(true);
  });

  it("includes Traction Pad", () => {
    expect(names).toContain("Traction Pad");
  });

  it("includes Smart WiFi Camera + Temp Monitor", () => {
    expect(names).toContain("Smart WiFi Camera + Temp Monitor");
  });

  it("includes Puppy Feeding Station (additional)", () => {
    expect(names).toContain("Puppy Feeding Station");
  });

  it("includes Reusable Quick Dry Pads", () => {
    expect(containsName(names, "Reusable Quick Dry Pads")).toBe(true);
  });

  it("includes Reusable Slip Resistant Pads", () => {
    expect(containsName(names, "Reusable Slip Resistant Pads")).toBe(true);
  });

  it("does NOT include Whelping Kit (already in bundle)", () => {
    expect(names).not.toContain("Whelping Kit");
  });

  it("does NOT include Corner Seat (already in bundle)", () => {
    expect(names).not.toContain("Corner Seat");
  });

  it("does NOT include Add-On Room (already in bundle)", () => {
    expect(names).not.toContain("TALL Add-On Room");
    expect(names).not.toContain("Add-On Room");
  });

  it("shows Acrylic Door first in priority", () => {
    expect(names[0]).toContain("Acrylic Glass Door");
  });
});

// ===== ELITE BUNDLE =====
// Per spec sheet 3 (count column): Elite has 3 add-ons — Add-On Room,
// Quick Dry, Slip Resistant. Mess Hall was previously listed but is not
// in the spec matrix and has been removed.
describe("Elite Bundle add-ons", () => {
  const names = getAddOnNames("Elite");

  it("shows exactly 3 suggested add-ons (per spec sheet 3)", () => {
    expect(names).toHaveLength(3);
  });

  it("includes Add-On Room (additional modules)", () => {
    expect(containsName(names, "Add-On Room")).toBe(true);
  });

  it("does NOT include Mess Hall (removed — not in spec sheet 3 matrix for Elite)", () => {
    expect(containsName(names, "Mess Hall")).toBe(false);
  });

  it("includes Reusable Quick Dry Pads", () => {
    expect(containsName(names, "Reusable Quick Dry Pads")).toBe(true);
  });

  it("includes Reusable Slip Resistant Pads", () => {
    expect(containsName(names, "Reusable Slip Resistant Pads")).toBe(true);
  });

  it("does NOT include Smart WiFi Camera (already in bundle)", () => {
    expect(names).not.toContain("Smart WiFi Camera + Temp Monitor");
  });

  it("does NOT include Traction Pad (already in bundle)", () => {
    expect(names).not.toContain("Traction Pad");
  });

  it("does NOT include Acrylic Door (already in bundle)", () => {
    expect(containsName(names, "Acrylic Glass Door")).toBe(false);
  });

  it("does NOT include Puppy Feeding Station (already in bundle)", () => {
    expect(names).not.toContain("Puppy Feeding Station");
  });
});

// ===== PLAY YARD =====
describe("Play Yard add-ons", () => {
  // Play Yard uses standard panels (18") per code override
  const names = getAddOns("Play Yard", "born_1_plus", "48", "18").map(a => a.name);

  it("shows exactly 5 suggested add-ons", () => {
    expect(names).toHaveLength(5);
  });

  it("includes Smart WiFi Camera + Temp Monitor", () => {
    expect(names).toContain("Smart WiFi Camera + Temp Monitor");
  });

  it("includes Traction Pad", () => {
    expect(names).toContain("Traction Pad");
  });

  it("includes Puppy Feeding Station", () => {
    expect(names).toContain("Puppy Feeding Station");
  });

  it("includes Reusable Quick Dry Pads", () => {
    expect(containsName(names, "Reusable Quick Dry Pads")).toBe(true);
  });

  it("includes Reusable Slip Resistant Pads", () => {
    expect(containsName(names, "Reusable Slip Resistant Pads")).toBe(true);
  });

  it("does NOT include Add-On Room (already in bundle)", () => {
    expect(names).not.toContain("Add-On Room");
    expect(names).not.toContain("TALL Add-On Room");
  });

  it("does NOT include Heat Combo (not in Play Yard)", () => {
    expect(names).not.toContain("Heat Combo");
  });

  it("does NOT include Corner Seat", () => {
    expect(names).not.toContain("Corner Seat");
  });
});

// ===== CONDO =====
describe("Condo add-ons", () => {
  const names = getAddOnNames("Condo");

  it("shows exactly 6 suggested add-ons", () => {
    expect(names).toHaveLength(6);
  });

  it("includes Smart WiFi Camera + Temp Monitor", () => {
    expect(names).toContain("Smart WiFi Camera + Temp Monitor");
  });

  it("includes Traction Pad", () => {
    expect(names).toContain("Traction Pad");
  });

  it("includes Puppy Feeding Station", () => {
    expect(names).toContain("Puppy Feeding Station");
  });

  it("includes Corner Seat", () => {
    expect(names).toContain("Corner Seat");
  });

  it("includes Reusable Quick Dry Pads", () => {
    expect(containsName(names, "Reusable Quick Dry Pads")).toBe(true);
  });

  it("includes Reusable Slip Resistant Pads", () => {
    expect(containsName(names, "Reusable Slip Resistant Pads")).toBe(true);
  });

  it("does NOT include Add-On Room (already in bundle)", () => {
    expect(containsName(names, "Add-On Room")).toBe(false);
  });

  it("does NOT include Mess Hall (already in bundle)", () => {
    expect(containsName(names, "Mess Hall")).toBe(false);
  });

  it("does NOT include Heat Combo (already in bundle)", () => {
    expect(names).not.toContain("Heat Combo");
  });
});

// ===== VARIANT-AWARE URL TESTS =====
describe("Add-on URLs are variant-aware", () => {
  it("Tall panels (28\") with 48x48 box get 48x48 pad URLs (not 48x76)", () => {
    const addOns = getAddOns("Starter", "due_7_days", "48", "28");
    const quickDry = addOns.find(a => a.name.includes("Reusable Quick Dry Pads"));
    expect(quickDry?.url).toContain("variant=46535234322674"); // 48x48 variant, NOT 48x76
  });

  it("Standard panels (18\") get box-sized pad URLs", () => {
    const addOns = getAddOns("Starter", "due_7_days", "38", "18");
    const quickDry = addOns.find(a => a.name.includes("Reusable Quick Dry Pads"));
    expect(quickDry?.url).toContain("variant=46535234289906"); // 38x38 variant
  });

  it("48x48 box with standard panels gets 48x48 pad URLs", () => {
    const addOns = getAddOns("Starter", "due_7_days", "48", "18");
    const quickDry = addOns.find(a => a.name.includes("Reusable Quick Dry Pads"));
    expect(quickDry?.url).toContain("variant=46535234322674"); // 48x48 variant
    const slipRes = addOns.find(a => a.name.includes("Reusable Slip Resistant Pads"));
    expect(slipRes?.url).toContain("variant=43769303040242"); // 48x48 variant
  });

  it("28x28 box gets 28x28 pad URLs", () => {
    const addOns = getAddOns("Starter", "due_7_days", "28", "18");
    const quickDry = addOns.find(a => a.name.includes("Reusable Quick Dry Pads"));
    expect(quickDry?.url).toContain("variant=46535234257138"); // 28x28 variant
    const slipRes = addOns.find(a => a.name.includes("Reusable Slip Resistant Pads"));
    expect(slipRes?.url).toContain("variant=43769299075314"); // 28x28 variant
  });

  it("Traction pad URL matches box size", () => {
    const addOns38 = getAddOns("Starter", "due_7_days", "38", "18");
    const traction38 = addOns38.find(a => a.name === "Traction Pad");
    expect(traction38?.url).toContain("variant=43956779942130"); // 38 variant

    const addOns48 = getAddOns("Starter", "due_7_days", "48", "18");
    const traction48 = addOns48.find(a => a.name === "Traction Pad");
    expect(traction48?.url).toContain("variant=43956779974898"); // 48 variant
  });

  it("Acrylic Door URL matches panel height", () => {
    const standard = getAddOns("Essential", "due_7_days", "48", "18");
    const doorStd = standard.find(a => a.name.includes("Acrylic Glass Door"));
    expect(doorStd?.url).toContain("variant=44460059263218"); // Standard

    const tall = getAddOns("Essential", "due_7_days", "48", "28");
    const doorTall = tall.find(a => a.name.includes("Acrylic Glass Door"));
    expect(doorTall?.url).toContain("variant=44460059295986"); // Tall
  });

  it("Slip Resistant pads match box size (tall panels don't upsize to 48x76)", () => {
    const addOns38 = getAddOns("Starter", "due_7_days", "38", "18");
    const slip38 = addOns38.find(a => a.name.includes("Reusable Slip Resistant Pads"));
    expect(slip38?.url).toContain("variant=43769300418802"); // 38x38

    const addOnsTall = getAddOns("Starter", "due_7_days", "48", "28");
    const slipTall = addOnsTall.find(a => a.name.includes("Reusable Slip Resistant Pads"));
    expect(slipTall?.url).toContain("variant=43769303040242"); // 48x48, NOT 48x76
  });
});
