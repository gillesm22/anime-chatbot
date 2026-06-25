"use client";

// ─────────────────────────────────────────────────────────────────────────────
// sceneSounds.ts
// Ambient audio layers per scene + character-specific melody themes.
// All audio is synthesized via Web Audio API — no external files.
// Master volume is kept very low (0.03–0.05) so it never overpowers
// speech or UI sounds.
// ─────────────────────────────────────────────────────────────────────────────

let ctx: AudioContext | null = null;

// All currently running nodes that need to be stopped on scene change.
let activeNodes: AudioNode[] = [];
// Master gain for the whole scene layer.
let masterGain: GainNode | null = null;
// Timeout handles for randomized event sounds (chimes, blips, etc.).
let eventTimers: ReturnType<typeof setTimeout>[] = [];
// Separate gain node for the character melody layer so it can be swapped.
let melodyGain: GainNode | null = null;
// Cleanup fn for the currently playing character melody (stops oscillators).
let melodyCleanup: (() => void) | null = null;

// ─── Audio context ────────────────────────────────────────────────────────────

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    ctx = new AudioContext();
  }
  // Resume in case the browser suspended it before a user gesture.
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

// ─── Utility: white-noise buffer (1 s, looped) ───────────────────────────────

function createNoiseSource(audioCtx: AudioContext): AudioBufferSourceNode {
  const bufferSize = audioCtx.sampleRate; // 1 second
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

// ─── Utility: register node so it's torn down on stopSceneAudio ──────────────

function track(node: AudioNode) {
  activeNodes.push(node);
}

// ─── Utility: schedule a randomized repeating event sound ───────────────────

function scheduleRandom(
  minMs: number,
  maxMs: number,
  callback: () => void
): void {
  const delay = minMs + Math.random() * (maxMs - minMs);
  const handle = setTimeout(() => {
    callback();
    scheduleRandom(minMs, maxMs, callback);
  }, delay);
  eventTimers.push(handle);
}

// ─── Tear-down helpers ────────────────────────────────────────────────────────

function clearEventTimers() {
  eventTimers.forEach(clearTimeout);
  eventTimers = [];
}

function stopAllNodes() {
  for (const node of activeNodes) {
    try {
      if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
        (node as OscillatorNode).stop();
      }
    } catch {
      // already stopped — ignore
    }
  }
  activeNodes = [];
}

// ─── Scene builders ───────────────────────────────────────────────────────────

function buildSakura(audioCtx: AudioContext, dest: AudioNode) {
  // Soft wind: filtered white noise, very low volume.
  const noise = createNoiseSource(audioCtx);
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 800;
  filter.Q.value = 0.5;
  const windGain = audioCtx.createGain();
  windGain.gain.value = 0.35; // relative to master 0.04

  noise.connect(filter);
  filter.connect(windGain);
  windGain.connect(dest);
  noise.start();
  track(noise);

  // Occasional high bell chime (2000–3000 Hz sine, very quiet).
  scheduleRandom(3000, 9000, () => {
    if (!ctx) return;
    const freq = 2000 + Math.random() * 1000;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.connect(g);
    g.connect(dest);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
  });
}

function buildBeach(audioCtx: AudioContext, dest: AudioNode) {
  // Low wave rumble: filtered noise sweeping 100–300 Hz.
  const noise = createNoiseSource(audioCtx);
  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 150;
  filter.Q.value = 1.2;
  const waveGain = audioCtx.createGain();
  waveGain.gain.value = 0.7;

  noise.connect(filter);
  filter.connect(waveGain);
  waveGain.connect(dest);
  noise.start();
  track(noise);

  // Sweep the filter frequency to simulate wave swell (every ~6 s).
  function sweepWave() {
    if (!ctx) return;
    filter.frequency.linearRampToValueAtTime(300, ctx.currentTime + 3);
    filter.frequency.linearRampToValueAtTime(100, ctx.currentTime + 6);
    const h = setTimeout(sweepWave, 6000);
    eventTimers.push(h);
  }
  sweepWave();

  // Seagull-like high sine blips every 5–8 s.
  scheduleRandom(5000, 8000, () => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    // Quick pitch glide upward — seagull cry feel.
    osc.frequency.setValueAtTime(2200 + Math.random() * 400, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(3000 + Math.random() * 300, ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(2400, ctx.currentTime + 0.35);
    g.gain.setValueAtTime(0.0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(g);
    g.connect(dest);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  });
}

function buildCyberpunk(audioCtx: AudioContext, dest: AudioNode) {
  // Low city hum: sawtooth at 60 Hz, very quiet.
  const hum = audioCtx.createOscillator();
  const humGain = audioCtx.createGain();
  hum.type = "sawtooth";
  hum.frequency.value = 60;
  humGain.gain.value = 0.12;

  hum.connect(humGain);
  humGain.connect(dest);
  hum.start();
  track(hum);

  // Slight sub-harmonic doubling at 120 Hz for thickness.
  const hum2 = audioCtx.createOscillator();
  const hum2Gain = audioCtx.createGain();
  hum2.type = "sawtooth";
  hum2.frequency.value = 120;
  hum2Gain.gain.value = 0.06;
  hum2.connect(hum2Gain);
  hum2Gain.connect(dest);
  hum2.start();
  track(hum2);

  // Occasional glitchy blip: square wave burst 800–1200 Hz.
  scheduleRandom(2000, 7000, () => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 800 + Math.random() * 400;
    // Very short burst, random pitch jitter.
    const duration = 0.02 + Math.random() * 0.04;
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(g);
    g.connect(dest);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);

    // Sometimes fire a second blip 80–200 ms later.
    if (Math.random() > 0.5) {
      const delay = 0.08 + Math.random() * 0.12;
      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.type = "square";
      osc2.frequency.value = 800 + Math.random() * 400;
      g2.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.025);
      osc2.connect(g2);
      g2.connect(dest);
      osc2.start(ctx.currentTime + delay);
      osc2.stop(ctx.currentTime + delay + 0.025);
    }
  });
}

