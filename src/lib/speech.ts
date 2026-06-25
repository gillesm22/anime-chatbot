let currentAudio: HTMLAudioElement | null = null;
let currentAbort: AbortController | null = null;

export function isVoiceEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("anime-chatbot-sound-enabled") !== "false";
}

export async function speakLine(text: string, characterId: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isVoiceEnabled()) return;

  // Stop any current speech and cancel in-flight requests
  stopSpeaking();

  const abort = new AbortController();
  currentAbort = abort;

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, characterId }),
      signal: abort.signal,
    });

    if (!response.ok || abort.signal.aborted) return;

    const blob = await response.blob();
    if (abort.signal.aborted) return;

    const url = URL.createObjectURL(blob);

    currentAudio = new Audio(url);
    currentAudio.volume = 0.8;

    currentAudio.onended = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
    };

    await currentAudio.play();
  } catch {
    // Silently fail - TTS is not critical (includes AbortError)
  }
}

export function toggleVoice(): boolean {
  if (typeof window === "undefined") return false;
  const current = isVoiceEnabled();
  const next = !current;
  localStorage.setItem("anime-chatbot-sound-enabled", next ? "true" : "false");
  if (!next) stopSpeaking();
  return next;
}

export function stopSpeaking(): void {
  if (currentAbort) {
    currentAbort.abort();
    currentAbort = null;
  }
  if (currentAudio) {
    const src = currentAudio.src;
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    if (src.startsWith("blob:")) URL.revokeObjectURL(src);
  }
  // Also stop Web Speech API in case it's still running
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
