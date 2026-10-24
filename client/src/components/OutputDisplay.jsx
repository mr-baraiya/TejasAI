import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  ArrowCounterClockwise,
  PencilSimple,
  CaretDown,
  CaretUp,
  ShareNetwork,
  Scissors,
  Smiley,
  PlusCircle,
  WhatsappLogo,
  Star,
} from '@phosphor-icons/react';
import { isFavorite, toggleFavorite } from '../services/favoritesService';

const AI_TOOLS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    getUrl: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
    title: 'Open prompt in ChatGPT',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    getUrl: (prompt) => `https://gemini.google.com/app?prompt=${encodeURIComponent(prompt)}`,
    title: 'Open Gemini (Prompt copied to clipboard - press Ctrl+V to paste)',
  },
  {
    id: 'claude',
    name: 'Claude',
    getUrl: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
    title: 'Open prompt in Claude',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    getUrl: (prompt) => `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`,
    title: 'Open prompt in Perplexity',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    getUrl: (prompt) => `https://chat.deepseek.com/?q=${encodeURIComponent(prompt)}`,
    title: 'Open DeepSeek (Prompt copied to clipboard - press Ctrl+V to paste)',
  },
  {
    id: 'grok',
    name: 'Grok',
    getUrl: (prompt) => `https://grok.com/?q=${encodeURIComponent(prompt)}`,
    title: 'Open Grok (Prompt copied to clipboard - press Ctrl+V to paste)',
  },
];

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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const shareContainerRef = useRef(null);

  const isStarred = isFavorite(enhancedPrompt);

  const handleToggleFavorite = () => {
    if (!enhancedPrompt) return;
    try {
      const res = toggleFavorite({
        prompt: enhancedPrompt,
        title: originalPrompt ? originalPrompt.slice(0, 45) : 'Enhanced Prompt',
        whyBetter,
        source: 'enhancer',
      });
      if (onShowToast) {
        onShowToast(res.isStarred ? 'Saved to Favorites!' : 'Removed from Favorites.');
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Could not save favorite.');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareContainerRef.current && !shareContainerRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showShareMenu]);

  // Skeleton loading view
  if (isLoading && !enhancedPrompt) {
    return (
      <div className="pt-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="space-y-3">
            <div className="h-3 w-24 bg-[#EDE8E1] animate-pulse"></div>
            <div className="h-4 w-full bg-[#EDE8E1]/60 animate-pulse"></div>
            <div className="h-4 w-3/4 bg-[#EDE8E1]/60 animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <div className="h-3 w-28 bg-[#EDE8E1] animate-pulse"></div>
            <div className="h-4 w-full bg-[#EDE8E1]/60 animate-pulse"></div>
            <div className="h-4 w-5/6 bg-[#EDE8E1]/60 animate-pulse"></div>
            <div className="h-4 w-2/3 bg-[#EDE8E1]/60 animate-pulse"></div>
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

  const getWhatsAppShareUrl = () => {
    const maxLen = 1200;
    const body =
      enhancedPrompt.length > maxLen
        ? `${enhancedPrompt.slice(0, maxLen)}...\n\n(Enhanced with TejasAI)`
        : `${enhancedPrompt}\n\n(Enhanced with TejasAI)`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(body)}`;
  };

  const getTwitterShareUrl = () => {
    const maxLen = 220;
    const body =
      enhancedPrompt.length > maxLen
        ? `${enhancedPrompt.slice(0, maxLen)}...`
        : enhancedPrompt;
    const tweet = `Check out this prompt enhanced with TejasAI:\n\n"${body}"`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
  };

  const handleShareClick = async () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(
      typeof navigator !== 'undefined' ? navigator.userAgent : ''
    );
    if (isMobile && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'TejasAI Enhanced Prompt',
          text: enhancedPrompt,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    setShowShareMenu((prev) => !prev);
  };

  const handleShareCopy = async () => {
    try {
      await navigator.clipboard.writeText(enhancedPrompt);
      setShareCopied(true);
      if (onShowToast) onShowToast('Prompt copied to clipboard');
      setTimeout(() => {
        setShareCopied(false);
        setShowShareMenu(false);
      }, 1200);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = enhancedPrompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShareCopied(true);
      if (onShowToast) onShowToast('Prompt copied to clipboard');
      setTimeout(() => {
        setShareCopied(false);
        setShowShareMenu(false);
      }, 1200);
    }
  };

  const handleOpenAi = (tool) => {
    let copied = false;
    try {
      const textArea = document.createElement('textarea');
      textArea.value = enhancedPrompt;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      copied = document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch {
      // ignore
    }

    if (!copied && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(enhancedPrompt).catch(() => {});
    }

    if (onShowToast) {
      if (tool.id === 'gemini') {
        onShowToast('Prompt copied! In Gemini, press Ctrl+V to paste');
      } else if (tool.id === 'deepseek') {
        onShowToast('Prompt copied! In DeepSeek, press Ctrl+V to paste');
      } else if (tool.id === 'grok') {
        onShowToast('Prompt copied! In Grok, press Ctrl+V to paste');
      } else {
        onShowToast(`Opening ${tool.name}... (Prompt copied to clipboard)`);
      }
    }
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        
        {/* Column 1: What you wrote (Open, unboxed) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold tracking-wider text-[#C2410C] uppercase">
              Draft
            </span>
            <span className="text-xs font-mono text-[#9CA3AF]">
              What you wrote
            </span>
          </div>
          <p className="text-sm sm:text-base text-[#6B7280] italic leading-relaxed whitespace-pre-wrap">
            &ldquo;{originalPrompt}&rdquo;
          </p>
        </div>

        {/* Column 2: Better version (Open, unboxed) */}
        <div className="space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold tracking-wider text-[#C2410C] uppercase">
                Enhanced
              </span>
              <span className="text-xs font-mono text-[#9CA3AF]">
                Precision prompt
              </span>
            </div>

            <div className="text-sm sm:text-base text-[#111827] font-normal leading-relaxed whitespace-pre-wrap selection:bg-[#C2410C] selection:text-white">
              {enhancedPrompt}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3.5 border-t border-[#EDE8E1] space-y-2.5">
            <div className="flex items-center justify-between gap-1 sm:gap-2 flex-nowrap overflow-x-auto scrollbar-none">
              {/* Primary Actions: sleek sharp buttons */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`h-8 px-2 sm:px-3 rounded-none font-medium text-xs transition-colors flex items-center justify-center space-x-1 sm:space-x-1.5 cursor-pointer shadow-xs shrink-0 whitespace-nowrap ${
                    copied
                      ? 'bg-[#15803D] text-white border border-[#15803D]'
                      : 'bg-[#C2410C] hover:bg-[#9A3412] text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" weight="bold" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy<span className="hidden sm:inline"> prompt</span></span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onRetry}
                  disabled={isLoading}
                  className="h-8 px-1.5 sm:px-2.5 rounded-none text-xs font-medium text-[#4B5563] hover:text-[#111827] hover:bg-[#FAF8F5] flex items-center space-x-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
                >
                  <ArrowCounterClockwise className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Try<span className="hidden sm:inline"> again</span></span>
                </button>

                <button
                  type="button"
                  onClick={onEdit}
                  className="h-8 px-1.5 sm:px-2.5 rounded-none text-xs font-medium text-[#4B5563] hover:text-[#111827] hover:bg-[#FAF8F5] flex items-center space-x-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
                >
                  <PencilSimple className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`h-8 px-1.5 sm:px-2.5 rounded-none text-xs font-medium flex items-center space-x-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                    isStarred
                      ? 'text-[#D97706] hover:bg-[#FEF3C7]'
                      : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#FAF8F5]'
                  }`}
                  title={isStarred ? 'Remove from favorites' : 'Save to favorites'}
                >
                  <Star className={`w-3.5 h-3.5 ${isStarred ? 'text-[#D97706]' : ''}`} weight={isStarred ? 'fill' : 'regular'} />
                  <span>{isStarred ? 'Saved' : 'Favorite'}</span>
                </button>
              </div>

              {/* Share */}
              <div className="relative shrink-0" ref={shareContainerRef}>
                <button
                  type="button"
                  onClick={handleShareClick}
                  className="h-8 px-1.5 sm:px-2.5 rounded-none text-xs font-medium text-[#4B5563] hover:text-[#111827] hover:bg-[#FAF8F5] flex items-center space-x-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
                  aria-label="Share enhanced prompt"
                  aria-expanded={showShareMenu}
                >
                  <ShareNetwork className="w-3.5 h-3.5 text-[#6B7280]" />
                  <span>Share</span>
                </button>

                  {showShareMenu && (
                    <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#FFFFFF] border border-[#EDE8E1] rounded-none shadow-lg py-1.5 z-30">
                      <button
                        type="button"
                        onClick={handleShareCopy}
                        className="w-full px-3 py-2 text-xs text-[#374151] hover:bg-[#FAF8F5] flex items-center justify-between transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center space-x-2.5">
                          {shareCopied ? (
                            <Check className="w-3.5 h-3.5 text-[#15803D]" weight="bold" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#6B7280]" />
                          )}
                          <span className={shareCopied ? 'text-[#15803D] font-medium' : ''}>
                            {shareCopied ? 'Copied to clipboard' : 'Copy prompt text'}
                          </span>
                        </div>
                      </button>

                      <a
                        href={getWhatsAppShareUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowShareMenu(false)}
                        className="w-full px-3 py-2 text-xs text-[#374151] hover:bg-[#FAF8F5] flex items-center space-x-2.5 transition-colors text-left"
                      >
                        <WhatsappLogo className="w-3.5 h-3.5 text-[#25D366]" weight="fill" />
                        <span>Share on WhatsApp</span>
                      </a>

                      <a
                        href={getTwitterShareUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowShareMenu(false)}
                        className="w-full px-3 py-2 text-xs text-[#374151] hover:bg-[#FAF8F5] flex items-center space-x-2.5 transition-colors text-left"
                      >
                        <svg className="w-3.5 h-3.5 text-[#111827] fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span>Share on X</span>
                      </a>

                      {typeof navigator !== 'undefined' && !!navigator.share && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.share({
                                title: 'TejasAI Enhanced Prompt',
                                text: enhancedPrompt,
                              });
                            } catch (err) {
                              if (err.name !== 'AbortError') console.warn(err);
                            }
                            setShowShareMenu(false);
                          }}
                          className="w-full px-3 py-2 text-xs text-[#374151] hover:bg-[#FAF8F5] flex items-center space-x-2.5 transition-colors text-left border-t border-[#EDE8E1] mt-1 pt-2 cursor-pointer"
                        >
                          <ShareNetwork className="w-3.5 h-3.5 text-[#6B7280]" />
                          <span>More device options...</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

            {/* Supported Platforms Launch Bar (Clean text links, no boxes, no icons, fits all in one line) */}
            <div className="pt-2.5 border-t border-[#EDE8E1] space-y-1">
              <div className="flex items-center gap-2 sm:gap-2.5 text-xs flex-nowrap overflow-x-auto scrollbar-none py-0.5">
                <span className="text-[11px] font-medium text-[#6B7280] shrink-0">
                  Open in:
                </span>
                {AI_TOOLS.map((tool) => (
                  <a
                    key={tool.id}
                    href={tool.getUrl(enhancedPrompt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleOpenAi(tool)}
                    title={tool.title}
                    aria-label={tool.title}
                    className="text-xs font-medium text-[#4B5563] hover:text-[#C2410C] hover:underline transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    {tool.name}
                  </a>
                ))}
              </div>
              <p className="text-[10px] text-[#9CA3AF] leading-tight">
                Independent tool. Not affiliated with or endorsed by OpenAI, Google, Anthropic, Perplexity, DeepSeek, or xAI.
              </p>
            </div>

            {/* Quick Tweaks */}
            <div className="pt-2 border-t border-[#EDE8E1] flex items-center gap-1 sm:gap-1.5 flex-nowrap overflow-x-auto scrollbar-none text-xs">
              <span className="text-xs text-[#6B7280] mr-0.5 shrink-0">Tweak:</span>
              <button
                type="button"
                onClick={() => onTweak('shorter')}
                disabled={isLoading}
                className="h-7 px-1.5 sm:px-2 rounded-none hover:bg-[#FAF8F5] text-xs font-medium text-[#4B5563] hover:text-[#111827] flex items-center space-x-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
              >
                <Scissors className="w-3 h-3 text-[#6B7280]" />
                <span>Shorter</span>
              </button>
              <button
                type="button"
                onClick={() => onTweak('simpler')}
                disabled={isLoading}
                className="h-7 px-1.5 sm:px-2 rounded-none hover:bg-[#FAF8F5] text-xs font-medium text-[#4B5563] hover:text-[#111827] flex items-center space-x-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
              >
                <Smiley className="w-3 h-3 text-[#6B7280]" />
                <span>Simpler</span>
              </button>
              <button
                type="button"
                onClick={() => onTweak('moreDetail')}
                disabled={isLoading}
                className="h-7 px-1.5 sm:px-2 rounded-none hover:bg-[#FAF8F5] text-xs font-medium text-[#4B5563] hover:text-[#111827] flex items-center space-x-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
              >
                <PlusCircle className="w-3 h-3 text-[#6B7280]" />
                <span><span className="hidden sm:inline">More </span>Detail</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion: Why this version works better — Open, unboxed */}
      {whyBetter && whyBetter.length > 0 && (
        <div className="border-t border-[#EDE8E1] pt-6 mt-8">
          <button
            type="button"
            onClick={() => setShowWhyBetter((prev) => !prev)}
            className="w-full flex items-center justify-between text-left group cursor-pointer"
          >
            <span className="font-serif text-base sm:text-lg font-semibold text-[#111827] group-hover:text-[#C2410C] transition-colors">
              Why this version works better
            </span>
            {showWhyBetter ? (
              <CaretUp className="w-4 h-4 text-[#6B7280] group-hover:text-[#C2410C] transition-colors" />
            ) : (
              <CaretDown className="w-4 h-4 text-[#6B7280] group-hover:text-[#C2410C] transition-colors" />
            )}
          </button>

          {showWhyBetter && (
            <ul className="mt-4 space-y-2.5 text-sm sm:text-base text-[#4B5563]">
              {whyBetter.map((bullet, idx) => (
                <li key={idx} className="flex items-start space-x-2.5">
                  <span className="text-[#C2410C] font-semibold select-none">&bull;</span>
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
