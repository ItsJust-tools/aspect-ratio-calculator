import { describe, it, expect } from 'vitest';
import {
  gcd,
  parseDimension,
  simplifyRatio,
  solveMissing,
  fitDimensions,
  isValidDimension,
} from '../../src/tool/ratio';
import {
  AspectRatioToolDefinition,
  isToolState,
  initialState,
} from '../../src/tool/tool-definition';
import type { ToolState } from '../../src/tool/types';

describe('solveMissing', () => {
  it('solves width given height and ratio 16:9', () => {
    const res = solveMissing(16, 9, { height: 1080 });
    expect(res).toEqual({ width: 1920, height: 1080 });
  });

  it('solves height given width and ratio 16:9', () => {
    const res = solveMissing(16, 9, { width: 1920 });
    expect(res).toEqual({ width: 1920, height: 1080 });
  });

  it('solves for a 4:3 ratio', () => {
    expect(solveMissing(4, 3, { width: 800 })).toEqual({ width: 800, height: 600 });
    expect(solveMissing(4, 3, { height: 600 })).toEqual({ width: 800, height: 600 });
  });

  it('solves for a 1:1 ratio', () => {
    expect(solveMissing(1, 1, { width: 500 })).toEqual({ width: 500, height: 500 });
  });

  it('handles non-integer results', () => {
    const res = solveMissing(16, 9, { width: 100 });
    expect(res).not.toBeNull();
    expect(res?.height).toBeCloseTo(56.25, 10);
  });

  it('returns null for zero/negative inputs', () => {
    expect(solveMissing(0, 9, { width: 100 })).toBeNull();
    expect(solveMissing(16, 0, { width: 100 })).toBeNull();
    expect(solveMissing(-16, 9, { width: 100 })).toBeNull();
    expect(solveMissing(16, 9, { width: -100 })).toBeNull();
    expect(solveMissing(16, 9, { height: 0 })).toBeNull();
  });

  it('returns null for NaN ratio or dimension', () => {
    expect(solveMissing(NaN, 9, { width: 100 })).toBeNull();
    expect(solveMissing(16, 9, { width: NaN })).toBeNull();
  });

  it('returns null when both dimensions are provided or neither', () => {
    expect(solveMissing(16, 9, { width: 100, height: 100 })).toBeNull();
    expect(solveMissing(16, 9, {})).toBeNull();
  });

  it('returns null for infinite inputs', () => {
    expect(solveMissing(16, 9, { width: Infinity })).toBeNull();
    expect(solveMissing(Infinity, 9, { width: 10 })).toBeNull();
  });
});

describe('simplifyRatio', () => {
  it('simplifies 1920:1080 to 16:9', () => {
    expect(simplifyRatio(1920, 1080)).toEqual({ ratioW: 16, ratioH: 9 });
  });

  it('simplifies 3840:2160 to 16:9', () => {
    expect(simplifyRatio(3840, 2160)).toEqual({ ratioW: 16, ratioH: 9 });
  });

  it('simplifies 800:600 to 4:3', () => {
    expect(simplifyRatio(800, 600)).toEqual({ ratioW: 4, ratioH: 3 });
  });

  it('keeps 16:9 as is', () => {
    expect(simplifyRatio(16, 9)).toEqual({ ratioW: 16, ratioH: 9 });
  });

  it('simplifies decimal ratios', () => {
    expect(simplifyRatio(16 / 9, 1)).toEqual({ ratioW: 16, ratioH: 9 });
    expect(simplifyRatio(1.5, 1)).toEqual({ ratioW: 3, ratioH: 2 });
  });

  it('simplifies 2560:1080 to 64:27 (21:9 family)', () => {
    expect(simplifyRatio(2560, 1080)).toEqual({ ratioW: 64, ratioH: 27 });
  });

  it('returns null for invalid inputs', () => {
    expect(simplifyRatio(0, 100)).toBeNull();
    expect(simplifyRatio(100, 0)).toBeNull();
    expect(simplifyRatio(-4, 3)).toBeNull();
    expect(simplifyRatio(NaN, 3)).toBeNull();
  });
});

