// Bootstrap disk-restore, injected as a `beforeInteractive` inline script in the
// root layout. It runs BEFORE React hydrates — and therefore before any page
// (the home screen included) reads OR writes localStorage. This is essential:
// HomeContent writes affinity keys on mount, which would otherwise make the
// browser look like it "has progress".
//
// It synchronously pulls /api/load and restores the on-disk save whenever the
// disk holds MORE progress than the browser (progress = total affinity points +
// history length, which only grow in normal play — the same score the write
// guard uses). This is self-healing: a blank or polluted browser is repaired on
// the next load, while a browser that is genuinely ahead of the disk is left
// untouched. Self-contained (no imports) so it serializes into a <Script> tag.

/**
 * Build the self-contained IIFE string for the beforeInteractive restore.
 */
export function buildBootstrapScript(): string {
  return `(function(){
  try {
    function scoreOf(get, keys){
      var s = 0;
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i], v = get(k);
        if (v == null) continue;
        try {
          if (k.indexOf("affinity-") !== -1) {
            var p = JSON.parse(v).points;
            if (typeof p === "number") s += p;
          } else if (k.indexOf("history-") !== -1) {
            var a = JSON.parse(v);
            if (a && a.length) s += a.length;
          }
        } catch (e) {}
      }
      return s;
    }
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/load", false); // synchronous: must finish before React reads
    xhr.send();
    if (xhr.status !== 200) return;
    var body = JSON.parse(xhr.responseText);
    if (!body || !body.data) return;
    var diskKeys = Object.keys(body.data);
    var diskScore = scoreOf(function(k){ return body.data[k]; }, diskKeys);
    var lsKeys = [];
    for (var i = 0; i < localStorage.length; i++) lsKeys.push(localStorage.key(i));
    var browserScore = scoreOf(function(k){ return localStorage.getItem(k); }, lsKeys);
    if (diskScore <= browserScore) return; // browser is level with / ahead of disk
    for (var j = 0; j < diskKeys.length; j++) {
      localStorage.setItem(diskKeys[j], body.data[diskKeys[j]]);
    }
  } catch (e) { /* non-fatal: fall through to normal browser-storage behavior */ }
})();`;
}
