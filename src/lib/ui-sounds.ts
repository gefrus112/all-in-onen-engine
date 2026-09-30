// All In One Engine — satisfying UI sound effects (Web Audio, zero assets)
// Synthesized tap / click / pop / toggle / success / error sounds.
"use client";

import { useStudio } from "./studio-store";

type Ctx = AudioContext & { __unlocked?: boolean };

let ctx: Ctx | null = null;
let master: GainNode | null = null;
let installed = false;

function ensureCtx(): Ctx | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC() as Ctx;
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function soundsOn(): boolean {
  try {
    return !!useStudio.getState().enableSounds;
  } catch {
    return true;
  }
}

function volume(): number {
  try {
    return useStudio.getState().uiSoundVolume ?? 0.6;
  } catch {
    return 0.6;
  }
}

/** one enveloped oscillator blip */
function blip(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, slideTo?: number) {
  const c = ensureCtx();
  if (!c || !master) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** short filtered noise burst (for soft "thock" transients) */
function noiseBurst(dur: number, gain: number, freq: number, delay = 0) {
  const c = ensureCtx();
  if (!c || !master) return;
  const t0 = c.currentTime + delay;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 1.2;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(master);
  src.start(t0);
}

// ============ public sound palette (all very quiet & rounded) ============

/** soft rounded tap — default for buttons */
export function playTap() {
  if (!soundsOn()) return;
  const v = volume();
  blip(1450, 0.045, "sine", 0.10 * v, 0, 900);
  noiseBurst(0.02, 0.05 * v, 3200);
}

/** crisp two-tone click — toolbar / small controls */
export function playClick() {
  if (!soundsOn()) return;
  const v = volume();
  blip(1900, 0.03, "sine", 0.08 * v, 0, 1400);
  blip(2400, 0.035, "sine", 0.05 * v, 0.028, 1800);
}

/** bubbly pop — toggles, switches, add-object */
export function playPop() {
  if (!soundsOn()) return;
  const v = volume();
  blip(420, 0.09, "sine", 0.12 * v, 0, 950);
  noiseBurst(0.015, 0.04 * v, 1800);
}

/** satisfying switch flip */
export function playToggle(on: boolean) {
  if (!soundsOn()) return;
  const v = volume();
  if (on) { blip(600, 0.05, "sine", 0.09 * v, 0, 1000); blip(1200, 0.06, "sine", 0.07 * v, 0.05, 1600); }
  else { blip(1000, 0.05, "sine", 0.09 * v, 0, 620); blip(640, 0.07, "sine", 0.07 * v, 0.05, 380); }
}

/** little ascending major arpeggio — success moments (play, publish, save) */
export function playSuccess() {
  if (!soundsOn()) return;
  const v = volume();
  const seq: [number, number][] = [[523.25, 0], [659.25, 0.07], [783.99, 0.14], [1046.5, 0.21]];
  seq.forEach(([f, d]) => blip(f, 0.14, "sine", 0.075 * v, d));
  blip(261.6, 0.3, "triangle", 0.05 * v, 0, 261.6);
}

/** gentle descending tone — errors / warnings */
export function playError() {
  if (!soundsOn()) return;
  const v = volume();
  blip(340, 0.16, "triangle", 0.09 * v, 0, 220);
  blip(240, 0.2, "sine", 0.06 * v, 0.08, 160);
}

/** airy swoosh — dialogs opening */
export function playWhoosh() {
  if (!soundsOn()) return;
  const v = volume();
  noiseBurst(0.16, 0.05 * v, 900);
  blip(300, 0.18, "sine", 0.045 * v, 0, 900);
}

/** playful coin blip — in-game pickups triggered by scripts */
export function playCoin() {
  if (!soundsOn()) return;
  const v = volume();
  blip(987.77, 0.07, "square", 0.05 * v, 0);
  blip(1318.51, 0.16, "square", 0.05 * v, 0.07);
}

// ============ global installer ============

function isEligibleTarget(el: Element | null): boolean {
  if (!el) return false;
  if (el.closest("textarea, input[type=text], input[type=number], input[type=color], input[type=range], select, [contenteditable=true]")) return false;
  return !!el.closest("button, [role=button], a, label, summary, input[type=checkbox], input[type=radio]");
}

function isToggle(el: Element): boolean {
  return !!el.closest('[role="switch"], [data-slot="switch"], input[type="checkbox"]');
}

function isTool(el: Element): boolean {
  return !!el.closest(".tool-btn");
}

/**
 * Installs one-time global listeners that play UI sounds on interactions.
 * Respects `enableSounds` + `uiSoundVolume` from the studio store live.
 */
export function installUiSounds() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // unlock audio on very first gesture
  const unlock = () => { ensureCtx(); window.removeEventListener("pointerdown", unlock, true); };
  window.addEventListener("pointerdown", unlock, true);

  window.addEventListener(
    "pointerdown",
    (e) => {
      const target = e.target as Element | null;
      if (!isEligibleTarget(target)) return;
      // warm the context on the first real click too
      ensureCtx();
      if (isToggle(target)) playPop();
      else if (isTool(target)) playClick();
      else playTap();
    },
    true,
  );

  // keyboard: Enter/Space on focused buttons
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = document.activeElement as Element | null;
      if (el && (el.tagName === "BUTTON" || el.getAttribute("role") === "button")) playTap();
    },
    true,
  );
}
