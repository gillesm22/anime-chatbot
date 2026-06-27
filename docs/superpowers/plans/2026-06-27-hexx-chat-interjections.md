# Hexx Chat Interjections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the user mentions "Hexx" in a chat message, the character acknowledges Hexx and the AI generates a short Hexx reaction that appears in her speech bubble.

**Architecture:** Client detects "hexx" in user message and flags the API request. The API route injects Hexx context into the system prompt and instructs the AI to include a `[hexx:...]` tag. The SSE stream parser extracts this tag and emits it as a new event type. The chat page passes it to BloodBat as a prop.

**Tech Stack:** Next.js API route (OpenAI streaming), React state, existing SSE parser pattern.

---

### Task 1: Add `parseHexxTag()` to expressions.ts

**Files:**
- Modify: `src/lib/sprites/expressions.ts`
- Modify: `__tests__/lib/expressions.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `__tests__/lib/expressions.test.ts`:

```typescript
import { getSpritePaths, parseExpressionTag, parseSceneTag, parseHexxTag, stripHexxTag } from "@/lib/sprites/expressions";

// ... existing tests ...

describe("parseHexxTag", () => {
  it("extracts hexx tag from text", () => {
    const result = parseHexxTag("She's cute! [hexx:*preens smugly*] Don't you think?");
    expect(result).toEqual({ hexxLine: "*preens smugly*", text: "She's cute! Don't you think?" });
  });

  it("returns null when no hexx tag", () => {
    expect(parseHexxTag("Just a normal message.")).toBeNull();
  });

  it("handles hexx tag at end of text", () => {
    const result = parseHexxTag("Your little bat is staring at me. [hexx:what? no I'm not]");
    expect(result).toEqual({ hexxLine: "what? no I'm not", text: "Your little bat is staring at me." });
  });

  it("handles hexx tag at start of text", () => {
    const result = parseHexxTag("[hexx:hey!] Oh, is Hexx here too?");
    expect(result).toEqual({ hexxLine: "hey!", text: "Oh, is Hexx here too?" });
  });
});

