// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createJobManager, type JobRecord } from "@/server/jobs";

const NODE = process.execPath;

function tempPersistPath() {
  return join(mkdtempSync(join(tmpdir(), "hexxii-jobs-")), "jobs.json");
}

async function waitForSettled(
  manager: ReturnType<typeof createJobManager>,
  id: string,
  timeoutMs = 10000
): Promise<JobRecord> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = manager.get(id);
    if (job && job.status !== "running") return job;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("job did not settle in time");
}

describe("job manager", () => {
  let persistPath: string;

  beforeEach(() => {
    persistPath = tempPersistPath();
  });

  it("starts a job in running state with an id and metadata", () => {
    const manager = createJobManager({ persistPath });
    const job = manager.start(
      { actionId: "test", label: "Test job", params: {} },
      NODE,
      ["-e", "setTimeout(() => {}, 500)"]
    );
    expect(job.id).toBeTruthy();
    expect(job.status).toBe("running");
    expect(job.actionId).toBe("test");
    expect(job.startedAt).toBeGreaterThan(0);
  });

  it("transitions to done with exit code 0 and fires onComplete", async () => {
    const completed: JobRecord[] = [];
    const manager = createJobManager({
      persistPath,
      onComplete: (job) => completed.push(job),
    });
    const job = manager.start(
      { actionId: "test", label: "Test job", params: {} },
      NODE,
      ["-e", "console.log('hello from job')"]
    );
    const settled = await waitForSettled(manager, job.id);
    expect(settled.status).toBe("done");
    expect(settled.exitCode).toBe(0);
    expect(settled.endedAt).toBeGreaterThan(0);
    expect(settled.log.join("\n")).toContain("hello from job");
    expect(completed).toHaveLength(1);
    expect(completed[0].id).toBe(job.id);
  });

  it("transitions to failed with the real exit code", async () => {
    const manager = createJobManager({ persistPath });
    const job = manager.start(
      { actionId: "test", label: "Failing job", params: {} },
      NODE,
      ["-e", "console.error('boom'); process.exit(3)"]
    );
    const settled = await waitForSettled(manager, job.id);
    expect(settled.status).toBe("failed");
    expect(settled.exitCode).toBe(3);
    expect(settled.log.join("\n")).toContain("boom");
  });

  it("marks a job failed when the command cannot spawn at all", async () => {
    const manager = createJobManager({ persistPath });
    const job = manager.start(
      { actionId: "test", label: "No such cmd", params: {} },
      "definitely-not-a-real-command-hexxii",
      []
    );
    const settled = await waitForSettled(manager, job.id);
    expect(settled.status).toBe("failed");
  });

  it("caps the log at maxLogLines, keeping the newest lines", async () => {
    const manager = createJobManager({ persistPath, maxLogLines: 10 });
    const job = manager.start(
      { actionId: "test", label: "Chatty job", params: {} },
      NODE,
      ["-e", "for (let i = 0; i < 50; i++) console.log('line-' + i)"]
    );
    const settled = await waitForSettled(manager, job.id);
    expect(settled.log.length).toBeLessThanOrEqual(10);
    expect(settled.log.join("\n")).toContain("line-49");
    expect(settled.log.join("\n")).not.toContain("line-0\n");
  });

  it("persists finished jobs to disk and reloads them in a new manager", async () => {
    const manager = createJobManager({ persistPath });
    const job = manager.start(
      { actionId: "test", label: "Persisted job", params: {} },
      NODE,
      ["-e", "console.log('persist me')"]
    );
    await waitForSettled(manager, job.id);
    expect(existsSync(persistPath)).toBe(true);
    const raw = JSON.parse(readFileSync(persistPath, "utf8"));
    expect(raw.some((j: JobRecord) => j.id === job.id)).toBe(true);

    const reloaded = createJobManager({ persistPath });
    const fromDisk = reloaded.get(job.id);
    expect(fromDisk).toBeTruthy();
    expect(fromDisk!.status).toBe("done");
  });

  it("lists jobs newest first", async () => {
    const manager = createJobManager({ persistPath });
    const first = manager.start(
      { actionId: "test", label: "First", params: {} },
      NODE,
      ["-e", ""]
    );
    const second = manager.start(
      { actionId: "test", label: "Second", params: {} },
      NODE,
      ["-e", ""]
    );
    await waitForSettled(manager, first.id);
    await waitForSettled(manager, second.id);
    const ids = manager.list().map((j) => j.id);
    expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
  });
});
