import { useMemo, type CSSProperties } from "react";
import { MeadowAdult, MeadowPuppy, type PuppyPose } from "@/components/art/MeadowDog";
import { FeedingArea, HeatLamp, KennelBack, KennelBoxFront, KennelYardFront, PicketFence, PlayBall } from "@/components/art/KennelArt";
import { DEFAULT_BOX, kennelGeometry } from "@/lib/kennel-geometry";
import { describeBox, initialMeadowScene, type MeadowScene } from "@/lib/meadow-scene";

const puppyActivities = ["sleeping", "eating", "jumping", "sitting", "playing", "stretching"] as const;
type PuppyActivity = (typeof puppyActivities)[number];

const activityLabels: Record<PuppyActivity, string> = {
  sleeping: "sleeping", eating: "eating", jumping: "jumping", sitting: "sitting", playing: "playing with a ball", stretching: "stretching",
};

/** Each activity gets its own drawing from the pose sheet — all six are used. */
const activityPose: Record<PuppyActivity, PuppyPose> = {
  sleeping: "curl", eating: "stand", jumping: "lie", sitting: "sit", playing: "walk", stretching: "sprawl",
};

type PuppyMeadowProps = {
  count: number;
  scene?: MeadowScene;
  /** Keeps the final kennel on screen from the first quiz question onward. */
  showQuizKennel?: boolean;
};

type PuppyPlacement = {
  i: number;
  activity: PuppyActivity;
  pose: PuppyPose;
  left: number;
  bottom: number;
  width: number;
};

// Each point is a coordinate on the yard floor (not a screen coordinate). This
// keeps the litter within the house at every box size while leaving enough room
// for each puppy to be seen on its own.
const kennelPuppySpots = [
  { u: .20, v: .60 },
  { u: .65, v: .20 },
  { u: .60, v: .60 },
  { u: .40, v: .82 },
  { u: .84, v: .39 },
  { u: .80, v: .82 },
  { u: .40, v: .60 },
  { u: .84, v: .20 },
  { u: .20, v: .82 },
  { u: .80, v: .60 },
  { u: .65, v: .39 },
  { u: .60, v: .82 },
] as const;

