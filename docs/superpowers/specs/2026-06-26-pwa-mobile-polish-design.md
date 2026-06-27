# PWA & Mobile Polish — Design Spec

**Date:** 2026-06-26
**Goal:** Make the app feel like a native iOS app — works offline, vibrates on interactions, responds to gestures, fills the screen properly, and welcomes you back when you've been away.

---

## 1. Offline Support & Service Worker

### App Shell Caching
- On service worker install, pre-cache all critical assets: HTML pages, JS bundles, CSS, sprite images (all characters, all expressions, all outfits), background images, fonts, manifest
- Static assets (sprites, backgrounds, hero avatars, Hexx sprites) use cache-first strategy
- API calls (chat `/api/chat`, TTS `/api/tts`) use network-first with graceful offline fallback

### Offline Fallback
- When chat API fails due to no network, show an in-character offline message instead of an error: "The connection seems unstable... I'll be right here when it comes back."
- Offline indicator: subtle banner slides in at top of screen when connection drops, disappears on reconnect. Non-intrusive, uses character accent color in chat or neutral on other pages.

### Cache Versioning
- Service worker uses a version constant (`CACHE_VERSION`). On new deployment, the activate event clears old caches and re-caches the new assets.
- No stale app stuck forever — users always get the latest version on next visit.

### What stays the same
- All data stays in localStorage (already works offline)
- The full UI, sprites, scenes, and history are available offline
- Only AI chat and TTS require internet

---

## 2. Haptic Feedback

### Haptic Patterns
Named vibration patterns in a new `src/lib/haptics.ts` module:
- `haptic.tick()` — 5ms, micro feedback for navigation taps and dialogue advance
- `haptic.pulse()` — 10ms, message send
- `haptic.doubleTap()` — [10, 50, 10]ms, surprise/expression change
- `haptic.rumble()` — [15, 30, 15, 30, 15]ms, angry expression
- `haptic.soft()` — 8ms, happy/devoted expression
- `haptic.pet()` — [8, 40, 8, 40, 8]ms, headpat pattern
- `haptic.success()` — [10, 30, 20, 30, 30]ms, milestone/level-up/gift reaction
- `haptic.expression(expr)` — maps expression to appropriate pattern

### Where Haptics Fire
- Send message → `pulse`
- Expression change → `expression(expr)` (varies by emotion)
- Headpat → `pet`
- Gift giving → `pulse` on send, `success` on reaction
- Milestone/level-up → `success`
- Click-to-advance dialogue → `tick`
- Bottom nav tap → `tick`
- Swipe gesture completion → `tick`

### Implementation
- Check `navigator.vibrate` support once on module load, no-op silently if unavailable
- User toggle in Settings: "Haptic Feedback" on/off, stored in `anime-chatbot-haptics-enabled`
- All patterns are subtle — accent the interaction, never annoying
- Falls back gracefully on devices without vibration support

---

## 3. Swipe Gestures

### Gesture Map
- **Swipe right from left edge** → open chat history panel
- **Swipe left on any open panel** → close it (history, diary, gift shop, outfit carousel, quest panel, scene picker)
- **Horizontal snap scroll on landing page** → character cards snap into position on mobile

### What We Don't Add
- No swipe between characters mid-chat (too easy to accidentally leave)
- No swipe-down-to-dismiss on dialogue box (conflicts with scroll)

### Implementation
- New `src/lib/useSwipeGesture.ts` hook
- Tracks touchstart/touchmove/touchend, calculates direction, distance, velocity
- Minimum threshold: 50px distance OR fast flick velocity
- Only fires on dominant horizontal axis (ignores vertical scroll)
- Uses passive touch listeners for scroll performance
- Fires `haptic.tick()` on successful swipe
- Edge detection: swipe-right-to-open only triggers from leftmost 30px of screen

---

## 4. Native-Feeling Transitions & Fullscreen Immersion

### Page Transitions
- Upgrade existing `PageTransition` component to iOS-style slides: forward navigation slides in from right, back slides from left
- Character card → chat: card expands and cross-fades into chat screen (scale + fade, 300ms)

### Panel Transitions
- Existing slide-up panels (history, diary, gifts, outfits, quests) get momentum physics: slight overshoot on open, snap-to-close if dragged down past 30% threshold
- Panels can be swiped down to dismiss (vertical swipe, separate from the horizontal gesture system)

### Fullscreen Immersion
- `manifest.json`: set `"display": "standalone"` (hides Safari chrome when installed)
- Add meta tags:
  - `<meta name="apple-mobile-web-app-capable" content="yes">`
  - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
  - `<meta name="theme-color">` — dynamically set to character accent color on chat page, dark default elsewhere
- `viewport-fit=cover` in viewport meta tag
- CSS `env(safe-area-inset-*)` padding on all fixed elements

### Viewport Fix
- Replace all `100vh` with `100dvh` (dynamic viewport height) with `100vh` fallback
- This fixes the iOS Safari address bar bounce issue

### Scroll Behavior
- `overscroll-behavior: none` on chat container (prevents browser pull-to-refresh)
- `-webkit-overflow-scrolling: touch` on all scrollable panels
- Outfit carousel and chat history get proper scroll snap

