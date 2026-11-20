import { describe, it, expect } from 'vitest';
import { slugify, transliterate, validateSlug, STOP_WORDS, generateSlugs } from '../../src/tool/slugify';
import type { ToolState } from '../../src/tool/types';

const base = {
  separator: '-' as const,
  transliterate: true,
  removeStopWords: false,
  maxLength: 0,
};

describe('slugify basics', () => {
  it('lowercases and replaces whitespace with the chosen separator', () => {
    expect(slugify('Hello World', base)).toBe('hello-world');
    expect(slugify('Hello   World', { ...base, separator: '_' })).toBe('hello_world');
    expect(slugify('Hello World', { ...base, separator: '.' })).toBe('hello.world');
  });

  it('strips punctuation and collapses runs of separators', () => {
    expect(slugify('Hello, World!!', base)).toBe('hello-world');
    expect(slugify('A  --  B — C', base)).toBe('a-b-c');
    expect(slugify("Don't stop", base)).toBe('dont-stop');
  });

  it('trims separators from both ends', () => {
    expect(slugify('  hello world  ', base)).toBe('hello-world');
    expect(slugify('!!!hello world???', base)).toBe('hello-world');
  });

  it('returns an empty slug for empty or punctuation-only input', () => {
    expect(slugify('', base)).toBe('');
    expect(slugify('   ', base)).toBe('');
    expect(slugify('***', base)).toBe('');
  });
});

describe('transliteration', () => {
  it('transliterates accented characters', () => {
    expect(slugify('café', base)).toBe('cafe');
    expect(slugify('Café', base)).toBe('cafe');
  });

  it('expands German umlauts and eszett', () => {
    expect(slugify('Müller', base)).toBe('mueller');
    expect(slugify('Ärger', base)).toBe('aerger');
    expect(slugify('Straße', base)).toBe('strasse');
    expect(slugify('Öl Übel', base)).toBe('oel-uebel');
  });

  it('handles uppercase umlauts preserving case', () => {
    expect(transliterate('Ü')).toBe('Ue');
    expect(transliterate('Ö')).toBe('Oe');
  });

  it('can be disabled, keeping the original characters', () => {
    expect(slugify('café', { ...base, transliterate: false })).toBe('café');
  });

  it('strips combining diacritics via NFD fallback', () => {
    expect(transliterate('e\u0301')).toBe('e');
  });
});

describe('stop-word removal', () => {
  it('removes common English stop words', () => {
    expect(slugify('The Quick Brown Fox', { ...base, removeStopWords: true })).toBe(
      'quick-brown-fox'
    );
    expect(slugify('A tale of two cities', { ...base, removeStopWords: true })).toBe(
      'tale-two-cities'
    );
  });

  it('keeps stop words when disabled', () => {
    expect(slugify('The Quick Brown Fox', base)).toBe('the-quick-brown-fox');
  });

  it('leaves no trailing separator when the last word is a stop word', () => {
    expect(slugify('State of', { ...base, removeStopWords: true })).toBe('state');
    expect(slugify('The', { ...base, removeStopWords: true })).toBe('');
  });

  it('defines the required stop words', () => {
    for (const w of ['the', 'a', 'an', 'of', 'and']) {
      expect(STOP_WORDS.has(w)).toBe(true);
    }
  });
});

describe('max-length truncation', () => {
  it('truncates at word boundaries without a trailing separator', () => {
    const slug = slugify('The quick brown fox jumps', { ...base, maxLength: 15 });
    expect(slug.length).toBeLessThanOrEqual(15);
    expect(slug.endsWith('-')).toBe(false);
    expect(slug).toBe('the-quick');

    const long = slugify('one two three four five', { ...base, maxLength: 10 });
    expect(long).toBe('one-two');
    expect(long.endsWith('-')).toBe(false);
  });

  it('falls back to hard cut when there is no inner separator', () => {
    expect(slugify('supercalifragilistic', { ...base, maxLength: 10 })).toBe('supercalif');
  });

  it('does not truncate when maxLength is 0 (unlimited)', () => {
    const slug = slugify('the quick brown fox', base);
    expect(slug).toBe('the-quick-brown-fox');
  });
});

describe('batch mode', () => {
  it('produces one slug per input line', () => {
    const state: ToolState = {
      ...base,
      input: 'Hello World\nCafé Müller\nThird line here',
      batchMode: true,
      output: '',
    };
    expect(generateSlugs(state)).toBe('hello-world\ncafe-mueller\nthird-line-here');
  });

  it('keeps empty lines empty in batch output', () => {
    const state: ToolState = {
      ...base,
      input: 'First\n\nSecond',
      batchMode: true,
      output: '',
    };
    expect(generateSlugs(state)).toBe('first\n\nsecond');
  });
});

describe('validateSlug', () => {
  it('accepts a well-formed slug', () => {
    expect(validateSlug('hello-world_1.title')).toEqual({ valid: true, errors: [] });
  });

  it('rejects slugs with uppercase or whitespace characters', () => {
    expect(validateSlug('Hello')).toEqual({
      valid: false,
      errors: ['Slug contains uppercase characters'],
    });
    expect(validateSlug('hello world')).toEqual({
      valid: false,
      errors: ['Slug contains whitespace'],
    });
  });

  it('rejects empty slugs, doubled and edge separators', () => {
    expect(validateSlug('').errors).toContain('Slug is empty');
    expect(validateSlug('hello--world').errors).toContain('Slug contains repeated separators');
    expect(validateSlug('-hello-').errors).toContain('Slug starts or ends with a separator');
  });
});
