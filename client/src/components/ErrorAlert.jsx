import React from 'react';
import { WarningCircle, ArrowsClockwise, X } from '@phosphor-icons/react';

export function ErrorAlert({ error, onDismiss, onRetry }) {
  if (!error) return null;

  const isPolicyRefusal =
    typeof error === 'string' &&
    (error.includes('content policy') || error.startsWith('We cannot enhance this request') || error.includes('Content Policy'));

  return (
    <div
      className={`relative rounded-none border p-4 sm:p-5 shadow-xs ${
        isPolicyRefusal
          ? 'border-amber-300 bg-[#FFFDF5] text-[#92400E]'
          : 'border-red-200 bg-[#FFFFFF] text-[#B91C1C]'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div
          className={`p-1.5 rounded-none shrink-0 mt-0.5 ${
            isPolicyRefusal
              ? 'bg-amber-100 text-[#B45309]'
              : 'bg-red-50 text-[#B91C1C]'
          }`}
        >
          <WarningCircle className="w-4 h-4" />
        </div>

        <div className="flex-1 pr-6">
          <p
            className={`text-sm font-semibold ${
              isPolicyRefusal ? 'text-[#92400E]' : 'text-[#B91C1C]'
            }`}
          >
            {isPolicyRefusal ? 'Notice' : 'Something went wrong. Please try again.'}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-[#374151] font-normal leading-relaxed">
            {error}
          </p>

          {!isPolicyRefusal && onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className="min-h-[48px] inline-flex items-center px-4 py-2 rounded-none text-xs sm:text-sm font-medium bg-[#B91C1C] hover:bg-red-800 text-white transition-colors cursor-pointer"
              >
                <ArrowsClockwise className="w-3.5 h-3.5 mr-1.5" />
                <span>Try again</span>
              </button>
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="absolute top-4 right-4 p-1 text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
