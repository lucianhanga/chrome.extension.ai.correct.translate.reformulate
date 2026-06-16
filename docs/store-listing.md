# Chrome Web Store listing copy

Paste-ready text for the Developer Dashboard. The store's "Detailed description"
field is **plain text** (no Markdown rendering), so the block below uses plain
text with hyphen bullets. Edit freely before submitting.

See [PUBLISHING.md](PUBLISHING.md) for the full submission checklist and
[store-assets/README.md](../store-assets/README.md) for image requirements.

---

## Name

```
Correct & Translate
```

## Short description (<= 132 characters)

```
Correct, translate, reformulate & summarize selected text with a private local AI (Ollama) or OpenAI. Open source.
```

(113 characters.)

## Category

```
Productivity
```

## Detailed description

```
Correct & Translate fixes grammar, translates, reformulates, and summarizes the
text you select on any page - using AI that runs LOCALLY on your own computer by
default, so your text stays private.

Select text, right-click (or use the toolbar popup), and choose an action:

- Correct - fixes grammar and spelling, keeping your original language.
- Translate - between English, German, Romanian, Spanish, and Italian (Romanian
  comes with diacritics or as plain ASCII "no diacritics").
- Reformulate - rewrites in a chosen tone: Keep tone, Professional, Friendly, or
  Natural, with an optional "keep terminology" toggle.
- Summarize - a short summary at Brief, Standard, or Detailed length, in the
  text's own language.

Every result is copied to your clipboard automatically and shows the model,
token count, and time taken. When you select text inside an editable field, the
result overlay also offers in-place Replace and Append.

PRIVATE BY DEFAULT (LOCAL AI)
By default the extension uses Ollama, a free local AI runtime. All processing
happens on your computer and nothing you correct or translate is sent over the
internet. You install Ollama once and pull a model. Full step-by-step setup for
macOS and Windows, including which model fits your RAM, is here:
https://github.com/lucianhanga/chrome.extension.ai.correct.translate.reformulate/blob/main/docs/ollama-install-guide.md

OPTIONAL: OPENAI
If you prefer not to run a local model, you can opt in to OpenAI using your own
API key. IMPORTANT: when OpenAI is active, the text you process is sent over the
internet to OpenAI's servers - it leaves your computer. This is opt-in only,
gated by a one-time consent dialog, and a persistent "OpenAI" badge is shown
while it is active. A guide to creating a key, setting a spending limit, and
adding a usage alert is here:
https://github.com/lucianhanga/chrome.extension.ai.correct.translate.reformulate/blob/main/docs/openai-setup-guide.md

OPEN SOURCE
This extension is free and open source (MIT licensed). You can read the full
source code, verify exactly what it does, report issues, or contribute at:
https://github.com/lucianhanga/chrome.extension.ai.correct.translate.reformulate

PERMISSIONS & PRIVACY
The extension does not run any servers of its own and does not use analytics or
tracking. Broad page access is used only so it can read your selection and place
results into editable fields (including webmail compose editors in iframes);
network access is restricted to your local Ollama and, if you opt in, OpenAI.
Privacy policy:
https://github.com/lucianhanga/chrome.extension.ai.correct.translate.reformulate/blob/main/PRIVACY.md
```

## Permission justifications and the data-practices form

These live in [PUBLISHING.md](PUBLISHING.md) so they stay in one place with the
rest of the submission steps.
