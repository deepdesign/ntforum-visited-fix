// ntforum.net Visited Links Fix
//
// Why this exists: thread titles on ntforum.net are wired up with a
// Knockout.js click binding that expands the thread in place via an
// AJAX call (GET /api/forum/thread/<id>/replies). It never performs a
// real browser navigation, so Chrome never records a visit and the
// site's own `a.link-text:visited` CSS rule never fires. This script
// tracks clicks itself (in localStorage, per browser profile) and
// re-applies the site's own "visited" colour by hand.

(function () {
  "use strict";

  var STORAGE_KEY = "ntforumVisitedLinks";
  var MAX_ENTRIES = 10000; // simple cap so storage doesn't grow forever
  var MARK_CLASS = "cc-visited-fix";
  var LINK_SELECTOR = "a.link-text[href]";

  var visited = Object.create(null);
  var loaded = false;
  var pendingApply = false;

  injectStyle();
  loadVisited(function () {
    loaded = true;
    applyVisited();
  });

  // Capture phase so we see the click even though the site's own
  // handler prevents the default navigation and never lets it bubble.
  document.addEventListener("click", onClick, true);

  // The list re-renders on expand/collapse and on pagination, so keep
  // re-applying the visited class whenever the DOM changes.
  var observer = new MutationObserver(function () {
    scheduleApply();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  function injectStyle() {
    var style = document.createElement("style");
    style.textContent =
      "a.link-text." + MARK_CLASS + "," +
      "a.link-text." + MARK_CLASS + ":link," +
      "a.link-text." + MARK_CLASS + ":hover {" +
      "  color: var(--neutral-accent-color) !important;" +
      "}";
    (document.head || document.documentElement).appendChild(style);
  }

  function normalizeHref(anchor) {
    var href = anchor.getAttribute("href");
    if (!href) return null;
    var trimmed = href.trim();
    if (trimmed === "" || trimmed === "#") return null;
    if (/^(javascript|mailto|tel):/i.test(trimmed)) return null;
    try {
      return new URL(trimmed, window.location.href).href;
    } catch (e) {
      return null;
    }
  }

  function loadVisited(callback) {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      callback();
      return;
    }
    chrome.storage.local.get([STORAGE_KEY], function (result) {
      var list = (result && result[STORAGE_KEY]) || [];
      for (var i = 0; i < list.length; i++) {
        visited[list[i]] = true;
      }
      callback();
    });
  }

  function saveVisited() {
    if (!chrome || !chrome.storage || !chrome.storage.local) return;
    var keys = Object.keys(visited);
    if (keys.length > MAX_ENTRIES) {
      // Drop the oldest-inserted half; insertion order is preserved
      // by V8's object key ordering for string keys, so this is a
      // reasonable enough trim without keeping a separate timestamp.
      keys = keys.slice(keys.length - MAX_ENTRIES);
      var trimmed = Object.create(null);
      keys.forEach(function (k) { trimmed[k] = true; });
      visited = trimmed;
    }
    var payload = {};
    payload[STORAGE_KEY] = keys;
    chrome.storage.local.set(payload);
  }

  function markVisited(url) {
    if (visited[url]) return;
    visited[url] = true;
    saveVisited();
  }

  function onClick(event) {
    if (event.button !== 0) return; // left click only
    var anchor = event.target.closest ? event.target.closest(LINK_SELECTOR) : null;
    if (!anchor) return;
    var url = normalizeHref(anchor);
    if (!url) return;
    markVisited(url);
    anchor.classList.add(MARK_CLASS);
  }

  function scheduleApply() {
    if (pendingApply) return;
    pendingApply = true;
    requestAnimationFrame(function () {
      pendingApply = false;
      applyVisited();
    });
  }

  function applyVisited() {
    if (!loaded) return;
    var anchors = document.querySelectorAll(LINK_SELECTOR);
    for (var i = 0; i < anchors.length; i++) {
      var anchor = anchors[i];
      var url = normalizeHref(anchor);
      if (url && visited[url]) {
        anchor.classList.add(MARK_CLASS);
      }
    }
  }
})();
