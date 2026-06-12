// tests/unit/service-worker-message-auth.test.ts
// Trust-boundary regression tests for the service-worker runtime.onMessage
// listener: messages must come from this extension (matching chrome.runtime.id)
// or they are rejected before reaching the message handler.

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { installChromeMock, resetChromeMock } from '../mocks/chrome.ts';

// Mock the message handler so we can assert whether it is reached.
const handleMessageMock = vi.fn().mockResolvedValue({ success: true });
vi.mock('../../src/background/message-handler.ts', () => ({
  handleMessage: handleMessageMock,
}));
// Keep heavy modules out of the import graph.
vi.mock('../../src/background/tasks.ts', () => ({
  correctGrammar: vi.fn(),
  translateText: vi.fn(),
}));
vi.mock('../../src/background/ollama-client.ts', () => ({
  callOllama: vi.fn(),
  checkOllamaHealth: vi.fn(),
}));

const EXT_ID = 'ct-test-extension-id'; // matches the chrome mock's runtime.id

type MessageListener = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
) => boolean | undefined;

// Capture the onMessage listener registered when service-worker.ts is imported.
let messageListener: MessageListener;

beforeAll(async () => {
  installChromeMock();
  const g = globalThis as Record<string, unknown>;
  const c = g['chrome'] as Record<string, unknown>;
  const registered: MessageListener[] = [];
  c['runtime'] = {
    id: EXT_ID,
    onInstalled: { addListener: vi.fn() },
    onStartup: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn((fn: MessageListener) => registered.push(fn)) },
    sendMessage: vi.fn(),
    lastError: null,
  };
  await import('../../src/background/service-worker.ts');
  const fn = registered[0];
  if (!fn) throw new Error('service-worker did not register an onMessage listener');
  messageListener = fn;
});

beforeEach(() => {
  resetChromeMock();
  handleMessageMock.mockClear();
});

describe('service-worker onMessage sender authorization', () => {
  it('passes a message from this extension through to the handler', async () => {
    const sendResponse = vi.fn();
    const result = messageListener(
      { type: 'GET_SETTINGS' },
      { id: EXT_ID } as chrome.runtime.MessageSender,
      sendResponse,
    );
    expect(result).toBe(true); // keeps the channel open for the async response
    expect(handleMessageMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a message from a different extension without invoking the handler', () => {
    const sendResponse = vi.fn();
    const result = messageListener(
      { type: 'VALIDATE_OPENAI_KEY', payload: { key: 'sk-x', model: 'gpt-5-nano' } },
      { id: 'some-other-extension' } as chrome.runtime.MessageSender,
      sendResponse,
    );
    expect(result).toBe(false);
    expect(handleMessageMock).not.toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, errorCode: 'INVALID_MESSAGE' }),
    );
  });

  it('rejects a message with no sender id', () => {
    const sendResponse = vi.fn();
    const result = messageListener(
      { type: 'GET_SETTINGS' },
      {} as chrome.runtime.MessageSender,
      sendResponse,
    );
    expect(result).toBe(false);
    expect(handleMessageMock).not.toHaveBeenCalled();
  });
});
