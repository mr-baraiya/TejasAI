import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

export function ErrorAlert({ error, onDismiss, onRetry }) {
  if (!error) return null;

  return (
    <div className="relative rounded-none border border-red-200 bg-[#FFFFFF] p-4 sm:p-5 text-[#B91C1C] shadow-xs">
      <div className="flex items-start space-x-3">
        <div className="p-1.5 rounded-none bg-red-50 text-[#B91C1C] shrink-0 mt-0.5">
          <AlertCircle className="w-4 h-4" strokeWidth={1.75} />
        </div>

        <div className="flex-1 pr-6">
          <p className="text-sm font-semibold text-[#B91C1C]">
            Something went wrong. Please try again.
          </p>
          {error && error !== 'Something went wrong. Please try again.' && (
            <p className="mt-1 text-xs sm:text-sm text-[#374151] font-normal leading-relaxed">
              {error}
            </p>
          )}

          {onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className="min-h-[48px] inline-flex items-center px-4 py-2 rounded-none text-xs sm:text-sm font-medium bg-[#B91C1C] hover:bg-red-800 text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
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
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
}
