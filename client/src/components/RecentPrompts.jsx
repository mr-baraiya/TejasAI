import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function RecentPrompts({
  recentPrompts = [],
  onSelectPrompt,
  onClearRecent,
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!recentPrompts || recentPrompts.length === 0) {
    return null;
  }

  return (
    <div className="pt-2">
      {/* Small muted text link */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center space-x-1.5 text-xs font-medium text-[#6B7280] hover:text-[#111827] cursor-pointer"
      >
        <span>Recent prompts ({recentPrompts.length})</span>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.75} />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} />
        )}
      </button>

      {/* Expanded list */}
      {isOpen && (
        <div className="mt-2.5 p-3.5 rounded-[12px] border border-[#E7E0D6] bg-[#FFFFFF] shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[#6B7280] pb-1 border-b border-[#E7E0D6]">
            <span>Saved only on this device.</span>
            <button
              type="button"
              onClick={onClearRecent}
              className="text-[#6B7280] hover:text-[#B91C1C] transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="space-y-1.5">
            {recentPrompts.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSelectPrompt(item)}
                className="w-full text-left p-2.5 rounded-[8px] border border-[#E7E0D6] bg-[#FAF8F5] hover:bg-[#FFFFFF] hover:border-[#D4CCC0] text-xs sm:text-sm text-[#374151] transition-colors truncate block cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
