import React, { useState } from 'react';
import { CaretDown, CaretUp, ArrowUpRight } from '@phosphor-icons/react';

export function RecentPrompts({
  recentPrompts = [],
  onSelectPrompt,
  onClearRecent,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

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
          <CaretUp className="w-3.5 h-3.5" />
        ) : (
          <CaretDown className="w-3.5 h-3.5" />
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
            {recentPrompts.map((item, index) => {
              const isHovered = hoveredIndex === index;
              return (
                <div
                  key={index}
                  className="w-full py-2 px-0.5 text-xs sm:text-sm flex items-center justify-between"
                >
                  <button
                    type="button"
                    onClick={() => onSelectPrompt(item)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(index)}
                    onBlur={() => setHoveredIndex(null)}
                    className="truncate pr-4 text-left text-[#4B5563] hover:text-[#111827] cursor-pointer flex-1"
                    title={item}
                  >
                    &ldquo;{item}&rdquo;
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectPrompt(item)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(index)}
                    onBlur={() => setHoveredIndex(null)}
                    style={{
                      opacity: isHovered ? 1 : 0,
                      visibility: isHovered ? 'visible' : 'hidden',
                      pointerEvents: isHovered ? 'auto' : 'none',
                    }}
                    className="text-[11px] font-mono text-[#C2410C] hover:text-[#9A3412] shrink-0 flex items-center gap-0.5 cursor-pointer transition-opacity duration-150"
                  >
                    <span>Restore</span>
                    <ArrowUpRight className="w-3 h-3" weight="bold" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
