// Job manager for HEXXII remote. Spawns allowlisted commands, keeps a ring
// buffer of output, tracks status, and persists history to disk so it
// survives a server restart. See docs/hexxii-remote-design.md.

import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

export type JobStatus = "running" | "done" | "failed";

export interface JobMeta {
  actionId: string;
  label: string;
  params: Record<string, string>;
}

export interface JobRecord extends JobMeta {
  id: string;
  status: JobStatus;
  exitCode: number | null;
  startedAt: number;
  endedAt: number | null;
  log: string[];
}

export interface JobManagerOptions {
  persistPath: string;
  maxLogLines?: number;
  maxJobs?: number;
  onComplete?: (job: JobRecord) => void;
  cwd?: string;
}

const DEFAULT_MAX_LOG_LINES = 200;
const DEFAULT_MAX_JOBS = 50;

export function createJobManager(options: JobManagerOptions) {
  const maxLogLines = options.maxLogLines ?? DEFAULT_MAX_LOG_LINES;
  const maxJobs = options.maxJobs ?? DEFAULT_MAX_JOBS;
  let jobs: JobRecord[] = load();

  function load(): JobRecord[] {
    try {
      const loaded: JobRecord[] = JSON.parse(readFileSync(options.persistPath, "utf8"));
      // A job still "running" in the file died with the previous server process.
      for (const job of loaded) {
        if (job.status === "running") {
          job.status = "failed";
          job.log.push("[hexxii] server restarted while job was running");
        }
      }
      return loaded;
    } catch {
      return [];
    }
  }

  function persist() {
    try {
      mkdirSync(dirname(options.persistPath), { recursive: true });
      writeFileSync(options.persistPath, JSON.stringify(jobs, null, 2));
    } catch (err) {
      console.error("[hexxii-remote] failed to persist jobs:", err);
    }
  }

  function appendLog(job: JobRecord, chunk: string) {
    const lines = chunk.split(/\r?\n/).filter((l) => l.length > 0);
    job.log.push(...lines);
    if (job.log.length > maxLogLines) {
      job.log = job.log.slice(job.log.length - maxLogLines);
    }
  }

  function settle(job: JobRecord, status: JobStatus, exitCode: number | null) {
    if (job.status !== "running") return;
    job.status = status;
    job.exitCode = exitCode;
    job.endedAt = Date.now();
    persist();
    options.onComplete?.(job);
  }

  function start(meta: JobMeta, cmd: string, args: string[]): JobRecord {
    const job: JobRecord = {
      id: randomUUID(),
      ...meta,
      status: "running",
      exitCode: null,
      startedAt: Date.now(),
      endedAt: null,
      log: [],
    };
    jobs.unshift(job);
    if (jobs.length > maxJobs) jobs = jobs.slice(0, maxJobs);
    persist();

    const child = spawn(cmd, args, {
      cwd: options.cwd ?? process.cwd(),
      windowsHide: true,
    });
    child.stdout.on("data", (d) => appendLog(job, String(d)));
    child.stderr.on("data", (d) => appendLog(job, String(d)));
    child.on("error", (err) => {
      appendLog(job, `[hexxii] spawn error: ${err.message}`);
      settle(job, "failed", null);
    });
    child.on("close", (code) => {
      settle(job, code === 0 ? "done" : "failed", code);
    });
    return job;
  }

  function get(id: string): JobRecord | undefined {
    return jobs.find((j) => j.id === id);
  }

  function list(): JobRecord[] {
    return jobs;
  }

  return { start, get, list };
}

export interface QuickResult {
  exitCode: number | null;
  output: string;
}

/** Run a quick (non-tracked) action to completion and capture its output. */
export function runQuick(
  cmd: string,
  args: string[],
  opts: { cwd?: string; timeoutMs?: number } = {}
): Promise<QuickResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd ?? process.cwd(),
      windowsHide: true,
    });
    let output = "";
    const timeout = setTimeout(() => {
      output += "\n[hexxii] timed out, killing process";
      child.kill();
    }, opts.timeoutMs ?? 60_000);
    child.stdout.on("data", (d) => (output += String(d)));
    child.stderr.on("data", (d) => (output += String(d)));
    child.on("error", (err) => {
      clearTimeout(timeout);
      resolve({ exitCode: null, output: `spawn error: ${err.message}` });
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ exitCode: code, output });
    });
  });
}
