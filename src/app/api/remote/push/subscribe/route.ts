import { checkToken } from "@/server/auth";
import { getRemoteState } from "@/server/state";
import type { StoredSubscription } from "@/server/push";

export async function POST(req: Request): Promise<Response> {
  const auth = checkToken(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  let sub: StoredSubscription;
  try {
    sub = await req.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }
  if (!sub || typeof sub.endpoint !== "string" || !sub.endpoint) {
    return Response.json(
      { error: "Subscription must include an endpoint" },
      { status: 400 }
    );
  }
  getRemoteState().store.add(sub);
  return Response.json({ ok: true });
}
