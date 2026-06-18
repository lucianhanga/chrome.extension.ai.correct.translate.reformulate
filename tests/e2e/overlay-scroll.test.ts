// tests/e2e/overlay-scroll.test.ts
// Regression test for the overlay scroll-jump bug.
//
// Bug (observed in a GMX compose window with several screens of text):
//   Selecting a sentence near the TOP of a long, scrollable page and triggering
//   an action scrolled the page to the very BOTTOM and the overlay never
//   appeared. Selecting at the bottom worked fine.
//
// Root cause:
//   showLoading() captured the selection's position, then appended the overlay
//   host <div> to the end of <body> as a normal-flow (static) element and
//   focused a control inside it BEFORE positionOverlay() made the host
//   position:fixed. Focusing that in-flow element -- which sat below all the
//   page content -- scrolled the page to the bottom. positionOverlay() then
//   computed `top = pos.top - window.scrollY` using the new (large) scrollY,
//   producing a large negative top that placed the fixed overlay off-screen.
//   Selecting at the bottom worked because there was nothing below to scroll to.
//
// Fix:
//   The host is set position:fixed the moment it is created (never in normal
//   flow), and all internal focus() calls pass { preventScroll: true }.
//
// This test reproduces the conditions without Ollama: it builds a tall,
// scrollable page, selects text at the top, injects SHOW_LOADING via the
// service worker, then asserts (a) the page did NOT scroll away from the top
// and (b) the overlay host landed inside the viewport.

import { test, expect } from './fixtures/extension-fixture';

// Wait for the content script to register its message listener (ISOLATED world).
async function waitForContentScript(
  sw: import('@playwright/test').Worker,
  tabId: number,
): Promise<void> {
  for (let i = 0; i < 25; i++) {
    const registered = await sw.evaluate(async (tid: number) => {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tid },
        func: () =>
          (window as unknown as Record<string, boolean>)['__ct_content_registered__'] === true,
      });
      return results[0]?.result === true;
    }, tabId);
    if (registered) return;
    await new Promise<void>((r) => setTimeout(r, 200));
  }
  throw new Error('[overlay-scroll-test] Content script did not register within 5 s.');
}

async function sendMessageToPage(
  serviceWorker: import('@playwright/test').Worker,
  tabId: number,
  message: Record<string, unknown>,
): Promise<void> {
  await serviceWorker.evaluate(
    ({ tabId, message }: { tabId: number; message: Record<string, unknown> }) => {
      return chrome.tabs.sendMessage(tabId, message);
    },
    { tabId, message },
  );
}

test.describe('Overlay: no scroll-jump on a tall page', () => {
  test('selection near the top: page does not scroll and the overlay stays in view', async ({ context, testServerBaseUrl }) => {
    const page = await context.newPage();
    await page.goto(`${testServerBaseUrl}/test-page.html`);

    const sw = context.serviceWorkers().find((w) => w.url().includes('service-worker.js'));
    if (!sw) throw new Error('Service worker not found');

    const realTabId = await sw.evaluate(async (): Promise<number> => {
      const tabs = await chrome.tabs.query({ active: true });
      return tabs[0]?.id ?? -1;
    });

    await sw.evaluate(async (tid: number) => {
      await chrome.scripting.executeScript({ target: { tabId: tid }, files: ['content.js'] });
    }, realTabId);

    await waitForContentScript(sw, realTabId);

    // Make the page much taller than the viewport, select text at the very top,
    // and pin the scroll position to the top. The tall spacer guarantees the
    // overlay host (appended to the end of <body>) sits far below the fold --
    // the exact condition that triggered the scroll-jump before the fix.
    const setup = await page.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.style.height = '4000px';
      spacer.setAttribute('data-test-spacer', '');
      document.body.appendChild(spacer);

      const heading = document.querySelector('h2');
      if (!heading) throw new Error('heading not found');
      const range = document.createRange();
      range.selectNodeContents(heading);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);

      window.scrollTo(0, 0);
      return { scrollHeight: document.documentElement.scrollHeight, innerHeight: window.innerHeight };
    });

    // Precondition: the page really is scrollable well past one viewport.
    expect(setup.scrollHeight).toBeGreaterThan(setup.innerHeight * 2);

    await sendMessageToPage(sw, realTabId, {
      type: 'SHOW_LOADING',
      payload: { action: 'translate', originalText: 'Test Page for Correct & Translate Extension' },
    });

    await page.waitForFunction(
      () => document.querySelector('[data-ct-overlay-host]') !== null,
      undefined,
      { timeout: 5_000 },
    );

    const result = await page.evaluate(() => {
      const host = document.querySelector('[data-ct-overlay-host]') as HTMLElement | null;
      const rect = host?.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        hostTop: rect?.top ?? null,
        hostBottom: rect?.bottom ?? null,
        innerHeight: window.innerHeight,
      };
    });

    // The page must NOT have jumped down to reveal the host element.
    expect(result.scrollY).toBeLessThan(50);

    // The overlay must be inside the viewport, not pushed off the top by a
    // negative `top`.
    expect(result.hostTop).not.toBeNull();
    expect(result.hostTop!).toBeGreaterThanOrEqual(0);
    expect(result.hostTop!).toBeLessThan(result.innerHeight);
  });
});
