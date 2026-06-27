import { ElevenLabsClient } from "elevenlabs";
import OpenAI from "openai";

// Use ElevenLabs if API key is set, otherwise fall back to OpenAI TTS
const elevenlabs = process.env.ELEVENLABS_API_KEY
  ? new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
  : null;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ElevenLabs voice IDs — browse https://elevenlabs.io/voice-library to find/change voices
// Set these to the voice IDs you pick from the library
const ELEVENLABS_VOICES: Record<string, { voiceId: string; stability: number; similarityBoost: number; speed: number }> = {
  arisu: {
    voiceId: "EXAVITQu4vr4xnSDxMaL",  // "Sarah" — warm, gentle
    stability: 0.6,
    similarityBoost: 0.8,
    speed: 0.95,
  },
  marin: {
    voiceId: "jBpfuIE2acCO8z3wKNLl",  // "Gigi" — bright, energetic
    stability: 0.4,
    similarityBoost: 0.75,
    speed: 1.1,
  },
  nao: {
    voiceId: "jsCqWAovK2LkecY7zXl4",  // "Freya" — smooth, cool
    stability: 0.5,
    similarityBoost: 0.8,
    speed: 1.0,
  },
  kurisu: {
    voiceId: "XB0fDUnXU5powFXDhCwa",  // "Charlotte" — sharp, articulate
    stability: 0.45,
    similarityBoost: 0.85,
    speed: 1.1,
  },
  merrick: {
    voiceId: "pFZP5JQG7iQjIQuC4Bku",  // "Lily" — sweet, charming
    stability: 0.55,
    similarityBoost: 0.8,
    speed: 0.9,
  },
  ticia: {
    voiceId: "XrExE9yKIg1WjnnlVkGX",  // "Matilda" — low, measured, elegant
    stability: 0.7,
    similarityBoost: 0.85,
    speed: 0.85,
  },
};

// OpenAI fallback voices (used when ELEVENLABS_API_KEY is not set)
const OPENAI_VOICES: Record<string, { voice: string; speed: number; instructions: string }> = {
  arisu: {
    voice: "nova",
    speed: 0.95,
    instructions: "Speak as a warm, gentle young woman with a soft Australian accent. Your tone is nurturing, patient, and kind — like a supportive older sister. Speak clearly with a light, breathy quality. Pause gently between thoughts.",
  },
  marin: {
    voice: "nova",
    speed: 1.1,
    instructions: "Speak as an energetic, bubbly young woman full of excitement. You're a confident, tanned California-girl type — bright, fast-paced, expressive. Use rising intonation when excited. Laugh easily. Your voice sparkles with enthusiasm.",
  },
  nao: {
    voice: "sage",
    speed: 1.0,
    instructions: "You are a pretty, smart young woman with a smooth and silky voice. Speak in a relaxed, effortlessly cool way — your voice is soft and feminine but with an edge of dry wit underneath. You sound like you're always slightly amused. Your delivery is fluid and unhurried, with a natural prettiness to your tone. Think of a girl who's too clever to try hard but too cute to ignore. Occasionally let a real emotion slip through — brief and genuine.",
  },
  kurisu: {
    voice: "coral",
    speed: 1.15,
    instructions: "You are a sharp, confident young woman genius. Your voice is medium-pitched, clear, and articulate. Speak quickly and precisely — you are always the smartest person in the room. Your default tone is cool, composed, and slightly sarcastic. When annoyed, your voice gets clipped and cutting with rapid-fire rebuttals. You sigh in exasperation often. When flustered or embarrassed, you stammer slightly and get defensive — your composure cracks and your pitch rises. You are NOT soft, NOT gentle, NOT slow. You are witty, snarky, and intellectual with sharp comedic timing.",
  },
  merrick: {
    voice: "shimmer",
    speed: 0.92,
    instructions: "You are a beautiful Creole woman from New Orleans. Your voice is sweet, warm, and charming — like honey with a playful sparkle. You sound genuinely delighted to be talking to someone. Your tone is feminine, melodic, and inviting with a light Southern warmth. You are charming without being seductive — more like a captivating woman at a dinner party who makes everyone feel special. Smile when you talk. Be sweet but clever.",
  },
  ticia: {
    voice: "shimmer",
    speed: 1.0,
    instructions: "You are an elegant gothic young woman with a silky, feminine voice. Your tone is soft and melodic with a slightly breathy, intimate quality — like a beautiful whisper that carries weight. You speak at a natural conversational pace, unhurried but never dragging. You deliver dark and morbid things with warm sincerity and a gentle smile in your voice, as if discussing something lovely. Your humor is dry and deadpan — never laugh at your own jokes. Think a young, feminine Morticia Addams — graceful, alluring, and hauntingly pretty.",
  },
};

async function generateElevenLabs(text: string, characterId: string): Promise<Buffer> {
  const config = ELEVENLABS_VOICES[characterId] || ELEVENLABS_VOICES.arisu;
  const audio = await elevenlabs!.textToSpeech.convert(config.voiceId, {
    text,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: config.stability,
      similarity_boost: config.similarityBoost,
      speed: config.speed,
    },
  });

  // Collect the stream into a buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of audio) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function generateOpenAI(text: string, characterId: string): Promise<Buffer> {
  const config = OPENAI_VOICES[characterId] || OPENAI_VOICES.arisu;
  const response = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: config.voice as "shimmer" | "nova" | "coral" | "sage" | "alloy",
    input: text,
    speed: config.speed,
    instructions: config.instructions,
    response_format: "mp3",
  });
  return Buffer.from(await response.arrayBuffer());
}

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

  try {
    const buffer = elevenlabs
      ? await generateElevenLabs(safeText, characterId)
      : await generateOpenAI(safeText, characterId);

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