function buildCafe(audioCtx: AudioContext, dest: AudioNode) {
  // Warm low pad: sine at 220 Hz.
  const pad = audioCtx.createOscillator();
  const padGain = audioCtx.createGain();
  pad.type = "sine";
  pad.frequency.value = 220;
  padGain.gain.value = 0.18;

  // Add a very slow LFO tremolo to the pad for organic feel.
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.3;
  lfoGain.gain.value = 0.05;
  lfo.connect(lfoGain);
  lfoGain.connect(padGain.gain);
  lfo.start();
  track(lfo);

  pad.connect(padGain);
  padGain.connect(dest);
  pad.start();
  track(pad);

  // Soft clinking: high sine burst at ~3000 Hz every 4–7 s.
  scheduleRandom(4000, 7000, () => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 2800 + Math.random() * 400;
    g.gain.setValueAtTime(0.0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(g);
    g.connect(dest);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  });
}

function buildRain(audioCtx: AudioContext, dest: AudioNode) {
  // Constant rain: bandpass-filtered white noise at 400–800 Hz.
  const noise = createNoiseSource(audioCtx);
  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 600;
  filter.Q.value = 0.8;
  const rainGain = audioCtx.createGain();
  rainGain.gain.value = 0.8;

  noise.connect(filter);
  filter.connect(rainGain);
  rainGain.connect(dest);
  noise.start();
  track(noise);

  // Occasional deeper thunder rumble pulse at ~100 Hz.
  scheduleRandom(6000, 18000, () => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.8);
    g.gain.setValueAtTime(0.0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc.connect(g);
    g.connect(dest);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.9);
  });
}

function buildNightSky(audioCtx: AudioContext, dest: AudioNode) {
  // Near silence — the faintest high-frequency shimmer at 4000 Hz.
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = 4000;
  g.gain.value = 0.01; // whisper-quiet relative to master

  // Very slow LFO so even this shimmer breathes gently.
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.07;
  lfoGain.gain.value = 0.005;
  lfo.connect(lfoGain);
  lfoGain.connect(g.gain);
  lfo.start();
  track(lfo);

  osc.connect(g);
  g.connect(dest);
  osc.start();
  track(osc);
}

// ─── Character melody layers ──────────────────────────────────────────────────

// Helper: play a repeating arpeggio and return a cleanup function.
function buildArpeggioMelody(
  audioCtx: AudioContext,
  dest: AudioNode,
  freqs: number[],
  noteDuration: number,  // seconds per note
  oscType: OscillatorType,
  gainValue: number
): () => void {
  let step = 0;
  let stopped = false;
  const activeOscs: OscillatorNode[] = [];

  function playNote() {
    if (stopped || !ctx) return;
    const freq = freqs[step % freqs.length];
    step++;

    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = oscType;
    osc.frequency.value = freq;
    // Short attack, decay to near-zero.
    g.gain.setValueAtTime(0, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(gainValue, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + noteDuration * 0.85);
    osc.connect(g);
    g.connect(dest);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + noteDuration);
    activeOscs.push(osc);

    if (!stopped) {
      const h = setTimeout(playNote, noteDuration * 1000);
      eventTimers.push(h);
    }
  }

  playNote();

  return () => {
    stopped = true;
    for (const o of activeOscs) {
      try { o.stop(); } catch { /* already stopped */ }
    }
  };
}

// arisu — gentle piano-like triangle wave, C major, slow tempo (~60 bpm feel).
// C4 D4 E4 G4 A4 C5
function buildArisuMelody(audioCtx: AudioContext, dest: AudioNode): () => void {
  const cMajor = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
  return buildArpeggioMelody(audioCtx, dest, cMajor, 0.6, "triangle", 0.35);
}

