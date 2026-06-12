// tests/unit/tasks.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { GRAMMAR_CORRECT_SYSTEM, buildTranslateSystemPrompt, buildReformulateSystemPrompt } from '../../src/shared/prompts.ts';
import type { LLMResult } from '../../src/shared/types.ts';
import type { LLMClient } from '../../src/background/llm-client.ts';

// A fresh mock LLMClient wrapping the given call spy. All four tasks now go
// through the provider-agnostic LLMClient.call(), so the tests assert on that.
function mockClient(callMock: ReturnType<typeof vi.fn>): LLMClient {
  return { call: callMock, healthCheck: vi.fn() } as unknown as LLMClient;
}

// Build an LLMResult fixture; client.call resolves to this shape.
function llmResult(text: string, overrides: Partial<LLMResult> = {}): LLMResult {
  return { text, model: 'qwen3:14b', totalTokens: 100, elapsedMs: 1200, ...overrides };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('correctGrammar', () => {
  it('calls client.call with the grammar correction system prompt', async () => {
    const { correctGrammar } = await import('../../src/background/tasks.ts');
    const callMock = vi.fn().mockResolvedValue(llmResult('Corrected text.'));

    const result = await correctGrammar(mockClient(callMock), 'She dont know nothing.', {
      model: 'qwen3:14b',
      temperature: 0.2,
    });
    expect(result.text).toBe('Corrected text.');
    expect(callMock).toHaveBeenCalledWith(
      GRAMMAR_CORRECT_SYSTEM,
      'She dont know nothing.',
      { model: 'qwen3:14b', temperature: 0.2 },
    );
  });

  it('passes the options through to client.call (any provider)', async () => {
    const { correctGrammar } = await import('../../src/background/tasks.ts');
    const callMock = vi.fn().mockResolvedValue(llmResult('ok'));

    await correctGrammar(mockClient(callMock), 'text', { model: 'gpt-5-nano', temperature: 0.2 });
    expect(callMock).toHaveBeenCalledWith(
      GRAMMAR_CORRECT_SYSTEM,
      'text',
      { model: 'gpt-5-nano', temperature: 0.2 },
    );
  });

  it('propagates errors from the client', async () => {
    const { correctGrammar } = await import('../../src/background/tasks.ts');
    const callMock = vi.fn().mockRejectedValue(new Error('Ollama unreachable: network error'));

    await expect(
      correctGrammar(mockClient(callMock), 'text', { model: 'qwen3:14b' }),
    ).rejects.toThrow('Ollama unreachable');
  });
});

describe('translateText', () => {
  it('uses the auto-detect translate prompt', async () => {
    const { translateText } = await import('../../src/background/tasks.ts');
    const callMock = vi.fn().mockResolvedValue(llmResult('Translated text.'));

    await translateText(mockClient(callMock), 'Hello', 'Romanian', { model: 'qwen3:14b', temperature: 0.2 });
    expect(callMock).toHaveBeenCalledWith(
      buildTranslateSystemPrompt('Romanian'),
      'Hello',
      { model: 'qwen3:14b', temperature: 0.2 },
    );
  });

  it('builds the right prompt for every supported target language', async () => {
    const { translateText } = await import('../../src/background/tasks.ts');

    for (const lang of [
      'English', 'German', 'Romanian', 'Romanian (no diacritics)', 'Spanish', 'Italian',
    ] as const) {
      const callMock = vi.fn().mockResolvedValue(llmResult('ok'));
      await translateText(mockClient(callMock), 'text', lang, { model: 'qwen3:14b' });
      expect(callMock).toHaveBeenCalledWith(
        buildTranslateSystemPrompt(lang),
        'text',
        expect.any(Object),
      );
    }
  });

  it('returns an LLMResult carrying the translated text and metadata', async () => {
    const { translateText } = await import('../../src/background/tasks.ts');
    const callMock = vi.fn().mockResolvedValue(
      llmResult('Soarele straluceste.', { model: 'qwen3:14b', totalTokens: 64, elapsedMs: 900 }),
    );

    const result = await translateText(mockClient(callMock), 'The sun is shining.', 'Romanian', {
      model: 'qwen3:14b',
    });
    expect(result.text).toBe('Soarele straluceste.');
    expect(result.model).toBe('qwen3:14b');
    expect(result.totalTokens).toBe(64);
    expect(result.elapsedMs).toBe(900);
  });
});

// ============================================================
// reformulateText
// ============================================================

describe('reformulateText', () => {
  it('calls client.call with the correct system prompt for the given tone', async () => {
    const { reformulateText } = await import('../../src/background/tasks.ts');

    const callMock = vi.fn().mockResolvedValue(llmResult('Reformulated text.'));
    const client = { call: callMock, healthCheck: vi.fn() };

    await reformulateText(client, 'Original text.', 'professional', true, {
      model: 'qwen3:14b',
      temperature: 0.4,
    });

    const expectedPrompt = buildReformulateSystemPrompt('professional', true);
    expect(callMock).toHaveBeenCalledWith(expectedPrompt, 'Original text.', {
      model: 'qwen3:14b',
      temperature: 0.4,
    });
  });

  it('produces different prompts for each tone', async () => {
    const { reformulateText } = await import('../../src/background/tasks.ts');

    const prompts: string[] = [];
    for (const tone of ['keep', 'professional', 'friendly', 'natural'] as const) {
      const callMock = vi.fn().mockResolvedValue(llmResult('ok'));
      const client = { call: callMock, healthCheck: vi.fn() };
      await reformulateText(client, 'text', tone, true, { model: 'qwen3:14b' });
      const receivedPrompt = callMock.mock.calls[0]![0] as string;
      prompts.push(receivedPrompt);
    }

    // All four prompts should be distinct.
    const uniquePrompts = new Set(prompts);
    expect(uniquePrompts.size).toBe(4);
  });

  it('produces different prompts for keepTerminology true vs false', async () => {
    const { reformulateText } = await import('../../src/background/tasks.ts');

    const callMockTrue = vi.fn().mockResolvedValue(llmResult('ok'));
    await reformulateText(
      { call: callMockTrue, healthCheck: vi.fn() },
      'text', 'keep', true, { model: 'qwen3:14b' },
    );

    const callMockFalse = vi.fn().mockResolvedValue(llmResult('ok'));
    await reformulateText(
      { call: callMockFalse, healthCheck: vi.fn() },
      'text', 'keep', false, { model: 'qwen3:14b' },
    );

    const promptWithKeep = callMockTrue.mock.calls[0]![0] as string;
    const promptWithoutKeep = callMockFalse.mock.calls[0]![0] as string;
    expect(promptWithKeep).not.toBe(promptWithoutKeep);
  });

  it('returns an LLMResult from the client', async () => {
    const { reformulateText } = await import('../../src/background/tasks.ts');

    const callMock = vi.fn().mockResolvedValue(
      llmResult('Reformulated.', { model: 'gpt-5-nano', totalTokens: 55, elapsedMs: 800 }),
    );
    const result = await reformulateText(
      { call: callMock, healthCheck: vi.fn() },
      'text', 'friendly', false, { model: 'gpt-5-nano', temperature: 0.4 },
    );

    expect(result.text).toBe('Reformulated.');
    expect(result.model).toBe('gpt-5-nano');
    expect(result.totalTokens).toBe(55);
    expect(result.elapsedMs).toBe(800);
  });
});
