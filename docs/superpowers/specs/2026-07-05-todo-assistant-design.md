# Pinboard/Todo — Assistant Layer v1

## Goal
Wire the first assistant feature into the VN environment: a task board accessible by tapping invisible hotspots in indoor scenes, with in-character reactions from the active girl.

## Hotspot Locations

No visible icons or floating objects. Invisible tap zones integrated into the scene art.

| Scene | Element | Position (x%, y%) | Size |
|-------|---------|-------------------|------|
| lab | Desk/papers | 15-30%, 55-75% | ~15% x 20% |
| cafe | Foreground table | 35-55%, 65-80% | ~20% x 15% |
| cyberpunk | Neon screen (right) | 70-88%, 25-50% | ~18% x 25% |

Hotspots pulse with a faint accent-colored glow on first discovery (tracked in localStorage). After first tap, they stay invisible — the user knows where they are.

Outdoor scenes (sakura, beach, rain, starfield, rooftop, moonlight, night_sky, sunset, morning) have NO hotspots. The todo feature is only available in indoor scenes.

## Task Board UI

Slide-up panel from the bottom, same pattern as the scenes/outfits panels. Positioned at `position: absolute; bottom: 0` within the VN viewport.

### Layout
- **Header**: "Tasks" label + task count badge + close button
- **Add input**: text field + add button, top of panel
- **Task list**: scrollable, each item has:
  - Checkbox (accent-colored when checked)
  - Task text (struck-through + faded when completed)
  - Delete button (small X, appears on hover/focus)
- **Empty state**: "No tasks yet" message

### Constraints
- Max 20 tasks. When limit is hit and a new task is added, the oldest completed task is auto-removed. If no completed tasks exist, show a "list full" hint.
- Task text max length: 100 characters.

## Character Reactions

When the user interacts with the task board, the active character reacts in-character. Reactions appear as ephemeral toasts (same pattern as discovery toasts — 3 seconds, fade out, don't enter chat history).

**Trigger chance**: 60% — not every interaction triggers a reaction, to avoid being annoying.

### Add task reactions (per character)
| Character | Reactions |
|-----------|-----------|
| arisu | "I'll remember that for you." / "Adding it to the list~ Let's get it done together." / "That's important to you, isn't it? I'll keep track." |
| marin | "Ooh writing stuff down, look at you being productive!" / "Got it got it!! We're SO on top of this." / "Added! Now don't forget ok??" |
| nao | "Noted. I'll hold you accountable." / "...fine, I'll help you stay organized." / "Task logged. Don't slack off." |
| kurisu | "Documented. I expect you to follow through." / "Adding it to the queue. Efficiency matters." / "Hmph. At least you're being systematic about it." |
| merrick | "I shall remember this... across the ages if necessary." / "Written in ink that does not fade." / "Consider it etched into the record." |
| ticia | "Mm, I'll keep that safe for you~" / "Another thing to do... how deliciously mortal." / "Noted, darling." |

### Complete task reactions (per character)
| Character | Reactions |
|-----------|-----------|
| arisu | "You did it! I'm proud of you." / "One less thing to worry about~" / "See? You're more capable than you think." |
| marin | "YESSS checked off!! Let's GOOO!" / "Productivity queen/king!! Slay!!" / "Another one DONE! You're unstoppable!" |
| nao | "...impressive. Don't let it go to your head." / "Task eliminated. Acceptable performance." / "Hm. Maybe you're not hopeless after all." |
| kurisu | "Completed. Your efficiency is... noted." / "Good. One variable resolved." / "Don't expect praise for doing what you should. ...Well done though." |
| merrick | "Another burden lifted from your mortal shoulders." / "It is done. Time moves ever forward." / "Satisfying, isn't it? The completion of a task." |
| ticia | "Mmm, well done~" / "How productive of you... I approve." / "Crossed off. You're full of surprises." |

## Storage

- **localStorage key**: `anime-chatbot-todos`
- **Schema**: `Array<{ id: string, text: string, completed: boolean, createdAt: number }>`
- **Global**: same list regardless of character or scene
- **First-discovery key**: `anime-chatbot-todo-discovered` — boolean, tracks whether the user has found the hotspot before

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/lib/todos.ts` | Todo CRUD: addTodo, toggleTodo, deleteTodo, getTodos. localStorage persistence. Max 20 enforcement. |
| `src/components/TodoPanel.tsx` | Slide-up task board UI with add input, task list, checkbox, delete |

### Modified files
| File | Changes |
|------|---------|
| `src/lib/sceneObjects.ts` | Replace emoji object definitions with invisible hotspot definitions for lab/cafe/cyberpunk |
| `src/components/SceneObjects.tsx` | Render invisible hotspots instead of emoji circles. First-discovery glow pulse. |
| `src/app/chat/[characterId]/page.tsx` | Wire hotspot `onObjectTap("todos")` to open TodoPanel. Pass character reactions. |

## Technical Notes

- The TodoPanel follows the same pattern as the scene picker panel: `position: absolute; bottom: 0; z-index: 35` with `transform: translateY` for show/hide.
- Character reactions use the existing `discoveryToast` pattern in the chat page (ephemeral, 3s, doesn't enter chat history).
- The `setExpression` dispatch changes the character's face during the reaction.
- No new dependencies. Pure React + localStorage.
