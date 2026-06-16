# Using OpenAI (optional): API key, budget limits, and alerts

Correct & Translate can use **OpenAI** instead of a local model. This is
**opt-in** and **not** the default.

> **Your text leaves your computer.** When OpenAI is the active provider, the
> text you correct, translate, reformulate, or summarize is sent over the
> internet to OpenAI's servers (`https://api.openai.com`) and is processed under
> [OpenAI's API data usage policies](https://openai.com/policies/). If a
> correction or translation must stay private, use the default **Ollama**
> provider instead — with Ollama, nothing leaves your machine. See
> [provider-setup-and-privacy.md](provider-setup-and-privacy.md).

Using OpenAI requires your own OpenAI account, and OpenAI bills you for usage.
The steps below show how to create a key and — importantly — cap your spending
and get alerted before bills surprise you.

---

## 1. Create an API key

1. Sign in at the OpenAI platform: <https://platform.openai.com>.
2. Make sure your account has billing set up (Settings → Billing). API usage
   requires a payment method or prepaid credits.
3. Go to the API keys page: <https://platform.openai.com/api-keys>.
4. Click **Create new secret key**.
5. **Give the key permission to list models.** The extension validates a key by
   calling `GET /v1/models`; a key that cannot list models will fail validation
   even if it is otherwise valid. Choosing the **"All"** permissions option is
   the simplest way to ensure this.
6. Copy the key (it starts with `sk-...`). **OpenAI shows the secret only once** —
   store it somewhere safe. Treat it like a password; anyone with it can spend
   from your account.

---

## 2. Set a spending limit (do this before you use the key)

OpenAI lets you cap how much your account can spend. Set this so a mistake or a
runaway loop cannot run up a large bill.

1. Open **Settings → Billing → Limits**:
   <https://platform.openai.com/settings/organization/limits>.
2. Set a **monthly budget / hard limit** to an amount you are comfortable with
   (for personal use of this extension, a few dollars a month is usually plenty —
   the supported models are small and cheap).
3. When the **hard limit** is reached, OpenAI **stops** serving further API
   requests for the rest of the billing period. The extension will then report a
   quota/billing error; switch back to Ollama or raise the limit.

> If you use **prepaid credits** instead of monthly billing, your spending is
> naturally capped at the credit balance — OpenAI will not charge beyond what
> you have loaded, and requests stop when credits run out.

---

## 3. Add a usage alert / notification

A **soft limit** sends you an email when usage crosses a threshold, so you are
warned well before hitting the hard limit.

1. On the same **Billing → Limits** page, set the **soft limit** (the
   "usage threshold" / alert amount) below your hard limit — for example, alert
   at $2 and hard-stop at $5.
2. Confirm the notification email address under **Settings → Organization** is
   one you read.
3. You can also watch live spend any time on the **Usage** dashboard:
   <https://platform.openai.com/usage>.

With both limits set, you get an **email alert** at the soft limit and an
automatic **hard stop** at the hard limit.

---

## 4. Enter the key in the extension

1. Open the Correct & Translate popup and expand **Settings**.
2. Set **Provider** to `OpenAI`. The first time you do this, a one-time
   **data-egress consent dialog** appears, reminding you that your text will be
   sent to OpenAI. Confirm to continue.
3. Choose an **OpenAI Model**. Supported models are `gpt-5.4-nano` and
   `gpt-5-nano` (default `gpt-5-nano`) — both small and inexpensive.
4. Paste your key into the **OpenAI API Key** field.
5. (Optional) Click **Validate**. The extension checks the key and model against
   `GET /v1/models` without saving. Green = valid; red = explains the failure.
6. Click **Save Settings**. The key is stored only in `chrome.storage.local` on
   your machine; it is redacted in the UI afterward and never logged.

While OpenAI is active, a persistent yellow **`OpenAI` badge** appears in the
popup as a reminder that text leaves your machine. Switch the provider back to
`Ollama (local)` and save to remove it.

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Validation fails: "OpenAI returned HTTP 403" | Key lacks model-list permission | Recreate the key with "All" permissions (it must be able to call `GET /v1/models`). |
| Validation fails: "Invalid API key." | Wrong, expired, or revoked key (HTTP 401) | Create a fresh key and paste it in. |
| Key valid but model not found | Selected model not available to your account | Pick the other supported model and validate again. |
| Request fails with a quota/billing error | Out of quota, hard limit reached, or billing issue | Check Billing/Limits, add credit or raise the limit, or switch to Ollama. |
| "Cannot reach OpenAI" | No internet or timeout | Check your connection and retry, or switch to Ollama. |

For the full provider and privacy reference, see
[provider-setup-and-privacy.md](provider-setup-and-privacy.md).
