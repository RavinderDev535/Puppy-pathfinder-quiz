import { createRoot } from "react-dom/client";
import PuppyMeadow from "@/components/PuppyMeadow";
import { initialMeadowScene } from "@/lib/meadow-scene";
import "@/storybook.css";
const scene = { ...initialMeadowScene, breed: "Beagle", size: "40_90" as const, stage: "playful" as const, zones: 3, heating: true,
  box: { width: 48, depth: 48, panel: 18, window: true } };
createRoot(document.getElementById("root")!).render(
  <main className="storybook"><PuppyMeadow count={8} scene={scene} /></main>
);
