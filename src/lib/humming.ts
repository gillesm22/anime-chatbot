"use client";

// Character humming system — plays a soft melody when the user is idle for 30+ seconds.
// Uses the Web Audio API only (no external files).

type CharacterId = "arisu" | "marin" | "nao" | "kurisu" | "merrick";

interface NoteSpec {
  freq: number;
  duration: number; // seconds
}

// Frequency helpers
const noteFreq: Record<string, number> = {
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  D5: 587.33,
};

// Melodies per character
const melodies: Record<CharacterId, NoteSpec[]> = {
  // Arisu — gentle lullaby, C major, ~60 BPM, 0.8 s per note
  arisu: [
    "C4", "E4", "G4", "A4", "G4", "E4", "D4", "C4", "D4", "E4", "C4",
  ].map((n) => ({ freq: noteFreq[n], duration: 0.8 })),

  // Marin — upbeat pop hum, G major, ~90 BPM, 0.5 s per note
  marin: [
    "G4", "B4", "D5", "B4", "G4", "A4", "B4", "A4", "G4", "D4", "G4",
  ].map((n) => ({ freq: noteFreq[n], duration: 0.5 })),

  // Nao — mysterious minor melody, A minor, ~50 BPM, 1.0 s per note
  nao: [
    "A3", "C4", "E4", "D4", "C4", "B3", "A3", "E4", "D4", "C4", "A3",
  ].map((n) => ({ freq: noteFreq[n], duration: 1.0 })),

  // Kurisu — precise staccato, E minor, ~70 BPM, 0.6 s per note
  kurisu: [
    "E4", "G4", "B4", "A4", "G4", "E4", "D4", "E4", "G4", "A4", "E4",
  ].map((n) => ({ freq: noteFreq[n], duration: 0.6 })),

  // Merrick — slow haunting waltz, D minor, ~45 BPM, 1.2 s per note
  merrick: [
    "D4", "A3", "D4", "E4", "C4", "A3", "B3", "D4", "C4", "A3", "D4",
  ].map((n) => ({ freq: noteFreq[n], duration: 1.2 })),
};

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let idleTimerId: ReturnType<typeof setTimeout> | null = null;
let noteTimerId: ReturnType<typeof setTimeout> | null = null;
let humming = false;
let currentCharacter: CharacterId | null = null;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getAudioCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.025, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

/** Returns a frequency with +-5 cents of random variation for naturalness. */
function withPitchVariation(freq: number): number {
  const cents = (Math.random() * 10 - 5) / 100; // range: -0.05 to +0.05 semitones
  return freq * Math.pow(2, cents / 12);
}

/** Play a single triangle-wave note with attack/sustain/release envelope. */
function playNote(freq: number, duration: number): void {
  if (typeof window === "undefined") return;
  const ctx = getAudioCtx();
  if (!masterGain) return;

  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(withPitchVariation(freq), ctx.currentTime);

  const attack = 0.05;
  const release = 0.1;
  const sustain = Math.max(0, duration - attack - release);

  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(1.0, ctx.currentTime + attack);
  env.gain.setValueAtTime(1.0, ctx.currentTime + attack + sustain);
  env.gain.linearRampToValueAtTime(0, ctx.currentTime + attack + sustain + release);

  osc.connect(env);
  env.connect(masterGain);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/**
 * Recursively schedule melody notes.
 * Plays the melody `totalLoops` times then fades out.
 */
function scheduleMelody(
  notes: NoteSpec[],
  noteIndex: number,
  loopIndex: number,
  totalLoops: number
): void {
  if (!humming) return;

  const note = notes[noteIndex];
  playNote(note.freq, note.duration);

  const nextNoteIndex = (noteIndex + 1) % notes.length;
  const nextLoopIndex = nextNoteIndex === 0 ? loopIndex + 1 : loopIndex;

  // If we have finished all loops, fade out and stop
  if (loopIndex >= totalLoops) {
    fadeOutAndStop();
    return;
  }

  noteTimerId = setTimeout(
    () => scheduleMelody(notes, nextNoteIndex, nextLoopIndex, totalLoops),
    note.duration * 1000
  );
}

function fadeOutAndStop(): void {
  if (typeof window === "undefined") return;
  if (!audioCtx || !masterGain) return;

  const ctx = audioCtx;
  const gain = masterGain;

  // Fade to silence over 1 second
  gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);

  setTimeout(() => {
    humming = false;
    clearNoteTimer();
  }, 1100);
}

function clearNoteTimer(): void {
  if (noteTimerId !== null) {
    clearTimeout(noteTimerId);
    noteTimerId = null;
  }
}

function clearIdleTimer(): void {
  if (idleTimerId !== null) {
    clearTimeout(idleTimerId);
    idleTimerId = null;
  }
}

function beginHumming(characterId: CharacterId): void {
  if (typeof window === "undefined") return;
  if (humming) return;

  const notes = melodies[characterId];
  if (!notes) return;

  currentCharacter = characterId;
  humming = true;

  // Ensure master gain is audible (may have been zeroed by a previous fade-out)
  getAudioCtx();
  if (masterGain) {
    masterGain.gain.cancelScheduledValues(audioCtx!.currentTime);
    masterGain.gain.setValueAtTime(0.025, audioCtx!.currentTime);
  }

  // Play 2-3 loops at random so it feels varied
  const totalLoops = Math.floor(Math.random() * 2) + 2; // 2 or 3
  scheduleMelody(notes, 0, 0, totalLoops);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start the 30-second idle timer for a character.
 * If a timer is already running it is replaced.
 */
export function startIdleTimer(characterId: string): void {
  if (typeof window === "undefined") return;

  clearIdleTimer();

  idleTimerId = setTimeout(() => {
    beginHumming(characterId as CharacterId);
  }, 30_000);
}

/**
 * Reset the idle timer (call on every user interaction or dialogue event).
 * Also stops any humming that is currently playing.
 */
export function resetIdleTimer(): void {
  if (typeof window === "undefined") return;
  stopHumming();
  clearIdleTimer();

  // Restart with the same character if one was set
  if (currentCharacter) {
    startIdleTimer(currentCharacter);
  }
}

/**
 * Stop humming immediately and clear all timers.
 */
export function stopHumming(): void {
  if (typeof window === "undefined") return;

  clearNoteTimer();
  clearIdleTimer();

  if (humming) {
    humming = false;
    fadeOutAndStop();
  }
}

/**
 * Returns true if a melody is currently playing.
 */
export function isHumming(): boolean {
  return humming;
}