---

## 5. In-App Notifications ("While You Were Away")

### Trigger Conditions
- Checked on landing page mount
- Character must be level 2+ (Acquaintance or higher)
- User must have been absent 1+ days (from `lastVisit` in affinity data)
- Max 3 notifications total, prioritized by highest affinity
- Max 1 notification per character

### Message Display
- Toast-style cards stacked at top of landing page
- Each card shows: character avatar (sprite thumbnail), character name, one-liner message
- Accent-colored left border, subtle slide-in-from-top animation (staggered 200ms apart)
- Auto-dismiss after 8 seconds or tap to dismiss
- Tapping navigates to that character's chat

### Message Pools (pre-written, per character, randomly selected)
Each character has 5+ short in-character messages referencing absence:

**Arisu:** "I made tea for two again today. Just in case." / "I had a thought I wanted to share with you... it can wait until you are ready." / "The cherry blossoms are falling. I wish you could see them with me."

**Marin:** "okay I have like FIVE things to tell you when you get back" / "I found the PERFECT outfit reference and you are the first person I want to show" / "ngl I keep opening this app to see if you are here yet"

**Suzuka:** "...I noticed you have not been around. Not that I was checking." / "I solved that thing we were talking about. Whenever you feel like hearing about it." / "Your absence has been... noted. Statistically."

**Kurisu:** "I ran the numbers. Your absence is statistically significant." / "There is a flaw in my latest hypothesis and I need someone to argue with." / "I am not waiting for you. I am just... between experiments."

**Merrick:** "The nights have been quieter without you, cher." / "I dreamt of our last conversation. That does not happen often." / "Time moves differently when you are not here. Slower, somehow."

### Implementation
- New `src/lib/awayNotifications.ts` — `getAwayNotifications()` returns qualified messages
- New `src/components/AwayNotificationStack.tsx` — renders stacked toast cards
- Uses existing affinity `lastVisit` data, no new localStorage keys
- No backend needed — all client-side

---

## 6. Mobile UI Fixes

### Safe Areas
- Apply `env(safe-area-inset-top)` to: control bar, notification stack
- Apply `env(safe-area-inset-bottom)` to: bottom nav, dialogue box, input field, all slide-up panels
- Apply `env(safe-area-inset-left/right)` to: full-width containers in landscape

### Touch Targets
- All interactive elements: minimum 44x44px tap area (Apple HIG)
- Control bar buttons: increase hit area with padding (icon stays same size)
- Bottom nav icons: larger tap zones
- Settings controls: bigger touch areas for sliders and toggles
- Conversation starter pills: more horizontal + vertical padding
- Scene picker thumbnails: larger tap targets

### Text Sizing
- Body text minimum 20px on mobile (user preference for readability)
- Input fields minimum `font-size: 16px` (prevents iOS auto-zoom on focus)
- Use CSS clamp or media queries: `font-size: clamp(16px, 4vw, 20px)` for scaling

### Chat Page Mobile Layout
- Dialogue box: extra bottom padding on iOS for home indicator clearance
- Input field: `env(safe-area-inset-bottom)` so keyboard doesn't cover it
- Scene picker: larger thumbnails on touch devices

### Scroll Behavior
- `overscroll-behavior: none` on `#chat-container`
- `-webkit-overflow-scrolling: touch` on scrollable panels (history, outfit carousel, scene picker)

### Viewport
- Add `viewport-fit=cover` to existing viewport meta tag
- Replace `100vh` with `100dvh` throughout `globals.css` with fallback:
  ```css
  height: 100vh;
  height: 100dvh;
  ```

---

## Architecture Notes

### New Files
- `public/sw.js` — rewritten service worker with caching strategies (replaces existing)
- `src/lib/haptics.ts` — vibration patterns and expression mapping
- `src/lib/useSwipeGesture.ts` — touch gesture detection hook
- `src/lib/awayNotifications.ts` — absence-based notification logic
- `src/components/AwayNotificationStack.tsx` — notification toast UI
- `src/components/OfflineBanner.tsx` — connection status indicator

### Modified Files
- `src/app/layout.tsx` — meta tags for PWA, viewport-fit, apple-mobile-web-app
- `src/app/page.tsx` — mount AwayNotificationStack
- `src/app/chat/[characterId]/page.tsx` — haptics integration, swipe gestures, safe area padding, dynamic theme-color
- `src/components/PageTransition.tsx` — iOS-style slide transitions
- `src/components/BottomNav.tsx` — safe area padding, larger tap targets
- `src/components/DialogueBox.tsx` — haptic on advance, safe area padding
- `src/components/ChatInput.tsx` — safe area padding, 16px font minimum
- `src/components/ControlBar.tsx` — larger tap targets
- `src/styles/globals.css` — 100dvh fix, overscroll-behavior, safe areas, mobile text sizing, touch targets
- `public/manifest.json` — display standalone, updated metadata
- `src/app/settings/page.tsx` — haptic feedback toggle

### No New Dependencies
All features use Web APIs: Vibration API, Service Worker, Cache API, Touch Events, CSS env().
