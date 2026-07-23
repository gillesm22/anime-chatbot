import { spawn } from "node:child_process";
import { checkToken } from "@/server/auth";
import { getAction } from "@/server/actions";
import { runQuick } from "@/server/jobs";
import { getRemoteState } from "@/server/state";

export async function POST(req: Request): Promise<Response> {
  const auth = checkToken(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  let body: { action?: string; params?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const action = getAction(body.action ?? "");
  if (!action) {
    return Response.json(
      { error: `Unknown action "${body.action ?? ""}"` },
      { status: 400 }
    );
  }

  let built;
  try {
    built = action.build(body.params ?? {});
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }

  if (action.detached) {
    // dev-restart kills this very server, so detach and answer first.
    const child = spawn(built.cmd, built.args, {
      cwd: process.cwd(),
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.unref();
    return Response.json({ ok: true, detached: true, message: `${action.label} launched` });
  }

  if (action.longRunning) {
    const { jobs } = getRemoteState();
    const job = jobs.start(
      { actionId: action.id, label: action.label, params: body.params ?? {} },
      built.cmd,
      built.args
    );
    return Response.json({ ok: true, jobId: job.id });
  }

  const { exitCode, output } = await runQuick(built.cmd, built.args);
  return Response.json({ ok: exitCode === 0, exitCode, output });
}