describe("stripHexxTag", () => {
  it("removes hexx tag from text", () => {
    expect(stripHexxTag("Hello [hexx:yo] world")).toBe("Hello world");
  });

  it("returns original text when no tag", () => {
    expect(stripHexxTag("No tag here")).toBe("No tag here");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/expressions.test.ts`
Expected: FAIL — `parseHexxTag` and `stripHexxTag` are not exported

- [ ] **Step 3: Implement parseHexxTag and stripHexxTag**

Add to `src/lib/sprites/expressions.ts` at the bottom:

```typescript
const HEXX_TAG_SINGLE = /\[hexx:([^\]]+)\]/;
const HEXX_TAG_GLOBAL = /\[hexx:[^\]]+\]/g;

export function parseHexxTag(
  text: string
): { hexxLine: string; text: string } | null {
  const match = text.match(HEXX_TAG_SINGLE);
  if (!match) return null;
  const hexxLine = match[1];
  const stripped = text
    .replace(HEXX_TAG_GLOBAL, " ")
    .replace(/  +/g, " ")
    .trim();
  return { hexxLine, text: stripped };
}

export function stripHexxTag(text: string): string {
  return text
    .replace(HEXX_TAG_GLOBAL, " ")
    .replace(/  +/g, " ")
    .trim();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/expressions.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/sprites/expressions.ts __tests__/lib/expressions.test.ts
git commit -m "feat: add parseHexxTag and stripHexxTag to expression parser"
```

---

### Task 2: Update SSE type and add hexxMentioned to API client

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Add hexx event to SSEEvent type**

In `src/lib/api.ts`, update the `SSEEvent` type union to include a hexx event:

```typescript
export type SSEEvent =
  | { type: "expression"; expression: Expression }
  | { type: "text"; content: string }
  | { type: "scene"; sceneId: string }
  | { type: "hexx"; content: string }
  | { type: "done" }
  | { type: "error"; message: string };
```

- [ ] **Step 2: Add hexxMentioned to SendMessageParams**

In `src/lib/api.ts`, add `hexxMentioned` to the `SendMessageParams` interface:

```typescript
export interface SendMessageParams {
  message: string;
  characterId: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  userName?: string | null;
  memories?: string;
  responseLength?: "short" | "medium" | "long";
  provider?: string;
  affinityPrompt?: string;
  giftContext?: string;
  heroAppearance?: string;
  heroClassReaction?: string;
  crossCharPrompt?: string;
  miniGamePrompt?: string;
  typingHint?: string | null;
  language?: string;
  greetingContext?: string;
  personalityContext?: string;
  hexxMentioned?: boolean;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add hexx SSE event type and hexxMentioned param"
```

---

### Task 3: Update API route to inject Hexx context and parse [hexx:] tags

**Files:**
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Import parseHexxTag**

At the top of `src/app/api/chat/route.ts`, update the import:

```typescript
import { parseExpressionTag, stripExpressionTags, parseSceneTag, parseHexxTag } from "@/lib/sprites/expressions";
```

- [ ] **Step 2: Accept hexxMentioned from request body**

In the destructuring of `body` (line 15), add `hexxMentioned`:

```typescript
const { message, characterId, userName, memories, responseLength, provider, affinityPrompt, giftContext, heroAppearance, heroClassReaction, crossCharPrompt, miniGamePrompt, typingHint, language, greetingContext, personalityContext, hexxMentioned } = body;
```

- [ ] **Step 3: Add Hexx prompt injection block**

After the `personalityContext` block (after line 84) and before the `language` block, add:

```typescript
  if (hexxMentioned) {
    const hexxOpinions: Record<string, string> = {
      arisu: "You think Hexx is absolutely adorable. You talk to her sweetly and worry about her well-being. You sometimes address her directly with gentle encouragement.",
      marin: "You think Hexx is hilarious and treat her like your hype sidekick. You give her silly nicknames and gas her up.",
      nao: "You respect Hexx's chaotic energy and see a kindred spirit in her. You find her fascinating and want to study her abilities.",
      kurisu: "You pretend Hexx annoys you but you secretly think she's scientifically fascinating. You act tsundere toward her — 'It's just a bat, why would I care about it?'",
      merrick: "You treat Hexx as a fellow creature of the night and speak to her as an equal. You respect her dark energy and consider her a kindred spirit.",
    };
    const opinion = hexxOpinions[characterId] || hexxOpinions.arisu;
    systemContent += `\n\n[Hexx the Bat]
The user has a tiny pet bat companion named Hexx who is always nearby. She's a small, chaotic, sassy blood-red bat with big personality. She's loyal to the user but mischievous.

Your opinion of Hexx: ${opinion}

The user mentioned Hexx in their message. Acknowledge Hexx naturally in your response. Also include a [hexx:her reaction] tag somewhere in your response — this is what Hexx says/does in reaction. Keep it short (under 10 words), sassy, and in character for a tiny chaotic bat. Examples: [hexx:*preens smugly*], [hexx:hey I heard that!], [hexx:tch, whatever]`;
  }
```

- [ ] **Step 4: Add hexx tag parsing to the SSE stream**

In the `ReadableStream` `start` function, add a `hexxSent` flag alongside the existing `expressionSent` and `sceneSent` flags (around line 126):

```typescript
  let hexxSent = false;
```

Then, inside the `else if (expressionSent)` block (around line 154-180), add hexx tag detection alongside the existing scene tag detection. After the scene tag check block, add:

```typescript
            // Check for hexx tags in accumulated text
            if (!hexxSent) {
              const hexxResult = parseHexxTag(fullText);
              if (hexxResult) {
                hexxSent = true;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "hexx", content: hexxResult.hexxLine })}\n\n`
                  )
                );
              }
            }
```

Also update the text stripping to remove hexx tags from deltas. After the scene tag stripping in the delta (around line 170-172), add:

```typescript
            // Strip hexx tags from text chunks
            const hexxInDelta = parseHexxTag(cleaned);
            if (hexxInDelta) {
              cleaned = hexxInDelta.text;
            }
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: inject Hexx context into system prompt and parse hexx tags in SSE stream"
```

---

### Task 4: Handle hexx SSE events in chat page and pass to BloodBat

**Files:**
- Modify: `src/app/chat/[characterId]/page.tsx`

- [ ] **Step 1: Add hexxPhrase state**

In the `ChatContent` component, add a state variable after the existing state declarations (around line 168):

```typescript
  const [hexxPhrase, setHexxPhrase] = useState<string | null>(null);
```

- [ ] **Step 2: Detect hexx mention and add to streamChat params**

In the `handleSend` callback, before the `streamChat` call (around line 351), add hexx detection:

```typescript
      const hexxMentioned = message.toLowerCase().includes("hexx");
```

Then add `hexxMentioned` to the params object passed to `streamChat` (line 353):

```typescript
      try {
        await streamChat(
          { message, characterId, history, userName, memories, responseLength, provider: aiProvider, affinityPrompt, giftContext, heroAppearance, heroClassReaction, crossCharPrompt: crossChar.prompt, miniGamePrompt, typingHint, language: (typeof window !== "undefined" ? localStorage.getItem("anime-chatbot-language") : null) ?? "en", greetingContext: greetingCtx, personalityContext: personalityCtx, hexxMentioned },
```

- [ ] **Step 3: Handle hexx event in the SSE event callback**

In the `switch (event.type)` block inside the `streamChat` callback (around line 355-378), add a case for hexx:

```typescript
              case "hexx":
                setHexxPhrase(event.content);
                break;
```

- [ ] **Step 4: Pass hexxPhrase to BloodBat**

Update the `BloodBat` component usage (around line 950-954) to include the `chatPhrase` prop:

```tsx
        <BloodBat
          expression={state.currentExpression}
          accentColor={character.theme.accent}
          isIdle={state.phase === "idle" && state.messages.length > 0}
          chatPhrase={hexxPhrase}
          onChatPhraseDone={() => setHexxPhrase(null)}
        />
```

- [ ] **Step 5: Commit**

```bash
git add src/app/chat/[characterId]/page.tsx
git commit -m "feat: detect hexx mentions, handle hexx SSE events, pass to BloodBat"
```

---

### Task 5: Update BloodBat to accept and display chatPhrase

**Files:**
- Modify: `src/components/BloodBat.tsx`

- [ ] **Step 1: Add chatPhrase and onChatPhraseDone to props**

Update the `BloodBatProps` interface:

```typescript
interface BloodBatProps {
  expression?: Expression;
  accentColor?: string;
  isIdle?: boolean;
  isAudioPlaying?: boolean;
  landingMode?: boolean;
  chatPhrase?: string | null;
  onChatPhraseDone?: () => void;
}
```

Update the component signature to destructure the new props:

```typescript
export function BloodBat({ expression, accentColor = "#b71c1c", isIdle, isAudioPlaying, landingMode, chatPhrase, onChatPhraseDone }: BloodBatProps) {
```

- [ ] **Step 2: Add useEffect to handle chatPhrase**

Add a new `useEffect` after the existing landing mode effect (after line 233):

```typescript
  // Chat-generated Hexx phrase (from AI when user mentions Hexx)
  useEffect(() => {
    if (!chatPhrase) return;
    setPhrase(chatPhrase);
    // Pick an active mood for chat reactions
    const chatMoods: HexxMood[] = ["excited", "smug", "playful", "proud", "curious"];
    setMood(chatMoods[Math.floor(Math.random() * chatMoods.length)]);
    if (phraseTimer.current) clearTimeout(phraseTimer.current);
    phraseTimer.current = setTimeout(() => {
      setPhrase(null);
      onChatPhraseDone?.();
    }, 5000);
  }, [chatPhrase, onChatPhraseDone]);
```

- [ ] **Step 3: Commit**

```bash
git add src/components/BloodBat.tsx
git commit -m "feat: BloodBat displays AI-generated chat phrases with active mood"
```

---

### Task 6: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
cd "C:/Users/G$/anime-chatbot"
rm -rf .next
npx next dev --webpack -p 3000
```

- [ ] **Step 2: Test hexx mention**

Open http://localhost:3000, pick any character, and send a message like "What do you think of Hexx?" or "Hexx says hi". Verify:
1. The character's response acknowledges Hexx
2. Hexx's speech bubble shows an AI-generated reaction (not a canned phrase)
3. Hexx's mood changes to an active mood (excited/smug/playful/etc.)
4. The `[hexx:...]` tag does NOT appear in the visible dialogue text
5. The bubble stays for ~5 seconds

- [ ] **Step 3: Test normal messages (no regression)**

Send a message that does NOT mention Hexx. Verify:
1. No Hexx-specific bubble appears
2. Normal expression/scene behavior works as before
3. Click/idle Hexx behavior still works

- [ ] **Step 4: Commit any fixes if needed**
