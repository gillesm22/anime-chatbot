import { checkToken } from "@/server/auth";
import { getRemoteState } from "@/server/state";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<Response> {
  const auth = checkToken(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const job = getRemoteState().jobs.get(id);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }
  return Response.json({ job });
}
