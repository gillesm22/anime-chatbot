"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const TOKEN_KEY = "anime-chatbot-remote-token";

interface ActionSummary {
  id: string;
  label: string;
  category: "art" | "dev";
  longRunning: boolean;
  detached?: boolean;
  params?: { name: string; values: string[] }[];
}

interface JobSummary {
  id: string;
  actionId: string;
  label: string;
  params: Record<string, string>;
  status: "running" | "done" | "failed";
  exitCode: number | null;
  startedAt: number;
  endedAt: number | null;
  log: string[];
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

const STATUS_STYLE: Record<JobSummary["status"], { dot: string; label: string }> = {
  running: { dot: "#facc15", label: "running" },
  done: { dot: "#4ade80", label: "done" },
  failed: { dot: "#f87171", label: "failed" },
};

export default function RemotePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [actions, setActions] = useState<ActionSummary[]>([]);
  const [character, setCharacter] = useState("merrick");
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [openJob, setOpenJob] = useState<string | null>(null);
  const [jobLogs, setJobLogs] = useState<Record<string, string[]>>({});
  const [quickOutput, setQuickOutput] = useState<{ label: string; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pushState, setPushState] = useState<"unknown" | "unsupported" | "off" | "on">("unknown");
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(path, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        "content-type": "application/json",
        "x-hexxii-token": tokenRef.current ?? "",
      },
    });
    if (res.status === 401 || res.status === 503) {
      const body = await res.json().catch(() => ({}));
      setAuthError(body.error ?? "Not authorized");
      if (res.status === 401) setToken(null);
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    return res;
  }, []);

  // Load stored token once
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) setToken(stored);
    else setToken(null);
    const params = new URLSearchParams(window.location.search);
    const jobParam = params.get("job");
    if (jobParam) setOpenJob(jobParam);
  }, []);

  const refreshJobs = useCallback(async () => {
    try {
      const res = await api("/api/remote/jobs");
      const body = await res.json();
      setJobs(body.jobs);
    } catch {
      /* auth error already surfaced */
    }
  }, [api]);

  // Fetch catalog + jobs when a token is present
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await api("/api/remote/actions");
        const body = await res.json();
        setActions(body.actions);
        setAuthError(null);
        await refreshJobs();
      } catch {
        /* surfaced via authError */
      }
    })();
  }, [token, api, refreshJobs]);

  // Poll jobs while any are running
  useEffect(() => {
    if (!token || !jobs.some((j) => j.status === "running")) return;
    const t = setInterval(refreshJobs, 3000);
    return () => clearInterval(t);
  }, [token, jobs, refreshJobs]);

  // Detect push subscription state
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushState("unsupported");
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setPushState(sub ? "on" : "off");
    });
  }, []);

  // Fetch the full log when a job is expanded
  useEffect(() => {
    if (!openJob || !token) return;
    (async () => {
      try {
        const res = await api(`/api/remote/jobs/${openJob}`);
        if (res.status === 404) return;
        const body = await res.json();
        setJobLogs((prev) => ({ ...prev, [openJob]: body.job.log }));
      } catch {
        /* ignore */
      }
    })();
  }, [openJob, token, jobs, api]);

  const saveToken = () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) return;
    localStorage.setItem(TOKEN_KEY, trimmed);
    setAuthError(null);
    setToken(trimmed);
  };

  const runAction = async (action: ActionSummary) => {
    setBusy(action.id);
    setQuickOutput(null);
    try {
      const params = action.id === "regen-sprites" ? { character } : {};
      const res = await api("/api/remote/run", {
        method: "POST",
        body: JSON.stringify({ action: action.id, params }),
      });
      const body = await res.json();
      if (!res.ok) {
        setQuickOutput({ label: action.label, text: body.error ?? "Failed" });
      } else if (body.jobId) {
        await refreshJobs();
        setOpenJob(body.jobId);
      } else if (body.detached) {
        setQuickOutput({ label: action.label, text: body.message ?? "Launched." });
      } else {
        setQuickOutput({ label: action.label, text: body.output || `(exit ${body.exitCode})` });
      }
    } catch (err) {
      setQuickOutput({ label: action.label, text: String(err) });
    } finally {
      setBusy(null);
    }
  };

  const enablePush = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setQuickOutput({ label: "Notifications", text: "NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set." });
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await api("/api/remote/push/subscribe", {
        method: "POST",
        body: JSON.stringify(sub.toJSON()),
      });
      setPushState("on");
    } catch (err) {
      setQuickOutput({ label: "Notifications", text: `Push setup failed: ${err}` });
    }
  };

  const categories: { key: "art" | "dev"; title: string }[] = [
    { key: "art", title: "Art pipeline" },
    { key: "dev", title: "Dev / ops" },
  ];

  const characterValues =
    actions.find((a) => a.id === "regen-sprites")?.params?.find((p) => p.name === "character")
      ?.values ?? [];

  return (
    <div
      className="h-screen overflow-y-auto"
      style={{
        background:
          "linear-gradient(180deg, var(--color-surface, #16161e) 0%, var(--color-bg, #0d0d12) 100%)",
      }}
    >
      <div className="max-w-lg mx-auto w-full px-6 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <button
            onClick={() => router.push("/")}
            className="text-text-secondary hover:text-text transition-colors text-sm"
          >
            ← HEXXII
          </button>
          <span className="text-xs tracking-widest uppercase text-text-secondary">Remote</span>
        </div>

        {!token ? (
          <div className="mt-12 flex flex-col gap-3">
            <p className="text-sm text-text-secondary">
              Enter the remote token from <code>.env.local</code> (REMOTE_TOKEN). It is stored on
              this device.
            </p>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveToken()}
              placeholder="Remote token"
              className="rounded-lg bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
            />
            <button
              onClick={saveToken}
              className="rounded-lg bg-white/10 hover:bg-white/20 transition-colors px-4 py-3 text-sm font-medium"
            >
              Unlock
            </button>
            {authError && <p className="text-xs text-red-400">{authError}</p>}
          </div>
        ) : (
          <>
            {authError && <p className="text-xs text-red-400 mb-4">{authError}</p>}

            {/* Push enable */}
            {pushState === "off" && (
              <button
                onClick={enablePush}
                className="w-full mb-6 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-4 py-3 text-sm"
              >
                🦇 Enable job notifications on this device
              </button>
            )}

            {/* Actions */}
            {categories.map(({ key, title }) => {
              const group = actions.filter((a) => a.category === key);
              if (group.length === 0) return null;
              return (
                <div key={key} className="mb-8">
                  <h2 className="text-xs tracking-widest uppercase text-text-secondary mb-3">
                    {title}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {group.map((action) => (
                      <div key={action.id} className="flex gap-2">
                        <button
                          onClick={() => runAction(action)}
                          disabled={busy !== null}
                          className="flex-1 text-left rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors px-4 py-3 text-sm"
                        >
                          {busy === action.id ? "…" : action.label}
                        </button>
                        {action.id === "regen-sprites" && (
                          <select
                            value={character}
                            onChange={(e) => setCharacter(e.target.value)}
                            className="rounded-lg bg-black/30 border border-white/10 px-2 py-2 text-sm"
                          >
                            {characterValues.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Quick action output */}
            {quickOutput && (
              <div className="mb-8">
                <h2 className="text-xs tracking-widest uppercase text-text-secondary mb-2">
                  {quickOutput.label}
                </h2>
                <pre className="rounded-lg bg-black/40 border border-white/10 p-3 text-xs whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                  {quickOutput.text}
                </pre>
              </div>
            )}

            {/* Jobs */}
            <div className="mb-8">
              <h2 className="text-xs tracking-widest uppercase text-text-secondary mb-3">Jobs</h2>
              {jobs.length === 0 ? (
                <p className="text-xs text-text-secondary">No jobs yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {jobs.map((job) => {
                    const style = STATUS_STYLE[job.status];
                    const open = openJob === job.id;
                    return (
                      <div key={job.id} className="rounded-lg border border-white/10 bg-white/5">
                        <button
                          onClick={() => setOpenJob(open ? null : job.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm"
                        >
                          <span
                            className="inline-block w-2 h-2 rounded-full shrink-0"
                            style={{ background: style.dot }}
                          />
                          <span className="flex-1 truncate">
                            {job.label}
                            {job.params.character ? ` · ${job.params.character}` : ""}
                          </span>
                          <span className="text-xs text-text-secondary">
                            {style.label}
                            {job.status === "failed" && job.exitCode !== null
                              ? ` (${job.exitCode})`
                              : ""}
                          </span>
                        </button>
                        {open && (
                          <pre className="border-t border-white/10 p-3 text-xs whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                            {(jobLogs[job.id] ?? job.log).join("\n") || "(no output yet)"}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
