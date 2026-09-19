import { describe, expect, it } from "vitest";
import { describeBox, getMeadowScene, initialMeadowScene } from "@/lib/meadow-scene";
import type { ExistingCustomerData, NewCustomerData } from "@/lib/types";

const fresh: NewCustomerData = { timeline: null, dueDate: null, breed: "", experience: null, litterSize: null, containment: null, zones: null, branchAnswer: null, damSize: null, panelHeight: null, hasWindow: null };
const existing: ExistingCustomerData = { breed: "", damSize: null, experience: null, boxSize: null, boxHeight: null, hasWindow: null, stage: null, dueDate: null };

describe("answer-driven meadow", () => {
  it.each([["preparing", "expecting"], ["due_7_days", "expecting"], ["born_0_3", "sleeping"], ["born_1_plus", "playful"]] as const)("maps %s to %s", (timeline, stage) => {
    expect(getMeadowScene("new", { ...fresh, timeline }, existing, false).stage).toBe(stage);
  });

  it("adds heat only when the user selects heating", () => {
    expect(getMeadowScene("new", { ...fresh, zones: 3, branchAnswer: true }, existing, false).heating).toBe(true);
    expect(getMeadowScene("new", { ...fresh, zones: 3, branchAnswer: false }, existing, false).heating).toBe(false);
  });

  it("does not carry an old path's scene into a new one", () => {
    expect(getMeadowScene(null, { ...fresh, breed: "Poodle", zones: 3 }, existing, false)).toEqual(initialMeadowScene);
    expect(getMeadowScene("existing", fresh, { ...existing, breed: "Beagle", boxSize: "28" }, true)).toMatchObject({ breed: "Beagle", zones: 1, heating: false, complete: true });
  });

  it("draws the box a new customer is being recommended", () => {
    const small = getMeadowScene("new", { ...fresh, damSize: "under_16" }, existing, false);
    expect(small.box).toEqual({ width: 28, depth: 28, panel: 18, window: false });

    // XL/Giant is the only rectangular box, and it is always tall.
    const giant = getMeadowScene("new", { ...fresh, damSize: "over_90", hasWindow: "yes" }, existing, false);
    expect(giant.box).toEqual({ width: 48, depth: 76, panel: 28, window: true });

    // Medium/large take the height the customer picked.
    const tall = getMeadowScene("new", { ...fresh, damSize: "40_90", panelHeight: "28" }, existing, false);
    expect(tall.box).toMatchObject({ width: 48, depth: 48, panel: 28 });
  });

  it("draws the box an existing customer already owns", () => {
    const xl = getMeadowScene("existing", fresh, { ...existing, boxSize: "48xl", boxHeight: "28", hasWindow: "yes" }, false);
    expect(xl.box).toEqual({ width: 48, depth: 76, panel: 28, window: true });

    // An unsure height falls back to the common standard panel.
    const unsureHeight = getMeadowScene("existing", fresh, { ...existing, boxSize: "38", boxHeight: "unsure" }, false);
    expect(unsureHeight.box).toMatchObject({ depth: 38, panel: 18 });
  });

  it("draws no box until the size is actually known", () => {
    expect(getMeadowScene("new", fresh, existing, false).box).toBeNull();
    expect(getMeadowScene("existing", fresh, { ...existing, boxSize: "unsure" }, false).box).toBeNull();
  });

  it("describes what the drawing is showing", () => {
    expect(describeBox({ width: 48, depth: 76, panel: 28, window: true })).toBe("48\u00d776 \u00b7 Tall panels \u00b7 Viewing window");
    expect(describeBox({ width: 28, depth: 28, panel: 18, window: false })).toBe("28\u00d728 \u00b7 Standard panels \u00b7 Solid panels");
  });
});
