'use client';

import type { ToolState, SlugSeparator } from '../types';

interface ToolSidebarProps {
  state: ToolState;
  onChange: (state: ToolState) => void;
}

const SEPARATOR_OPTIONS: Array<{ value: SlugSeparator; label: string }> = [
  { value: '-', label: 'Dash (-)' },
  { value: '_', label: 'Underscore (_)' },
  { value: '.', label: 'Dot (.)' },
];

const SAMPLES: Array<{ label: string; input: string }> = [
  { label: 'Blog post title', input: 'The Best Coffee Shops in Berlin' },
  { label: 'Accented text', input: 'Café Müller in Köln — Über den Dächern' },
  { label: 'Product name', input: 'Acme® Super-Duper Widget (2024 Edition)! »' },
];

const MAX_LENGTH_PRESETS = [0, 30, 50, 75, 100];

export function ToolSidebar({ state, onChange }: ToolSidebarProps) {
  const patch = (partial: Partial<ToolState>) => onChange({ ...state, ...partial });

  return (
    <div className="slug-sidebar">
      <div className="sidebar-section">
        <h3>Options</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="separator-select" className="text-xs font-medium mb-1 block">
              Separator
            </label>
            <select
              id="separator-select"
              value={state.separator}
              onChange={(e) => patch({ separator: e.target.value as SlugSeparator })}
              className="slug-select"
            >
              {SEPARATOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center justify-between gap-2 text-xs font-medium">
            <span>Transliterate accents (é &rarr; e, ü &rarr; ue)</span>
            <input
              type="checkbox"
              checked={state.transliterate}
              onChange={(e) => patch({ transliterate: e.target.checked })}
              className="slug-checkbox"
            />
          </label>

          <label className="flex items-center justify-between gap-2 text-xs font-medium">
            <span>Remove stop words (the, a, an, of, and…)</span>
            <input
              type="checkbox"
              checked={state.removeStopWords}
              onChange={(e) => patch({ removeStopWords: e.target.checked })}
              className="slug-checkbox"
            />
          </label>

          <div>
            <label htmlFor="maxlength-select" className="text-xs font-medium mb-1 block">
              Maximum length (0 = unlimited)
            </label>
            <select
              id="maxlength-select"
              value={state.maxLength}
              onChange={(e) => patch({ maxLength: Number(e.target.value) })}
              className="slug-select"
            >
              {MAX_LENGTH_PRESETS.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'Unlimited' : `${n} characters`}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center justify-between gap-2 text-xs font-medium">
            <span>Batch mode (one slug per line)</span>
            <input
              type="checkbox"
              checked={state.batchMode}
              onChange={(e) => patch({ batchMode: e.target.checked })}
              className="slug-checkbox"
            />
          </label>
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Samples</h3>
        <div className="space-y-2">
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              type="button"
              className="slug-sample-btn"
              onClick={() => patch({ input: s.input })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Actions</h3>
        <button type="button" className="slug-sample-btn" onClick={() => patch({ input: '' })}>
          Clear input
        </button>
      </div>
    </div>
  );
}
