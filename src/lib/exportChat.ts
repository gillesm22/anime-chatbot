import type { ChatMessage } from "@/lib/chat/types";

function formatDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAsText(messages: ChatMessage[], characterName: string): void {
  const lines = messages.map((m) => {
    const time = new Date(m.timestamp).toLocaleString();
    const speaker = m.role === "user" ? "You" : characterName;
    return `[${time}] ${speaker}: ${m.content}`;
  });

  const header = `Chat with ${characterName} — Exported ${new Date().toLocaleString()}\n${"=".repeat(50)}\n\n`;
  const text = header + lines.join("\n\n");

  triggerDownload(text, `${characterName}-chat-${formatDate()}.txt`, "text/plain");
}

export function exportAsJSON(messages: ChatMessage[], characterName: string): void {
  const data = { characterName, exportedAt: new Date().toISOString(), messages };
  const json = JSON.stringify(data, null, 2);

  triggerDownload(json, `${characterName}-chat-${formatDate()}.json`, "application/json");
}
