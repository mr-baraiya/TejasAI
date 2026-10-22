import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  Edit3,
  ChevronDown,
  ChevronUp,
  Share2,
  ExternalLink,
  Scissors,
  Smile,
  PlusCircle,
} from 'lucide-react';

export function OutputDisplay({
  originalPrompt,
  enhancedPrompt,
  whyBetter = [],
  isLoading,
  onRetry,
  onEdit,
  onTweak,
  onShowToast,
}) {
  const [copied, setCopied] = useState(false);
  const [showWhyBetter, setShowWhyBetter] = useState(true);

  // Skeleton loading view
  if (isLoading && !enhancedPrompt) {
    return (
      <div className="pt-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          <div className="rounded-[12px] border border-[#E7E0D6] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs space-y-3">
            <div className="h-4 w-28 bg-[#E7E0D6] rounded-[4px] animate-pulse"></div>
            <div className="h-4 w-full bg-[#FAF8F5] rounded-[4px] animate-pulse"></div>
            <div className="h-4 w-3/4 bg-[#FAF8F5] rounded-[4px] animate-pulse"></div>
          </div>
          <div className="rounded-[12px] border border-[#E7E0D6] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs space-y-3">
            <div className="h-4 w-32 bg-[#E7E0D6] rounded-[4px] animate-pulse"></div>
            <div className="h-4 w-full bg-[#FAF8F5] rounded-[4px] animate-pulse"></div>
            <div className="h-4 w-5/6 bg-[#FAF8F5] rounded-[4px] animate-pulse"></div>
            <div className="h-4 w-2/3 bg-[#FAF8F5] rounded-[4px] animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!enhancedPrompt) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(enhancedPrompt);
      setCopied(true);
      if (onShowToast) onShowToast('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = enhancedPrompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      if (onShowToast) onShowToast('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const chatGptUrl = `https://chatgpt.com/?q=${encodeURIComponent(enhancedPrompt)}`;
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(enhancedPrompt)}`;

  return (
    <div className="space-y-6 pt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        
        {/* Card 1: What you wrote */}
        <div className="rounded-[12px] border border-[#E7E0D6] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs flex flex-col justify-start">
          <div className="pb-3 mb-3 border-b border-[#E7E0D6]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              What you wrote
            </h3>
          </div>
          <p className="text-sm sm:text-base text-[#374151] leading-relaxed whitespace-pre-wrap">
            {originalPrompt}
          </p>
        </div>

        {/* Card 2: Better version */}
        <div className="rounded-[12px] border border-[#E7E0D6] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="pb-3 border-b border-[#E7E0D6] flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
                Better version
              </h3>
            </div>

            <div className="text-sm sm:text-base text-[#111827] font-normal leading-relaxed whitespace-pre-wrap selection:bg-[#C2410C] selection:text-white">
              {enhancedPrompt}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3.5 border-t border-[#E7E0D6] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Primary Actions: sleek h-8 buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`h-8 px-3 rounded-[6px] font-medium text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs ${
                    copied
                      ? 'bg-[#15803D] text-white border border-[#15803D]'
                      : 'bg-[#C2410C] hover:bg-[#9A3412] text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Copy prompt</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onRetry}
                  disabled={isLoading}
                  className="h-8 px-2.5 rounded-[6px] text-xs font-medium text-[#374151] bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#E7E0D6] flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
                  <span>Try again</span>
                </button>

                <button
                  type="button"
                  onClick={onEdit}
                  className="h-8 px-2.5 rounded-[6px] text-xs font-medium text-[#374151] bg-[#FFFFFF] hover:bg-[#FAF8F5] border border-[#E7E0D6] flex items-center space-x-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Edit</span>
                </button>
              </div>

              {/* External Links */}
              <div className="flex items-center gap-1.5 text-xs">
                <a
                  href={chatGptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-2.5 rounded-[6px] border border-[#E7E0D6] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#374151] flex items-center space-x-1"
                >
                  <span>Open in ChatGPT</span>
                  <ExternalLink className="w-3 h-3 text-[#6B7280]" strokeWidth={1.75} />
                </a>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-2.5 rounded-[6px] border border-[#E7E0D6] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#374151] flex items-center space-x-1"
                >
                  <Share2 className="w-3 h-3 text-[#6B7280]" strokeWidth={1.75} />
                  <span>Share</span>
                </a>
              </div>
            </div>

            {/* Quick Tweaks */}
            <div className="pt-2 border-t border-[#E7E0D6] flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-[#6B7280] mr-1">Tweak:</span>
              <button
                type="button"
                onClick={() => onTweak('shorter')}
                disabled={isLoading}
                className="h-7 px-2.5 rounded-[5px] border border-[#E7E0D6] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-medium text-[#374151] flex items-center space-x-1 cursor-pointer"
              >
                <Scissors className="w-3 h-3 text-[#6B7280]" strokeWidth={1.75} />
                <span>Shorter</span>
              </button>
              <button
                type="button"
                onClick={() => onTweak('simpler')}
                disabled={isLoading}
                className="h-7 px-2.5 rounded-[5px] border border-[#E7E0D6] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-medium text-[#374151] flex items-center space-x-1 cursor-pointer"
              >
                <Smile className="w-3 h-3 text-[#6B7280]" strokeWidth={1.75} />
                <span>Simpler</span>
              </button>
              <button
                type="button"
                onClick={() => onTweak('moreDetail')}
                disabled={isLoading}
                className="h-7 px-2.5 rounded-[5px] border border-[#E7E0D6] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-medium text-[#374151] flex items-center space-x-1 cursor-pointer"
              >
                <PlusCircle className="w-3 h-3 text-[#6B7280]" strokeWidth={1.75} />
                <span>More detail</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion: Why is this better? */}
      {whyBetter && whyBetter.length > 0 && (
        <div className="rounded-[12px] border border-[#E7E0D6] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs">
          <button
            type="button"
            onClick={() => setShowWhyBetter((prev) => !prev)}
            className="w-full flex items-center justify-between text-left text-sm font-semibold text-[#111827] cursor-pointer"
          >
            <span>Why this version works better</span>
            {showWhyBetter ? (
              <ChevronUp className="w-4 h-4 text-[#6B7280]" strokeWidth={1.75} />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6B7280]" strokeWidth={1.75} />
            )}
          </button>

          {showWhyBetter && (
            <ul className="mt-3 space-y-2 text-sm text-[#374151] border-t border-[#E7E0D6] pt-3">
              {whyBetter.map((bullet, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-[#C2410C] font-semibold">•</span>
                  <span className="leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
