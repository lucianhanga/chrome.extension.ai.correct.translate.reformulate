// src/popup/components/QuickAction.tsx
// Action-first quick panel: pick an action (Correct / Translate / Reformulate /
// Summarize), see only that action's relevant control, then Run. Enter in the
// textarea runs the selected action.

import React, { useState } from 'react';
import type {
  LLMProvider,
  SupportedLanguage,
  ReformulateTone,
  SummarizeLength,
  ActionType,
} from '../../shared/types.ts';
import type {
  SuccessResponse,
  ErrorResponse,
  ServiceWorkerResponse,
} from '../../shared/messages.ts';
import { MAX_INPUT_LENGTH } from '../../shared/constants.ts';
import { LanguageSelector } from './LanguageSelector.tsx';
import { ToneSelector } from './ToneSelector.tsx';
import { LengthSelector } from './LengthSelector.tsx';
import { ResultDisplay } from './ResultDisplay.tsx';

interface QuickActionProps {
  defaultTargetLanguage: SupportedLanguage;
  provider: LLMProvider;
  defaultReformulateTone: ReformulateTone;
  keepTerminology: boolean;
  defaultSummarizeLength: SummarizeLength;
}

interface ResultState {
  originalText: string;
  resultText: string;
  model: string;
  totalTokens: number | null;
  elapsedMs: number;
}

// Action tabs, in display order. The label doubles as the Run button verb.
const ACTIONS: ReadonlyArray<{ id: ActionType; label: string }> = [
  { id: 'correct', label: 'Correct' },
  { id: 'translate', label: 'Translate' },
  { id: 'reformulate', label: 'Reformulate' },
  { id: 'summarize', label: 'Summarize' },
];

