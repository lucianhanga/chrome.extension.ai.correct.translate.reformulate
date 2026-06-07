// tests/unit/text.test.ts
import { describe, it, expect } from 'vitest';
import { stripRomanianDiacritics } from '../../src/shared/text.ts';

describe('stripRomanianDiacritics', () => {
  it('maps every Romanian diacritic to its ASCII equivalent', () => {
    expect(stripRomanianDiacritics('ă â î ș ț')).toBe('a a i s t');
    expect(stripRomanianDiacritics('Ă Â Î Ș Ț')).toBe('A A I S T');
  });

  it('also handles the cedilla variants (ş, ţ)', () => {
    expect(stripRomanianDiacritics('ş ţ Ş Ţ')).toBe('s t S T');
  });

  it('strips diacritics from a real sentence while preserving the rest', () => {
    expect(stripRomanianDiacritics('Soarele strălucește astăzi.')).toBe(
      'Soarele straluceste astazi.',
    );
  });

  it('is a no-op for text without Romanian diacritics', () => {
    expect(stripRomanianDiacritics('The sun is shining.')).toBe('The sun is shining.');
    expect(stripRomanianDiacritics('')).toBe('');
  });

  it('leaves non-Romanian diacritics untouched', () => {
    // Spanish ñ/á and German ö are not Romanian diacritics.
    expect(stripRomanianDiacritics('El niño está aquí.')).toBe('El niño está aquí.');
    expect(stripRomanianDiacritics('schön')).toBe('schön');
  });
});
