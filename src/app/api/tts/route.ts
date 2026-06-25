import { EdgeTTS } from "@andresaya/edge-tts";

// Distinct female neural voices for each character
const CHARACTER_VOICES: Record<string, { voice: string; pitch: string; rate: string }> = {
  arisu: {
    voice: "en-AU-NatashaNeural",    // Beautiful Australian young woman, warm and gentle
    pitch: "+6Hz",
    rate: "-10%",
  },
  marin: {
    voice: "en-US-SaraNeural",       // Bright, energetic, confident young woman
    pitch: "+8Hz",
    rate: "+5%",
  },
  nao: {
    voice: "en-US-AriaNeural",       // Smooth, cool, expressive young woman
    pitch: "-2Hz",
    rate: "+0%",
  },
  kurisu: {
    voice: "en-US-JennyNeural",      // Precise, articulate, slightly sharp
    pitch: "+2Hz",
    rate: "+3%",
  },
  merrick: {
    voice: "en-US-AmberNeural",      // Deep, smooth, mysterious
    pitch: "-4Hz",
    rate: "-5%",
  },
};

export async function POST(request: Request) {
  const { text, characterId } = await request.json();

  if (!text || !characterId) {
    return new Response(JSON.stringify({ error: "Missing text or characterId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const config = CHARACTER_VOICES[characterId] || CHARACTER_VOICES.arisu;

  try {
    const tts = new EdgeTTS();
    await tts.synthesize(text, config.voice, {
      pitch: config.pitch,
      rate: config.rate,
      volume: "90%",
      outputFormat: "audio-24khz-96kbitrate-mono-mp3",
    });

    const buffer = tts.toBuffer();

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "TTS failed";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