export default function PuppyMeadow({ count, scene = initialMeadowScene, showQuizKennel = false }: PuppyMeadowProps) {
  const motherScale = scene.size === "under_16" ? .76 : scene.size === "40_90" ? 1.13 : scene.size === "over_90" ? 1.25 : 1;
  const stageText = { waiting: "A little family, a new beginning", expecting: "Mom is expecting · your puppy family is on its way", sleeping: "Tiny paws, sleepy newborns", growing: "Little stretches, growing puppies", playful: "Bigger adventures for playful puppies" }[scene.stage];

  // The final kennel is present for every quiz step and fills in as answers arrive.
  const showKennel = showQuizKennel || scene.zones > 0;
  const hasProductPlayYard = scene.zones >= 2;
  // The first quiz view deliberately starts with an empty home. Puppies only
  // arrive after the visitor starts answering questions.
  const isEmptyQuizHome = showQuizKennel && count === 0 && scene.stage === "waiting" && scene.zones === 0;
  // These layers leave the pen genuinely empty until quiz progress adds a puppy.
  const kennelSpec = scene.box ?? DEFAULT_BOX;
  const kennelGeom = useMemo(() => kennelGeometry(kennelSpec, true), [kennelSpec]);

  const puppies = useMemo<PuppyPlacement[]>(() => Array.from({ length: Math.min(count, kennelPuppySpots.length) }, (_, i) => {
    // This shuffled cycle guarantees a varied first litter while the fixed
    // house-floor spots keep every puppy within the illustrated playpen.
    const activity = puppyActivities[(i * 5 + 3) % puppyActivities.length];
    const spot = kennelPuppySpots[i % kennelPuppySpots.length];
    const pen = kennelGeom.yard;
    const floorPoint = pen?.floorAt(spot.u, spot.v);
    // The values used by the absolutely positioned puppy are percentages of
    // the shared SVG canvas. Offset its left edge by half its rendered width
    // so the puppy's paws sit on the selected floor point.
    const renderedWidth = 7.8;
    return {
      i,
      activity,
      pose: activityPose[activity],
      left: floorPoint ? floorPoint.x / kennelGeom.vw * 100 - renderedWidth / 2 : 43,
      bottom: floorPoint ? 100 - floorPoint.y / kennelGeom.vh * 100 : 48,
      width: renderedWidth,
    };
  }), [count, kennelGeom]);

  const renderPuppy = ({ i, activity, pose, left, bottom, width }: PuppyPlacement) => (
    <div
      className={`puppy-arrival puppy-${activity} pose-${pose}`}
      key={i}
      data-testid="meadow-puppy"
      data-puppy-id={i}
      data-coat={i < 6 ? "golden" : "cocoa"}
      aria-label={`Puppy ${i + 1}, ${activityLabels[activity]}`}
      style={{
        "--delay": `${i % 4 * -.6}s`,
        "--tilt": `${i % 2 ? -4 : 3}deg`,
        ...(showKennel ? { left: `${left}%`, bottom: `${bottom}%`, width: `${width}%`, zIndex: Math.round(100 - bottom) } : {}),
      } as CSSProperties}
    >
      <MeadowPuppy pose={pose} style={showKennel ? { width: "100%" } : undefined} />
      {activity === "sleeping" && <span className="sleep-bubbles" aria-hidden="true">z z Z</span>}
      {activity === "eating" && <span className="puppy-bowl" aria-hidden="true"><i /></span>}
      {activity === "playing" && <span className="puppy-ball" aria-hidden="true" />}
      {scene.stage === "expecting" && <span className="puppy-dream" aria-hidden="true">♡</span>}
    </div>
  );

  // The parents stand on the grass to either side of the pen. Once there is a
  // kennel they live inside the stage so they scale with it and keep the same
  // stand-off from the panels at every width.
  const adults = (
    <>
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
    </>
  );

  return <div className={`puppy-meadow stage-${scene.stage}${showKennel ? " meadow-has-kennel" : ""}${scene.complete ? " meadow-complete" : ""}`} aria-label={`Two adult dogs and ${count} puppies`}>
    <div className="meadow-caption" role="status" aria-live="polite">
      {scene.complete ? "Hooray! Your family's setup is ready to explore." : stageText}
      {scene.breed && !showKennel && <small>{scene.breed} family</small>}
    </div>
    <svg className="meadow-hills" viewBox="0 0 1440 330" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 58Q180 9 380 68T760 52T1100 44T1440 8V330H0Z" fill="#bdd173" stroke="#829747" strokeWidth="3" />
      <path d="M0 154Q220 79 510 127T940 116T1440 79V330H0Z" fill="#abc65f" />
      <defs><pattern id="grass" width="63" height="47" patternUnits="userSpaceOnUse"><path d="M12 32l-3-8m3 8 4-12m-4 12 9-5" stroke="#819b46" strokeWidth="1.4" opacity=".6" /></pattern></defs>
      <path d="M0 68Q300 20 520 90T1000 60T1440 25V330H0Z" fill="url(#grass)" />
    </svg>
    {["left", "right"].map(side => <PicketFence key={side} className={`story-fence fence-${side}`} />)}
    <div className="meadow-family">
      {!showKennel && adults}

      {showKennel ? (
        <div className="kennel-stage" aria-label="Illustrated setup preview" style={{ aspectRatio: `${kennelGeom.vw} / ${kennelGeom.vh}` }}>
          {!isEmptyQuizHome && adults}
          <KennelBack geom={kennelGeom} className="kennel-back" />
          <span className="sr-slot" aria-label={hasProductPlayYard ? "Play yard" : "Family play yard"} />
          <span className="sr-slot" aria-label="Whelping box" />
          {scene.breed && <div className="kennel-nameplate">{scene.breed} family</div>}
          {(scene.stage === "expecting" || scene.stage === "sleeping") && <div className="scene-accessory scene-blankets" aria-label="Fresh blankets for the nursery"><span /><span /></div>}
          {scene.zones >= 3 && <div className="scene-accessory scene-feeding" aria-label="Feeding area"><FeedingArea /><small>Mess hall</small></div>}
          {(hasProductPlayYard || scene.stage === "playful") && <div className="scene-accessory scene-toys" aria-label="Playtime toys"><PlayBall /></div>}
          {scene.tools && <div className="scene-accessory scene-tools" aria-label="Breeder care kit"><svg viewBox="0 0 100 85" aria-hidden="true"><path d="M33 27V15h34v12" fill="none" stroke="#674832" strokeWidth="6" /><rect x="8" y="27" width="84" height="52" rx="9" fill="#fff1d5" stroke="#674832" strokeWidth="3" /><path d="M50 39v27M37 52h26" stroke="#cc8569" strokeWidth="9" /></svg><small>Care kit</small></div>}
          {scene.monitoring && <div className="scene-accessory scene-monitor" aria-label="WiFi puppy monitor"><svg viewBox="0 0 80 110" aria-hidden="true"><path d="M40 60v37m-20 4h40" stroke="#674832" strokeWidth="5" /><rect x="12" y="25" width="56" height="39" rx="12" fill="#fff9eb" stroke="#674832" strokeWidth="3" /><circle cx="40" cy="44" r="12" fill="#577d87" stroke="#674832" strokeWidth="3" /><circle cx="44" cy="40" r="4" fill="#e0f2ed" /><path d="M26 15q14-12 28 0m-21 5q7-6 14 0" fill="none" stroke="#577d87" strokeWidth="3" strokeLinecap="round" /></svg><small>Puppy cam</small></div>}
          {scene.heating && <div className="stage-lamp" aria-label="Heat lamp included"><HeatLamp /></div>}
          <div className="kennel-puppies" aria-live="polite">{puppies.map(renderPuppy)}</div>
          <KennelBoxFront geom={kennelGeom} spec={kennelSpec} className="kennel-box-front" />
          <KennelYardFront geom={kennelGeom} className="kennel-yard-front" />
          <small className="stage-caption">{scene.box ? describeBox(scene.box) : "Your storybook setup · illustration"}</small>
        </div>
      ) : <div className="puppy-pack">{puppies.map(renderPuppy)}</div>}

      {scene.complete && <div className="meadow-celebration" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <span key={i} style={{ left: `${5 + i * 8}%`, animationDelay: `${i * .12}s`, color: ["#e9a65c", "#f7e9a0", "#9ebd6a", "#d98b8d"][i % 4] }}>♥</span>)}</div>}
    </div>
    <div className="meadow-flowers" aria-hidden="true">✿ <span>✿</span> ✿</div>
  </div>;
}
