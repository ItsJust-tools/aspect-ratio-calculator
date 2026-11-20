import type { Tool, ToolConfig, ToolExporterDefinition, DeserializeResult } from '@itsjust/core';
import toolConfig from './tool.config';
import type { ToolState } from './types';
import { isToolState, initialState } from './tool-definition';

export type { ToolState };
export { initialState as notepadInitialState };

/**
 * Legacy alias kept so @/tool/notepad-state imports keep working.
 * The notepad-era scaffold used this path for the shared state definition.
 */
export const notepadTool: Tool<ToolState> = {
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
