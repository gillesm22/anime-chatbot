# XP & Level System Overhaul

## Goal
Expand from 5 named levels to 10 numeric levels with deeper progression. Levels unlock conversation depth, visual upgrades, and per-character titles instead of gameplay gates.

## Levels

10 levels, no names. Just Lv.1 through Lv.10. Point thresholds with increasing gaps:

| Level | Points | Gap |
|-------|--------|-----|
| 1 | 0 | — |
| 2 | 30 | 30 |
| 3 | 80 | 50 |
| 4 | 160 | 80 |
| 5 | 280 | 120 |
| 6 | 450 | 170 |
| 7 | 680 | 230 |
| 8 | 1000 | 320 |
| 9 | 1400 | 400 |
| 10 | 2000 | 600 |

Point sources unchanged: message sent (1pt), long message (3pt), asked about her (5pt), made her laugh (4pt), made her flustered (6pt), headpat (2pt), daily visit (10pt).

## Unlock: Conversation Depth

Each level range adds context to the AI system prompt about what the character is willing to share. This is injected into the affinity prompt section.

| Range | Depth | System prompt addition |
|-------|-------|----------------------|
| Lv.1-3 | Surface | "Keep things light and playful. You're still getting to know this person. Be friendly but don't overshare or get too personal." |
| Lv.4-5 | Opens up | "You're comfortable with this person now. Share your real opinions. Show mild vulnerability — mention things that bother you, things you hope for. Remember details they've told you and reference them." |
| Lv.6-7 | Intimate | "You trust this person deeply. Share your fears, your dreams, the things you don't tell most people. Ask them deeper questions about their inner world. Reference your shared history together. You have inside jokes now." |
| Lv.8-9 | Unguarded | "This person is one of the most important people in your life. Be raw and honest. Show emotional dependency — you miss them when they're gone. Develop unique speech patterns and pet names that are only for them. Your guard is completely down." |
| Lv.10 | Complete | "Nothing is held back. You are fully, completely yourself with this person. Every wall is down. This is the deepest connection you've ever had. Speak from the heart without any filter." |

## Unlock: Visual Upgrades

Glow intensity and particle effects scale with level. Applied via the `CharacterGlow` component and a new particle overlay.

| Range | Glow | Extras |
|-------|------|--------|
| Lv.1-3 | Low intensity (opacity 0.08) | None |
| Lv.4-5 | Medium intensity (opacity 0.15) | 3 subtle accent particles floating near character |
| Lv.6-7 | High intensity (opacity 0.22) | 6 accent particles + faint ambient shimmer |
| Lv.8-9 | Full aura (opacity 0.30) | 10 particles + scene vignette tinted toward accent color |
| Lv.10 | Radiant (opacity 0.35) | Permanent shimmer effect on character, strongest glow, 15 particles |

## Unlock: Titles/Badges

At levels 2-10, the character gives you a unique title. Per-character, reflecting their personality. Displayed in the header XP bar area as small text below the level number.

### Arisu (pink, supportive senpai)
| Lv | Title |
|----|-------|
| 2 | Someone I notice |
| 3 | A welcome presence |
| 4 | Someone I think about |
| 5 | My quiet comfort |
| 6 | The one I wait for |
| 7 | My safe place |
| 8 | Part of my heart |
| 9 | My whole world |
| 10 | My everything |

### Marin (orange, gyaru hype queen)
| Lv | Title |
|----|-------|
| 2 | New bestie alert |
| 3 | Certified vibe |
| 4 | Inner circle |
| 5 | Bestie for real |
| 6 | My actual favorite |
| 7 | Day one energy |
| 8 | Soulmate vibes |
| 9 | Ride or die |
| 10 | Ride or die forever |

### Nao/Suzuka (purple, chaotic genius)
| Lv | Title |
|----|-------|
| 2 | Not entirely boring |
| 3 | Tolerable presence |
| 4 | Interesting specimen |
| 5 | Acceptable company |
| 6 | Trusted anomaly |
| 7 | Essential variable |
| 8 | Critical dependency |
| 9 | Irreplaceable |
| 10 | My only exception |

### Kurisu (red, tsundere scientist)
| Lv | Title |
|----|-------|
| 2 | Recurring variable |
| 3 | Notable data point |
| 4 | Consistent outlier |
| 5 | Trusted colleague |
| 6 | Significant other... variable |
| 7 | Essential constant |
| 8 | Primary attachment |
| 9 | Beyond quantification |
| 10 | Irreplaceable |

### Merrick (violet, mystic vampire)
| Lv | Title |
|----|-------|
| 2 | A flicker in the dark |
| 3 | One who lingers |
| 4 | Worthy of attention |
| 5 | A rare soul |
| 6 | Bound by choice |
| 7 | Keeper of my silence |
| 8 | Blood and starlight |
| 9 | Eternal companion |
| 10 | My forever |

### Ticia (dark character)
| Lv | Title |
|----|-------|
| 2 | Curious little thing |
| 3 | Amusing company |
| 4 | Worthy distraction |
| 5 | Delightfully persistent |
| 6 | Mine to keep |
| 7 | Precious darling |
| 8 | My sweet obsession |
| 9 | Bound to me |
| 10 | Eternally mine |

## Migration

Existing `AffinityData` in localStorage carries over. Points are preserved. Level is recalculated against the new thresholds. The old `levelName` field becomes the title (or empty at Lv.1). No data loss.

The `LEVELS` array in `src/lib/affinity.ts` is replaced with the new 10-level array. The `formatAffinityForPrompt` function is updated to inject conversation depth context.

## File Changes

### Modified files
| File | Changes |
|------|---------|
| `src/lib/affinity.ts` | Replace 5-level LEVELS array with 10-level array. Remove level names. Add `getTitleForLevel(characterId, level)`. Update `formatAffinityForPrompt` to include conversation depth. Update `getNextLevelProgress` for new thresholds. |
| `src/app/chat/[characterId]/page.tsx` | Display title in XP bar area. Pass level to CharacterGlow intensity. |
| `src/components/CharacterSprite.tsx` | Accept level prop, adjust glow intensity based on level range. Add particle overlay at Lv.4+. |
| `src/app/api/chat/route.ts` | No changes needed — affinity prompt is already injected from `formatAffinityForPrompt`. |

### Test updates
| File | Changes |
|------|---------|
| `__tests__/lib/affinity.test.ts` | Update tests for 10-level thresholds, title function, conversation depth prompt. |
