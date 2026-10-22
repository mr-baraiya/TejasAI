import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, BookOpen, ShoppingBag, Utensils } from 'lucide-react';

const CHIPS = [
  {
    id: 'email',
    label: 'Write an email',
    icon: Mail,
    sample: 'Write a sick leave application email to my manager for 2 days due to fever.',
  },
  {
    id: 'study',
    label: 'Help me study',
    icon: BookOpen,
    sample: 'Explain how photosynthesis works with a simple everyday example for my science class.',
  },
  {
    id: 'product',
    label: 'Product description',
    icon: ShoppingBag,
    sample: 'Write a friendly 3-sentence description for handmade cotton kurtas for my online shop.',
  },
  {
    id: 'recipe',
    label: 'Recipe idea',
    icon: Utensils,
    sample: 'Give me a healthy 15-minute breakfast idea using oats, milk, and seasonal fruits.',
  },
];

const AI_OPTIONS = [
  { id: 'any', label: 'Any AI' },
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'claude', label: 'Claude' },
];

export function CategorySelector({
  onSelectSample,
  targetAI,
  setTargetAI,
  disabled,
}) {
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs font-medium text-[#6B7280] mb-2 block">
          Or start from an example:
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CHIPS.map((chip) => {
            const IconComponent = chip.icon;
            return (
              <button
                key={chip.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectSample(chip.sample)}
                className="h-10 px-3 rounded-[8px] border border-[#E7E0D6] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#374151] text-xs font-medium transition-colors flex items-center space-x-2 cursor-pointer truncate"
              >
                <IconComponent className="w-3.5 h-3.5 text-[#6B7280] shrink-0" strokeWidth={1.75} />
                <span className="truncate">{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowMoreOptions((prev) => !prev)}
          className="inline-flex items-center space-x-1 text-xs font-medium text-[#6B7280] hover:text-[#111827] cursor-pointer py-1"
        >
          <span>{showMoreOptions ? 'Fewer options' : 'More options'}</span>
          {showMoreOptions ? (
            <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.75} />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} />
          )}
        </button>

        {showMoreOptions && (
          <div className="mt-2.5 p-3 rounded-[8px] border border-[#E7E0D6] bg-[#FAF8F5] space-y-2">
            <span className="text-xs font-medium text-[#111827] block">
              Which AI will you use?
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AI_OPTIONS.map((choice) => {
                const isSelected = targetAI === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setTargetAI(choice.id)}
                    className={`h-9 px-2.5 rounded-[8px] text-xs font-medium text-center border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#111827] text-white border-[#111827]'
                        : 'bg-[#FFFFFF] text-[#374151] border-[#E7E0D6] hover:bg-[#F3EFEA]'
                    }`}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