// marin — upbeat plucky square wave, G major, slightly faster (~90 bpm feel).
// G4 A4 B4 D5 E5 G5
function buildMarinMelody(audioCtx: AudioContext, dest: AudioNode): () => void {
  const gMajor = [392.0, 440.0, 493.88, 587.33, 659.25, 784.0];
  return buildArpeggioMelody(audioCtx, dest, gMajor, 0.4, "square", 0.2);
}

// nao — dark synthwave sawtooth pad, A minor, slow arpeggiation.
// A2 C3 E3 G3 A3 C4
function buildNaoMelody(audioCtx: AudioContext, dest: AudioNode): () => void {
  const aMinor = [110.0, 130.81, 164.81, 196.0, 220.0, 261.63];
  return buildArpeggioMelody(audioCtx, dest, aMinor, 0.75, "sawtooth", 0.28);
}

// kurisu — precise staccato sine, E minor, clinical tempo (~70 bpm feel).
// E3 G3 B3 D4 E4 G4
function buildKurisuMelody(audioCtx: AudioContext, dest: AudioNode): () => void {
  const eMinor = [164.81, 196.0, 246.94, 293.66, 329.63, 392.0];
  return buildArpeggioMelody(audioCtx, dest, eMinor, 0.5, "sine", 0.3);
}

// merrick — haunting triangle wave, D minor, slow and ethereal (~45 bpm feel).
// D3 F3 A3 C4 D4 F4
function buildMerrickMelody(audioCtx: AudioContext, dest: AudioNode): () => void {
  const dMinor = [146.83, 174.61, 220.0, 261.63, 293.66, 349.23];
  return buildArpeggioMelody(audioCtx, dest, dMinor, 0.9, "triangle", 0.32);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Start the ambient soundscape for `sceneId` and optionally layer
 * the character-specific melody for `characterId` on top.
 */
export function startSceneAudio(sceneId: string, characterId: string): void {
  if (typeof window === "undefined") return;

  // Always stop any existing scene first.
  stopSceneAudio();

  const audioCtx = getCtx();
  if (!audioCtx) return;

  // Master gain — very quiet so it never overpowers speech/UI sounds.
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.04;
  masterGain.connect(audioCtx.destination);

  // Scene layer (connects to masterGain).
  switch (sceneId) {
    case "sakura":
      buildSakura(audioCtx, masterGain);
      break;
    case "beach":
      buildBeach(audioCtx, masterGain);
      break;
    case "cyberpunk":
      buildCyberpunk(audioCtx, masterGain);
      break;
    case "cafe":
      buildCafe(audioCtx, masterGain);
      break;
    case "rain":
      buildRain(audioCtx, masterGain);
      break;
    case "night_sky":
    case "moonlight":
    case "lab":
      buildNightSky(audioCtx, masterGain);
      break;
    case "cozy_room":
      buildCafe(audioCtx, masterGain);
      break;
    case "morning":
    case "sunset":
      buildBeach(audioCtx, masterGain);
      break;
    default:
      break;
  }

  // Character melody layer.
  setCharacterMusic(characterId);
}

/**
 * Fade out and stop all scene audio.
 */
export function stopSceneAudio(): void {
  if (typeof window === "undefined") return;

  clearEventTimers();

  if (melodyCleanup) {
    melodyCleanup();
    melodyCleanup = null;
  }

  if (masterGain && ctx) {
    const now = ctx.currentTime;
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(0, now + 0.8);
    // Give the fade time to complete before stopping hard.
    const h = setTimeout(() => {
      stopAllNodes();
      masterGain = null;
      melodyGain = null;
    }, 900);
    eventTimers.push(h); // gets cleared on next startSceneAudio — harmless.
  } else {
    stopAllNodes();
    masterGain = null;
    melodyGain = null;
  }
}

/**
 * Switch only the melody layer to the character-specific theme,
 * leaving the scene soundscape untouched.
 */
export function setCharacterMusic(characterId: string): void {
  if (typeof window === "undefined") return;

  // Stop existing melody.
  if (melodyCleanup) {
    melodyCleanup();
    melodyCleanup = null;
  }
  if (melodyGain) {
    try {
      melodyGain.disconnect();
    } catch { /* already disconnected */ }
    melodyGain = null;
  }

  const audioCtx = getCtx();
  if (!audioCtx || !masterGain) return;

  // Melody gets its own gain buss routed into the master.
  melodyGain = audioCtx.createGain();
  melodyGain.gain.value = 0.6; // relative to master
  melodyGain.connect(masterGain);

  switch (characterId) {
    case "arisu":
      melodyCleanup = buildArisuMelody(audioCtx, melodyGain);
      break;
    case "marin":
      melodyCleanup = buildMarinMelody(audioCtx, melodyGain);
      break;
    case "nao":
      melodyCleanup = buildNaoMelody(audioCtx, melodyGain);
      break;
    case "kurisu":
      melodyCleanup = buildKurisuMelody(audioCtx, melodyGain);
      break;
    case "merrick":
      melodyCleanup = buildMerrickMelody(audioCtx, melodyGain);
      break;
    default:
      break;
  }
}
