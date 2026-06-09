// tests/e2e/summarize.test.ts
// End-to-end tests for the Summarize feature.
//
// What is covered:
//   - Popup: Summarize button enabled/disabled states.
//   - Popup: clicking Summarize shows a non-empty result after a real Ollama call.
//   - SUMMARIZE message validation: valid payload -> success; invalid length,
//     empty text, and over-length text -> the matching error codes.
//
// Real-model tests use a 120 s timeout to absorb warm inference latency.

import { test, expect } from './fixtures/extension-fixture';

test.describe('Popup: Summarize -- Quick Action', () => {
  test('Summarize button is disabled when textarea is empty', async ({ openPopup }) => {
    const popup = await openPopup();
    await expect(popup.getByRole('button', { name: /^Summarize$/i })).toBeDisabled();
  });

  test('Summarize button is enabled when textarea has text', async ({ openPopup }) => {
    const popup = await openPopup();
    await popup.locator('textarea').fill('Some text to summarize.');
    await expect(popup.getByRole('button', { name: /^Summarize$/i })).toBeEnabled();
  });

  test('clicking Summarize shows a non-empty result after a real Ollama call', async ({ openPopup }) => {
    const popup = await openPopup();
    await popup.locator('textarea').fill(
      'The meeting covered the quarterly budget, the new hiring plan, and the timeline ' +
      'for the product launch. Everyone agreed to reconvene next week to finalize the details.',
    );

    // Select the Brief length so the summary has clear work to do.
    const lengthSelect = popup
      .locator('select')
      .filter({ has: popup.locator('option[value="brief"]') });
    await lengthSelect.selectOption('brief');

    await popup.getByRole('button', { name: /^Summarize$/i }).click();

    const resultContainer = popup.locator('[data-testid="result-text"]');
    await resultContainer.waitFor({ state: 'visible', timeout: 120_000 });
    const resultText = (await resultContainer.textContent()) ?? '';
    expect(resultText.trim().length).toBeGreaterThan(0);
  });
});

test.describe('SUMMARIZE message validation', () => {
  test('SUMMARIZE with valid payload returns a success response', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForSelector('h1', { timeout: 8_000 });

    const response = await page.evaluate(async () => {
      return chrome.runtime.sendMessage({
        type: 'SUMMARIZE',
        payload: {
          text: 'The cat sat on the mat. It was warm and sunny. The cat was happy.',
          length: 'brief',
        },
      });
    });

    expect((response as Record<string, unknown>).success).toBe(true);
    expect(typeof (response as Record<string, unknown>).result).toBe('string');
  });

  test('SUMMARIZE with invalid length returns INVALID_MESSAGE error', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForSelector('h1', { timeout: 8_000 });

    const response = await page.evaluate(async () => {
      return chrome.runtime.sendMessage({
        type: 'SUMMARIZE',
        payload: { text: 'Hello world.', length: 'gigantic' },
      });
    });

    expect((response as Record<string, unknown>).success).toBe(false);
    expect((response as Record<string, unknown>).errorCode).toBe('INVALID_MESSAGE');
  });

  test('SUMMARIZE with empty text returns EMPTY_INPUT error', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForSelector('h1', { timeout: 8_000 });

    const response = await page.evaluate(async () => {
      return chrome.runtime.sendMessage({
        type: 'SUMMARIZE',
        payload: { text: '   ', length: 'standard' },
      });
    });

    expect((response as Record<string, unknown>).success).toBe(false);
    expect((response as Record<string, unknown>).errorCode).toBe('EMPTY_INPUT');
  });

  test('SUMMARIZE with text over 10,000 characters returns INPUT_TOO_LONG error', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForSelector('h1', { timeout: 8_000 });

    const response = await page.evaluate(async () => {
      return chrome.runtime.sendMessage({
        type: 'SUMMARIZE',
        payload: { text: 'x'.repeat(10_001), length: 'standard' },
      });
    });

    expect((response as Record<string, unknown>).success).toBe(false);
    expect((response as Record<string, unknown>).errorCode).toBe('INPUT_TOO_LONG');
  });
});
