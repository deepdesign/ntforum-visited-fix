# ntforum.net Visited Links Fix

A small Chrome extension that fixes visited-link colouring on ntforum.net.

## Why

Thread titles on ntforum.net use a Knockout.js click handler that expands
the thread in place via an AJAX call. It never performs a real browser
navigation, so Chrome never records the URL as visited and the site's own
`a.link-text:visited` CSS rule never has a chance to fire. Confirmed by
watching the Network tab: clicking a thread only fires
`GET /api/forum/thread/<id>/replies` — no navigation, no change to the
address bar or browser history.

This extension tracks clicks itself and re-applies the site's own
"visited" colour by hand, so it looks exactly like a normal visited link
on the site (it reuses the site's `--neutral-accent-color` CSS variable).

## What it does

- Listens for left-clicks on thread links.
- Remembers the exact URL clicked, stored locally via
  `chrome.storage.local` (kept in your browser only, not synced or sent
  anywhere).
- Colours that link — and any future occurrence of it on the page — the
  same grey/tan the site uses for its own visited links.
- Re-applies this whenever the page's content changes (the site re-renders
  parts of the page via JavaScript when you expand a thread or change
  pages), using a MutationObserver.

It only tracks links on ntforum.net and does nothing on any other site.

## Install (unpacked, since this isn't published to the Chrome Web Store)

1. Download and unzip `ntforum-visited-fix.zip` somewhere permanent (don't
   delete the folder afterwards — Chrome loads the extension from it
   directly).
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked**, and select the unzipped `ntforum-visited-fix`
   folder.
5. Visit ntforum.net and click a few threads — they should now stay
   coloured after you navigate away and come back.

## Notes / limitations

- This only affects how the page *looks* to you — it doesn't touch
  Chrome's real global browsing history, and it can't make Chrome's
  native `:visited` styling work again (that's the underlying Chrome
  behaviour this works around).
- The visited list is stored per Chrome profile. It won't follow you to
  a different computer or browser.
- If ntforum.net changes its markup (e.g. renames the `link-text` class),
  this may need a small update to match.
