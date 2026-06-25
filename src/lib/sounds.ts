let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (localStorage.getItem("anime-chatbot-sound-enabled") === "false") return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function playTypingClick() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 800;
  osc.type = "sine";
  gain.gain.value = 0.05;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  osc.start(now);
  osc.stop(now + 0.02);
}

export function playSendSwoosh() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.15);
  gain.gain.value = 0.1;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

export function playExpressionChange() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // First note
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.value = 523;
  gain1.gain.value = 0.08;
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.05);

  // Second note
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.value = 659;
  gain2.gain.value = 0.08;
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.05);
  osc2.stop(now + 0.1);
}

export function playMessageReceived() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}
