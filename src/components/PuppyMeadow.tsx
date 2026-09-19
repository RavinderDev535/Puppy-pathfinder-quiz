import type { CSSProperties } from "react";
import { MeadowAdult, MeadowPuppy, type PuppyPose } from "@/components/art/MeadowDog";
import { FeedingArea, HeatLamp, KennelBack, KennelBoxFront, KennelYardFront, PicketFence } from "@/components/art/KennelArt";
import { DEFAULT_BOX, kennelGeometry } from "@/lib/kennel-geometry";
import { describeBox, initialMeadowScene, type MeadowScene } from "@/lib/meadow-scene";

const puppyActivities = ["sleeping", "eating", "jumping", "sitting", "playing", "stretching"] as const;
type PuppyActivity = (typeof puppyActivities)[number];

const activityLabels: Record<PuppyActivity, string> = {
  sleeping: "sleeping", eating: "eating", jumping: "jumping", sitting: "sitting", playing: "playing with a ball", stretching: "stretching",
};

/** Each activity gets its own drawing from the pose sheet — all six are used. */
const activityPose: Record<PuppyActivity, PuppyPose> = {
  sleeping: "curl", eating: "stand", jumping: "walk", sitting: "sit", playing: "walk", stretching: "sprawl",
};

/** Puppies bedded down in the box are resting, whatever else is going on. */
const restingPoses: PuppyPose[] = ["curl", "lie", "sprawl"];

/** How much of the litter is still in the box at each stage of the story:
 *  newborns are all in, and they spill out into the yard as they grow. */
const insideShare: Record<MeadowScene["stage"], number> = {
  waiting: 0, expecting: 0, sleeping: 1, growing: 0.5, playful: 0.25,
};

/** Spots on the box floor, in normalised floor coordinates. Both axes run
 *  toward the reader, so these stay in the back half where the near panel does
 *  not bury them. */
const boxSlots: Array<[number, number]> = [
  [0.18, 0.30], [0.43, 0.20], [0.70, 0.18], [0.28, 0.50], [0.56, 0.38], [0.82, 0.32],
  [0.14, 0.60], [0.43, 0.64], [0.70, 0.55], [0.87, 0.50],
];

/** Spots on the yard floor. Values past 1 fall outside the pen, onto the grass
 *  in front of it — which is where the boldest puppies end up. */
const yardSlots: Array<[number, number]> = [
  [0.74, 0.24], [0.28, 0.66], [0.78, 0.46], [0.44, 0.84], [0.68, 0.72], [0.55, 0.97],
];

/** Place an element on a point in the kennel's viewBox, standing on it. */
function place(at: { x: number; y: number }, geom: { vw: number; vh: number }, z: number): CSSProperties {
  return {
    position: "absolute",
    left: `${(at.x / geom.vw) * 100}%`,
    top: `${(at.y / geom.vh) * 100}%`,
    transform: "translate(-50%, -78%)",
    zIndex: z,
  };
}

