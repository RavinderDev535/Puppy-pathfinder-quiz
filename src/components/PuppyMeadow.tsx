import type { CSSProperties } from "react";
import { getDogLook, initialMeadowScene, type MeadowScene } from "@/lib/meadow-scene";

function Dog({ coat, patch, mother = false, character, ears = "floppy", fluffy = false, sleeping = false, expecting = false }: { coat: string; patch: string; mother?: boolean; character?: "strict" | "polite"; ears?: "pointed" | "floppy" | "long"; fluffy?: boolean; sleeping?: boolean; expecting?: boolean }) {
  return <svg viewBox="0 0 180 160" fill="none" aria-hidden="true">
    <ellipse cx="92" cy="147" rx="62" ry="8" fill="#54712d" opacity=".18" />
    <g stroke="#685035" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path className="dog-tail" d="M49 103Q16 112 22 79Q29 105 51 87" fill={coat} />
      <path d="M48 86Q70 70 112 89L133 117L124 144L111 144L109 121L77 122L72 144L58 144L56 118Q42 110 48 86Z" fill={coat} />
      <path d="M60 88Q88 76 92 97Q88 113 67 108Z" fill={patch} stroke="none" />
      {expecting && <ellipse cx="86" cy="112" rx="28" ry="19" fill={coat} />}
      <path d="M108 39L111 18L128 35Q146 29 155 44L164 74Q179 77 170 90Q158 101 129 94Q108 83 108 61Z" fill={coat} />
      <path d={ears === "pointed" ? "M105 55L103 9L129 39Z" : ears === "long" ? "M120 36Q91 24 96 63Q97 98 111 92L126 44" : "M120 36Q98 23 98 52Q99 77 112 75L126 44"} fill={patch} />
      {fluffy && <path d="M111 37Q99 24 111 20Q114 8 125 17Q136 7 143 20Q158 16 158 32Q168 45 153 47" fill={coat} />}
      <path d="M151 84Q151 107 161 97L164 88" fill="#df8b85" />
      <path d="M128 92L154 99" stroke={mother ? "#b76763" : "#568d88"} strokeWidth="7" />
      <path d="M159 72L171 76L165 82Z" fill="#49392c" />
      {character === "strict" && <path d="M136 52L146 55M151 55L159 51" stroke="#49392c" strokeWidth="3" />}
      <path d={sleeping ? "M140 60Q145 65 150 60" : character === "polite" ? "M142 58Q145 62 148 58" : "M145 59L146 61"} stroke="#352b22" strokeWidth={sleeping || character === "polite" ? 2 : 5} />
      <path d={character === "strict" ? "M155 89L164 89" : "M155 88Q160 92 165 87"} />
      {mother && <path d="M112 37L98 26L97 42L112 37L123 25L126 41Z" fill="#d88983" />}
    </g>
  </svg>;
}
const coats = [["#e2b87a", "#a7784e"], ["#f5e6c9", "#9b7760"], ["#c3956e", "#765942"], ["#e9d4b2", "#b17d54"]];
const puppyActivities = ["sleeping", "eating", "jumping", "sitting", "playing", "stretching"] as const;
const activityLabels: Record<(typeof puppyActivities)[number], string> = {
  sleeping: "sleeping", eating: "eating", jumping: "jumping", sitting: "sitting", playing: "playing with a ball", stretching: "stretching",
};
export default function PuppyMeadow({ count, scene = initialMeadowScene }: { count: number; scene?: MeadowScene }) {
  const look = getDogLook(scene.breed);
  const motherScale = scene.size === "under_16" ? .76 : scene.size === "40_90" ? 1.13 : scene.size === "over_90" ? 1.25 : 1;
  const stageText = { waiting: "A little family, a new beginning", expecting: "Mom is expecting · your puppy family is on its way", sleeping: "Tiny paws, sleepy newborns", growing: "Little stretches, growing puppies", playful: "Bigger adventures for playful puppies" }[scene.stage];
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
    {["left", "right"].map(side => <div key={side} className={`story-fence fence-${side}`} aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}<b /><b /></div>)}
    <div className="meadow-family">
      <div className="adult-dog dog-dad" aria-label="Dad, the watchful protector"><Dog {...look} character="strict" /><span>Dad <em>watchful protector</em></span></div>
      <div className="adult-dog dog-mom" data-size={scene.size ?? "default"} aria-label="Mom, the gentle caretaker"><div className="mother-size" style={{ transform: `scale(${motherScale})` }}><Dog {...look} mother character="polite" expecting={scene.stage === "expecting"} /></div><span>Mom <em>gentle caretaker</em></span></div>
      <div className="puppy-pack">{Array.from({ length: count }, (_, i) => {
        const activity = puppyActivities[i % puppyActivities.length];
        return <div className={`puppy-arrival puppy-${activity}`} key={i} data-testid="meadow-puppy" aria-label={`Puppy ${i + 1}, ${activityLabels[activity]}`} style={{ "--delay": `${i % 4 * -.6}s`, "--tilt": `${i % 2 ? -4 : 3}deg` } as CSSProperties}>
          <Dog {...look} coat={scene.breed ? look.coat : coats[i % coats.length][0]} patch={scene.breed ? look.patch : coats[i % coats.length][1]} sleeping={activity === "sleeping" || scene.stage === "sleeping"} />
          {activity === "sleeping" && <span className="sleep-bubbles" aria-hidden="true">z z Z</span>}
          {activity === "eating" && <span className="puppy-bowl" aria-hidden="true"><i /></span>}
          {activity === "playing" && <span className="puppy-ball" aria-hidden="true" />}
          {scene.stage === "expecting" && <span className="puppy-dream" aria-hidden="true">♡</span>}
        </div>;
      })}</div>
      {scene.zones > 0 && <div className="meadow-setup" aria-label="Illustrated setup preview">
        <div className="setup-box setup-piece" aria-label="Whelping box"><div className="box-blanket" /><span>Whelping box</span></div>
        {scene.zones >= 2 && <div className="setup-yard setup-piece" aria-label="Play yard"><div className="yard-ball" /><span>Play yard</span></div>}
        {scene.zones >= 3 && <div className="setup-feeding setup-piece" aria-label="Feeding area"><i /><i /><span>Feeding area</span></div>}
        {scene.heating && <div className="setup-lamp setup-piece" aria-label="Heat lamp included"><div className="lamp-glow" /><i /><span>Heat lamp</span></div>}
        <small className="setup-note">Your storybook setup · illustration</small>
      </div>}
      {scene.complete && <div className="meadow-celebration" aria-hidden="true">{Array.from({length: 12}, (_, i) => <span key={i} style={{ left: `${5 + i * 8}%`, animationDelay: `${i * .12}s`, color: ["#e9a65c", "#f7e9a0", "#9ebd6a", "#d98b8d"][i % 4] }}>♥</span>)}</div>}
    </div>
    <div className="meadow-flowers" aria-hidden="true">✿ <span>✿</span> ✿</div>
  </div>;
}
