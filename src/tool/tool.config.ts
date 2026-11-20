import type { ToolConfig } from '@itsjust/core';
import packageJson from '../../package.json';

export const templateBaseVersion = packageJson.version;

export const toolConfig = {
  id: '1795152181',
  name: 'Slug Generator',
  description:
    'Converts text into URL-safe slugs with customizable separators, transliteration of accented characters, optional stop-word removal, and length limits.',
  version: '1.0.0',
  exportFormats: ['png', 'jpeg', 'webp', 'pdf'],
  features: {
    export: true,
    autoSave: true,
    undoRedo: true,
    sidebar: true,
    statusBar: true,
    darkMode: true,
  },
  theme: {
    accent: '#10b981',
    accentHover: '#059669',
    accentSubtle: 'rgba(16, 185, 129, 0.08)',
    brand: 'Slug Generator',
    icon: '🔗',
  },
} satisfies ToolConfig;

export default toolConfig;
