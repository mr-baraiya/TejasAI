import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';

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
    <div className="pt-1">
      {/* Small muted text link */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center space-x-1.5 text-xs text-[#6B7280] hover:text-[#111827] cursor-pointer transition-colors"
      >
        <span>Recent drafts ({recentPrompts.length})</span>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.75} />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} />
        )}
      </button>

      {/* Expanded list - Clean, open list with zero boxes */}
      {isOpen && (
        <div className="mt-2 pt-2 border-t border-[#EDE8E1] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#9CA3AF]">
            <span>Saved locally on this device</span>
            <button
              type="button"
              onClick={onClearRecent}
              className="text-[#9CA3AF] hover:text-[#B91C1C] transition-colors cursor-pointer"
            >
              Clear history
            </button>
          </div>

          <div className="divide-y divide-[#EDE8E1]/60">
            {recentPrompts.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSelectPrompt(item)}
                className="w-full text-left py-2 px-0.5 text-xs sm:text-sm text-[#4B5563] hover:text-[#111827] flex items-center justify-between group transition-colors cursor-pointer"
              >
                <span className="truncate pr-4 leading-relaxed">
                  &ldquo;{item}&rdquo;
                </span>
                <span className="text-[11px] font-mono text-[#C2410C] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex items-center gap-0.5">
                  <span>Restore</span>
                  <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
