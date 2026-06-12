// tests/unit/manifest.test.ts
// Security regression guard for the extension's permission surface (#44).
//
// The extension intentionally requests the broad `<all_urls>` host permission.
// This is NOT an oversight: the content script is injected on-demand (only on a
// context-menu click) via chrome.scripting.executeScript into the clicked
// frame, and webmail compose editors (e.g. GMX) host their editable area in a
// CROSS-ORIGIN iframe that `activeTab` alone cannot reach. `<all_urls>` is what
// enables that injection (see docs/architecture.md §3.2 / §3.4 and
// tests/e2e/iframe-injection.test.ts).
//
// Compensating controls (also asserted here):
//   - There are NO static `content_scripts` and NO `web_accessible_resources`;
//     injection is always programmatic and user-initiated.
//   - The `connect-src` CSP is the real egress lock: outbound requests can only
//     reach the extension itself, the local Ollama endpoint, and the OpenAI API,
//     regardless of the broad host permission.
//
// This test pins the exact permission set so that ANY future widening of the
// surface (a new permission, a broader host pattern, a looser CSP, or a newly
// added static content script / web-accessible resource) fails CI and gets a
// deliberate review rather than silently shipping.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  readFileSync(resolve(here, '../../public/manifest.json'), 'utf8'),
) as {
  manifest_version: number;
  permissions: string[];
  host_permissions: string[];
  content_security_policy?: { extension_pages?: string };
  content_scripts?: unknown[];
  web_accessible_resources?: unknown[];
};

describe('manifest permission surface (security regression guard)', () => {
  it('uses Manifest V3', () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it('declares exactly the expected API permissions (no more)', () => {
    expect([...manifest.permissions].sort()).toEqual(
      ['activeTab', 'clipboardWrite', 'contextMenus', 'scripting', 'storage'].sort(),
    );
  });

  it('uses <all_urls> host permission deliberately for cross-origin iframe injection', () => {
    // If this ever needs to change, update docs/architecture.md and revisit #44.
    expect(manifest.host_permissions).toEqual(['<all_urls>']);
  });

  it('locks network egress via connect-src to only Ollama and OpenAI', () => {
    const csp = manifest.content_security_policy?.extension_pages ?? '';
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain(
      "connect-src 'self' http://localhost:11434 https://api.openai.com",
    );
    // No wildcard egress.
    expect(csp).not.toContain('connect-src *');
    expect(csp).not.toMatch(/connect-src[^;]*\bhttps:\s/);
  });

  it('has no static content scripts (injection is always programmatic and user-initiated)', () => {
    expect(manifest.content_scripts ?? []).toEqual([]);
  });

  it('exposes no web-accessible resources', () => {
    expect(manifest.web_accessible_resources ?? []).toEqual([]);
  });
});
