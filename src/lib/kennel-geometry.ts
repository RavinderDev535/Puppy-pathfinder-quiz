/**
 * Isometric geometry for the whelping box and the play yard around it.
 *
 * This lives in lib/ rather than beside the drawing because the quiz's scene
 * model needs the BoxSpec shape too, and lib must not depend on components.
 */

export type Pt = [number, number];

interface Dims { W: number; D: number; h: number; ex: Pt; ey: Pt }

// The camera the reference scene is drawn from. The two axes deliberately rise
// by different amounts: the width axis runs almost flat across the page while
// the depth axis falls steeply toward the reader, so a pen reads as a wide
// rectangle seen from the front instead of a 45-degree diamond.
const ISO_X = 0.32;
const ISO_Y = 0.72;
const makeDims = (W: number, D: number, h: number): Dims => ({ W, D, h, ex: [W, W * ISO_X], ey: [-D, D * ISO_Y] });

export interface BoxSpec {
  /** Footprint in inches, as sold: 28×28, 38×38, 48×48, 48×76. */
  width: number;
  depth: number;
  /** Panel height in inches: 18 standard, 28 tall. */
  panel: number;
  /** Does their box have a viewing window? */
  window: boolean;
}

export const DEFAULT_BOX: BoxSpec = { width: 48, depth: 48, panel: 18, window: true };

/** Real inches compressed toward the middle so a 28×28 and a 48×76 both read
 *  well on screen. The difference stays obvious; neither extreme breaks layout. */
const compress = (inches: number, from: number, k: number) => from + (inches - from) * k;
const UNIT = 2.3;
/** How far the play yard stands off the box, in drawing units. The yard is far
 *  wider than it is deep: that is what keeps the litter reading as a row across
 *  the scene, with open grass in front of the box rather than a deep well. */
/* The yard has to be wide enough to read as a rectangle seen from the front,
   and deep enough that the strip of floor in front of the box clears the near
   wall — otherwise every puppy standing there is cut in half by a panel. */
const YARD_MARGIN_X = 104;
const YARD_MARGIN_Y = 90;
/** Panel height is what stops a pen reading as a floor decal: the yard wall
 *  has to stand tall enough beside a puppy to look like something it cannot
 *  simply walk over. */
const YARD_PANEL = 34;
/** Where the box sits inside the yard, as a share of the floor the box leaves
 *  over: a little left of centre, tucked up against the back wall. */
const BOX_U = 0.34;
const BOX_V = 0.1;

// Panel height is compressed harder than the footprint: a true-to-scale 28"
// panel on a 48" box hides the whole litter, which defeats the point of the
// drawing. Tall still reads as visibly taller, just not as a wall.
const boxDims = (spec: BoxSpec) => makeDims(
  compress(spec.width, 28, 0.55) * UNIT,
  compress(spec.depth, 28, 0.55) * UNIT,
  compress(spec.panel, 18, 0.45) * UNIT * 0.62,
);

/** A pen's four floor corners plus a mapper from normalised floor coordinates. */
function corners(d: Dims, BL: Pt) {
  const BR: Pt = [BL[0] + d.ex[0], BL[1] + d.ex[1]];
  const FL: Pt = [BL[0] + d.ey[0], BL[1] + d.ey[1]];
  const FR: Pt = [BL[0] + d.ex[0] + d.ey[0], BL[1] + d.ex[1] + d.ey[1]];
  return {
    FL, BL, BR, FR, h: d.h,
    /** u runs along the width edge, v along the depth edge; both 0..1. */
    floorAt: (u: number, v: number) => ({
      x: BL[0] + d.ex[0] * u + d.ey[0] * v,
      y: BL[1] + d.ex[1] * u + d.ey[1] * v,
    }),
  };
}

export type Pen = ReturnType<typeof corners>;

/** The largest box sold. A yard scene uses this as its canvas so box sizes stay
 * visibly different inside the same play area. */
const LARGEST: BoxSpec = { width: 48, depth: 76, panel: 28, window: false };

/** Geometry for the whole kennel: the box, and the yard around it when asked. */
export function kennelGeometry(spec: BoxSpec, withYard: boolean) {
  const box = boxDims(spec);
  const yard = withYard
    ? makeDims(box.W + YARD_MARGIN_X * 2, box.D + YARD_MARGIN_Y * 2, YARD_PANEL)
    : null;

  // A stand-alone box gets a tight canvas. Keeping the yard-sized canvas for a
  // single box made it look like a tiny floating cage, and encouraged puppies
  // to read as though they had spilled out underneath it. A yard, on the other
  // hand, deliberately keeps the shared large canvas so its scale is clear.
  const max = boxDims(LARGEST);
  const canvas = yard
    ? makeDims(max.W + YARD_MARGIN_X * 2, max.D + YARD_MARGIN_Y * 2, YARD_PANEL)
    : makeDims(box.W, box.D, box.h);
  const pad = 16;
  const vw = canvas.W + canvas.D + pad * 2;
  const vh = canvas.W * ISO_X + canvas.D * ISO_Y + canvas.h + pad * 2;
  const canvasBL: Pt = [canvas.D + pad, canvas.h + pad];
  const centre: Pt = [
    canvasBL[0] + (canvas.ex[0] + canvas.ey[0]) / 2,
    canvasBL[1] + (canvas.ex[1] + canvas.ey[1]) / 2,
  ];
  // Both pens hang off the same centre.
  const placeAt = (d: Dims): Pt => [
    centre[0] - (d.ex[0] + d.ey[0]) / 2,
    centre[1] - (d.ex[1] + d.ey[1]) / 2,
  ];

  const yardPen = yard ? corners(yard, placeAt(yard)) : null;
  // Inside a yard the box is positioned in the yard's own floor coordinates
  // rather than by a screen offset, so however the footprint changes it keeps
  // the same stand-off from the back wall and the same open play area in front.
  let boxBL = placeAt(box);
  if (yardPen && yard) {
    const at = yardPen.floorAt(BOX_U * (1 - box.W / yard.W), BOX_V * (1 - box.D / yard.D));
    boxBL = [at.x, at.y];
  }

  return {
    vw, vh, viewBox: `0 0 ${vw.toFixed(1)} ${vh.toFixed(1)}`,
    box: corners(box, boxBL),
    yard: yardPen,
  };
}
