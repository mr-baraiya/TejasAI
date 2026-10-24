import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, X, ArrowRight, Star } from 'lucide-react';

export function PromptInput({
  prompt,
  setPrompt,
  onEnhance,
  isLoading,
  textareaRef,
  onOpenFavorites,
}) {
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setHasSpeechSupport(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setPrompt((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    } else {
      setHasSpeechSupport(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [setPrompt]);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.start();
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleClear = () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }
    setPrompt('');
    if (textareaRef?.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && prompt.trim()) {
        onEnhance();
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Human, authentic label */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="prompt-input"
          className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]"
        >
          Your rough draft or question
        </label>
        <span className="text-xs text-[#9CA3AF]">
          Plain text, questions, or notes
        </span>
      </div>

      {/* Writing Canvas with integrated subtle action bar */}
      <div className="border border-[#EDE8E1] bg-[#FFFFFF] focus-within:border-[#111827] transition-colors shadow-xs">
        <textarea
          id="prompt-input"
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={5}
          placeholder="What are you trying to accomplish? Write in your everyday voice—no prompt engineering or technical phrasing needed..."
          className="w-full bg-transparent p-4 sm:p-5 text-sm sm:text-base text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 leading-relaxed min-h-[140px] resize-none"
        />

        {/* Clean Integrated Action Bar */}
        <div className="px-4 py-3 border-t border-[#EDE8E1]/60 flex items-center justify-between gap-3 bg-[#FAF8F5]/60">
          {/* Left tools: Speech recognition & Clear & Desktop shortcut */}
          <div className="flex items-center space-x-3 text-xs text-[#6B7280]">
            {hasSpeechSupport && (
              <button
                type="button"
                onClick={toggleMic}
                disabled={isLoading}
                title={isListening ? 'Stop listening' : 'Dictate your prompt'}
                aria-label={isListening ? 'Stop listening' : 'Dictate your prompt'}
                className={`flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  isListening
                    ? 'text-[#C2410C]'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-[#C2410C]" strokeWidth={2} />
                    <span className="text-[11px] font-mono font-semibold text-[#C2410C] animate-pulse">
                      Listening...
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span className="hidden sm:inline text-[11px]">Dictate</span>
                  </>
                )}
              </button>
            )}

            {prompt && prompt.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                title="Clear text"
                aria-label="Clear text"
                className="flex items-center space-x-1 text-[11px] text-[#6B7280] hover:text-[#B91C1C] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Clear</span>
              </button>
            )}

            {onOpenFavorites && (
              <button
                type="button"
                onClick={onOpenFavorites}
                disabled={isLoading}
                title="Open saved favorite prompts"
                className="flex items-center space-x-1 text-[11px] text-[#6B7280] hover:text-[#D97706] transition-colors cursor-pointer"
              >
                <Star className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">Favorites</span>
              </button>
            )}

            <span className="hidden lg:inline text-[11px] text-[#9CA3AF]">
              Ctrl + Enter
            </span>
          </div>

          {/* Right: Authoritative Ink-Black Button */}
          <button
            type="button"
            onClick={() => onEnhance()}
            disabled={isLoading || !prompt.trim()}
            className={`h-9 px-4 font-medium text-xs sm:text-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
              isLoading || !prompt.trim()
                ? 'bg-[#EDE7DD] text-[#8A8178] cursor-not-allowed'
                : 'bg-[#C2410C] hover:bg-[#9A3412] text-white shadow-xs'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-current" strokeWidth={2} />
                <span>Enhancing...</span>
              </>
            ) : (
              <>
                <span>Make it better</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Subtle Privacy Footnote */}
      <p className="text-xs text-[#9CA3AF] leading-relaxed">
        Private by design &bull; Processed in real-time over encrypted HTTPS &bull; Never stored
      </p>
    </div>
  );
}