describe('fitDimensions', () => {
  it('fit keeps aspect ratio and respects the bounding box', () => {
    const res = fitDimensions(16, 9, 1000, 1000, 'fit');
    expect(res).not.toBeNull();
    expect(res?.width).toBeCloseTo(1000, 10);
    expect(res?.height).toBeCloseTo(562.5, 10);
    expect(res!.width <= 1000).toBe(true);
    expect(res!.height <= 1000).toBe(true);
  });

  it('fit in a wide box confines to height', () => {
    const res = fitDimensions(16, 9, 3840, 1080, 'fit');
    expect(res?.width).toBeCloseTo(1920, 10);
    expect(res?.height).toBeCloseTo(1080, 10);
  });

  it('cover fills the bounding box in one dimension', () => {
    // 16:9 content in a square box: cover scales up so height fills the box.
    const res = fitDimensions(16, 9, 1000, 1000, 'cover');
    expect(res?.width).toBeCloseTo(1777.7777777777778, 6);
    expect(res?.height).toBeCloseTo(1000, 6);
    expect(res!.width >= 1000).toBe(true);
    expect(res!.height >= 1000).toBe(true);
    // Cover with a portrait content inside a landscape box
    const res2 = fitDimensions(9, 16, 1920, 1080, 'cover');
    expect(res2!.width >= 1920).toBe(true);
    expect(res2!.height >= 1080).toBe(true);
  });

  it('integer mode keeps fit results within the box and integers', () => {
    const res = fitDimensions(16, 9, 1000, 1000, 'fit', true);
    expect(Number.isInteger(res!.width)).toBe(true);
    expect(Number.isInteger(res!.height)).toBe(true);
    expect(res!.width <= 1000).toBe(true);
    expect(res!.height <= 1000).toBe(true);
  });

  it('integer mode cover fills the box fully with integers', () => {
    const res = fitDimensions(9, 16, 1920, 1080, 'cover', true);
    expect(Number.isInteger(res!.width)).toBe(true);
    expect(Number.isInteger(res!.height)).toBe(true);
    expect(res!.width >= 1920).toBe(true);
    expect(res!.height >= 1080).toBe(true);
  });

  it('returns null for invalid inputs', () => {
    expect(fitDimensions(0, 9, 100, 100)).toBeNull();
    expect(fitDimensions(16, 9, 0, 100)).toBeNull();
    expect(fitDimensions(16, 9, 100, -5)).toBeNull();
    expect(fitDimensions(NaN, 9, 100, 100)).toBeNull();
  });
});

describe('gcd and parseDimension', () => {
  it('computes gcd', () => {
    expect(gcd(1920, 1080)).toBe(120);
    expect(gcd(16, 9)).toBe(1);
    expect(gcd(0, 5)).toBe(5);
    expect(gcd(-16, 9)).toBe(1);
  });

  it('parses valid dimensions', () => {
    expect(parseDimension('1920')).toBe(1920);
    expect(parseDimension(' 12.5 ')).toBe(12.5);
    expect(parseDimension('0.1')).toBe(0.1);
  });

  it('rejects empty/invalid/zero/negative/non-finite inputs', () => {
    expect(parseDimension('')).toBeNull();
    expect(parseDimension('  ')).toBeNull();
    expect(parseDimension('abc')).toBeNull();
    expect(parseDimension('NaN')).toBeNull();
    expect(parseDimension('-5')).toBeNull();
    expect(parseDimension('0')).toBeNull();
    expect(parseDimension('Infinity')).toBeNull();
  });

  it('isValidDimension rejects zero, negatives and non-finite values', () => {
    expect(isValidDimension(1)).toBe(true);
    expect(isValidDimension(0)).toBe(false);
    expect(isValidDimension(-1)).toBe(false);
    expect(isValidDimension(NaN)).toBe(false);
    expect(isValidDimension(Infinity)).toBe(false);
    expect(isValidDimension('10')).toBe(false);
  });
});

describe('AspectRatioToolDefinition state', () => {
  const def = new AspectRatioToolDefinition();

  it('round-trips serialize/deserialize', () => {
    const round = def.deserialize(def.serialize(initialState));
    expect(round.success).toBe(true);
    if (round.success) expect(round.data).toEqual(initialState);
  });

  it('rejects invalid serialized JSON', () => {
    expect(def.deserialize('not json').success).toBe(false);
  });

  it('rejects invalid state payloads', () => {
    expect(def.deserialize(JSON.stringify({})).success).toBe(false);
    expect(def.deserialize(JSON.stringify({ ...initialState, ratioW: 0 })).success).toBe(false);
    expect(def.deserialize(JSON.stringify({ ...initialState, ratioH: -1 })).success).toBe(false);
    expect(def.deserialize(JSON.stringify({ ...initialState, fitMode: 'bogus' })).success).toBe(
      false
    );
    expect(def.deserialize(JSON.stringify({ ...initialState, width: 42 })).success).toBe(false);
    expect(def.deserialize(JSON.stringify(null) as string).success).toBe(false);
  });

  it('rejects NaN ratio values in state payloads', () => {
    expect(isToolState({ ...initialState, ratioW: NaN })).toBe(false);
    expect(def.deserialize(JSON.stringify({ ...initialState, ratioW: '16' })).success).toBe(false);
  });

  it('accepts a full valid state payload', () => {
    const state: ToolState = { ...initialState, fitMode: 'cover', integerMode: true };
    expect(isToolState(state)).toBe(true);
    const round = def.deserialize(def.serialize(state));
    expect(round.success).toBe(true);
    if (round.success) expect(round.data).toEqual(state);
  });
});

describe('URL state round-trip', () => {
  it('serialize -> deserialize through JSON preserves state', () => {
    const state: ToolState = {
      ratioW: 21,
      ratioH: 9,
      width: '2560',
      height: '',
      fitMode: 'cover',
      boxWidth: '1920',
      boxHeight: '500',
      integerMode: true,
      orientation: 'landscape',
    };
    const serialized = JSON.stringify(state);
    // Simulate URL: JSON.stringify of URLSearchParams output is plain string.
    const deserialized = new AspectRatioToolDefinition().deserialize(serialized);
    expect(deserialized.success).toBe(true);
    if (deserialized.success) {
      expect(deserialized.data).toEqual(state);
      expect(deserialized.data.width).toBe('2560');
      expect(deserialized.data.fitMode).toBe('cover');
    }
  });

  it('rejects empty state object round-trip', () => {
    expect(new AspectRatioToolDefinition().deserialize(JSON.stringify({})).success).toBe(false);
  });
});
