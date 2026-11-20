import type { Tool, DeserializeResult } from '@itsjust/core';
import toolConfig from './tool.config';
import type { ToolState, SlugSeparator } from './types';

const SEPARATORS: readonly string[] = ['-', '_', '.'];

function isToolState(value: unknown): value is ToolState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ToolState>;
  return (
    typeof v.input === 'string' &&
    (v.separator === '-' || v.separator === '_' || v.separator === '.') &&
    typeof v.transliterate === 'boolean' &&
    typeof v.removeStopWords === 'boolean' &&
    typeof v.maxLength === 'number' &&
    Number.isFinite(v.maxLength) &&
    v.maxLength >= 0 &&
    typeof v.batchMode === 'boolean' &&
    typeof v.output === 'string'
  );
}

export const slugGeneratorTool: Tool<ToolState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: {
    input: 'Café Müller — A Guide to URL-Friendly Titles!',
    separator: '-',
    transliterate: true,
    removeStopWords: false,
    maxLength: 0,
    batchMode: false,
    output: '',
  },
  serialize: (state) => JSON.stringify(state),
  deserialize: (data): DeserializeResult<ToolState> => {
    try {
      if (isToolState(data)) {
        return { success: true, data };
      }
      return { success: false, error: 'Invalid data format: expected valid slug generator state' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deserialization error';
      return { success: false, error: `Failed to deserialize state: ${message}` };
    }
  },
  exporters: [
    { format: 'png', loader: () => import('./exporters/png') },
    { format: 'jpeg', loader: () => import('./exporters/jpeg') },
    { format: 'webp', loader: () => import('./exporters/webp') },
    { format: 'pdf', loader: () => import('./exporters/pdf') },
  ],
};

/** Back-compat class-style wrapper used by unit tests. */
export class SlugGeneratorToolDefinition {
  initialState: ToolState = slugGeneratorTool.initialState;

  serialize(state: ToolState): string {
    return slugGeneratorTool.serialize(state);
  }

  deserialize(serialized: string | unknown): DeserializeResult<ToolState> {
    try {
      const parsed: unknown =
        typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
      return slugGeneratorTool.deserialize(parsed);
    } catch {
      return {
        success: false,
        error: 'Invalid data format: expected valid slug generator state',
      };
    }
  }
}

export function isSeparator(value: unknown): value is SlugSeparator {
  return typeof value === 'string' && SEPARATORS.includes(value);
}
