import { createRoot } from "react-dom/client";
import PuppyMeadow from "@/components/PuppyMeadow";
import { initialMeadowScene } from "@/lib/meadow-scene";
import "@/storybook.css";
const scene = { ...initialMeadowScene, breed: "Beagle", size: "40_90" as const, stage: "playful" as const, zones: 3, heating: true,
  box: { width: 48, depth: 48, panel: 18, window: true } };
// ?playing renders the thin in-quiz strip, which lays the meadow out very
// differently from the full-page scene.
const params = new URLSearchParams(location.search);
const playing = params.has("playing");
const count = Math.max(0, Math.min(12, Number(params.get("count") ?? 8) || 0));
createRoot(document.getElementById("root")!).render(
  <main className={`storybook${playing ? " storybook-playing" : ""}`}><PuppyMeadow count={count} scene={scene} /></main>
);
