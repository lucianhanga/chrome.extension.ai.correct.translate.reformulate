// tests/unit/prompts.test.ts
import { describe, it, expect } from 'vitest';
import {
  GRAMMAR_CORRECT_SYSTEM,
  buildTranslateSystemPrompt,
  buildReformulateSystemPrompt,
} from '../../src/shared/prompts.ts';

describe('GRAMMAR_CORRECT_SYSTEM', () => {
  it('is a non-empty string', () => {
    expect(typeof GRAMMAR_CORRECT_SYSTEM).toBe('string');
    expect(GRAMMAR_CORRECT_SYSTEM.length).toBeGreaterThan(0);
  });

  it('contains the clean-output constraint', () => {
    expect(GRAMMAR_CORRECT_SYSTEM).toContain('Output ONLY the corrected text');
    expect(GRAMMAR_CORRECT_SYSTEM).toContain('no explanations');
    expect(GRAMMAR_CORRECT_SYSTEM).toContain('no quotes');
    expect(GRAMMAR_CORRECT_SYSTEM).toContain('no markdown');
  });

  it('mentions Romanian diacritics', () => {
    expect(GRAMMAR_CORRECT_SYSTEM).toContain('ă');
    expect(GRAMMAR_CORRECT_SYSTEM).toContain('ș');
    expect(GRAMMAR_CORRECT_SYSTEM).toContain('ț');
  });

  it('instructs to preserve language', () => {
    expect(GRAMMAR_CORRECT_SYSTEM).toContain('do not translate');
  });

  it('instructs to detect the input language and respond in it (no English drift)', () => {
    // Regression guard: a Romanian (or any non-English) input must be corrected
    // in its own language, not silently translated to English.
    expect(GRAMMAR_CORRECT_SYSTEM).toContain('detect the language');
    expect(GRAMMAR_CORRECT_SYSTEM).toContain('same detected language');
    expect(GRAMMAR_CORRECT_SYSTEM).toMatch(/never translate .* into english/i);
  });

  it('handles empty input instruction', () => {
    expect(GRAMMAR_CORRECT_SYSTEM).toContain('empty');
  });
});

describe('buildTranslateSystemPrompt', () => {
  it('produces a prompt that mentions the target language', () => {
    const prompt = buildTranslateSystemPrompt('Romanian');
    expect(prompt).toContain('Romanian');
  });

  it('instructs to auto-detect source language', () => {
    const prompt = buildTranslateSystemPrompt('German');
    expect(prompt).toContain('Detect');
  });

  it('contains the clean-output constraint', () => {
    const prompt = buildTranslateSystemPrompt('English');
    expect(prompt).toContain('Output ONLY the translated text');
    expect(prompt).toContain('no explanations');
  });

  it('handles all supported target languages', () => {
    expect(buildTranslateSystemPrompt('English')).toContain('English');
    expect(buildTranslateSystemPrompt('German')).toContain('German');
    expect(buildTranslateSystemPrompt('Romanian')).toContain('Romanian');
    expect(buildTranslateSystemPrompt('Spanish')).toContain('Spanish');
  });

  it('instructs no-diacritics output only when the target is Romanian', () => {
    expect(buildTranslateSystemPrompt('Romanian')).toContain('WITHOUT diacritics');
    expect(buildTranslateSystemPrompt('English')).not.toContain('WITHOUT diacritics');
    expect(buildTranslateSystemPrompt('German')).not.toContain('WITHOUT diacritics');
    expect(buildTranslateSystemPrompt('Spanish')).not.toContain('WITHOUT diacritics');
  });
});

// ============================================================
// buildReformulateSystemPrompt
// ============================================================

