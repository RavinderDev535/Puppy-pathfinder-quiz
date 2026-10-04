/**
 * Illustrated whelping gear — the EZWhelp panels, drawn in the same ink-and-cream
 * style as the dogs.
 *
 * The play yard and the whelping box share one isometric coordinate system, and
 * each pen is drawn in two halves: everything behind the animals (far walls,
 * floor, bedding) and everything in front of them (near walls, windows, posts).
 * The meadow stacks puppies between those halves, which is what makes a puppy
 * actually look like it is *in* the box rather than pasted on top of it.
 */
import type { CSSProperties } from "react";
import { type BoxSpec, DEFAULT_BOX, type Pen, type Pt, kennelGeometry } from "@/lib/kennel-geometry";

const INK = "#4A2E21";
const PANEL = "#FCFDFE";
const PANEL_SH = "#F2F5F6";
const PANEL_DK = "#D2DCE1";
const NAVY = "#3A4C77";
const GLASS = "#CBE7CC";
const PAD = "#E9E2D6";
const PAD_DK = "#D4C9B6";
const WOOD = "#D9A45B";
const WOOD_DK = "#B47F3C";
const GRASS = "#B9D97E";
/** The yard's panels are knocked back a shade so the whelping box reads as a
 *  separate white object standing inside it, not as more of the same wall. */
const YARD_WALLS: [string, string] = ["#E7EEF1", "#F3F8F9"];
const BOX_WALLS: [string, string] = [PANEL_SH, PANEL];

const up = (p: Pt, h: number): Pt => [p[0], p[1] - h];
const pts = (...list: Pt[]) => list.map(p => p.join(",")).join(" ");

/* ---------------- pen halves ---------------- */

/** An upright: white post, rounded off, under the navy cap the real panels are
 *  joined by. The cap overhangs the post on both sides, which is what makes a
 *  join read as hardware rather than as a seam in the moulding. */
const post = (p: Pt, h: number, key: string) => (
  <g key={key}>
    <rect x={p[0] - 4.6} y={p[1] - h - 2} width={9.2} height={h + 5} rx={2.8} fill={PANEL} />
    <rect x={p[0] - 6.2} y={p[1] - h - 5.5} width={12.4} height={9.5} rx={3.6} fill={NAVY} />
  </g>
);

/** The navy end face a panel shows where a run stops — at the gate, where the
 *  two halves of the front wall are cut apart. */
const endCap = (p: Pt, h: number, key: string) => (
  <rect key={key} x={p[0] - 3.4} y={p[1] - h - 1} width={6.8} height={h + 4} rx={2.4} fill={NAVY} />
);

/** Moulded wave grain running along a panel run. The wavelength is fixed in
 *  drawing units, so a long yard wall ripples like a short one instead of
 *  stretching into streaks. */
