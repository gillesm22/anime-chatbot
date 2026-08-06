import path from "path";
import { readSave } from "@/lib/serverSaves";

/** On-disk save directory, resolved from the running server's cwd. */
function savesDir(): string {
  return path.join(process.cwd(), "saves");
}

// Return the durable on-disk save so a fresh/wiped browser can rehydrate.
// Responds { data: null } when there is no save, so the client can fall through.
export async function GET(): Promise<Response> {
  try {
    const result = readSave(savesDir());
    return Response.json(result);
  } catch (err) {
    console.error("[api/load] read failed:", err);
    return Response.json({ data: null, timestamp: 0 });
  }
}
