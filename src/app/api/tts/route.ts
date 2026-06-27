import { EdgeTTS } from "@andresaya/edge-tts";

// Edge TTS voices per character — free, no API key needed
const EDGE_VOICES: Record<string, { voice: string; rate: string; pitch: string }> = {
  arisu: {
    voice: "en-AU-NatashaNeural",  // Soft, warm Australian
    rate: "+6%",
    pitch: "+10Hz",
  },
  marin: {
    voice: "en-US-AnaNeural",  // Bright, youthful, upbeat
    rate: "+12%",
    pitch: "+15Hz",
  },
  nao: {
    voice: "en-US-AriaNeural",  // Smooth, cool, confident
    rate: "+2%",
    pitch: "+0Hz",
  },
  kurisu: {
    voice: "en-US-JennyNeural",  // Crisp, articulate
    rate: "+8%",
    pitch: "+5Hz",
  },
  merrick: {
    voice: "en-US-AmberNeural",  // Lower, mysterious
    rate: "-2%",
    pitch: "-5Hz",
  },
  ticia: {
    voice: "en-GB-SoniaNeural",  // Refined, dark elegance
    rate: "+0%",
    pitch: "-3Hz",
  },
};

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const { text, characterId } = body;

  if (!text || !characterId || typeof text !== "string") {
    return new Response(JSON.stringify({ error: "Missing text or characterId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const safeText = text.slice(0, 500);
  const config = EDGE_VOICES[characterId] || EDGE_VOICES.arisu;

  try {
    const tts = new EdgeTTS();
    await tts.synthesize(safeText, config.voice, {
      rate: config.rate,
      pitch: config.pitch,
    });

    const audio = await tts.toBuffer();

    return new Response(audio, {
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
