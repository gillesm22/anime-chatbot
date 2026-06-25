"use client";

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let allNodes: OscillatorNode[] = [];
let melodyTimeout: ReturnType<typeof setTimeout> | null = null;
let isPlaying = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

// Two interleaving melodies in Cmaj9 - piano-like lead + soft counter melody
const LEAD = [
  // Phrase 1 - ascending, hopeful
  { freq: 329.63, dur: 3.2 },  // E4
  { freq: 392.00, dur: 2.0 },  // G4
  { freq: 523.25, dur: 3.5 },  // C5
  { freq: 587.33, dur: 2.8 },  // D5
  { freq: 659.25, dur: 4.0 },  // E5 (linger)
  // Phrase 2 - floating, reflective
  { freq: 523.25, dur: 2.5 },  // C5
  { freq: 493.88, dur: 3.0 },  // B4
  { freq: 440.00, dur: 2.2 },  // A4
  { freq: 392.00, dur: 3.8 },  // G4 (breathe)
  // Phrase 3 - climbing higher, emotional
  { freq: 523.25, dur: 2.0 },  // C5
  { freq: 659.25, dur: 2.5 },  // E5
  { freq: 783.99, dur: 3.2 },  // G5
  { freq: 880.00, dur: 4.0 },  // A5 (peak, hold)
  { freq: 783.99, dur: 2.8 },  // G5
  { freq: 659.25, dur: 3.5 },  // E5 (resolve down)
  // Phrase 4 - gentle descent, peaceful
  { freq: 587.33, dur: 2.5 },  // D5
  { freq: 523.25, dur: 3.0 },  // C5
  { freq: 440.00, dur: 2.8 },  // A4
  { freq: 392.00, dur: 3.5 },  // G4
  { freq: 329.63, dur: 4.5 },  // E4 (rest, breathe)
];

const COUNTER = [
  // Gentle low accompaniment, plays slower
  { freq: 261.63, dur: 5.0 },  // C4
  { freq: 329.63, dur: 4.5 },  // E4
  { freq: 293.66, dur: 5.5 },  // D4
  { freq: 261.63, dur: 4.0 },  // C4
  { freq: 220.00, dur: 6.0 },  // A3
  { freq: 246.94, dur: 5.0 },  // B3
  { freq: 261.63, dur: 5.5 },  // C4
  { freq: 196.00, dur: 6.0 },  // G3
];

function createReverb(ctx: AudioContext): ConvolverNode {
  const convolver = ctx.createConvolver();
  const rate = ctx.sampleRate;
  const length = rate * 2.5;
  const buffer = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
  }
  convolver.buffer = buffer;
  return convolver;
}

function playNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  dur: number,
  volume: number,
  delay: number = 0,
) {
  const t = ctx.currentTime + delay;

  // Main tone - triangle for warmth
  const osc = ctx.createOscillator();
  const noteGain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, t);

  // Piano-like envelope: quick attack, gentle sustain, smooth release
  noteGain.gain.setValueAtTime(0, t);
  noteGain.gain.linearRampToValueAtTime(volume, t + 0.08);
  noteGain.gain.exponentialRampToValueAtTime(volume * 0.5, t + 0.6);
  noteGain.gain.linearRampToValueAtTime(volume * 0.25, t + dur * 0.7);
  noteGain.gain.linearRampToValueAtTime(0.001, t + dur);

  osc.connect(noteGain);
  noteGain.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.1);
  allNodes.push(osc);

  // Octave overtone - sine, very soft, adds sparkle
  const harm = ctx.createOscillator();
  const harmGain = ctx.createGain();
  harm.type = "sine";
  harm.frequency.setValueAtTime(freq * 2, t);
  harmGain.gain.setValueAtTime(0, t);
  harmGain.gain.linearRampToValueAtTime(volume * 0.15, t + 0.08);
  harmGain.gain.linearRampToValueAtTime(0.001, t + dur * 0.5);
  harm.connect(harmGain);
  harmGain.connect(dest);
  harm.start(t);
  harm.stop(t + dur);
  allNodes.push(harm);

  // Fifth overtone - adds richness
  const fifth = ctx.createOscillator();
  const fifthGain = ctx.createGain();
  fifth.type = "sine";
  fifth.frequency.setValueAtTime(freq * 1.5, t);
  fifthGain.gain.setValueAtTime(0, t);
  fifthGain.gain.linearRampToValueAtTime(volume * 0.06, t + 0.1);
  fifthGain.gain.linearRampToValueAtTime(0.001, t + dur * 0.4);
  fifth.connect(fifthGain);
  fifthGain.connect(dest);
  fifth.start(t);
  fifth.stop(t + dur);
  allNodes.push(fifth);
}

