import { describe, it, expect } from 'vitest';
import {
  slugGeneratorTool,
  SlugGeneratorToolDefinition,
  isSeparator,
} from '../../src/tool/tool-definition';
import type { ToolState } from '../../src/tool/types';

const validState: ToolState = {
  input: 'Hello World',
  separator: '-',
  transliterate: true,
  removeStopWords: false,
  maxLength: 0,
  batchMode: false,
  output: 'hello-world',
};

describe('slugGeneratorTool', () => {
  it('exposes identity from the tool config', () => {
    expect(slugGeneratorTool.id).toBe('1795152181');
    expect(slugGeneratorTool.name).toBe('Slug Generator');
    expect(slugGeneratorTool.config.id).toBe(slugGeneratorTool.id);
  });

  it('provides a sensible initial state', () => {
    const s = slugGeneratorTool.initialState;
    expect(s.separator).toBe('-');
    expect(s.transliterate).toBe(true);
    expect(s.removeStopWords).toBe(false);
    expect(s.maxLength).toBe(0);
    expect(s.batchMode).toBe(false);
    expect(s.output).toBe('');
  });
});

describe('serialize/deserialize round-trip', () => {
  it('round-trips a valid state', () => {
    const json = slugGeneratorTool.serialize(validState);
    const parsed: unknown = JSON.parse(json);
    const result = slugGeneratorTool.deserialize(parsed);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validState);
    }
  });

  it('rejects null and non-object payloads', () => {
    expect(slugGeneratorTool.deserialize(null).success).toBe(false);
    expect(slugGeneratorTool.deserialize('str').success).toBe(false);
    expect(slugGeneratorTool.deserialize(undefined).success).toBe(false);
  });

  it('rejects missing or wrong-typed fields', () => {
    expect(slugGeneratorTool.deserialize({ ...validState, input: 5 }).success).toBe(false);
    expect(slugGeneratorTool.deserialize({ ...validState, separator: ',' }).success).toBe(false);
    expect(slugGeneratorTool.deserialize({ ...validState, transliterate: 'yes' }).success).toBe(false);
    expect(slugGeneratorTool.deserialize({ ...validState, maxLength: -1 }).success).toBe(false);
    expect(slugGeneratorTool.deserialize({ ...validState, maxLength: 'none' }).success).toBe(false);
    expect(slugGeneratorTool.deserialize({ ...validState, batchMode: 1 }).success).toBe(false);
    expect(slugGeneratorTool.deserialize({ input: 'x' }).success).toBe(false);
  });

  it('returns error strings on failure', () => {
    const result = slugGeneratorTool.deserialize(null);
    if (!result.success) {
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    } else {
      throw new Error('expected failure');
    }
  });
});

describe('SlugGeneratorToolDefinition wrapper', () => {
  const def = new SlugGeneratorToolDefinition();

  it('parses a serialized JSON string', () => {
    const result = def.deserialize(JSON.stringify(validState));
    expect(result.success).toBe(true);
  });

  it('fails cleanly on malformed JSON', () => {
    const result = def.deserialize('{not-json');
    expect(result.success).toBe(false);
  });
});

describe('isSeparator', () => {
  it('accepts only -, _, and .', () => {
    expect(isSeparator('-')).toBe(true);
    expect(isSeparator('_')).toBe(true);
    expect(isSeparator('.')).toBe(true);
    expect(isSeparator(',')).toBe(false);
    expect(isSeparator(1)).toBe(false);
  });
});
