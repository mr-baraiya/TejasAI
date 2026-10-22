import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

export function PromptInput({
  prompt,
  setPrompt,
  onEnhance,
  isLoading,
  textareaRef,
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

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && prompt.trim()) {
        onEnhance();
      }
    }
  };

  return (
    <div className="rounded-[12px] border border-[#E7E0D6] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs space-y-4">
      {/* Label */}
      <label
        htmlFor="prompt-input"
        className="block text-sm font-medium text-[#111827]"
      >
        What do you want to ask or write?
      </label>

      {/* Textarea container with mic */}
      <div className="relative">
        <textarea
          id="prompt-input"
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={5}
          placeholder="e.g. Write a polite email to my manager asking for a sick leave for 2 days due to fever..."
          className="w-full bg-[#FFFFFF] rounded-[8px] border border-[#E7E0D6] p-3.5 pb-12 text-sm sm:text-base text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/20 leading-relaxed min-h-[140px] resize-y"
        />

        {/* Mic button inside textarea */}
        {hasSpeechSupport && (
          <div className="absolute bottom-3 right-3 flex items-center space-x-2">
            {isListening && (
              <span className="text-xs font-medium text-[#C2410C] animate-pulse">
                Listening...
              </span>
            )}
            <button
              type="button"
              onClick={toggleMic}
              disabled={isLoading}
              title={isListening ? 'Stop listening' : 'Speak your prompt'}
              aria-label={isListening ? 'Stop listening' : 'Speak your prompt'}
              className={`p-2 rounded-[6px] text-xs transition-colors flex items-center justify-center cursor-pointer border ${
                isListening
                  ? 'bg-[#C2410C] text-white border-[#C2410C]'
                  : 'bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#6B7280] hover:text-[#111827] border-[#E7E0D6]'
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-white" strokeWidth={1.75} />
              ) : (
                <Mic className="w-4 h-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Footer row with Primary Button */}
      <div className="pt-2 border-t border-[#E7E0D6] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Ctrl + Enter hint on desktop */}
        <span className="hidden lg:inline text-xs text-[#6B7280]">
          Ctrl + Enter to submit
        </span>

        {/* Primary button: compact, sleek h-9, 6px radius */}
        <button
          type="button"
          onClick={() => onEnhance()}
          disabled={isLoading || !prompt.trim()}
          className={`h-9 px-4 rounded-[6px] font-medium text-xs sm:text-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer w-full sm:w-auto ${
            isLoading || !prompt.trim()
              ? 'bg-[#EDE7DD] text-[#8A8178] cursor-not-allowed border border-[#EDE7DD]'
              : 'bg-[#C2410C] hover:bg-[#9A3412] text-white shadow-xs'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-current" strokeWidth={1.75} />
              <span>Improving...</span>
            </>
          ) : (
            <span>Make it better</span>
          )}
        </button>
      </div>

      {/* Single Privacy line under button */}
      <p className="text-xs text-[#6B7280] leading-relaxed pt-1">
        We don&apos;t store your text on our servers. It is processed by an AI provider to create your result.
      </p>
    </div>
  );
}
