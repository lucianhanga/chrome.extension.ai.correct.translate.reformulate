# Installing Ollama (macOS and Windows)

The default provider for Correct & Translate is **Ollama**, a free, open-source
runtime that runs language models **locally on your own computer**. With Ollama,
nothing you correct or translate ever leaves your machine.

This guide covers installing Ollama, pulling a model, allowing the extension to
talk to it, and choosing a model that fits your RAM.

---

## 1. Install Ollama

### macOS

1. Download the macOS app from <https://ollama.com/download>.
2. Open the downloaded `.dmg` and drag **Ollama** into your Applications folder.
3. Launch Ollama once. It runs in the background and listens on
   `http://localhost:11434`.

Alternatively, with [Homebrew](https://brew.sh):

```bash
brew install ollama
ollama serve   # starts the local server
```

### Windows

1. Download the Windows installer (`OllamaSetup.exe`) from
   <https://ollama.com/download>.
2. Run the installer and follow the prompts.
3. Ollama starts automatically and listens on `http://localhost:11434`. You can
   confirm it is running from the system tray.

---

## 2. Pull a model

Pick a model that fits your hardware (see [section 4](#4-which-model-fits-your-ram)),
then download it. The extension's shipped default is `qwen3.6:35b-a3b`:

```bash
ollama pull qwen3.6:35b-a3b
```

The models offered in the extension's **Settings → Model** dropdown are:

| Model | Notes |
|-------|-------|
| `qwen3.6:35b-a3b` | Default. Mixture-of-experts: ~35B total parameters, only ~3B active per token, so it is fast for its quality but still needs RAM for the full weights (~17 GB on disk). |
| `gemma3:27b` | Dense 27B model; highest quality of the three, heaviest. |
| `gemma4:latest` | Smallest of the three; good for lower-RAM machines. |

The model field also accepts **any** model name you have pulled. On a
lower-RAM machine you can pull a smaller model (for example `qwen3:14b` or a
small Gemma) and type its name into the Model field.

You can list what you have pulled and see each file size with:

```bash
ollama list
```

---

## 3. Let the extension reach Ollama (required, one-time)

The extension's service worker sends requests stamped with a
`chrome-extension://` origin. By default Ollama **rejects** these with HTTP 403,
so the extension shows Ollama as unreachable until you allow that origin.

### macOS

If you run the Ollama app:

```bash
launchctl setenv OLLAMA_ORIGINS "chrome-extension://*"
```

Then **quit and reopen Ollama** so the new process picks up the setting.

> Note: `launchctl setenv` does **not** survive a reboot. Run it again after a
> restart, or install a LaunchAgent for a permanent fix.

If you instead start the server from a terminal with `ollama serve`, you can set
it inline:

```bash
export OLLAMA_ORIGINS="chrome-extension://*"
ollama serve
```

### Windows

Set a persistent user environment variable, then restart Ollama:

```powershell
setx OLLAMA_ORIGINS "chrome-extension://*"
```

After running `setx`, fully exit Ollama from the system tray and start it again
(or sign out and back in) so it reads the new variable. For a one-off session in
the current PowerShell window you can instead use:

```powershell
$env:OLLAMA_ORIGINS = "chrome-extension://*"
ollama serve
```

You can also set it through **Settings → System → About → Advanced system
settings → Environment Variables** if you prefer the GUI.

---

## 4. Which model fits your RAM?

Ollama loads the model's weights into memory before it can run. On Apple Silicon
MacBooks, memory is **unified** (shared between CPU and GPU), and Ollama can use
a large share of it. As a rule of thumb you need free memory of roughly the
**model's on-disk size plus a few GB** for the context window (this extension
uses a 16K-token context).

The table below is approximate guidance for Apple Silicon MacBooks (M-series).
Exact fit depends on quantization and other apps you have open. When in doubt,
check the model's file size with `ollama list` and keep a few GB free.

| MacBook unified memory | Comfortable model size | Shipped models that fit | Suggestion |
|------------------------|------------------------|--------------------------|------------|
| **8 GB** | up to ~3–4B | None of the three shipped models | Use a small model (e.g. a 3–4B Gemma) typed into the Model field, or use OpenAI. |
| **16 GB** | up to ~7–9B (a 14B is tight) | None of the three fit comfortably | Pull a smaller model such as `qwen3:14b` (tight) or a 7–8B model; or use OpenAI. |
| **24 GB** | up to ~14B comfortably | `gemma4:latest` if small; 27B is tight | `qwen3:14b` is a good balance; the 27B/35B defaults leave little headroom. |
| **32 GB** | up to ~27–35B | `qwen3.6:35b-a3b` (~17 GB) and `gemma3:27b` fit with room for context | The shipped default `qwen3.6:35b-a3b` runs well here. |
| **48–64 GB** | 27–35B comfortably, larger possible | All three shipped models | Run any shipped model with a large context and other apps open. |
| **64 GB+** | very large models | All | Plenty of headroom for the biggest models. |

Notes:

- **Quantization matters.** Ollama models are usually quantized (commonly 4-bit),
  which is what keeps a 27B model around ~15–16 GB rather than far larger. A
  smaller quantization uses less RAM at some quality cost.
- **Mixture-of-experts (the `-a3b` default).** `qwen3.6:35b-a3b` keeps ~3B
  parameters active per token, so it runs faster than a dense 35B model — but
  the full ~35B of weights must still be loaded, so plan RAM around the on-disk
  size, not the active size.
- **Intel Macs** (no Apple Silicon) run models on the CPU only and will be much
  slower; prefer small models or OpenAI.
- **Windows with a discrete GPU**: models that fit in your **VRAM** run fastest;
  otherwise Ollama falls back to system RAM and runs slower.

---

## 5. Verify it works

1. Make sure Ollama is running and you have pulled a model.
2. Open the Correct & Translate popup. In **Settings**, keep **Provider** set to
   `Ollama (local)` and select your model.
3. The status dot next to the popup title turns **green** when Ollama is
   reachable and the selected model is available.

If it stays red, re-check the `OLLAMA_ORIGINS` step in
[section 3](#3-let-the-extension-reach-ollama-required-one-time) and confirm the
model name matches one you have pulled. For more troubleshooting, see
[provider-setup-and-privacy.md](provider-setup-and-privacy.md).
