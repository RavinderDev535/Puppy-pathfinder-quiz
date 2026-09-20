import type { CSSProperties } from "react";
import { MeadowPuppy, type PuppyPose } from "@/components/art/MeadowDog";
import { FeedingArea, HeatLamp, PlayBall } from "@/components/art/KennelArt";
import homeArt from "@/assets/meadow/reference-home-empty.png";
import { describeBox, type MeadowScene } from "@/lib/meadow-scene";

// Coordinates are anchored to the 941 × 1672 reference artwork, not the viewport.
// Keep existing puppies in place as subsequent quiz steps reveal new arrivals.
const spots: { x: number; y: number; width: number; pose: PuppyPose; activity: string; pen: "box" | "yard" | "entrance" }[] = [
  { x: 482, y: 777, width: 105, pose: "sit", activity: "sitting", pen: "box" },
  { x: 581, y: 751, width: 126, pose: "lie", activity: "jumping", pen: "box" },
  { x: 195, y: 980, width: 136, pose: "stand", activity: "eating", pen: "yard" },
  { x: 390, y: 737, width: 112, pose: "curl", activity: "sleeping", pen: "box" },
  { x: 548, y: 1045, width: 167, pose: "sprawl", activity: "stretching", pen: "yard" },
  { x: 753, y: 1015, width: 153, pose: "walk", activity: "playing with a ball", pen: "yard" },
  { x: 430, y: 1249, width: 120, pose: "sit", activity: "sitting", pen: "entrance" },
  { x: 718, y: 1400, width: 175, pose: "lie", activity: "jumping", pen: "entrance" },
  { x: 250, y: 1490, width: 155, pose: "stand", activity: "eating", pen: "entrance" },
  { x: 172, y: 1063, width: 108, pose: "curl", activity: "sleeping", pen: "yard" },
  { x: 350, y: 1030, width: 163, pose: "sprawl", activity: "stretching", pen: "yard" },
  { x: 645, y: 1236, width: 108, pose: "sit", activity: "sitting", pen: "entrance" },
];

export default function ReferencePuppyHome({ count, scene }: { count: number; scene: MeadowScene }) {
  const puppies = spots.slice(0, Math.max(0, count));
  const renderPuppy = (spot: typeof spots[number], i: number) => (
    <div key={i} className="puppy-arrival reference-puppy" data-testid="meadow-puppy" data-puppy-id={i}
      data-pen={spot.pen} data-coat={i < 6 ? "golden" : i === 11 ? "chestnut" : "cocoa"}
      aria-label={`Puppy ${i + 1}, ${spot.activity}`}
      style={{ left: `${(spot.x - spot.width / 2) / 941 * 100}%`, bottom: `${(1672 - spot.y) / 1672 * 100}%`, width: `${spot.width / 941 * 100}%`, zIndex: spot.y } as CSSProperties}>
      <MeadowPuppy pose={spot.pose} style={{ width: "100%" }} />
    </div>
  );

  return <div className="puppy-meadow meadow-has-kennel reference-meadow" aria-label={`Two adult dogs and ${puppies.length} puppies`}>
    <div className="reference-family-name" role="status">{scene.breed ? `${scene.breed} family` : "A happy home for little paws"}</div>
    <div className="kennel-stage reference-home-stage" aria-label="Illustrated setup preview">
      <div className="reference-home-canvas">
        <img className="reference-home-art kennel-back" src={homeArt} alt="White puppy playpen with a raised nursery, viewing windows and an open front entrance" draggable={false} />
        <span className="sr-slot" aria-label="Dad, the watchful protector">Dad</span>
        <span className="sr-slot" aria-label="Mom, the gentle caretaker">Mom</span>
        <span className="sr-slot" aria-label="Whelping box" />
        <span className="sr-slot" aria-label={scene.zones >= 2 ? "Play yard" : "Family play yard"} />
        <div className="reference-puppy-layer kennel-nursery-puppies">{puppies.map((p, i) => p.pen === "box" ? renderPuppy(p, i) : null)}</div>
        <div className="reference-puppy-layer">{puppies.map((p, i) => p.pen === "yard" ? renderPuppy(p, i) : null)}</div>
        <div className="reference-puppy-layer kennel-entrance-puppies">{puppies.map((p, i) => p.pen === "entrance" ? renderPuppy(p, i) : null)}</div>
        {/* Reuse just the foreground rails from the same artwork for natural occlusion. */}
        <img className="reference-front-rails" src={homeArt} alt="" aria-hidden="true" draggable={false} />
        <img className="reference-front-rails reference-nursery-rail" src={homeArt} alt="" aria-hidden="true" draggable={false} />
        {scene.zones >= 3 && <div className="reference-prop reference-bowls" aria-label="Feeding area"><FeedingArea /></div>}
        {(scene.zones >= 2 || scene.stage === "playful") && <div className="reference-prop reference-ball" aria-label="Playtime toys"><PlayBall /></div>}
        {scene.heating && <div className="reference-prop reference-heat" aria-label="Heat lamp included"><HeatLamp /></div>}
        {(scene.stage === "expecting" || scene.stage === "sleeping") && <div className="reference-prop reference-blankets scene-blankets" aria-label="Fresh blankets for the nursery"><span /><span /></div>}
        {scene.tools && <div className="reference-prop reference-kit" aria-label="Breeder care kit"><svg viewBox="0 0 100 85" aria-hidden="true"><path d="M33 27V15h34v12" fill="none" stroke="#674832" strokeWidth="6" /><rect x="8" y="27" width="84" height="52" rx="9" fill="#fff1d5" stroke="#674832" strokeWidth="3" /><path d="M50 39v27M37 52h26" stroke="#cc8569" strokeWidth="9" /></svg></div>}
        {scene.monitoring && <div className="reference-prop reference-camera" aria-label="WiFi puppy monitor"><svg viewBox="0 0 80 110" aria-hidden="true"><path d="M40 60v37m-20 4h40" stroke="#674832" strokeWidth="5" /><rect x="12" y="25" width="56" height="39" rx="12" fill="#fff9eb" stroke="#674832" strokeWidth="3" /><circle cx="40" cy="44" r="12" fill="#577d87" /><path d="M26 15q14-12 28 0" fill="none" stroke="#577d87" strokeWidth="3" /></svg></div>}
      </div>
    </div>
    <p className="reference-home-note">{scene.box ? `Recommended box: ${describeBox(scene.box)} · Scene is illustrative` : "Your puppy family grows with every step"}</p>
  </div>;
}
