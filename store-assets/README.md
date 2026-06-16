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

## Upload-ready screenshots (1280x800)

The `store-01-…` through `store-04-…` files are the raw captures centered on a
1280x800 white canvas — the exact size the Chrome Web Store requires. Upload
these four directly in the Developer Dashboard.

They were generated from the raw captures with macOS `sips`:

```bash
for f in 01-context-menu 02-result-overlay 03-popup-quick-action 04-settings-providers; do
  sips -p 800 1280 --padColor FFFFFF "$f.png" --out "store-$f.png"
done
```

> To regenerate on a dark canvas instead, swap `FFFFFF` for e.g. `12141C`.
