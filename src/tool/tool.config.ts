import type { ExportFormat } from '@itsjust/core';

export const toolConfig = {
  id: '1795172676',
  name: 'Aspect Ratio Calculator',
  category: 'Utility',
  description:
    'Calculate missing dimensions from an aspect ratio, simplify ratios, and get fit/cover dimensions for resizing.',
  version: '1.0.0',
  exportFormats: ['png', 'jpeg', 'webp', 'pdf'] as ExportFormat[],
  features: {
    export: true,
    autoSave: true,
    undoRedo: true,
    statusBar: true,
    darkMode: true,
    sidebar: true,
  },
  theme: {
    brand: 'ItsJust',
  },
};

export const templateBaseVersion = '1.1.0';

export const RATIO_PRESETS: Array<{ label: string; w: number; h: number }> = [
  { label: '16:9', w: 16, h: 9 },
  { label: '4:3', w: 4, h: 3 },
  { label: '1:1', w: 1, h: 1 },
  { label: '21:9', w: 21, h: 9 },
  { label: '3:2', w: 3, h: 2 },
  { label: '9:16', w: 9, h: 16 },
];

export default toolConfig;
