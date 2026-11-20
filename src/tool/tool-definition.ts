import type { Tool, ToolConfig, ToolExporterDefinition, DeserializeResult } from '@itsjust/core';
import toolConfig, { RATIO_PRESETS } from './tool.config';
import type { ToolState, FitMode, Orientation } from './types';
import { isValidDimension } from './ratio';

export { RATIO_PRESETS };

export const initialState: ToolState = {
  ratioW: 16,
  ratioH: 9,
  width: '1920',
  height: '',
  fitMode: 'fit',
  boxWidth: '1280',
  boxHeight: '720',
  integerMode: false,
  orientation: 'landscape',
};

function isPositiveNumber(value: unknown): value is number {
  return isValidDimension(value);
}

function isFitMode(value: unknown): value is FitMode {
  return value === 'fit' || value === 'cover';
}

function isOrientation(value: unknown): value is Orientation {
  return value === 'landscape' || value === 'portrait';
}

export function isToolState(value: unknown): value is ToolState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ToolState>;
  return (
    isPositiveNumber(v.ratioW) &&
    isPositiveNumber(v.ratioH) &&
    typeof v.width === 'string' &&
    typeof v.height === 'string' &&
    isFitMode(v.fitMode) &&
    typeof v.boxWidth === 'string' &&
    typeof v.boxHeight === 'string' &&
    typeof v.integerMode === 'boolean' &&
    isOrientation(v.orientation)
  );
}

export const aspectRatioTool: Tool<ToolState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig as unknown as ToolConfig,
  initialState,
  serialize: (state: ToolState): string => JSON.stringify(state),
  deserialize: (data: unknown): DeserializeResult<ToolState> => {
    try {
      if (isToolState(data)) {
        return { success: true, data };
      }
      return {
        success: false,
        error: 'Invalid data format: expected valid aspect ratio calculator state',
      };
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
  ] as ToolExporterDefinition[],
};

/** Class-style wrapper kept for compatibility with state-transition helpers. */
export class AspectRatioToolDefinition {
  initialState: ToolState = initialState;

  serialize(state: ToolState): string {
    return aspectRatioTool.serialize(state);
  }

  deserialize(serialized: string): DeserializeResult<ToolState> {
    try {
      const parsed: unknown = JSON.parse(serialized);
      return aspectRatioTool.deserialize(parsed);
    } catch {
      return {
        success: false,
        error: 'Invalid data format: expected valid aspect ratio calculator state',
      };
    }
  }
}
