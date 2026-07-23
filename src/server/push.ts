// Web-push wrapper for HEXXII remote. Stores phone subscriptions on disk and
// fires HEXXII-branded notifications when a job finishes.
// See docs/hexxii-remote-design.md ("Notification look").

import webpush, { type PushSubscription } from "web-push";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { JobRecord } from "./jobs";

export interface StoredSubscription extends PushSubscription {
  endpoint: string;
}

export function createSubscriptionStore(persistPath: string) {
  let subs: StoredSubscription[] = load();

  function load(): StoredSubscription[] {
    try {
      return JSON.parse(readFileSync(persistPath, "utf8"));
    } catch {
      return [];
    }
  }

  function persist() {
    try {
      mkdirSync(dirname(persistPath), { recursive: true });
      writeFileSync(persistPath, JSON.stringify(subs, null, 2));
    } catch (err) {
      console.error("[hexxii-remote] failed to persist subscriptions:", err);
    }
  }

  function add(sub: StoredSubscription) {
    subs = subs.filter((s) => s.endpoint !== sub.endpoint);
    subs.push(sub);
    persist();
  }

  function remove(endpoint: string) {
    subs = subs.filter((s) => s.endpoint !== endpoint);
    persist();
  }

  function list(): StoredSubscription[] {
    return [...subs];
  }

  return { add, remove, list };
}

export interface JobNotification {
  title: string;
  body: string;
  icon: string;
  badge: string;
  tag: string;
  url: string;
}

const HEXXII_ICON = "/icons/icon-192x192.png";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildJobNotification(job: JobRecord): JobNotification {
  const base = {
    title: "HEXXII",
    icon: HEXXII_ICON,
    badge: HEXXII_ICON,
    tag: job.actionId,
  };
  if (job.status === "failed") {
    return {
      ...base,
      body: `💥 ${job.label} failed (exit ${job.exitCode ?? "?"}). Tap for the log.`,
      url: `/remote?job=${job.id}`,
    };
  }
  switch (job.actionId) {
    case "regen-sprites":
      return {
        ...base,
        body: `🦇 ${capitalize(job.params.character ?? "Sprite")} regen complete — tap to review.`,
        url: "/regen-gallery.html",
      };
    case "build-gallery":
      return {
        ...base,
        body: "🖼️ Review gallery ready — tap to review.",
        url: "/regen-gallery.html",
      };
    case "git-pull":
      return { ...base, body: "⬇️ Git pull complete.", url: "/remote" };
    default:
      return { ...base, body: `✅ ${job.label} complete.`, url: "/remote" };
  }
}

export async function sendJobDone(
  job: JobRecord,
  store: ReturnType<typeof createSubscriptionStore>
): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails("mailto:hexxii@localhost", publicKey, privateKey);

  const payload = JSON.stringify(buildJobNotification(job));
  await Promise.all(
    store.list().map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          store.remove(sub.endpoint);
        } else {
          console.error("[hexxii-remote] push failed:", err);
        }
      }
    })
  );
}
