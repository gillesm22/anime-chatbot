import type { Expression } from "@/lib/characters/types";

export type SSEEvent =
  | { type: "expression"; expression: Expression }
  | { type: "text"; content: string }
  | { type: "done" }
  | { type: "error"; message: string };

export function parseSSEChunk(chunk: string): SSEEvent | null {
  const trimmed = chunk.trim();
  if (!trimmed || trimmed.startsWith(":")) return null;
  if (!trimmed.startsWith("data: ")) return null;

  const data = trimmed.slice(6);
  if (data === "[DONE]") return null;

  try {
    return JSON.parse(data) as SSEEvent;
  } catch {
    return null;
  }
}

export interface SendMessageParams {
  message: string;
  characterId: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  userName?: string | null;
  memories?: string;
  responseLength?: "short" | "medium" | "long";
  provider?: string;
  affinityPrompt?: string;
  giftContext?: string;
  heroAppearance?: string;
  heroClassReaction?: string;
  crossCharPrompt?: string;
  miniGamePrompt?: string;
  typingHint?: string | null;
  language?: string;
}

export async function streamChat(
  params: SendMessageParams,
  onEvent: (event: SSEEvent) => void
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    onEvent({ type: "error", message: `API error: ${response.status}` });
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onEvent({ type: "error", message: "No response body" });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const event = parseSSEChunk(line);
      if (event) onEvent(event);
    }
  }

  if (buffer.trim()) {
    const event = parseSSEChunk(buffer);
    if (event) onEvent(event);
  }

  onEvent({ type: "done" });
}
