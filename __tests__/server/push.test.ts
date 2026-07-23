// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const sendNotification = vi.hoisted(() => vi.fn());
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification,
  },
}));

import {
  createSubscriptionStore,
  buildJobNotification,
  sendJobDone,
} from "@/server/push";
import type { JobRecord } from "@/server/jobs";

function sub(endpoint: string) {
  return { endpoint, keys: { p256dh: "p", auth: "a" } };
}

function job(overrides: Partial<JobRecord> = {}): JobRecord {
  return {
    id: "job-1",
    actionId: "regen-sprites",
    label: "Regen sprites",
    params: { character: "merrick" },
    status: "done",
    exitCode: 0,
    startedAt: 1,
    endedAt: 2,
    log: [],
    ...overrides,
  };
}

function tempStorePath() {
  return join(mkdtempSync(join(tmpdir(), "hexxii-push-")), "subs.json");
}

describe("subscription store", () => {
  it("persists subscriptions and reloads them", () => {
    const path = tempStorePath();
    const store = createSubscriptionStore(path);
    store.add(sub("https://push.example/one"));
    expect(JSON.parse(readFileSync(path, "utf8"))).toHaveLength(1);

    const reloaded = createSubscriptionStore(path);
    expect(reloaded.list()).toHaveLength(1);
    expect(reloaded.list()[0].endpoint).toBe("https://push.example/one");
  });

  it("dedupes by endpoint", () => {
    const store = createSubscriptionStore(tempStorePath());
    store.add(sub("https://push.example/one"));
    store.add(sub("https://push.example/one"));
    store.add(sub("https://push.example/two"));
    expect(store.list()).toHaveLength(2);
  });

  it("removes by endpoint", () => {
    const store = createSubscriptionStore(tempStorePath());
    store.add(sub("https://push.example/one"));
    store.remove("https://push.example/one");
    expect(store.list()).toHaveLength(0);
  });
});

describe("buildJobNotification", () => {
  it("brands every notification as HEXXII with the BloodBat icon", () => {
    const n = buildJobNotification(job());
    expect(n.title).toBe("HEXXII");
    expect(n.icon).toBe("/icons/icon-192x192.png");
    expect(n.badge).toBe("/icons/icon-192x192.png");
  });

  it("uses a per-action tag so new statuses replace old ones", () => {
    expect(buildJobNotification(job()).tag).toBe("regen-sprites");
    expect(
      buildJobNotification(job({ actionId: "git-pull", label: "Git pull" })).tag
    ).toBe("git-pull");
  });

  it("regen completion names the character and deep-links to the gallery", () => {
    const n = buildJobNotification(job());
    expect(n.body).toContain("Merrick");
    expect(n.body).toMatch(/complete/i);
    expect(n.url).toBe("/regen-gallery.html");
  });

  it("gallery build deep-links to the gallery", () => {
    const n = buildJobNotification(
      job({ actionId: "build-gallery", label: "Build review gallery", params: {} })
    );
    expect(n.url).toBe("/regen-gallery.html");
  });

  it("failures say failed with the exit code and link to the job log", () => {
    const n = buildJobNotification(job({ status: "failed", exitCode: 3 }));
    expect(n.body).toMatch(/failed/i);
    expect(n.body).toContain("3");
    expect(n.url).toBe("/remote?job=job-1");
  });
});

describe("sendJobDone", () => {
  beforeEach(() => {
    sendNotification.mockReset();
    process.env.VAPID_PRIVATE_KEY = "priv";
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "pub";
  });

  it("sends one push per stored subscription", async () => {
    sendNotification.mockResolvedValue({});
    const store = createSubscriptionStore(tempStorePath());
    store.add(sub("https://push.example/one"));
    store.add(sub("https://push.example/two"));
    await sendJobDone(job(), store);
    expect(sendNotification).toHaveBeenCalledTimes(2);
    const payload = JSON.parse(sendNotification.mock.calls[0][1]);
    expect(payload.title).toBe("HEXXII");
  });

  it("prunes subscriptions the push service reports gone (410)", async () => {
    sendNotification.mockRejectedValue({ statusCode: 410 });
    const store = createSubscriptionStore(tempStorePath());
    store.add(sub("https://push.example/dead"));
    await sendJobDone(job(), store);
    expect(store.list()).toHaveLength(0);
  });

  it("does nothing when VAPID keys are missing", async () => {
    delete process.env.VAPID_PRIVATE_KEY;
    const store = createSubscriptionStore(tempStorePath());
    store.add(sub("https://push.example/one"));
    await sendJobDone(job(), store);
    expect(sendNotification).not.toHaveBeenCalled();
  });
});
