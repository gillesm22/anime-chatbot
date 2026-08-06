// Bootstrap disk-restore, injected as a `beforeInteractive` inline script in the
// root layout. It runs BEFORE React hydrates — and therefore before any page
// (the home screen included) reads OR writes localStorage. This is essential:
// HomeContent writes affinity keys on mount, which would otherwise make the
// browser look like it "has progress" and permanently block the real restore.
//
// If localStorage has no character data, it synchronously pulls /api/load and
// hydrates localStorage from the on-disk save. Guarded and self-contained (no
// imports) so it can be serialized into a <Script> tag.

import { CHARACTER_KEY_PATTERNS } from "@/lib/saveSystem";

/**
 * Build the self-contained IIFE string for the beforeInteractive restore.
 * The character-key patterns are interpolated from the single source of truth
 * so this can never disagree with hasCharacterData().
 */
export function buildBootstrapScript(): string {
  const patterns = JSON.stringify(CHARACTER_KEY_PATTERNS);
  return `(function(){
  try {
    var PATTERNS = ${patterns};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k) continue;
      for (var p = 0; p < PATTERNS.length; p++) {
        if (k.indexOf(PATTERNS[p]) !== -1) return; // browser already has progress
      }
    }
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/load", false); // synchronous: must finish before React reads
    xhr.send();
    if (xhr.status !== 200) return;
    var body = JSON.parse(xhr.responseText);
    if (!body || !body.data) return;
    var keys = Object.keys(body.data);
    for (var j = 0; j < keys.length; j++) {
      localStorage.setItem(keys[j], body.data[keys[j]]);
    }
  } catch (e) { /* non-fatal: fall through to normal browser-storage behavior */ }
})();`;
}