export function QuickAction({
  defaultTargetLanguage,
  provider,
  defaultReformulateTone,
  keepTerminology: initialKeepTerminology,
  defaultSummarizeLength,
}: QuickActionProps): React.ReactElement {
  const [action, setAction] = useState<ActionType>('correct');
  const [inputText, setInputText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>(defaultTargetLanguage);
  const [tone, setTone] = useState<ReformulateTone>(defaultReformulateTone);
  const [keepTerminology, setKeepTerminology] = useState<boolean>(initialKeepTerminology);
  const [summarizeLength, setSummarizeLength] = useState<SummarizeLength>(defaultSummarizeLength);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const charCount = inputText.length;
  const overLimit = charCount > MAX_INPUT_LENGTH;
  const isEmpty = inputText.trim() === '';
  const canRun = !isEmpty && !overLimit && !loading;
  const actionLabel = ACTIONS.find((a) => a.id === action)?.label ?? 'Run';

  // ============================================================
  // Settings persistence helpers
  // ============================================================

  const persist = (settings: Record<string, unknown>, field: string): void => {
    chrome.runtime
      .sendMessage({ type: 'SAVE_SETTINGS', payload: { settings } })
      .catch((err: unknown) => {
        console.error(`[QuickAction] Failed to persist ${field}:`, err);
      });
  };

  // ============================================================
  // Run the currently selected action
  // ============================================================

  const buildRequest = (): { type: string; payload: Record<string, unknown> } => {
    switch (action) {
      case 'translate':
        return { type: 'TRANSLATE', payload: { text: inputText, targetLanguage } };
      case 'reformulate':
        return { type: 'REFORMULATE', payload: { text: inputText, tone, keepTerminology } };
      case 'summarize':
        return { type: 'SUMMARIZE', payload: { text: inputText, length: summarizeLength } };
      case 'correct':
      default:
        return { type: 'CORRECT_GRAMMAR', payload: { text: inputText } };
    }
  };

  const runAction = async (): Promise<void> => {
    if (!canRun) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = (await chrome.runtime.sendMessage(buildRequest())) as ServiceWorkerResponse;

      if (isSuccessResponse(response)) {
        setResult({
          originalText: inputText,
          resultText: response.result,
          model: response.model,
          totalTokens: response.totalTokens,
          elapsedMs: response.elapsedMs,
        });
      } else if (isErrorResponse(response)) {
        setError(response.error);
      } else {
        setError('Unexpected response from service worker.');
      }
    } catch (err) {
      setError('Failed to communicate with extension service worker.');
      console.error(`[QuickAction] ${action} error:`, err);
    } finally {
      setLoading(false);
    }
  };

  const run = (): void => {
    runAction().catch((err: unknown) => {
      console.error('[QuickAction] runAction unhandled:', err);
    });
  };

  const selectAction = (next: ActionType): void => {
    setAction(next);
    // The previous result/error belongs to the previous action; clear it.
    setResult(null);
    setError(null);
  };

  // ============================================================
  // Render
  // ============================================================

  const tabClass = (selected: boolean): string =>
    [
      'py-1.5 rounded-md text-xs font-semibold transition-colors duration-100',
      'focus:outline-none focus:ring-2 focus:ring-[#89b4fa] focus:ring-offset-1 focus:ring-offset-[#1e1e2e]',
      'disabled:opacity-40 disabled:cursor-not-allowed',
      selected
        ? 'bg-[#45475a] text-[#cdd6f4]'
        : 'bg-[#181825] text-[#a6adc8] hover:bg-[#313244]',
    ].join(' ');

  return (
    <div className="flex flex-col gap-3">
      {/* Action selector */}
      <div role="tablist" aria-label="Action" className="grid grid-cols-4 gap-1">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            role="tab"
            aria-selected={action === a.id}
            disabled={loading}
            onClick={() => selectAction(a.id)}
            className={tabClass(action === a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Text input */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-[#a6adc8] uppercase tracking-wide">
          Input Text
        </label>
        <textarea
          value={inputText}
          disabled={loading}
          onChange={(e) => {
            setInputText(e.target.value);
            setResult(null);
            setError(null);
          }}
          onKeyDown={(e) => {
            // Enter runs the selected action; Shift+Enter inserts a newline.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              run();
            }
          }}
          placeholder="Paste or type text here..."
          rows={4}
          className="
            w-full bg-[#181825] text-[#cdd6f4] border border-[#313244]
            rounded-md px-2 py-2 text-sm resize-none
            focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent
            placeholder:text-[#45475a]
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        />
        {/* Character count */}
        <div className="flex justify-end">
          <span
            className="text-xs"
            style={{ color: overLimit ? '#ef4444' : charCount > MAX_INPUT_LENGTH * 0.9 ? '#eab308' : '#585b70' }}
          >
            {charCount.toLocaleString()} / {MAX_INPUT_LENGTH.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Action-specific controls (only the relevant one is shown) */}
      {action === 'translate' && (
        <LanguageSelector
          label="Translate To"
          value={targetLanguage}
          onChange={(v) => {
            if (v !== null) setTargetLanguage(v);
          }}
          includeAutoDetect={false}
          disabled={loading}
        />
      )}

      {action === 'reformulate' && (
        <>
          <ToneSelector
            value={tone}
            onChange={(newTone) => {
              setTone(newTone);
              persist({ defaultReformulateTone: newTone }, 'defaultReformulateTone');
            }}
            disabled={loading}
          />
          <div className="flex items-center gap-2">
            <input
              id="keep-terminology"
              type="checkbox"
              checked={keepTerminology}
              disabled={loading}
              onChange={(e) => {
                const newValue = e.target.checked;
                setKeepTerminology(newValue);
                persist({ keepTerminology: newValue }, 'keepTerminology');
              }}
              className="
                w-3.5 h-3.5 rounded border border-[#313244] bg-[#181825]
                accent-[#22c55e] cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            />
            <label
              htmlFor="keep-terminology"
              title="When enabled, domain-specific terms and technical vocabulary are kept in their original language during reformulation."
              className="text-xs text-[#a6adc8] cursor-pointer select-none"
            >
              Keep terminology
            </label>
          </div>
        </>
      )}

      {action === 'summarize' && (
        <LengthSelector
          value={summarizeLength}
          onChange={(newLength) => {
            setSummarizeLength(newLength);
            persist({ defaultSummarizeLength: newLength }, 'defaultSummarizeLength');
          }}
          disabled={loading}
        />
      )}

      {/* Primary Run button */}
      <button
        onClick={run}
        disabled={!canRun}
        className="
          w-full py-2 rounded-md text-sm font-semibold
          bg-[#22c55e] text-[#1e1e2e]
          hover:brightness-110 active:brightness-95
          transition-[filter] duration-100
          focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:ring-offset-1 focus:ring-offset-[#1e1e2e]
          disabled:opacity-40 disabled:cursor-not-allowed
        "
      >
        {loading ? 'Processing...' : actionLabel}
      </button>

      {/* Processing indicator */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-2">
          <div
            className="w-4 h-4 rounded-full border-2 border-[#313244] border-t-[#22c55e] animate-spin"
            aria-label="Loading"
          />
          <span className="text-xs text-[#a6adc8]">
            Processing with {provider === 'openai' ? 'OpenAI' : 'Ollama'}...
          </span>
        </div>
      )}

      {/* Error display */}
      {error && !loading && (
        <div
          data-testid="error-banner"
          className="flex items-start gap-2 p-2 rounded-md border text-sm"
          style={{ borderColor: '#eab308', background: 'rgba(234,179,8,0.08)', color: '#eab308' }}
        >
          <span className="font-bold flex-shrink-0">!</span>
          <span>{error}</span>
        </div>
      )}

      {/* Result display */}
      {result && !loading && (
        <ResultDisplay
          originalText={result.originalText}
          resultText={result.resultText}
          model={result.model}
          totalTokens={result.totalTokens}
          elapsedMs={result.elapsedMs}
        />
      )}
    </div>
  );
}

// ============================================================
// Type narrowing helpers
// ============================================================

function isSuccessResponse(r: ServiceWorkerResponse): r is SuccessResponse {
  return r.success === true && 'result' in r && typeof (r as SuccessResponse).result === 'string';
}

function isErrorResponse(r: ServiceWorkerResponse): r is ErrorResponse {
  return r.success === false;
}
