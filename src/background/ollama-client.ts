// src/background/ollama-client.ts
// Fetch-based Ollama client for the Chrome extension service worker.
// Only the service worker calls Ollama -- never content scripts or the popup.

import type { LLMClient, LLMHealthResult } from './llm-client.ts';
import type { LLMResult, OllamaCallOptions, OllamaHealthResult } from '../shared/types.ts';
import {
  DEFAULT_MODEL,
  DEFAULT_OLLAMA_ENDPOINT,
  OLLAMA_PARAMS,
  REQUEST_TIMEOUT_MS,
  HEALTH_CHECK_TIMEOUT_MS,
} from '../shared/constants.ts';

// ============================================================
// Request Builder
// ============================================================

// Builds a request body for the native Ollama /api/chat endpoint.
//
// This client uses /api/chat -- NOT the OpenAI-compatible /v1/chat/completions
// endpoint -- because only /api/chat honors the `options` block. The OpenAI
// endpoint silently ignores `options`, which would leave temperature, top_p,
// top_k, and num_ctx (the context window) at the model defaults.
function buildChatRequest(
  systemPrompt: string,
  userText: string,
  model: string,
  temperature: number,
): object {
  return {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText },
    ],
    stream: false,
    // `think` is a top-level field on /api/chat (not part of `options`).
    think: OLLAMA_PARAMS.think,
    // Runtime parameters. num_ctx caps the context window (16k) so the model
    // is not loaded with its much larger default context.
    options: {
      temperature,
      top_p: OLLAMA_PARAMS.top_p,
      top_k: OLLAMA_PARAMS.top_k,
      num_ctx: OLLAMA_PARAMS.num_ctx,
    },
  };
}

// ============================================================
// Main Call Function
// ============================================================

/**
 * Calls the Ollama native /api/chat API (non-streaming).
 *
 * @param systemPrompt - The system prompt for the task
 * @param userText - The user's input text
 * @param options - Optional overrides for model, endpoint, timeout, temperature
 * @returns LLMResult with trimmed text, model name, token count, and elapsed time
 * @throws Error with descriptive message on network failure, timeout, or Ollama error
 */
export async function callOllama(
  systemPrompt: string,
  userText: string,
  options: OllamaCallOptions = {},
): Promise<LLMResult> {
  const {
    model = DEFAULT_MODEL,
    endpoint = DEFAULT_OLLAMA_ENDPOINT,
    timeoutMs = REQUEST_TIMEOUT_MS,
    temperature = OLLAMA_PARAMS.temperature,
  } = options;

  if (!userText || userText.trim() === '') {
    return { text: '', model, totalTokens: null, elapsedMs: 0 };
  }

  const url = `${endpoint}/api/chat`;
  const body = buildChatRequest(systemPrompt, userText, model, temperature);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const startMs = Date.now();
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Ollama request timed out after ${timeoutMs}ms`, { cause: error });
    }
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Ollama unreachable: ${msg}`, { cause: error });
  } finally {
    clearTimeout(timer);
  }

  const elapsedMs = Date.now() - startMs;

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    if (response.status === 404) {
      throw new Error(`Model not found. Pull the model first: ollama pull ${model}`);
    }
    throw new Error(`Ollama API error ${response.status}: ${text}`);
  }

  const data: unknown = await response.json();

  // Native /api/chat response: { model, message: { content }, prompt_eval_count,
  // eval_count, ... }.
  const typed = data as {
    message?: { content?: unknown };
    model?: unknown;
    prompt_eval_count?: unknown;
    eval_count?: unknown;
  };

  const content = typed?.message?.content;

  if (typeof content !== 'string') {
    throw new Error(`Unexpected Ollama response shape: ${JSON.stringify(data)}`);
  }

  // /api/chat reports token usage as separate prompt and completion counts;
  // sum them for the total. Degrade to null when neither is present.
  const resolvedModel = typeof typed.model === 'string' ? typed.model : model;
  const promptTokens =
    typeof typed.prompt_eval_count === 'number' ? typed.prompt_eval_count : null;
  const evalTokens = typeof typed.eval_count === 'number' ? typed.eval_count : null;
  const totalTokens =
    promptTokens === null && evalTokens === null
      ? null
      : (promptTokens ?? 0) + (evalTokens ?? 0);

  return { text: content.trim(), model: resolvedModel, totalTokens, elapsedMs };
}

// ============================================================
// Health Check
// ============================================================

/**
 * Check if Ollama is reachable and whether the target model is available.
 *
 * @param endpoint - Ollama base URL
 * @param model - Model name to verify
 * @returns Health status object
 */
export async function checkOllamaHealth(
  endpoint: string = DEFAULT_OLLAMA_ENDPOINT,
  model: string = DEFAULT_MODEL,
): Promise<OllamaHealthResult> {
  try {
    const response = await fetch(`${endpoint}/api/tags`, {
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        reachable: false,
        modelFound: false,
        error: `Ollama returned HTTP ${response.status}`,
      };
    }

    const data = (await response.json()) as { models?: Array<{ name: string }> };
    const models = data?.models ?? [];
    const modelPrefix = model.split(':')[0] ?? model;
    const modelFound = models.some(
      (m) => m.name === model || m.name.startsWith(modelPrefix),
    );

    return { reachable: true, modelFound, error: null };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { reachable: false, modelFound: false, error: msg };
  }
}

// ============================================================
// LLMClient Adapter
// ============================================================

/**
 * Wraps the lower-level callOllama / checkOllamaHealth functions in the
 * provider-agnostic LLMClient interface. The existing functions are unchanged;
 * this is a thin, pure adapter with no new behavior.
 */
export function createOllamaClient(cfg: { endpoint: string }): LLMClient {
  return {
    call: async (system, user, opts): Promise<LLMResult> => {
      const callOpts: OllamaCallOptions = {
        endpoint: cfg.endpoint,
        model: opts.model,
      };
      if (opts.timeoutMs !== undefined) callOpts.timeoutMs = opts.timeoutMs;
      if (opts.temperature !== undefined) callOpts.temperature = opts.temperature;
      return callOllama(system, user, callOpts);
    },
    healthCheck: (model): Promise<LLMHealthResult> =>
      checkOllamaHealth(cfg.endpoint, model),
  };
}
