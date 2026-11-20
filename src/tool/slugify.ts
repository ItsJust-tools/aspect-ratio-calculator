import type { ToolState } from './types';

/** Common English stop words removed in stop-word mode. */
export const STOP_WORDS: ReadonlySet<string> = new Set([
  'a',
  'an',
  'and',
  'the',
  'of',
  'or',
  'but',
  'is',
  'are',
  'to',
  'in',
  'on',
  'at',
  'for',
  'with',
]);


/** Normalize Unicode to ASCII: é -> e, and combined diacritics removed. */
function stripDiacritics(text: string): string {
  // NFD splits accented chars into base + combining mark; marks are then dropped.
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Transliterate accented characters.
 * German-style digraphs (ä -> ae, ö -> oe, ü -> ue, ß -> ss) apply first when
 * enabled; everything else falls back to diacritic stripping.
 */
export function transliterate(text: string): string {
  let result = '';
  for (const ch of text) {
    if (ch === 'ß') {
      result += 'ss';
      continue;
    }
    const lower = ch.toLowerCase();
    if (lower === 'ä') {
      result += ch === 'Ä' ? 'Ae' : 'ae';
      continue;
    }
    if (lower === 'ö') {
      result += ch === 'Ö' ? 'Oe' : 'oe';
      continue;
    }
    if (lower === 'ü') {
      result += ch === 'Ü' ? 'Ue' : 'ue';
      continue;
    }
    result += ch;
  }
  return stripDiacritics(result);
}

/** Remove punctuation that has no meaning inside a URL slug. */
function stripPunctuation(text: string): string {
  // Replace em/en dashes with a space so they act as word boundaries, then
  // drop anything that is not a word character, space or apostrophe.
  return text
    .replace(/[\u2013\u2014\u2012]/g, ' ')
    .replace(/['\u2019]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '');
}

function truncateAtWordBoundary(slug: string, separator: string, maxLength: number): string {
  if (maxLength <= 0 || slug.length <= maxLength) return slug;

  const cut = slug.slice(0, maxLength);
  // Prefer cutting on the last separator inside the window.
  const lastSep = cut.lastIndexOf(separator);
  if (lastSep > 0) {
    const candidate = cut.slice(0, lastSep);
    if (candidate.length > 0) return candidate;
  }
  // Fall back to a hard cut without a trailing separator.
  return cut.replace(new RegExp(`${escapeRegExp(separator)}+$`), '');
}

function escapeRegExp(v: string): string {
  return v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Convert a single line of text into a URL-safe slug. */
export function slugify(
  text: string,
  options: Pick<ToolState, 'separator' | 'transliterate' | 'removeStopWords' | 'maxLength'>
): string {
  const separator = options.separator;
  let working = text ?? '';

  if (options.transliterate) {
    working = transliterate(working);
  }

  working = stripPunctuation(working);

  // Split into words on any whitespace/separator run and lowercase them.
  let words = working
    .split(/[\s_-]+/u)
    .map((w) => w.trim())
    .filter(Boolean);
  // Split remaining intra-word separators like dots.
  words = words.flatMap((w) => (w.includes('.') ? w.split('.') : [w])).filter(Boolean);
  words = words.map((w) => w.toLowerCase());

  if (options.removeStopWords) {
    words = words.filter((w) => !STOP_WORDS.has(w));
  }

  let slug = words.join(separator);

  // Collapse repeated separators that may have survived punctuation stripping.
  slug = slug.replace(new RegExp(`${escapeRegExp(separator)}{2,}`, 'g'), separator);
  slug = slug.replace(new RegExp(`^${escapeRegExp(separator)}+|${escapeRegExp(separator)}+$`, 'g'), '');

  return truncateAtWordBoundary(slug, separator, options.maxLength);
}

/** Convert full input (single or batch mode) into the slug output. */
export function generateSlugs(state: ToolState): string {
  if (state.batchMode) {
    return state.input
      .split('\n')
      .map((line) => slugify(line, state))
      .join('\n');
  }
  return slugify(state.input.replace(/\r?\n/g, ' '), state);
}

export interface SlugValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Check a slug against common URL rules:
 * lowercase, no spaces, ASCII, safe characters only, no leading/trailing
 * separators, no doubled separators, non-empty and sane length.
 */
export function validateSlug(slug: string): SlugValidation {
  const errors: string[] = [];
  if (slug.length === 0) {
    errors.push('Slug is empty');
  }
  if (slug !== slug.toLowerCase()) {
    errors.push('Slug contains uppercase characters');
  }
  if (/\s/.test(slug)) {
    errors.push('Slug contains whitespace');
  }
  if (/[^\sA-Za-z0-9._~!'()*+,;=:@%-]/.test(slug)) {
    errors.push('Slug contains characters that need URL encoding');
  }
  if (slug.length > 0 && /^[-_.]|[-_.]$/.test(slug)) {
    errors.push('Slug starts or ends with a separator');
  }
  if (/[-_.]{2,}/.test(slug)) {
    errors.push('Slug contains repeated separators');
  }
  if (slug.length > 512) {
    errors.push('Slug is longer than 512 characters');
  }
  return { valid: errors.length === 0, errors };
}
