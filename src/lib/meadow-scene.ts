import { computeBoxSize, computePanelHeight } from "./structural-engine";
import type { BoxSpec } from "./kennel-geometry";
import type { CustomerType, ExistingCustomerData, NewCustomerData } from "./types";

export interface MeadowScene {
  breed: string;
  size: NewCustomerData["damSize"];
  stage: "waiting" | "expecting" | "sleeping" | "growing" | "playful";
  zones: number;
  heating: boolean;
  complete: boolean;
  /** The box they are being recommended, or already own, once it is known. */
  box: BoxSpec | null;
}

export const initialMeadowScene: MeadowScene = {
  breed: "", size: null, stage: "waiting", zones: 0, heating: false, complete: false, box: null,
};

/** 48×76 is the XL/Giant box; every other size is square. */
function footprint(boxSize: "28" | "38" | "48" | "48xl") {
  if (boxSize === "48xl") return { width: 48, depth: 76 };
  const side = Number(boxSize);
  return { width: side, depth: side };
}

/** New customers have a box recommended for them, existing customers tell us
 *  which one they own. The drawing must never contradict the recommendation,
 *  so sizing comes from the same resolvers the engines use. */
function getBoxSpec(type: CustomerType, fresh: NewCustomerData, existing: ExistingCustomerData): BoxSpec | null {
  if (type === "new") {
    if (!fresh.damSize) return null;
    const size = fresh.damSize === "over_90" ? "48xl" : computeBoxSize(fresh.damSize);
    const panel = computePanelHeight(fresh.damSize, fresh.panelHeight, fresh.zones, fresh.branchAnswer);
    return { ...footprint(size), panel: Number(panel), window: fresh.hasWindow === "yes" };
  }
  if (type === "existing") {
    if (!existing.boxSize || existing.boxSize === "unsure") return null;
    // An unsure height is far more likely to be the common standard panel.
    const panel = existing.boxHeight && existing.boxHeight !== "unsure" ? Number(existing.boxHeight) : 18;
    return { ...footprint(existing.boxSize), panel, window: existing.hasWindow === "yes" };
  }
  return null;
}

// Scene props come only from the active path, so switching paths cannot leak answers.
export function getMeadowScene(type: CustomerType, fresh: NewCustomerData, existing: ExistingCustomerData, complete: boolean): MeadowScene {
  if (!type) return initialMeadowScene;
  const data = type === "new" ? fresh : existing;
  const timeline = type === "new" ? fresh.timeline : existing.stage;
  const stage = timeline === "preparing" || timeline === "due_7_days" ? "expecting"
    : timeline === "born_0_3" ? "sleeping"
    : timeline === "1_2_weeks" ? "growing"
    : timeline === "born_1_plus" || timeline === "3_plus_weeks" ? "playful" : "waiting";
  return {
    breed: data.breed, size: data.damSize, stage, complete,
    zones: type === "new" ? fresh.zones ?? 0 : existing.boxSize && existing.boxSize !== "unsure" ? 1 : 0,
    // branchAnswer also means tools/monitoring on other branches, never heat there.
    heating: type === "new" && fresh.zones === 3 && fresh.branchAnswer === true,
    box: getBoxSpec(type, fresh, existing),
  };
}

/** "48×76 · Tall panels · Viewing window" — says out loud what the drawing shows. */
export function describeBox(box: BoxSpec) {
  return [
    `${box.width}×${box.depth}`,
    box.panel === 28 ? "Tall panels" : "Standard panels",
    box.window ? "Viewing window" : "Solid panels",
  ].join(" · ");
}
