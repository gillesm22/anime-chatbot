let currentAudio: HTMLAudioElement | null = null;

export function isVoiceEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("anime-chatbot-sound-enabled") !== "false";
}

export async function speakLine(text: string, characterId: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isVoiceEnabled()) return;

  // Stop any current speech
  stopSpeaking();

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, characterId }),
    });

    if (!response.ok) return;

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    currentAudio = new Audio(url);
    currentAudio.volume = 0.8;

    currentAudio.onended = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
    };

    await currentAudio.play();
  } catch {
    // Silently fail - TTS is not critical
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
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  // Also stop Web Speech API in case it's still running
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
