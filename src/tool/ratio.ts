import type { Dimensions, FitMode, RatioResult } from './types';

/** Greatest common divisor of two non-negative integers. */
export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.floor(a));
  let y = Math.abs(Math.floor(b));
  while (y > 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

/** True when value is a finite number greater than 0. */
export function isValidDimension(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** Parse a dimension input string; returns null for empty/invalid/zero/negative input. */
export function parseDimension(input: string): number | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

/**
 * Simplify a W:H ratio to lowest positive integer terms.
 * Handles non-integer inputs by scaling up until both sides are integral (bounded).
 * Returns null when inputs are not finite positive numbers.
 */
export function simplifyRatio(ratioW: number, ratioH: number): RatioResult | null {
  if (!isValidDimension(ratioW) || !isValidDimension(ratioH)) return null;
  const r = ratioW / ratioH;
  // Continued-fraction approximation of r with a bounded denominator.
  let h1 = 1;
  let h0 = 0;
  let k1 = 0;
  let k0 = 1;
  let x = r;
  for (let i = 0; i < 64; i++) {
    const a = Math.floor(x);
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;
    h0 = h1;
    h1 = h2;
    k0 = k1;
    k1 = k2;
    if (k1 > 100000 || Math.abs(r - h1 / k1) < 1e-9 * Math.max(1, r)) break;
    const frac = x - a;
    if (frac < 1e-12) break;
    x = 1 / frac;
  }
  if (h1 > 0 && k1 > 0 && Math.abs(r - h1 / k1) <= 1e-6 * Math.max(1, r)) {
    return { ratioW: h1, ratioH: k1 };
  }
  // Fallback: best-effort integer reduction
  const divisor = gcd(ratioW, ratioH) || 1;
  const sw = Math.max(1, Math.round(ratioW / divisor));
  const sh = Math.max(1, Math.round(ratioH / divisor));
  return { ratioW: sw, ratioH: sh };
}

/** Missing dimension given ratio and one known width or height. Returns null for invalid inputs. */
export function solveMissing(
  ratioW: number,
  ratioH: number,
  known: { width?: number | null; height?: number | null }
): Dimensions | null {
  if (!isValidDimension(ratioW) || !isValidDimension(ratioH)) return null;
  const { width, height } = known;
  if (isValidDimension(width) && !isValidDimension(height)) {
    return { width, height: (width * ratioH) / ratioW };
  }
  if (isValidDimension(height) && !isValidDimension(width)) {
    return { width: (height * ratioW) / ratioH, height };
  }
  return null;
}

/**
 * Fit (contain) or cover dimensions for content with the given ratio inside a bounding box.
 * Fit uses the smaller scale factor (content fully visible), cover uses the larger
 * (bounding box fully covered, content cropped).
 */
export function fitDimensions(
  ratioW: number,
  ratioH: number,
  boxW: number,
  boxH: number,
  mode: FitMode = 'fit',
  integerMode = false
): Dimensions | null {
  if (
    !isValidDimension(ratioW) ||
    !isValidDimension(ratioH) ||
    !isValidDimension(boxW) ||
    !isValidDimension(boxH)
  ) {
    return null;
  }
  const scaleX = boxW / ratioW;
  const scaleY = boxH / ratioH;
  const scale = mode === 'cover' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
  let width = ratioW * scale;
  let height = ratioH * scale;
  if (integerMode) {
    if (mode === 'cover') {
      // Ceil so the bounding box stays fully covered.
      width = Math.ceil(width);
      height = Math.ceil(height);
    } else {
      // Floor so the result never exceeds the bounding box...
      width = Math.floor(width);
      height = Math.floor(height);
      // ...then walk back to the nearest integer dimension that keeps the ratio.
      const target = width / ratioW;
      height = Math.round(ratioH * target);
      if (height > boxH) {
        height = Math.floor(boxH);
        width = Math.round(ratioW * (height / ratioH));
      }
      if (width < 1 || height < 1) return null;
    }
  }
  return { width, height };
}
