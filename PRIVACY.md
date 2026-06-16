# Privacy Policy — Correct & Translate

_Last updated: 2026-06-16_

Correct & Translate is an open-source Chrome extension that corrects,
translates, reformulates, and summarizes selected text using a large language
model. This policy explains exactly where your text goes, depending on which
provider you choose.

Source code: https://github.com/lucianhanga/chrome.extension.ai.correct.translate.reformulate

## Summary

**The extension does not run any servers of its own and does not collect,
sell, or share your data with the developer.** Where your text goes depends
entirely on the provider you select in Settings:

| Provider | Default | Where your text goes | Leaves your machine |
|----------|---------|----------------------|---------------------|
| Ollama (local) | Yes | Your own computer (`http://localhost:11434`) | No |
| OpenAI | No (opt-in) | OpenAI's servers (`https://api.openai.com`) | Yes |

## What data the extension handles

- **The text you select** (or type into the popup) is sent to the **active
  provider** so it can be corrected, translated, reformulated, or summarized.
  It is not stored by the extension after the result is returned.
- **Your settings** (provider choice, model, default language/tone/length,
  Ollama endpoint, and your OpenAI API key if you enter one) are stored locally
  in `chrome.storage.local` on your own machine. They are never synced to a
  cloud account and never sent anywhere except, in the case of the OpenAI API
  key, to OpenAI in the `Authorization` header of OpenAI requests.

## Provider 1 — Ollama (local, default)

When the active provider is **Ollama**, all text stays on your own computer.
Requests go only to a local Ollama instance at `http://localhost:11434` (or the
endpoint you configure). **Nothing leaves your device, and no credential is
used.** Use this provider when a correction or translation must stay private.

## Provider 2 — OpenAI (opt-in)

When you switch the active provider to **OpenAI**, the text you process is sent
over HTTPS to OpenAI's API (`https://api.openai.com`) for processing. **Your
text leaves your computer** and is handled by OpenAI under
[OpenAI's API data usage policies](https://openai.com/policies/). To reduce
surprise:

- Switching to OpenAI requires a one-time, in-product **consent dialog** that
  states your text will be sent to OpenAI.
- While OpenAI is active, a persistent **`OpenAI` badge** is shown in the popup
  as an always-visible reminder.
- Your OpenAI API key is stored only in `chrome.storage.local`, is redacted
  before it is shown back in the UI, is never written to logs or error
  messages, and is sent only to OpenAI.

If you do not want any text to leave your machine, use the default Ollama
provider and do not enable OpenAI.

## What the extension does NOT do

- It does not run any developer-operated server or backend.
- It does not use analytics, tracking, advertising, or telemetry.
- It does not collect personally identifiable information.
- It does not sell or share your data with third parties. (When you opt in to
  OpenAI, text is sent to OpenAI as the LLM provider you chose — not to the
  developer.)

## Permissions

The extension requests these permissions. Each is used only for the stated
purpose:

- **`storage`** — saves your settings locally (`chrome.storage.local`).
- **`contextMenus`** — adds the right-click "Correct / Translate / Reformulate"
  menu.
- **`activeTab`** + **`scripting`** — injects the result overlay into the page
  you are actively using when you trigger an action.
- **`clipboardWrite`** — copies each result to your clipboard automatically.
- **Host access (`<all_urls>`)** — lets the content script reach the editable
  area on any page, including cross-origin iframes (for example, webmail
  compose editors). Broad host access does **not** mean broad network access:
  a Content Security Policy restricts outgoing connections to local Ollama and
  OpenAI only.

## Network access

Outgoing network connections are restricted by the extension's
`connect-src` Content Security Policy to exactly two destinations: local Ollama
(`http://localhost:11434`) and OpenAI (`https://api.openai.com`). The extension
cannot contact any other server.

## Changes to this policy

If the extension's data practices change, this document will be updated and the
"Last updated" date revised.

## Contact

Questions about this policy: lucianhanga@googlemail.com
