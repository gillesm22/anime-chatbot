import { checkToken } from "@/server/auth";
import { getRemoteState } from "@/server/state";

export async function GET(req: Request): Promise<Response> {
  const auth = checkToken(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const { jobs } = getRemoteState();
  // Lists are small (max 50); trim the log tail so the phone list stays light.
  const summaries = jobs.list().map((j) => ({ ...j, log: j.log.slice(-3) }));
  return Response.json({ jobs: summaries });
}
