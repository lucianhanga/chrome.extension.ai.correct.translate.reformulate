// src/background/tasks.ts
// High-level task functions for grammar correction and translation.

import type { LLMResult, SupportedLanguage, ReformulateTone, SummarizeLength } from '../shared/types.ts';
import {
  GRAMMAR_CORRECT_SYSTEM,
  buildTranslateSystemPrompt,
  buildReformulateSystemPrompt,
  buildSummarizeSystemPrompt,
} from '../shared/prompts.ts';
import type { LLMClient, LLMCallOptions } from './llm-client.ts';

// ============================================================
// Grammar Correction
// ============================================================

/**
 * Correct grammar and spelling in the given text using the provider-agnostic
 * LLMClient (Ollama or OpenAI).
 *
 * @param client - The active LLM client
 * @param text - The text to correct
 * @param options - Model name and optional temperature override
 * @returns LLMResult with corrected text and metadata
 */
export async function correctGrammar(
  client: LLMClient,
  text: string,
  options: LLMCallOptions,
): Promise<LLMResult> {
  return client.call(GRAMMAR_CORRECT_SYSTEM, text, options);
}

// ============================================================
// Translation
// ============================================================

/**
 * Translate text to targetLanguage using the provider-agnostic LLMClient. The
 * source language is always auto-detected by the model.
 *
 * @param client - The active LLM client
 * @param text - The text to translate
 * @param targetLanguage - Target language
 * @param options - Model name and optional temperature override
 * @returns LLMResult with translated text and metadata
 */
export async function translateText(
  client: LLMClient,
  text: string,
  targetLanguage: SupportedLanguage,
  options: LLMCallOptions,
): Promise<LLMResult> {
  const systemPrompt = buildTranslateSystemPrompt(targetLanguage);
  return client.call(systemPrompt, text, options);
}

// ============================================================
// Reformulation
// ============================================================

/**
 * Reformulate text using the provider-agnostic LLMClient.
 * Temperature: 0.3 for 'keep' tone, 0.4 for all other tones.
 *
 * @param client - The active LLM client (Ollama or OpenAI)
 * @param text - The text to reformulate
 * @param tone - The tone style to apply
 * @param keepTerminology - Whether foreign words should be folded into the dominant language
 * @param options - Model name and optional temperature override
 * @returns LLMResult with reformulated text and metadata
 */
export async function reformulateText(
  client: LLMClient,
  text: string,
  tone: ReformulateTone,
  keepTerminology: boolean,
  options: LLMCallOptions,
): Promise<LLMResult> {
  const systemPrompt = buildReformulateSystemPrompt(tone, keepTerminology);
  return client.call(systemPrompt, text, options);
}

// ============================================================
// Summarization
// ============================================================

/**
 * Summarize text using the provider-agnostic LLMClient. The summary stays in
 * the input/detected language; `length` controls how short it is.
 *
 * @param client - The active LLM client (Ollama or OpenAI)
 * @param text - The text to summarize
 * @param length - The summary length ('brief' | 'standard' | 'detailed')
 * @param options - Model name and optional temperature override
 * @returns LLMResult with the summary and metadata
 */
export async function summarizeText(
  client: LLMClient,
  text: string,
  length: SummarizeLength,
  options: LLMCallOptions,
): Promise<LLMResult> {
  const systemPrompt = buildSummarizeSystemPrompt(length);
  return client.call(systemPrompt, text, options);
}
