import type { CustomerType, ExistingCustomerData, NewCustomerData } from "./types";

export interface MeadowScene {
  breed: string;
  size: NewCustomerData["damSize"];
  stage: "waiting" | "expecting" | "sleeping" | "growing" | "playful";
  zones: number;
  heating: boolean;
  complete: boolean;
}

export const initialMeadowScene: MeadowScene = {
  breed: "", size: null, stage: "waiting", zones: 0, heating: false, complete: false,
};

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
  };
}

export function getDogLook(breed: string) {
  const name = breed.toLowerCase();
  if (/husky|malamute|shepherd|corgi|akita|shiba|spitz/.test(name)) return { coat: "#b9b5aa", patch: "#626669", ears: "pointed" as const, fluffy: false };
  if (/poodle|doodle|bichon/.test(name)) return { coat: "#eee0c5", patch: "#be9d76", ears: "floppy" as const, fluffy: true };
  if (/dalmatian|collie/.test(name)) return { coat: "#f6efdd", patch: "#514d49", ears: "floppy" as const, fluffy: false };
  if (/beagle|basset|dachshund/.test(name)) return { coat: "#dca366", patch: "#785438", ears: "long" as const, fluffy: false };
  if (/labrador|retriever/.test(name)) return { coat: "#e8bc79", patch: "#bd8a50", ears: "floppy" as const, fluffy: false };
  // A deterministic illustrated coat for other breeds, including custom entries.
  const palettes = [["#eed8ae", "#aa7f5a"], ["#c6b6a0", "#786957"], ["#efe8d9", "#ad8066"]];
  const index = Array.from(name).reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % palettes.length;
  return { coat: palettes[index][0], patch: palettes[index][1], ears: "floppy" as const, fluffy: false };
}
