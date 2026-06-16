# Store assets

Images for the Chrome Web Store listing. See
[../docs/PUBLISHING.md](../docs/PUBLISHING.md) for the full submission checklist
and [../docs/store-listing.md](../docs/store-listing.md) for the listing text.

## What's here

- `icon-128.png` — the 128x128 store icon (a copy of `public/icons/icon-128.png`,
  reused as the manifest icon).

## What you still need to capture (manual)

Screenshots cannot be generated from code; capture these from a running build
(`pnpm build`, then load `dist/` via Load unpacked). The store requires at least
one screenshot at **1280x800** or **640x400** (PNG or JPEG). Suggested set:

1. **Context menu** — text selected on a page with the right-click
   "Correct / Translate / Reformulate" submenu open.
2. **Result overlay** — a result shown over an editable field, with the
   Replace / Append buttons visible.
3. **Popup quick panel** — the toolbar popup showing an action result and its
   metadata line (model, tokens, time).
4. **Settings** — the Settings section showing the provider selector
   (Ollama vs OpenAI) and model dropdown.

Save them here (for example `01-context-menu.png`, `02-overlay.png`, ...) before
uploading them in the Developer Dashboard.

> Tip: for clean shots, use a neutral page and the light theme; 1280x800 gives
> the most room in the store carousel.
