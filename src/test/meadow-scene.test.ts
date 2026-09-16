import { describe, expect, it } from "vitest";
import { getDogLook, getMeadowScene, initialMeadowScene } from "@/lib/meadow-scene";
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

  it("chooses breed-specific illustrated features", () => {
    expect(getDogLook("German Shepherd").ears).toBe("pointed");
    expect(getDogLook("Beagle").ears).toBe("long");
    expect(getDogLook("Poodle").fluffy).toBe(true);
  });
});
