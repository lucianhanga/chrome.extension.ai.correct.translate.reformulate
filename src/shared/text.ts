// src/shared/text.ts
// Small, dependency-free text helpers shared across extension contexts.

// Map of Romanian diacritic characters to their plain-ASCII equivalents,
// covering both the comma-below standard (ș, ț) and the cedilla variants
// (ş, ţ) that some sources emit, plus uppercase forms.
const ROMANIAN_DIACRITIC_MAP: Record<string, string> = {
  ă: 'a', Ă: 'A',
  â: 'a', Â: 'A',
  î: 'i', Î: 'I',
  ș: 's', Ș: 'S', // comma-below
  ş: 's', Ş: 'S', // cedilla variant
  ț: 't', Ț: 'T', // comma-below
  ţ: 't', Ţ: 'T', // cedilla variant
};

const ROMANIAN_DIACRITIC_RE = new RegExp(
  `[${Object.keys(ROMANIAN_DIACRITIC_MAP).join('')}]`,
  'g',
);

/**
 * Replace Romanian diacritics with their plain-ASCII equivalents
 * (ă/â -> a, î -> i, ș/ş -> s, ț/ţ -> t, and uppercase forms). Any other
 * character, including non-Romanian diacritics, is left untouched.
 *
 * @param text - Input text.
 * @returns The text with Romanian diacritics stripped.
 */
export function stripRomanianDiacritics(text: string): string {
  return text.replace(ROMANIAN_DIACRITIC_RE, (ch) => ROMANIAN_DIACRITIC_MAP[ch] ?? ch);
}
