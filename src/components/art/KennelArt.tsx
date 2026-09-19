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

const up = (p: Pt, h: number): Pt => [p[0], p[1] - h];
const pts = (...list: Pt[]) => list.map(p => p.join(",")).join(" ");

/* ---------------- pen halves ---------------- */

/** An upright: white post with the navy cap the real panels are joined by. */
const post = (p: Pt, h: number, key: string) => (
  <g key={key}>
    <polygon points={pts([p[0] - 4.5, p[1] - h - 2], [p[0] + 4.5, p[1] - h - 2], [p[0] + 4.5, p[1] + 3], [p[0] - 4.5, p[1] + 3])} fill={PANEL} />
    <polygon points={pts([p[0] - 6, p[1] - h - 5], [p[0] + 6, p[1] - h - 5], [p[0] + 6, p[1] - h + 3], [p[0] - 6, p[1] - h + 3])} fill={NAVY} />
  </g>
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

/** The paired line where two panels butt together. */
const seam = (a: Pt, b: Pt, h: number, s: number, key: string) => {
  const x = a[0] + (b[0] - a[0]) * s, y = a[1] + (b[1] - a[1]) * s;
  return (
    <g key={key} stroke={PANEL_DK} strokeWidth={1.3} strokeLinecap="round">
      <path d={`M${(x - 1.6).toFixed(1)},${y.toFixed(1)} L${(x - 1.6).toFixed(1)},${(y - h).toFixed(1)}`} />
      <path d={`M${(x + 1.6).toFixed(1)},${y.toFixed(1)} L${(x + 1.6).toFixed(1)},${(y - h).toFixed(1)}`} />
    </g>
  );
};

/** Far walls, floor and bedding — everything the animals stand in front of. */
function PenBack({ pen, floor, bedding }: { pen: Pen; floor: string; bedding?: boolean }) {
  const { FL, BL, BR, FR, h } = pen;
  const centre: Pt = [(FL[0] + BL[0] + BR[0] + FR[0]) / 4, (FL[1] + BL[1] + BR[1] + FR[1]) / 4];
  const inset = (p: Pt, k: number): Pt => [p[0] + (centre[0] - p[0]) * k, p[1] + (centre[1] - p[1]) * k];
  return (
    <>
      <g stroke={INK} strokeWidth={2.35} strokeLinejoin="round" strokeLinecap="round">
        <polygon points={pts(up(FL, h), up(BL, h), BL, FL)} fill={PANEL_SH} />
        <polygon points={pts(up(BL, h), up(BR, h), BR, BL)} fill={PANEL} />
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

/** Near walls, windows and front posts — everything that overlaps the animals. */
function PenFront({ pen, window: hasWindow, gate }: { pen: Pen; window?: boolean; gate?: boolean }) {
  const { FL, BL, BR, FR, h } = pen;
  const at = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  /** A viewing window: green pane in a moulded frame, with corner screws. */
  const pane = (a: Pt, b: Pt, t0: number, t1: number, key: string) => {
    const p0 = at(a, b, t0), p1 = at(a, b, t1);
    const inset = (p: Pt, q: Pt, k: number): Pt => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
    const i0 = inset(p0, p1, 0.1), i1 = inset(p1, p0, 0.1);
    const screw = (p: Pt, t: number, k: string) => (
      <circle key={k} cx={p[0]} cy={p[1] - h * t} r={1.5} fill="none" stroke={PANEL_DK} strokeWidth={1.1} />
    );
    return (
      <g key={key}>
        <polygon points={pts(up(p0, h * .78), up(p1, h * .78), up(p1, h * .16), up(p0, h * .16))}
          fill={PANEL_SH} stroke={PANEL_DK} strokeWidth={1.6} strokeLinejoin="round" />
        <polygon points={pts(up(i0, h * .70), up(i1, h * .70), up(i1, h * .24), up(i0, h * .24))}
          fill={GLASS} stroke={PANEL_DK} strokeWidth={1.6} strokeLinejoin="round" />
        {screw(p0, .74, "a")}{screw(p1, .74, "b")}{screw(p0, .20, "c")}{screw(p1, .20, "d")}
      </g>
    );
  };
  // An open gate leaves a gap in the near-left wall so the yard reads as enterable.
  const gateA = at(FL, FR, 0.44), gateB = at(FL, FR, 0.64);
  return (
    <>
      <g stroke={INK} strokeWidth={2.35} strokeLinejoin="round" strokeLinecap="round">
        <polygon points={pts(up(FR, h), up(BR, h), BR, FR)} fill={PANEL_SH} />
        {gate ? (
          <>
            <polygon points={pts(up(FL, h), up(gateA, h), gateA, FL)} fill={PANEL} />
            <polygon points={pts(up(gateB, h), up(FR, h), FR, gateB)} fill={PANEL} />
          </>
        ) : <polygon points={pts(up(FL, h), up(FR, h), FR, FL)} fill={PANEL} />}
      </g>
      <g>
        {!gate && grain(FL, FR, h, "gf")}{grain(FR, BR, h, "gr")}
        {!gate && seam(FL, FR, h, 0.5, "sf")}{seam(FR, BR, h, 0.5, "sr")}
      </g>
      {hasWindow && pane(FL, FR, 0.14, 0.54, "w1")}
      {hasWindow && pane(FR, BR, 0.26, 0.62, "w2")}
      <g stroke={INK} strokeWidth={2} strokeLinejoin="round">
        {post(FL, h, "fl")}{post(BR, h, "br")}{post(FR, h, "fr")}
        {gate && <>{post(gateA, h, "ga")}{post(gateB, h, "gb")}</>}
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
      {geom.yard && <PenBack pen={geom.yard} floor={GRASS} />}
      <PenBack pen={geom.box} floor={PAD} bedding />
    </svg>
  );
}

/** The box's near walls — over puppies inside it, under puppies in front of it. */
export function KennelBoxFront({ geom, spec = DEFAULT_BOX, className, style }: LayerProps) {
  return (
    <svg className={className} style={style} viewBox={geom.viewBox} fill="none" aria-hidden="true">
      <PenFront pen={geom.box} window={spec.window} />
    </svg>
  );
}

/** The yard's near walls — the frontmost thing in the scene. */
export function KennelYardFront({ geom, className, style }: LayerProps) {
  if (!geom.yard) return null;
  return (
    <svg className={className} style={style} viewBox={geom.viewBox} fill="none" aria-hidden="true">
      <PenFront pen={geom.yard} gate />
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
