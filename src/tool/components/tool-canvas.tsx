'use client';

import { useMemo } from 'react';
import type { Dimensions, ToolState } from '../types';
import { RATIO_PRESETS } from '../tool.config';
import { fitDimensions, parseDimension, simplifyRatio, solveMissing } from '../ratio';

interface ToolCanvasProps {
  state: ToolState;
  onChange: (state: ToolState) => void;
  canvasRef?: React.Ref<HTMLDivElement>;
}

function inputError(value: string, allowEmpty: boolean): boolean {
  if (!value.trim()) return !allowEmpty;
  return parseDimension(value) === null;
}

const numberField =
  'w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40';

function CalcRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-xs font-medium uppercase tracking-wide opacity-70">
        {label}
      </span>
      {children}
    </label>
  );
}

export function ToolCanvas({ state, onChange, canvasRef }: ToolCanvasProps) {
  const solved = useMemo(
    () =>
      solveMissing(state.ratioW, state.ratioH, {
        width: parseDimension(state.width),
        height: parseDimension(state.height),
      }),
    [state.ratioW, state.ratioH, state.width, state.height]
  );
  const simplified = useMemo(
    () =>
      simplifyRatio(
        state.width ? (parseDimension(state.width) ?? 0) : 0,
        state.height ? (parseDimension(state.height) ?? 0) : 0
      ),
    [state.width, state.height]
  );
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
    [state.ratioW, state.ratioH, state.boxWidth, state.boxHeight, state.fitMode, state.integerMode]
  );

  const solvedSize: Dimensions | null = solved;
  const displayW = solvedSize ? solvedSize.width : null;
  const displayH = solvedSize ? solvedSize.height : null;

  const setRatio = (ratioW: number, ratioH: number) =>
    onChange({
      ...state,
      ratioW,
      ratioH,
      orientation: ratioW >= ratioH ? 'landscape' : 'portrait',
    });

  const swap = () => setRatio(state.ratioH, state.ratioW);

  const applySolved = () => {
    if (!solvedSize) return;
    const w = state.width.trim() ? state.width : String(Math.round(solvedSize.width));
    const h = state.height.trim() ? state.height : String(Math.round(solvedSize.height));
    onChange({ ...state, width: w, height: h });
  };

  const showApply = Boolean(state.width.trim()) !== Boolean(state.height.trim());

  const copyResult = async () => {
    const value =
      displayW !== null && displayH !== null ? `${fmt(displayW)} × ${fmt(displayH)}` : '';
    if (!value) return;
    await navigator.clipboard.writeText(value);
  };

  const canCopy = displayW !== null && displayH !== null;

  const ratioInvalid =
    !Number.isFinite(state.ratioW) ||
    !Number.isFinite(state.ratioH) ||
    state.ratioW <= 0 ||
    state.ratioH <= 0;

  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

  return (
    <div
      ref={canvasRef}
      className="arc-canvas"
      role="application"
      aria-label="Aspect ratio calculator"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
        {/* Ratio input */}
        <section className="flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Aspect Ratio</h2>
          <div className="flex flex-wrap items-center gap-2">
            {RATIO_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className="rounded-full border px-3 py-1 text-xs hover:bg-blue-500/10"
                onClick={() => setRatio(p.w, p.h)}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              className="rounded-full border px-3 py-1 text-xs hover:bg-blue-500/10"
              onClick={swap}
              aria-label="Swap ratio orientation"
              title="Swap W:H"
            >
              ⇄ Swap
            </button>
          </div>
          <CalcRow label="Ratio (W:H)">
            <div className="flex flex-1 items-center gap-2">
              <input
                type="number"
                min={0.0001}
                step="any"
                className={`${numberField} ${ratioInvalid ? 'border-red-500' : 'border-current/20'}`}
                value={Number.isFinite(state.ratioW) ? state.ratioW : ''}
                onChange={(e) => setRatio(Number(e.target.value), state.ratioH)}
                aria-label="Ratio width"
              />
              <span className="opacity-60">:</span>
              <input
                type="number"
                min={0.0001}
                step="any"
                className={`${numberField} ${ratioInvalid ? 'border-red-500' : 'border-current/20'}`}
                value={Number.isFinite(state.ratioH) ? state.ratioH : ''}
                onChange={(e) => setRatio(state.ratioW, Number(e.target.value))}
                aria-label="Ratio height"
              />
            </div>
          </CalcRow>
          <p className="text-xs opacity-60">Current orientation: {state.orientation}</p>
        </section>

        {/* Solve missing dimension */}
        <section className="flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Solve Missing Dimension</h2>
          <CalcRow label="Width">
            <input
              type="text"
              inputMode="decimal"
              className={`${numberField} ${inputError(state.width, true) ? 'border-red-500' : 'border-current/20'}`}
              value={state.width}
              onChange={(e) => onChange({ ...state, width: e.target.value, height: '' })}
              placeholder="e.g. 1920 — leave empty to solve"
              aria-label="Known width"
            />
          </CalcRow>
          <CalcRow label="Height">
            <input
              type="text"
              inputMode="decimal"
              className={`${numberField} ${inputError(state.height, true) ? 'border-red-500' : 'border-current/20'}`}
              value={state.height}
              onChange={(e) => onChange({ ...state, height: e.target.value, width: '' })}
              placeholder="e.g. 1080 — leave empty to solve"
              aria-label="Known height"
            />
          </CalcRow>
          <div className="flex items-center justify-between rounded-md bg-blue-500/10 px-3 py-2">
            <span className="text-sm" aria-live="polite">
              {solvedSize
                ? `${displayW !== null && Number.isInteger(displayW) ? displayW : fmt(displayW ?? 0)} × ${
                    displayH !== null && Number.isInteger(displayH) ? displayH : fmt(displayH ?? 0)
                  }`
                : 'Enter the ratio and one dimension'}
            </span>
            <button
              type="button"
              className="rounded-md border px-3 py-1 text-xs hover:bg-blue-500/20 disabled:opacity-40"
              onClick={copyResult}
              disabled={!canCopy}
              aria-label="Copy result to clipboard"
            >
              Copy
            </button>
            {showApply && (
              <button
                type="button"
                className="rounded-md border px-3 py-1 text-xs hover:bg-blue-500/20 disabled:opacity-40"
                onClick={applySolved}
                disabled={!solvedSize}
                aria-label="Apply solved dimensions to inputs"
              >
                Apply
              </button>
            )}
          </div>
        </section>

        {/* Fit / cover */}
        <section className="flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Fit into Bounding Box</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`rounded-full border px-4 py-1 text-xs ${state.fitMode === 'fit' ? 'bg-blue-500 text-white' : 'hover:bg-blue-500/10'}`}
              onClick={() => onChange({ ...state, fitMode: 'fit' })}
              aria-pressed={state.fitMode === 'fit'}
            >
              Fit (contain)
            </button>
            <button
              type="button"
              className={`rounded-full border px-4 py-1 text-xs ${state.fitMode === 'cover' ? 'bg-blue-500 text-white' : 'hover:bg-blue-500/10'}`}
              onClick={() => onChange({ ...state, fitMode: 'cover' })}
              aria-pressed={state.fitMode === 'cover'}
            >
              Cover
            </button>
            <label className="ml-auto flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={state.integerMode}
                onChange={(e) => onChange({ ...state, integerMode: e.target.checked })}
                aria-label="Integer rounding mode"
              />
              Integer rounding
            </label>
          </div>
          <div className="flex gap-3">
            <CalcRow label="Box width">
              <input
                type="text"
                inputMode="decimal"
                className={`${numberField} ${inputError(state.boxWidth, true) ? 'border-red-500' : 'border-current/20'}`}
                value={state.boxWidth}
                onChange={(e) => onChange({ ...state, boxWidth: e.target.value })}
                aria-label="Bounding box width"
              />
            </CalcRow>
            <CalcRow label="Box height">
              <input
                type="text"
                inputMode="decimal"
                className={`${numberField} ${inputError(state.boxHeight, true) ? 'border-red-500' : 'border-current/20'}`}
                value={state.boxHeight}
                onChange={(e) => onChange({ ...state, boxHeight: e.target.value })}
                aria-label="Bounding box height"
              />
            </CalcRow>
          </div>
          <div className="rounded-md bg-blue-500/10 px-3 py-2 text-sm" aria-live="polite">
            {fitted
              ? `Result: ${fmt(fitted.width)} × ${fmt(fitted.height)} (${state.fitMode})`
              : 'Enter a valid bounding box'}
          </div>
        </section>

        {/* Simplify current W:H */}
        <section className="flex flex-col gap-2 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Simplify Known Dimensions</h2>
          <p className="text-sm" aria-live="polite">
            {simplified
              ? `Simplified: ${simplified.ratioW}:${simplified.ratioH}`
              : 'Enter both dimensions above to simplify their ratio'}
          </p>
        </section>
      </div>
    </div>
  );
}
