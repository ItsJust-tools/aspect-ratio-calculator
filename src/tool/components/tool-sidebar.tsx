'use client';

import { useMemo } from 'react';
import type { ToolState } from '../types';
import { RATIO_PRESETS } from '../tool.config';
import { fitDimensions, parseDimension, simplifyRatio, solveMissing } from '../ratio';

interface ToolSidebarProps {
  state: ToolState;
  onStateChange: (state: ToolState) => void;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function ToolSidebar({ state, onStateChange }: ToolSidebarProps) {
  const solved = useMemo(
    () =>
      solveMissing(state.ratioW, state.ratioH, {
        width: parseDimension(state.width),
        height: parseDimension(state.height),
      }),
    [state]
  );
  const simplified = useMemo(() => {
    const w = parseDimension(state.width);
    const h = parseDimension(state.height);
    return w !== null && h !== null ? simplifyRatio(w, h) : null;
  }, [state]);
  const fitted = useMemo(
    () =>
      fitDimensions(
        state.ratioW,
        state.ratioH,
        parseDimension(state.boxWidth) ?? 0,
        parseDimension(state.boxHeight) ?? 0,
        state.fitMode,
        state.integerMode
      ),
    [state]
  );

  const copy = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="arc-sidebar flex flex-col gap-4 p-2 text-sm">
      <div className="sidebar-section">
        <h3>Presets</h3>
        <div className="flex flex-wrap gap-1">
          {RATIO_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={`rounded border px-2 py-0.5 text-xs ${
                state.ratioW === p.w && state.ratioH === p.h
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-blue-500/10'
              }`}
              onClick={() =>
                onStateChange({
                  ...state,
                  ratioW: p.w,
                  ratioH: p.h,
                  orientation: p.w >= p.h ? 'landscape' : 'portrait',
                })
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Result</h3>
        <div className="stat-row flex items-center justify-between gap-2">
          <span>{solved ? `${fmt(solved.width)} × ${fmt(solved.height)}` : '—'}</span>
          <button
            type="button"
            className="rounded border px-2 py-0.5 text-xs hover:bg-blue-500/10 disabled:opacity-40"
            onClick={() => copy(solved ? `${fmt(solved.width)} × ${fmt(solved.height)}` : '')}
            disabled={!solved}
            aria-label="Copy solved dimensions"
          >
            Copy
          </button>
        </div>
        <div className="stat-row flex items-center justify-between gap-2">
          <span className="opacity-70">Ratio</span>
          <span>
            {state.ratioW}:{state.ratioH}
          </span>
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Simplified</h3>
        <div className="stat-row flex items-center justify-between gap-2">
          <span>{simplified ? `${simplified.ratioW}:${simplified.ratioH}` : '—'}</span>
          <button
            type="button"
            className="rounded border px-2 py-0.5 text-xs hover:bg-blue-500/10 disabled:opacity-40"
            onClick={() => copy(simplified ? `${simplified.ratioW}:${simplified.ratioH}` : '')}
            disabled={!simplified}
            aria-label="Copy simplified ratio"
          >
            Copy
          </button>
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Fit / Cover</h3>
        <div className="stat-row flex items-center justify-between gap-2">
          <span>{fitted ? `${fmt(fitted.width)} × ${fmt(fitted.height)}` : '—'}</span>
          <button
            type="button"
            className="rounded border px-2 py-0.5 text-xs hover:bg-blue-500/10 disabled:opacity-40"
            onClick={() => copy(fitted ? `${fmt(fitted.width)} × ${fmt(fitted.height)}` : '')}
            disabled={!fitted}
            aria-label="Copy fit dimensions"
          >
            Copy
          </button>
        </div>
        <div className="stat-row flex items-center justify-between gap-2">
          <span className="opacity-70">Mode</span>
          <span>{state.fitMode}</span>
        </div>
      </div>
    </div>
  );
}

export default ToolSidebar;