export default function PuppyMeadow({ count, scene = initialMeadowScene }: { count: number; scene?: MeadowScene }) {
  const motherScale = scene.size === "under_16" ? .76 : scene.size === "40_90" ? 1.13 : scene.size === "over_90" ? 1.25 : 1;
  const stageText = { waiting: "A little family, a new beginning", expecting: "Mom is expecting · your puppy family is on its way", sleeping: "Tiny paws, sleepy newborns", growing: "Little stretches, growing puppies", playful: "Bigger adventures for playful puppies" }[scene.stage];

  // The kennel appears as soon as they choose how many zones they need, then
  // takes on their real size once the box questions are answered.
  const showKennel = scene.zones > 0;
  const box = scene.box ?? DEFAULT_BOX;
  const geometry = kennelGeometry(box, scene.zones >= 2);
  // When there is no play yard yet, the box is the whole safe enclosure. Keep
  // the litter visibly *in* it instead of scattering puppies across the grass
  // below the panels.
  const inBox = showKennel
    ? geometry.yard ? Math.min(boxSlots.length, Math.round(count * insideShare[scene.stage])) : Math.min(boxSlots.length, count)
    : 0;

  const puppies = Array.from({ length: count }, (_, i) => {
    const inside = i < inBox;
    // A puppy bedded down in the box is resting, so say so rather than
    // claiming it is off playing with a ball.
    const activity: PuppyActivity = inside ? "sleeping" : puppyActivities[i % puppyActivities.length];
    const pose = inside ? restingPoses[i % restingPoses.length] : activityPose[activity];
    return { i, inside, activity, pose };
  });

  const renderPuppy = ({ i, inside, activity, pose }: (typeof puppies)[number], style: CSSProperties) => (
    <div
      className={`puppy-arrival puppy-${activity} pose-${pose}${inside ? " in-box" : ""}`}
      key={i}
      data-testid="meadow-puppy"
      aria-label={`Puppy ${i + 1}, ${activityLabels[activity]}`}
      style={{ "--delay": `${i % 4 * -.6}s`, "--tilt": `${i % 2 ? -4 : 3}deg`, ...style } as CSSProperties}
    >
      <MeadowPuppy pose={pose} />
      {activity === "sleeping" && <span className="sleep-bubbles" aria-hidden="true">z z Z</span>}
      {activity === "eating" && <span className="puppy-bowl" aria-hidden="true"><i /></span>}
      {activity === "playing" && <span className="puppy-ball" aria-hidden="true" />}
      {scene.stage === "expecting" && <span className="puppy-dream" aria-hidden="true">♡</span>}
    </div>
  );

  return <div className={`puppy-meadow stage-${scene.stage}${scene.complete ? " meadow-complete" : ""}`} aria-label={`Two adult dogs and ${count} puppies`}>
    <div className="meadow-caption" role="status" aria-live="polite">
      {scene.complete ? "Hooray! Your family's setup is ready to explore." : stageText}
      {scene.breed && <small>{scene.breed} family</small>}
    </div>
    <svg className="meadow-hills" viewBox="0 0 1440 330" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 58Q180 9 380 68T760 52T1100 44T1440 8V330H0Z" fill="#bdd173" stroke="#829747" strokeWidth="3" />
      <path d="M0 154Q220 79 510 127T940 116T1440 79V330H0Z" fill="#abc65f" />
      <defs><pattern id="grass" width="63" height="47" patternUnits="userSpaceOnUse"><path d="M12 32l-3-8m3 8 4-12m-4 12 9-5" stroke="#819b46" strokeWidth="1.4" opacity=".6" /></pattern></defs>
      <path d="M0 68Q300 20 520 90T1000 60T1440 25V330H0Z" fill="url(#grass)" />
    </svg>
    {["left", "right"].map(side => <PicketFence key={side} className={`story-fence fence-${side}`} />)}
    <div className="meadow-family">
      <div className="adult-dog dog-dad" aria-label="Dad, the watchful protector">
        <MeadowAdult role="dad" />
        <span>Dad <em>watchful protector</em></span>
      </div>
      <div className="adult-dog dog-mom" data-size={scene.size ?? "default"} aria-label="Mom, the gentle caretaker">
        <div className="mother-size" style={{ transform: `scale(${motherScale})` }}>
          <MeadowAdult role="mom" />
        </div>
        <span>Mom <em>gentle caretaker</em></span>
      </div>

      {showKennel ? (
        <div className="kennel-stage" aria-label="Illustrated setup preview" style={{ aspectRatio: `${geometry.vw} / ${geometry.vh}` }}>
          {/* Painter's order: far walls and floor, then the animals, then each
              pen's near walls, so a puppy in the box sits behind its panel. */}
          <KennelBack className="kennel-layer" geom={geometry} />
          {scene.zones >= 2 && <span className="sr-slot" aria-label="Play yard" />}
          <span className="sr-slot" aria-label="Whelping box" />

          {puppies.filter(p => p.inside).map((puppy, slot) => {
            const [u, v] = boxSlots[slot];
            return renderPuppy(puppy, place(geometry.box.floorAt(u, v), geometry, 2));
          })}

          <KennelBoxFront className="kennel-layer kennel-box-front" geom={geometry} spec={box} />

          {puppies.filter(p => !p.inside).slice(0, yardSlots.length).map((puppy, slot) => {
            const [u, v] = yardSlots[slot];
            // Without a yard, spread them on the grass around the box instead.
            const pen = geometry.yard ?? geometry.box;
            const at = geometry.yard ? pen.floorAt(u, v) : pen.floorAt(u * 1.7 - 0.35, v * 1.7 - 0.35);
            // Sit each puppy in the right slice of the painter's order: past the
            // yard wall, between the two pens, or behind the box entirely.
            const z = geometry.yard && at.y > geometry.yard.FR[1] ? 6
              : at.y > geometry.box.FR[1] ? 4 : 1;
            return renderPuppy(puppy, place(at, geometry, z));
          })}

          <KennelYardFront className="kennel-layer kennel-yard-front" geom={geometry} />

          {scene.zones >= 3 && <div className="stage-feeding" aria-label="Feeding area"><FeedingArea /></div>}
          {scene.heating && <div className="stage-lamp" aria-label="Heat lamp included"><HeatLamp /></div>}

          <small className="stage-caption">
            {scene.box ? describeBox(scene.box) : "Your storybook setup · illustration"}
          </small>
        </div>
      ) : (
        <div className="puppy-pack">{puppies.map(puppy => renderPuppy(puppy, {}))}</div>
      )}

      {scene.complete && <div className="meadow-celebration" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <span key={i} style={{ left: `${5 + i * 8}%`, animationDelay: `${i * .12}s`, color: ["#e9a65c", "#f7e9a0", "#9ebd6a", "#d98b8d"][i % 4] }}>♥</span>)}</div>}
    </div>
    <div className="meadow-flowers" aria-hidden="true">✿ <span>✿</span> ✿</div>
  </div>;
}
