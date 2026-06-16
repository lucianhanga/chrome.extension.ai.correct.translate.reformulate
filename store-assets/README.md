# Store assets

Images for the Chrome Web Store listing. See
[../docs/PUBLISHING.md](../docs/PUBLISHING.md) for the full submission checklist
and [../docs/store-listing.md](../docs/store-listing.md) for the listing text.

## What's here

- `icon-128.png` — the 128x128 store icon (a copy of `public/icons/icon-128.png`,
  reused as the manifest icon).
- `01-context-menu.png` — right-click "Correct / Translate / Reformulate" submenu.
- `02-result-overlay.png` — floating result panel with Replace / Append / Close.
- `03-popup-quick-action.png` — popup quick actions + Ollama settings.
- `04-settings-providers.png` — Settings showing the provider selector.

(The same captures, plus the Ollama settings and OpenAI consent dialog, live in
`../docs/images/` and are used in the [user guide](../docs/user-guide.md).)

## Before uploading (one manual step)

The Chrome Web Store requires each screenshot to be exactly **1280x800** or
**640x400** (PNG or JPEG). The captures here are smaller UI shots, so place each
on a 1280x800 canvas (centered, with a background) or scale to 640x400 before
uploading in the Developer Dashboard. At least one screenshot is required; all
four make a stronger listing.

> Tip: for the cleanest result, center each capture on a solid 1280x800
> background that matches the extension's dark theme.
