/**
 * The meadow's dogs are the client's own approved illustrations, keyed off their
 * original black backgrounds and exported to transparent WebP by
 * `scripts/extract-meadow-art.py`.
 *
 * All six puppy poses are cut from a single source sheet, so `units` below is the
 * width each drawing occupied on that sheet. Rendering at `units * --k` keeps a
 * curled puppy and a sitting one at the same scale no matter how differently
 * their bounding boxes are shaped. `--k` is a length — px normally, container
 * units inside the kennel so the whole scene scales together.
 */
import type { CSSProperties } from "react";

import curlSrc from "@/assets/meadow/puppy-curl.webp";
import lieSrc from "@/assets/meadow/puppy-lie.webp";
import sitSrc from "@/assets/meadow/puppy-sit.webp";
import sprawlSrc from "@/assets/meadow/puppy-sprawl.webp";
import standSrc from "@/assets/meadow/puppy-stand.webp";
import walkSrc from "@/assets/meadow/puppy-walk.webp";
import dadBody from "@/assets/meadow/dog-dad-body.webp";
import dadTail from "@/assets/meadow/dog-dad-tail.webp";
import momBody from "@/assets/meadow/dog-mom-body.webp";
import momTail from "@/assets/meadow/dog-mom-tail.webp";

export type PuppyPose = "walk" | "stand" | "lie" | "sit" | "curl" | "sprawl";

const PUPPY: Record<PuppyPose, { src: string; units: number }> = {
  walk: { src: walkSrc, units: 485 },
  stand: { src: standSrc, units: 405 },
  lie: { src: lieSrc, units: 529 },
  sit: { src: sitSrc, units: 322 },
  curl: { src: curlSrc, units: 429 },
  sprawl: { src: sprawlSrc, units: 460 },
};

interface PuppyProps {
  pose: PuppyPose;
  className?: string;
  style?: CSSProperties;
}

export function MeadowPuppy({ pose, className, style }: PuppyProps) {
  const { src, units } = PUPPY[pose];
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading="lazy"
      decoding="async"
      className={className}
      style={{ width: `calc(${units} * var(--k))`, height: "auto", ...style }}
    />
  );
}

interface AdultProps {
  role: "dad" | "mom";
  className?: string;
  style?: CSSProperties;
}

/** Dad faces right and Mom faces left in the source art, so they already look
 *  toward each other across the meadow — neither is mirrored.
 *
 *  The wrapper is a <div> on purpose: `.adult-dog span` styles the name label
 *  (pill background, padding) and `.storybook-playing .adult-dog > span` hides
 *  it during the quiz, so a <span> wrapper would inherit both.
 *
 *  Each adult is two layers: the tail, and the body drawn over it. The tail is
 *  cut along the rump outline with an overlap that stays tucked behind the
 *  body, so it can wag without the joint ever coming apart. */
export function MeadowAdult({ role, className, style }: AdultProps) {
  const [body, tail] = role === "dad" ? [dadBody, dadTail] : [momBody, momTail];
  return (
    <div className={`adult-art${className ? ` ${className}` : ""}`} style={style}>
      <img className="adult-tail" src={tail} alt="" aria-hidden="true" draggable={false} decoding="async" />
      <img className="adult-body" src={body} alt="" aria-hidden="true" draggable={false} decoding="async" />
    </div>
  );
}
