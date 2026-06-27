# Hexx Chat Interjections

**Date:** 2026-06-27  
**Status:** Approved

## Overview

When the user mentions Hexx in a chat message, the character acknowledges Hexx in their response and Hexx herself reacts via her speech bubble — creating a 3-way conversation feel. Hexx's chat reactions are AI-generated for contextual relevance, while her existing passive behavior (click reactions, expression mirroring, idle phrases) remains unchanged.

## Detection & Trigger

- Client-side: case-insensitive check for "hexx" in the user's message before sending to the API.
- If found, add `hexxMentioned: true` to the API request body.
- No regex or fuzzy matching — simple `message.toLowerCase().includes("hexx")`.

## System Prompt Injection

When `hexxMentioned` is true, the API route appends a Hexx context block to the system prompt:

```
[Hexx the Bat]
The user has a tiny pet bat companion named Hexx who is always nearby. She's a small,
chaotic, sassy blood-red bat with big personality. She's loyal to the user but mischievous.

Your opinion of Hexx: {per-character opinion}

The user mentioned Hexx in their message. Acknowledge Hexx naturally in your response.
Also include a [hexx:her reaction] tag somewhere in your response — this is what Hexx
says/does in reaction. Keep it short (under 10 words), sassy, and in character for a
tiny chaotic bat. Examples: [hexx:*preens smugly*], [hexx:hey I heard that!], [hexx:tch, whatever]
```

### Per-Character Opinions

| Character | Opinion of Hexx |
|-----------|----------------|
| Arisu | Thinks Hexx is adorable, talks to her sweetly, worries about her |
| Marin | Finds her hilarious, treats her like a hype sidekick, gives her nicknames |
| Suzuka (nao) | Respects Hexx's chaos energy, sees a kindred spirit, wants to study her |
| Kurisu | Pretends to find her annoying but secretly thinks she's fascinating — "it's just a bat, why would I care" |
| Merrick | Treats her like a fellow creature of the night, speaks to her as an equal |

## Parsing & SSE Events

The `[hexx:...]` tag follows the same pattern as existing `[expression]` and `[scene:id]` tags:

1. Add `parseHexxTag()` to `src/lib/sprites/expressions.ts` — extracts content from `[hexx:...]` and returns cleaned text.
2. In the API route SSE stream, detect `[hexx:...]` in accumulated text and emit: `{ type: "hexx", content: "extracted hexx line" }`
3. Strip the `[hexx:...]` tag from visible text chunks so it doesn't appear in the dialogue.

## Client-Side Handling

In the chat page (`src/app/chat/[characterId]/page.tsx`):

- Listen for `hexx` SSE events.
- Pass the content to BloodBat via a new `chatPhrase` prop.

In BloodBat (`src/components/BloodBat.tsx`):

- Accept `chatPhrase` prop.
- When `chatPhrase` changes (and is non-null), display it in the existing speech bubble.
- Override any current passive phrase.
- Bubble stays visible for 5s (up from 2.5s) since it's contextual and worth reading.
- Set mood to an active mood (e.g., `excited`, `smug`, `playful`) to visually signal she's engaged in the conversation.

## What Changes

| File | Change |
|------|--------|
| `src/lib/api.ts` | Detect "hexx" in message, add `hexxMentioned: true` to request body |
| `src/app/api/chat/route.ts` | Accept `hexxMentioned`, inject Hexx prompt, parse `[hexx:...]` tags, emit SSE events |
| `src/lib/sprites/expressions.ts` | Add `parseHexxTag()` function |
| `src/app/chat/[characterId]/page.tsx` | Handle `hexx` SSE events, pass `chatPhrase` to BloodBat |
| `src/components/BloodBat.tsx` | Accept `chatPhrase` prop, display with longer duration and active mood |

## What Doesn't Change

- Hexx's existing behavior: click reactions, expression mirroring, idle phrases, drag/resize, sparkle toggle.
- Chat history storage: `[hexx:...]` tags stripped before saving.
- No new API calls or dependencies.
- Phrase pools remain for all non-chat reactions.
