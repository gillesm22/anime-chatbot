// Shared server-side singletons for the remote API routes. Kept on
// globalThis so dev-mode HMR and route-module isolation don't spawn
// duplicate job managers.

import { join } from "node:path";
import { createJobManager } from "./jobs";
import { createSubscriptionStore, sendJobDone } from "./push";
import { getAction } from "./actions";

function dataDir(): string {
  return process.env.HEXXII_REMOTE_DATA_DIR ?? join(process.cwd(), ".hexxii-remote");
}

function init() {
  const store = createSubscriptionStore(join(dataDir(), "subscriptions.json"));
  const jobs = createJobManager({
    persistPath: join(dataDir(), "jobs.json"),
    onComplete: (job) => {
      // Quick actions return their result to the phone directly; only
      // long jobs notify.
      if (getAction(job.actionId)?.longRunning) {
        void sendJobDone(job, store);
      }
    },
  });
  return { jobs, store };
}

type RemoteState = ReturnType<typeof init>;

const globalState = globalThis as unknown as { __hexxiiRemote?: RemoteState };

export function getRemoteState(): RemoteState {
  if (!globalState.__hexxiiRemote) globalState.__hexxiiRemote = init();
  return globalState.__hexxiiRemote;
}
