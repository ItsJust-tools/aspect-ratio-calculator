'use client';

import { useCallback } from 'react';
import type { ToolState } from '../types';
import { generateSlugs, validateSlug } from '../slugify';

interface ToolCanvasProps {
  state: ToolState;
  onChange: (state: ToolState) => void;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
}

export function ToolCanvas({ state, onChange, canvasRef }: ToolCanvasProps) {
  const output = generateSlugs(state);
  const validation = validateSlug(state.batchMode ? output.split('\n')[0] ?? '' : output);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange({ ...state, input: e.target.value });
    },
    [onChange, state]
  );

  const handleCopy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Clipboard unavailable (permissions / insecure context): ignore.
      }
    },
    []
  );

  const previewLines = state.batchMode ? output.split('\n') : [output];

  return (
    <div ref={canvasRef} className="slug-canvas" role="application" aria-label="Slug generator canvas">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="slug-input"
            className="text-xs font-medium uppercase tracking-wider opacity-70"
          >
            {state.batchMode ? 'Input (one title per line)' : 'Input text'}
          </label>
          <textarea
            id="slug-input"
            className="slug-textarea"
            value={state.input}
            onChange={handleInputChange}
            placeholder="Enter text to slugify..."
            aria-label="Input text"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-wider opacity-70">
              Slug preview (live)
            </label>
            <div className="flex items-center gap-2">
              {!state.batchMode && (
                <button
                  type="button"
                  className="slug-btn"
                  onClick={() => handleCopy(output)}
                  disabled={!output}
                  aria-label="Copy slug to clipboard"
                >
                  Copy
                </button>
              )}
              {state.batchMode && (
                <button
                  type="button"
                  className="slug-btn"
                  onClick={() => handleCopy(output)}
                  disabled={!output}
                  aria-label="Copy all slugs to clipboard"
                >
                  Copy all
                </button>
              )}
            </div>
          </div>
          <div
            className="slug-preview rounded-md border px-3 py-2 font-mono text-sm break-all"
            role="status"
            aria-live="polite"
            aria-label="Generated slug"
            data-testid="slug-preview"
          >
            {state.batchMode ? (
              <pre className="whitespace-pre-wrap m-0 font-mono text-sm">{output}</pre>
            ) : (
              output || <span className="opacity-50">Your slug appears here…</span>
            )}
          </div>

          <div className="slug-validation text-xs" data-testid="slug-validation">
            {!state.batchMode &&
              (validation.valid ? (
                <span className="text-emerald-600 dark:text-emerald-400">✓ Valid URL slug</span>
              ) : (
                <span className="text-red-600 dark:text-red-400">
                  {validation.errors.join(' · ')}
                </span>
              ))}
            {state.batchMode && (
              <ul className="m-0 p-0 list-none space-y-0.5">
                {previewLines.map((line, i) => {
                  const v = validateSlug(line);
                  return (
                    <li key={i}>
                      <span className={v.valid ? 'text-emerald-600' : 'text-red-600'}>
                        {v.valid ? '✓' : '✗'}
                      </span>{' '}
                      <span className="font-mono">{line}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