describe('buildReformulateSystemPrompt', () => {
  it('returns a non-empty string for every tone', () => {
    for (const tone of ['keep', 'professional', 'friendly', 'natural'] as const) {
      const prompt = buildReformulateSystemPrompt(tone, true);
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    }
  });

  it('always includes the core reformulation constraints', () => {
    const prompt = buildReformulateSystemPrompt('keep', true);
    // Core: preserve language
    expect(prompt).toContain('preserve the original language');
    // Core: preserve meaning
    expect(prompt).toContain('preserve the original meaning');
    // Core: output only
    expect(prompt).toContain('Output ONLY the reformulated text');
  });

  it('instructs to detect the input language and respond in it for every tone', () => {
    // Regression guard for the bug where Romanian text reformulated to English.
    // Every tone shares REFORMULATE_CORE, so the instruction must be present in all.
    for (const tone of ['keep', 'professional', 'friendly', 'natural'] as const) {
      const prompt = buildReformulateSystemPrompt(tone, true);
      expect(prompt).toContain('detect the language');
      expect(prompt).toContain('same detected language');
      expect(prompt).toMatch(/never translate .* into english/i);
    }
  });

  it('locks the output language to the input language for every tone (no translation)', () => {
    // Regression guard for the inverse bug: English text reformulated with the
    // "professional" tone drifted into Romanian. The language lock must be
    // present for all tones and must state that tone changes never change the
    // language.
    for (const tone of ['keep', 'professional', 'friendly', 'natural'] as const) {
      const prompt = buildReformulateSystemPrompt(tone, true);
      expect(prompt).toContain('output language is locked to the language of the input');
      expect(prompt).toMatch(/NEVER means changing its language/);
      expect(prompt).toContain('overrides every tone');
    }
  });

  it('enumerates every supported language in the language lock', () => {
    const prompt = buildReformulateSystemPrompt('professional', true);
    for (const lang of ['English', 'German', 'Romanian', 'Spanish']) {
      expect(prompt).toContain(`the output is ${lang}`);
    }
  });

  it('places the language lock after the tone block so it is the final instruction', () => {
    // The lock is only effective if the model reads it last, after the tone
    // instruction that biases language switching.
    const prompt = buildReformulateSystemPrompt('professional', true);
    const toneIdx = prompt.indexOf('professional, formal, and official');
    const lockIdx = prompt.indexOf('output language is locked to the language of the input');
    expect(toneIdx).toBeGreaterThan(-1);
    expect(lockIdx).toBeGreaterThan(toneIdx);
  });

  it('keep tone prompt instructs minimal deviation from original phrasing', () => {
    const prompt = buildReformulateSystemPrompt('keep', true);
    expect(prompt).toContain('same tone and register');
    expect(prompt).toContain('Deviate as little as possible');
  });

  it('professional tone prompt instructs formal and official language', () => {
    const prompt = buildReformulateSystemPrompt('professional', true);
    expect(prompt).toContain('professional, formal, and official');
    expect(prompt).toContain('business correspondence');
  });

  it('friendly tone prompt instructs warm and approachable language', () => {
    const prompt = buildReformulateSystemPrompt('friendly', true);
    expect(prompt).toContain('warm, friendly, and approachable');
  });

  it('natural tone prompt instructs native-speaker fluency', () => {
    const prompt = buildReformulateSystemPrompt('natural', true);
    expect(prompt).toContain('native speaker');
    expect(prompt).toContain('idiomatic');
  });

  it('includes terminology-keep clause when keepTerminology is true', () => {
    const prompt = buildReformulateSystemPrompt('keep', true);
    expect(prompt).toContain('dominant language');
    expect(prompt).toContain('domain-specific term');
  });

  it('includes terminology-free clause when keepTerminology is false', () => {
    const prompt = buildReformulateSystemPrompt('keep', false);
    expect(prompt).toContain('dominant language of the text');
    // The keep-terminology specific clause should not be present.
    expect(prompt).not.toContain('domain-specific term');
  });

  it('produces different prompts for different tones', () => {
    const keep = buildReformulateSystemPrompt('keep', true);
    const professional = buildReformulateSystemPrompt('professional', true);
    const friendly = buildReformulateSystemPrompt('friendly', true);
    const natural = buildReformulateSystemPrompt('natural', true);
    const all = [keep, professional, friendly, natural];
    const unique = new Set(all);
    expect(unique.size).toBe(4);
  });

  it('produces different prompts for keepTerminology true vs false', () => {
    const withKeep = buildReformulateSystemPrompt('professional', true);
    const withoutKeep = buildReformulateSystemPrompt('professional', false);
    expect(withKeep).not.toBe(withoutKeep);
  });
});
