import { checkToken } from "@/server/auth";
import { listActions } from "@/server/actions";

export async function GET(req: Request): Promise<Response> {
  const auth = checkToken(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  return Response.json({ actions: listActions() });
}
