import path from "path";
import { writeSave, type SaveData } from "@/lib/serverSaves";

/** On-disk save directory, resolved from the running server's cwd. */
function savesDir(): string {
  return path.join(process.cwd(), "saves");
}

// Persist the full anime-chatbot-* blob to disk (atomic latest.json + a pruned
// timestamped history copy). Local-only durability layer; see the design spec.
export async function POST(req: Request): Promise<Response> {
  let body: { data?: SaveData };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Body must be JSON" }, { status: 400 });
  }

  const data = body?.data;
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    // Nothing to save — treat as a no-op rather than an error.
    return Response.json({ ok: false });
  }

  try {
    const result = writeSave(savesDir(), data, { now: Date.now() });
    return Response.json(result);
  } catch (err) {
    console.error("[api/save] write failed:", err);
    return Response.json({ ok: false, error: "Write failed" }, { status: 500 });
  }
}
