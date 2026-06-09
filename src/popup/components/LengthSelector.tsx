// src/popup/components/LengthSelector.tsx
// Reusable summarize-length dropdown component.

import React from 'react';
import type { SummarizeLength } from '../../shared/types.ts';
import { SUMMARIZE_LENGTHS, SUMMARIZE_LENGTH_LABELS } from '../../shared/constants.ts';

interface LengthSelectorProps {
  value: SummarizeLength;
  onChange: (value: SummarizeLength) => void;
  disabled?: boolean;
}

export function LengthSelector({
  value,
  onChange,
  disabled = false,
}: LengthSelectorProps): React.ReactElement {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onChange(e.target.value as SummarizeLength);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-[#a6adc8] uppercase tracking-wide">
        Summary length
      </label>
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="
          bg-[#181825] text-[#cdd6f4] border border-[#313244]
          rounded-md px-2 py-1.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-[#22c55e] focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer
        "
      >
        {SUMMARIZE_LENGTHS.map((length) => (
          <option key={length} value={length}>
            {SUMMARIZE_LENGTH_LABELS[length]}
          </option>
        ))}
      </select>
    </div>
  );
}