function playLeadNote(ctx: AudioContext, dest: AudioNode, index: number) {
  if (!isPlaying) return;
  const note = LEAD[index % LEAD.length];
  playNote(ctx, dest, note.freq, note.dur, 0.22);

  const nextDelay = (note.dur * 0.7 + 0.3 + Math.random() * 0.6) * 1000;
  melodyTimeout = setTimeout(() => playLeadNote(ctx, dest, index + 1), nextDelay);
}

let counterTimeout: ReturnType<typeof setTimeout> | null = null;

function playCounterNote(ctx: AudioContext, dest: AudioNode, index: number) {
  if (!isPlaying) return;
  const note = COUNTER[index % COUNTER.length];
  playNote(ctx, dest, note.freq, note.dur, 0.10);

  const nextDelay = (note.dur * 0.8 + 0.5 + Math.random() * 0.8) * 1000;
  counterTimeout = setTimeout(() => playCounterNote(ctx, dest, index + 1), nextDelay);
}

export function startAmbientMusic() {
  if (isPlaying) return;
  if (typeof window === "undefined") return;

  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();

  masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 5);
  masterGain.connect(ctx.destination);

  allNodes = [];

  // Reverb for spaciousness
  const reverb = createReverb(ctx);
  const reverbGain = ctx.createGain();
  reverbGain.gain.setValueAtTime(0.4, ctx.currentTime);
  reverb.connect(reverbGain);
  reverbGain.connect(masterGain);

  // Dry/wet mix bus
  const dryBus = ctx.createGain();
  dryBus.gain.setValueAtTime(0.7, ctx.currentTime);
  dryBus.connect(masterGain);
  dryBus.connect(reverb);

  // Layer 1: Warm evolving pad - two detuned sines per note for chorus
  const padNotes = [
    { freq: 130.81, gain: 0.10 },  // C3
    { freq: 196.00, gain: 0.08 },  // G3
    { freq: 261.63, gain: 0.06 },  // C4
    { freq: 329.63, gain: 0.04 },  // E4
  ];

  for (const pad of padNotes) {
    for (const detune of [-4, 4]) {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(pad.freq, ctx.currentTime);
      osc.detune.setValueAtTime(detune, ctx.currentTime);
      oscGain.gain.setValueAtTime(pad.gain, ctx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(masterGain);

      // Slow drift for organic feel
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.03 + Math.random() * 0.04, ctx.currentTime);
      lfoGain.gain.setValueAtTime(2.5, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);
      lfo.start();

      osc.start();
      allNodes.push(osc);
    }
  }

  // Layer 2: Airy high texture - filtered noise-like shimmer
  const shimmer1 = ctx.createOscillator();
  const shimmer1Gain = ctx.createGain();
  shimmer1.type = "sine";
  shimmer1.frequency.setValueAtTime(1318.5, ctx.currentTime); // E6
  shimmer1Gain.gain.setValueAtTime(0, ctx.currentTime);
  shimmer1.connect(shimmer1Gain);
  shimmer1Gain.connect(masterGain);

  const shimmer2 = ctx.createOscillator();
  const shimmer2Gain = ctx.createGain();
  shimmer2.type = "sine";
  shimmer2.frequency.setValueAtTime(1567.98, ctx.currentTime); // G6
  shimmer2Gain.gain.setValueAtTime(0, ctx.currentTime);
  shimmer2.connect(shimmer2Gain);
  shimmer2Gain.connect(masterGain);

  // Both shimmers breathe in and out on different cycles
  for (const [shGain, rate] of [[shimmer1Gain, 0.02], [shimmer2Gain, 0.015]] as [GainNode, number][]) {
    const lfo = ctx.createOscillator();
    const lGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(rate, ctx.currentTime);
    lGain.gain.setValueAtTime(0.025, ctx.currentTime);
    lfo.connect(lGain);
    lGain.connect(shGain.gain);
    lfo.start();
  }
  shimmer1.start();
  shimmer2.start();
  allNodes.push(shimmer1, shimmer2);

  // Layer 3: Lead melody (starts after 3s)
  melodyTimeout = setTimeout(() => {
    playLeadNote(ctx, dryBus, 0);
  }, 3000);

  // Layer 4: Counter melody (starts after 8s, offset from lead)
  counterTimeout = setTimeout(() => {
    playCounterNote(ctx, dryBus, 0);
  }, 8000);

  isPlaying = true;
}

export function stopAmbientMusic() {
  if (!isPlaying || !masterGain || !audioCtx) return;

  masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 3);

  if (melodyTimeout) { clearTimeout(melodyTimeout); melodyTimeout = null; }
  if (counterTimeout) { clearTimeout(counterTimeout); counterTimeout = null; }

  const nodes = allNodes;
  allNodes = [];
  isPlaying = false;

  setTimeout(() => {
    nodes.forEach((o) => { try { o.stop(); } catch {} });
    masterGain = null;
  }, 3500);
}

export function isAmbientPlaying(): boolean {
  return isPlaying;
}
