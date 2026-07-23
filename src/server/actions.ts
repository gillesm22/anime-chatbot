// Action registry for HEXXII remote. Single source of truth for what the
// remote API is allowed to run — an action absent from this file cannot run.
// See docs/hexxii-remote-design.md.

export type ActionCategory = "art" | "dev";

export interface ActionParamSpec {
  name: string;
  values: string[];
}

export interface BuiltCommand {
  cmd: string;
  args: string[];
}

export interface RemoteAction {
  id: string;
  label: string;
  category: ActionCategory;
  longRunning: boolean;
  /** Fire-and-forget: spawn detached, no job tracking (dev-restart kills this server). */
  detached?: boolean;
  params?: ActionParamSpec[];
  /** Validates params and returns argv. Throws on anything not allowlisted. */
  build(params: Record<string, string>): BuiltCommand;
}

export const REGEN_CHARACTERS = [
  "kurisu",
  "merrick",
  "arisu",
  "marin",
  "suzuka",
  "ticia",
  "nao",
] as const;

// Newest full-regen script per character (scripts/ has several generations).
const REGEN_SCRIPTS: Record<(typeof REGEN_CHARACTERS)[number], string> = {
  kurisu: "scripts/regen-kurisu-v2.mjs",
  merrick: "scripts/regen-merrick-v2.mjs",
  arisu: "scripts/regen-arisu-outfits.mjs",
  marin: "scripts/regen-marin.mjs",
  suzuka: "scripts/regen-suzuka.mjs",
  ticia: "scripts/regen-ticia-full.mjs",
  nao: "scripts/regen-nao-full.mjs",
};

const ACTIONS: RemoteAction[] = [
  {
    id: "regen-sprites",
    label: "Regen sprites",
    category: "art",
    longRunning: true,
    params: [{ name: "character", values: [...REGEN_CHARACTERS] }],
    build(params) {
      const character = params.character as (typeof REGEN_CHARACTERS)[number];
      if (!character || !(character in REGEN_SCRIPTS)) {
        throw new Error(
          `Unknown character "${params.character ?? ""}" — must be one of: ${REGEN_CHARACTERS.join(", ")}`
        );
      }
      return { cmd: "node", args: [REGEN_SCRIPTS[character]] };
    },
  },
  {
    id: "build-gallery",
    label: "Build review gallery",
    category: "art",
    longRunning: true,
    build() {
      return { cmd: "node", args: ["scripts/build-regen-gallery.mjs"] };
    },
  },
  {
    id: "dev-restart",
    label: "Restart dev server",
    category: "dev",
    longRunning: false,
    detached: true,
    build() {
      return { cmd: "cmd.exe", args: ["/c", "scripts\\restart-dev.cmd"] };
    },
  },
  {
    id: "git-pull",
    label: "Git pull",
    category: "dev",
    longRunning: false,
    build() {
      return { cmd: "git", args: ["pull"] };
    },
  },
  {
    id: "git-status",
    label: "Git status",
    category: "dev",
    longRunning: false,
    build() {
      return { cmd: "git", args: ["status"] };
    },
  },
];

export function getAction(id: string): RemoteAction | undefined {
  return ACTIONS.find((a) => a.id === id);
}

export interface ActionSummary {
  id: string;
  label: string;
  category: ActionCategory;
  longRunning: boolean;
  detached?: boolean;
  params?: ActionParamSpec[];
}

export function listActions(): ActionSummary[] {
  return ACTIONS.map(({ id, label, category, longRunning, detached, params }) => ({
    id,
    label,
    category,
    longRunning,
    ...(detached ? { detached } : {}),
    ...(params ? { params } : {}),
  }));
}
