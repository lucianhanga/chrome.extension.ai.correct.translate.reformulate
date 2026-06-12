// tests/unit/overlay-a11y.test.tsx
// DOM tests for the overlay's accessible-dialog semantics and error severity
// rendering. The overlay lives in a CLOSED shadow root, so we capture the
// shadow root by spying on attachShadow (forcing open mode for inspection only;
// the overlay holds its own reference regardless of mode).

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { COLORS } from '../../src/shared/constants.ts';

let captured: ShadowRoot | null = null;
const originalAttachShadow = Element.prototype.attachShadow;

beforeEach(() => {
  captured = null;
  vi.spyOn(Element.prototype, 'attachShadow').mockImplementation(function (
    this: Element,
    init: ShadowRootInit,
  ): ShadowRoot {
    const sr = originalAttachShadow.call(this, { ...init, mode: 'open' });
    captured = sr;
    return sr;
  });
});

afterEach(async () => {
  const { dismissOverlay } = await import('../../src/content/overlay.ts');
  dismissOverlay();
  vi.restoreAllMocks();
});

function overlayEl(): HTMLElement {
  expect(captured).not.toBeNull();
  const el = captured!.querySelector('.ct-overlay');
  expect(el).not.toBeNull();
  return el as HTMLElement;
}

describe('overlay accessible-dialog semantics', () => {
  it('marks the overlay as a labelled modal dialog', async () => {
    const { showLoading } = await import('../../src/content/overlay.ts');
    showLoading('correct', 'hello');

    const overlay = overlayEl();
    expect(overlay.getAttribute('role')).toBe('dialog');
    expect(overlay.getAttribute('aria-modal')).toBe('true');

    const labelledby = overlay.getAttribute('aria-labelledby');
    expect(labelledby).toBeTruthy();
    const title = captured!.querySelector(`#${labelledby}`);
    expect(title).not.toBeNull();
    expect(title?.classList.contains('ct-overlay-title')).toBe(true);
  });

  it('announces the loading state via a polite live region', async () => {
    const { showLoading } = await import('../../src/content/overlay.ts');
    showLoading('translate', 'hello');

    const loading = captured!.querySelector('.ct-overlay-loading') as HTMLElement;
    expect(loading.getAttribute('role')).toBe('status');
    expect(loading.getAttribute('aria-live')).toBe('polite');
  });

  it('announces the result via a polite live region', async () => {
    const { showResult } = await import('../../src/content/overlay.ts');
    showResult(
      {
        action: 'correct',
        originalText: 'teh cat',
        resultText: 'the cat',
        editable: false,
      },
      { onReplace: vi.fn(), onAppend: vi.fn(), onReject: vi.fn() },
    );

    const result = captured!.querySelector('.ct-overlay-result') as HTMLElement;
    expect(result.getAttribute('role')).toBe('status');
    expect(result.getAttribute('aria-live')).toBe('polite');
    expect(overlayEl().getAttribute('role')).toBe('dialog');
  });
});

describe('overlay error severity rendering', () => {
  it('renders a failure error in red (icon background + message class)', async () => {
    const { showError } = await import('../../src/content/overlay.ts');
    showError({ errorCode: 'OLLAMA_UNREACHABLE', errorMessage: 'Cannot reach Ollama.' });

    const errorBox = captured!.querySelector('.ct-overlay-error') as HTMLElement;
    expect(errorBox.getAttribute('role')).toBe('alert');

    const icon = captured!.querySelector('.ct-error-icon') as HTMLElement;
    expect(icon.style.background).toBeTruthy();

    const msg = captured!.querySelector('.ct-error-message') as HTMLElement;
    expect(msg.classList.contains('ct-error-message--red')).toBe(true);
  });

  it('does NOT mark a warning error as red', async () => {
    const { showError } = await import('../../src/content/overlay.ts');
    showError({ errorCode: 'REQUEST_TIMEOUT', errorMessage: 'Timed out.' });

    const msg = captured!.querySelector('.ct-error-message') as HTMLElement;
    expect(msg.classList.contains('ct-error-message--red')).toBe(false);
    // Sanity: warning is the non-failure severity.
    expect(COLORS.WARNING).not.toBe(COLORS.FAILURE);
  });
});