const grain = (a: Pt, b: Pt, h: number, key: string) => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const cycles = Math.max(2, Math.round(len / 15));
  const steps = Math.max(16, cycles * 6);
  return (
    <g key={key} stroke={PANEL_DK} strokeWidth={1.15} fill="none" opacity=".55" strokeLinecap="round">
      {[0.3, 0.5, 0.7].map((t, ri) => {
        let d = "";
        for (let i = 0; i <= steps; i++) {
          const s = i / steps;
          const x = a[0] + (b[0] - a[0]) * s;
          const y = a[1] + (b[1] - a[1]) * s - h * t + Math.sin(s * Math.PI * 2 * cycles + ri * 1.7) * 0.85;
          d += `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
        }
        return <path key={t} d={d} />;
      })}
    </g>
  );
};

/** The paired line where two panels butt together — all a wall seen from its
 *  inside face, or a plain yard run, actually shows. */
const seam = (a: Pt, b: Pt, h: number, s: number, key: string) => {
  const x = a[0] + (b[0] - a[0]) * s, y = a[1] + (b[1] - a[1]) * s;
  return (
    <g key={key} stroke={PANEL_DK} strokeWidth={1.3} strokeLinecap="round">
      <path d={`M${(x - 1.6).toFixed(1)},${y.toFixed(1)} L${(x - 1.6).toFixed(1)},${(y - h).toFixed(1)}`} />
      <path d={`M${(x + 1.6).toFixed(1)},${y.toFixed(1)} L${(x + 1.6).toFixed(1)},${(y - h).toFixed(1)}`} />
    </g>
  );
};

/** The navy reinforcing strap bolted down the outside of a whelping-box panel.
 *  Two to a face, standing on the base rail and stopping short of the top. */
const strap = (a: Pt, b: Pt, h: number, t: number, base: number, key: string) => {
  const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
  const foot = y - base * 0.5;
  return <rect key={key} x={x - 3} y={foot - h * 0.78} width={6} height={h * 0.78} rx={2.4} fill={NAVY} />;
};

/** The navy base rail the box's outside faces sit on. */
const rail = (a: Pt, b: Pt, base: number, key: string) => (
  <polygon key={key} points={pts(a, b, up(b, base), up(a, base))} fill={NAVY} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
);

/** Far walls, floor and bedding — everything the animals stand in front of. */
function PenBack({ pen, floor, bedding, walls = BOX_WALLS }: { pen: Pen; floor: string; bedding?: boolean; walls?: [string, string] }) {
  const { FL, BL, BR, FR, h } = pen;
  const centre: Pt = [(FL[0] + BL[0] + BR[0] + FR[0]) / 4, (FL[1] + BL[1] + BR[1] + FR[1]) / 4];
  const inset = (p: Pt, k: number): Pt => [p[0] + (centre[0] - p[0]) * k, p[1] + (centre[1] - p[1]) * k];
  return (
    <>
      <g stroke={INK} strokeWidth={2.35} strokeLinejoin="round" strokeLinecap="round">
        <polygon points={pts(up(FL, h), up(BL, h), BL, FL)} fill={walls[0]} />
        <polygon points={pts(up(BL, h), up(BR, h), BR, BL)} fill={walls[1]} />
        <polygon points={pts(FL, BL, BR, FR)} fill={floor} />
      </g>
      <g>
        {grain(FL, BL, h, "gl")}
        {grain(BL, BR, h, "gb")}
        {seam(FL, BL, h, .5, "sl")}
        {seam(BL, BR, h, .5, "sb")}
      </g>
      {bedding && (
        <>
          <polygon points={pts(inset(FL, .2), inset(BL, .2), inset(BR, .2), inset(FR, .2))} fill={PAD_DK} opacity=".55" />
          <polygon points={pts(inset(FL, .32), inset(BL, .32), inset(BR, .32), inset(FR, .32))} fill="#F6EFE2" opacity=".7" />
        </>
      )}
      <g stroke={INK} strokeWidth={2} strokeLinejoin="round">{post(BL, h, "bl")}</g>
    </>
  );
}

/** Near walls, windows and front posts — everything that overlaps the animals.
 *
 *  `floor` is the pen's own floor colour: a viewing window is a hole in the
 *  panel, so what shows through it is the bedding or the grass behind, not a
 *  tinted pane. `base` is the navy rail a whelping box stands on — the yard
 *  panels have none, which is most of what tells the two products apart. */
function PenFront({ pen, window: hasWindow, gate, walls = BOX_WALLS, floor = GLASS, base = 0 }: {
  pen: Pen; window?: boolean; gate?: boolean; walls?: [string, string]; floor?: string; base?: number;
}) {
  const { FL, BL, BR, FR, h } = pen;
  const at = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  /** A viewing window: an aperture cut through the panel, in a moulded frame. */
  const pane = (a: Pt, b: Pt, t0: number, t1: number, key: string) => {
    const p0 = at(a, b, t0), p1 = at(a, b, t1);
    const inset = (p: Pt, q: Pt, k: number): Pt => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
    const i0 = inset(p0, p1, 0.11), i1 = inset(p1, p0, 0.11);
    const lo = base ? base * 0.6 + h * 0.1 : h * 0.22;
    return (
      <g key={key}>
        <polygon points={pts(up(p0, h * .78), up(p1, h * .78), up(p1, lo), up(p0, lo))}
          fill={walls[0]} stroke={PANEL_DK} strokeWidth={1.6} strokeLinejoin="round" />
        <polygon points={pts(up(i0, h * .70), up(i1, h * .70), up(i1, lo + h * .09), up(i0, lo + h * .09))}
          fill={floor} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
        {/* What shows through an aperture stands in the panel's shadow, so it
            reads as a hole rather than as a gap in the drawing. */}
        <polygon points={pts(up(i0, h * .70), up(i1, h * .70), up(i1, lo + h * .09), up(i0, lo + h * .09))}
          fill={INK} opacity=".17" />
      </g>
    );
  };
  // An open gate leaves a gap in the near wall so the yard reads as enterable.
  const gateA = at(FL, FR, 0.44), gateB = at(FL, FR, 0.64);
  return (
    <>
      <g stroke={INK} strokeWidth={2.35} strokeLinejoin="round" strokeLinecap="round">
        <polygon points={pts(up(FR, h), up(BR, h), BR, FR)} fill={walls[0]} />
        {gate ? (
          <>
            <polygon points={pts(up(FL, h), up(gateA, h), gateA, FL)} fill={walls[1]} />
            <polygon points={pts(up(gateB, h), up(FR, h), FR, gateB)} fill={walls[1]} />
          </>
        ) : <polygon points={pts(up(FL, h), up(FR, h), FR, FL)} fill={walls[1]} />}
      </g>
      <g>
        {!gate && grain(FL, FR, h, "gf")}{grain(FR, BR, h, "gr")}
      </g>
      {base ? (
        <>
          {rail(FL, FR, base, "rf")}{rail(FR, BR, base, "rr")}
          {strap(FR, BR, h, 0.3, base, "pr1")}{strap(FR, BR, h, 0.7, base, "pr2")}
          {hasWindow
            ? strap(FL, FR, h, 0.8, base, "pf1")
            : <>{strap(FL, FR, h, 0.3, base, "pf1")}{strap(FL, FR, h, 0.7, base, "pf2")}</>}
        </>
      ) : (
        <>{!gate && seam(FL, FR, h, 0.5, "sf")}{seam(FR, BR, h, 0.5, "sr")}</>
      )}
      {hasWindow && !gate && pane(FL, FR, 0.12, 0.58, "w1")}
      {hasWindow && gate && <>{pane(FL, FR, 0.06, 0.34, "w1")}{pane(FL, FR, 0.70, 0.94, "w3")}</>}
      {hasWindow && !base && pane(FR, BR, 0.26, 0.62, "w2")}
      <g stroke={INK} strokeWidth={2} strokeLinejoin="round">
        {post(FL, h, "fl")}{post(BR, h, "br")}{post(FR, h, "fr")}
        {gate && <>{endCap(gateA, h, "ga")}{endCap(gateB, h, "gb")}</>}
      </g>
    </>
  );
}

type Geom = ReturnType<typeof kennelGeometry>;
interface LayerProps { geom: Geom; spec?: BoxSpec; className?: string; style?: CSSProperties }

/** Everything behind the animals. */
export function KennelBack({ geom, className, style }: LayerProps) {
  return (
    <svg className={className} style={style} viewBox={geom.viewBox} fill="none" aria-hidden="true">
      {geom.yard && <PenBack pen={geom.yard} floor={GRASS} walls={YARD_WALLS} />}
      {/* The box casts onto the yard floor, which is what lifts it off the grass
          instead of leaving it looking printed on. */}
      {geom.yard && <polygon points={pts(
        [geom.box.FL[0] - 4, geom.box.FL[1] + 6], [geom.box.BL[0] - 4, geom.box.BL[1] + 6],
        [geom.box.BR[0] - 4, geom.box.BR[1] + 6], [geom.box.FR[0] - 4, geom.box.FR[1] + 6],
      )} fill={INK} opacity=".13" />}
      <PenBack pen={geom.box} floor={PAD} bedding />
    </svg>
  );
}

/** The box's near walls — over puppies inside it, under puppies in front of it. */
export function KennelBoxFront({ geom, spec = DEFAULT_BOX, className, style }: LayerProps) {
  return (
    <svg className={className} style={style} viewBox={geom.viewBox} fill="none" aria-hidden="true">
      <PenFront pen={geom.box} window={spec.window} floor={PAD} base={geom.box.h * 0.17} />
    </svg>
  );
}

/** The yard's near walls — the frontmost thing in the scene. */
export function KennelYardFront({ geom, className, style }: LayerProps) {
  if (!geom.yard) return null;
  return (
    <svg className={className} style={style} viewBox={geom.viewBox} fill="none" aria-hidden="true">
      <PenFront pen={geom.yard} gate window walls={YARD_WALLS} floor={GRASS} />
    </svg>
  );
}

/* ---------------- standalone props ---------------- */

interface ArtProps { className?: string; style?: CSSProperties }

/** Food and water on a patch of grass. */
export function FeedingArea({ className, style }: ArtProps) {
  const bowl = (x: number, y: number, s: number, food: string) => (
    <g transform={`translate(${x},${y}) scale(${s})`} stroke={INK} strokeWidth={3.2 / s} strokeLinejoin="round">
      <path d="M-34,-6 C-34,-14 -18,-20 0,-20 C18,-20 34,-14 34,-6 C34,10 22,22 0,22 C-22,22 -34,10 -34,-6 Z" fill="#D2A97B" />
      <ellipse cx="0" cy="-7" rx="33" ry="12" fill="#E4C49B" />
      <ellipse cx="0" cy="-6" rx="24" ry="8" fill={food} />
    </g>
  );
  return (
    <svg className={className} style={style} viewBox="0 0 184 136" fill="none" aria-hidden="true">
      <ellipse cx="92" cy="104" rx="80" ry="26" fill={GRASS} stroke={INK} strokeWidth={3} />
      {bowl(58, 86, 1, "#F3EBDA")}
      {bowl(132, 96, 0.78, "#AFD8E8")}
      <path d="M40,78 C48,73 58,71 68,73" stroke="#fff" strokeWidth={2.2} fill="none" opacity=".65" strokeLinecap="round" />
    </svg>
  );
}

/** A clamp heat lamp on its stand, pooling warmth on the floor. */
export function HeatLamp({ className, style }: ArtProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 190 148" fill="none" aria-hidden="true">
      <ellipse className="lamp-pool" cx="84" cy="128" rx="62" ry="24" fill="#FFD98A" opacity=".5" />
      <ellipse className="lamp-pool" cx="84" cy="130" rx="38" ry="14" fill="#FFC96B" opacity=".5" />
      <path d="M46,84 L122,84 L140,126 L28,126 Z" fill="#FFE2A0" opacity=".45" />
      <g stroke={INK} strokeWidth={3.4} strokeLinejoin="round" strokeLinecap="round" fill="none">
        <path d="M162,132 L162,30 C162,22 156,16 148,16 L86,16" />
        <path d="M140,134 L184,134" strokeWidth={6} />
      </g>
      <g stroke={INK} strokeWidth={3.4} strokeLinejoin="round">
        <path d="M84,20 C96,20 105,26 109,35 L127,68 C131,76 125,84 114,84 L54,84 C43,84 37,76 41,68 L59,35 C63,26 72,20 84,20 Z" fill={WOOD} />
        <ellipse cx="84" cy="82" rx="43" ry="11" fill="#E8BA78" />
        <ellipse cx="84" cy="84" rx="18" ry="8" fill="#FFEFB8" />
      </g>
      <g stroke="#FFC451" strokeWidth={3.2} strokeLinecap="round" opacity=".95">
        <path d="M62,98 L56,110 M84,102 L84,116 M106,98 L112,110" />
      </g>
    </svg>
  );
}

/** The beach ball that lives on the grass outside the pen. */
export function PlayBall({ className, style }: ArtProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 96 104" fill="none" aria-hidden="true">
      <ellipse cx="50" cy="93" rx="30" ry="8" fill="#000" opacity=".1" />
      <g stroke={INK} strokeWidth={3.2} strokeLinejoin="round">
        <circle cx="48" cy="52" r="42" fill="#FBFCFD" />
        <path d="M48,10 C64,24 64,80 48,94 C70,94 90,76 90,52 C90,28 70,10 48,10 Z" fill="#E2762F" />
        <path d="M48,10 C32,24 32,80 48,94 C26,94 6,76 6,52 C6,28 26,10 48,10 Z" fill="#4E8FC4" />
      </g>
      <path d="M26,30 C32,23 40,18 49,17" stroke="#fff" strokeWidth={3} fill="none" opacity=".6" strokeLinecap="round" />
    </svg>
  );
}

/** The picket fence that frames the meadow. */
export function PicketFence({ className, style }: ArtProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 200 126" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <g stroke={INK} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" fill={WOOD}>
        {[10, 50, 90, 130, 170].map(x => (
          <path key={x} d={`M${x},44 L${x + 10},28 L${x + 20},44 L${x + 20},118 L${x},118 Z`} />
        ))}
      </g>
      <g fill={WOOD_DK} stroke={INK} strokeWidth={3} strokeLinejoin="round">
        <path d="M4,58 L196,58 L196,72 L4,72 Z" />
        <path d="M4,92 L196,92 L196,106 L4,106 Z" />
      </g>
    </svg>
  );
}
