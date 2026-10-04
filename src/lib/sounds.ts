/**
 * Gamified sound effects using Web Audio API
 * Warm, playful, Duolingo-inspired — designed for a fun breeder quiz experience
 * No external files needed — all sounds generated programmatically
 */

let muted = localStorage.getItem("ezwhelp-muted") === "true";
let audioCtx: AudioContext | null = null;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; localStorage.setItem("ezwhelp-muted", String(muted)); return muted; }

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", vol = 0.15) {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silent fail
  }
}

/** Soft tap — selecting an option (warm wooden "tok") */
export function playSelect() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    // Main tap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
    // Subtle harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, now);
    gain2.gain.setValueAtTime(0.04, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.06);
  } catch {}
}

/** Hover — very subtle warm breath (for tile hover) */
export function playHover() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.06);
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  } catch {}
}

/** Forward progression — ascending two-note chime */
export function playNext() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.12, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.2);
    });
  } catch {}
}

/** Back button — gentle descending note */
export function playBack() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.1);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch {}
}

/** Milestone chime — halfway or key progress (warm triple chime) */
export function playMilestone() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.1, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.3);
    });
  } catch {}
}

/** Pop — satisfying bubble pop for add-on interactions */
export function playPop() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  } catch {}
}

/** Whoosh — slide-in feeling for results appearing */
export function playWhoosh() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    // Noise-like sweep using detuned oscillators
    [200, 350, 500].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 2.5, now + 0.2);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    });
  } catch {}
}

/** Reward chime — warm "you did it" for completing a section */
export function playReward() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const notes = [659.25, 783.99, 987.77, 1174.66]; // E5, G5, B5, D6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.09, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.35);
    });
    // Sustained warm pad
    const pad = ctx.createOscillator();
    const padGain = ctx.createGain();
    pad.type = "triangle";
    pad.frequency.setValueAtTime(523.25, now + 0.2);
    padGain.gain.setValueAtTime(0.06, now + 0.2);
    padGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    pad.connect(padGain);
    padGain.connect(ctx.destination);
    pad.start(now + 0.2);
    pad.stop(now + 0.85);
  } catch {}
}

/** 
 * Celebration — psychologically optimized "you won" sound
 * 
 * 1. Ascending run → brain registers "achievement"
 * 2. Brief pause before payoff → anticipation amplifies dopamine
 * 3. Major chord resolution → deep satisfaction & trust
 * 4. Warm shimmer → "magic/delight" feeling that drives action
 * ~1s total — snappy yet emotionally resonant
 */
export function playCelebration() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Phase 1: Quick ascending run — "something great is happening"
    const run = [
      { freq: 523, time: 0, dur: 0.07 },      // C5
      { freq: 659, time: 0.06, dur: 0.07 },    // E5
      { freq: 784, time: 0.12, dur: 0.07 },    // G5
    ];

    // Phase 2: Pause + triumphant resolution — "YOU WON"
    const resolve = [
      { freq: 1047, time: 0.28, dur: 0.15 },   // C6 (payoff after pause)
      { freq: 1319, time: 0.44, dur: 0.35 },   // E6 (held major third finish)
    ];

    [...run, ...resolve].forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0.07, now + time);
      gain.gain.setValueAtTime(0.07, now + time + dur * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + dur + 0.02);
    });

    // Warm sine root on resolution — "trust & comfort"
    const warm = ctx.createOscillator();
    const warmGain = ctx.createGain();
    warm.type = "sine";
    warm.frequency.setValueAtTime(523, now + 0.28);
    warmGain.gain.setValueAtTime(0.1, now + 0.28);
    warmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    warm.connect(warmGain);
    warmGain.connect(ctx.destination);
    warm.start(now + 0.28);
    warm.stop(now + 0.9);

    // High shimmer sparkle — triggers "delight/magic" response
    const shimmer = ctx.createOscillator();
    const shimGain = ctx.createGain();
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(2637, now + 0.3);
    shimmer.frequency.exponentialRampToValueAtTime(3951, now + 0.6);
    shimGain.gain.setValueAtTime(0.03, now + 0.3);
    shimGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    shimmer.connect(shimGain);
    shimGain.connect(ctx.destination);
    shimmer.start(now + 0.3);
    shimmer.stop(now + 0.75);
  } catch {}
}

/** Typing tick — very soft per-keystroke feedback */
export function playTypeTick() {
  if (muted) return;
  playTone(1200 + Math.random() * 400, 0.03, "sine", 0.025);
}

/** Button click — slightly punchy confirmation */
export function playButtonClick() {
  if (muted) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.04);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch {}
}
