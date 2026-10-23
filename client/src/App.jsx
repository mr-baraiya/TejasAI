import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { PromptInput } from './components/PromptInput';
import { OutputDisplay } from './components/OutputDisplay';
import { HowItWorks } from './components/HowItWorks';
import { ExtensionSection } from './components/ExtensionSection';
import { ExamplesGallery } from './components/ExamplesGallery';
import { FaqSection } from './components/FaqSection';
import { RecentPrompts } from './components/RecentPrompts';
import { Footer } from './components/Footer';
import { ErrorAlert } from './components/ErrorAlert';
import { enhancePromptApi } from './services/api';
import { Check, ChevronUp } from 'lucide-react';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [targetAI, setTargetAI] = useState('any');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [whyBetter, setWhyBetter] = useState([]);
  const [lastOriginalPrompt, setLastOriginalPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Last 3 prompts in localStorage
  const [recentPrompts, setRecentPrompts] = useState(() => {
    try {
      const saved = localStorage.getItem('tejasai-recent-3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveToRecent = (newPrompt) => {
    if (!newPrompt.trim()) return;
    setRecentPrompts((prev) => {
      const filtered = prev.filter((p) => p.trim() !== newPrompt.trim());
      const updated = [newPrompt.trim(), ...filtered].slice(0, 3);
      try {
        localStorage.setItem('tejasai-recent-3', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearRecent = () => {
    setRecentPrompts([]);
    localStorage.removeItem('tejasai-recent-3');
  };

  // Toast notification
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef(null);

  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  const triggerToast = (msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    setShowToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Scroll to top button visibility
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Main prompt enhancement
  const handleEnhance = async (overridePrompt = null, tweakOption = '', prevResult = '') => {
    const textToEnhance = (overridePrompt !== null ? overridePrompt : prompt).trim();
    if (!textToEnhance) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    if (!overridePrompt && !tweakOption) {
      setLastOriginalPrompt(textToEnhance);
      saveToRecent(textToEnhance);
    }

    try {
      const data = await enhancePromptApi(
        {
          prompt: textToEnhance,
          targetAI,
          tweak: tweakOption,
          previousResult: prevResult,
        },
        controller.signal
      );

      setEnhancedPrompt(data.enhancedPrompt);
      setWhyBetter(data.whyBetter || []);

      // Smooth-scroll to result upon arrival
      setTimeout(() => {
        const resultsEl = document.getElementById('results-section');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } catch (err) {
      if (err.isCancelled) return;
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Quick tweak buttons (shorter, simpler, moreDetail)
  const handleTweak = (tweakType) => {
    if (!enhancedPrompt) return;
    handleEnhance(lastOriginalPrompt || prompt, tweakType, enhancedPrompt);
  };

  const handleSelectSample = (sampleSentence) => {
    setPrompt(sampleSentence);
    setError(null);
    const toolEl = document.getElementById('prompt-tool');
    if (toolEl) {
      toolEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 200);
  };

  const handleEdit = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNewPrompt = () => {
    setPrompt('');
    setEnhancedPrompt('');
    setWhyBetter([]);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#374151] flex flex-col justify-between selection:bg-[#C2410C] selection:text-white">

      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#C2410C] focus:text-white focus:rounded-none focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Toast Notification */}
      {showToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-50 max-w-sm bg-[#111827] text-white px-4 py-3 rounded-none shadow-sm flex items-center space-x-2.5 border border-[#374151]"
        >
          <Check className="w-4 h-4 text-[#15803D] shrink-0" strokeWidth={1.75} />
          <span className="text-xs sm:text-sm font-medium">
            {toastMessage}
          </span>
        </aside>
      )}

      {/* Header */}
      <Header
        onNewPrompt={handleNewPrompt}
        hasActivePrompt={Boolean(prompt.trim() || enhancedPrompt.trim())}
      />

      {/* Main Container */}
      <main id="main-content" className="w-full flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-16 lg:space-y-24">

          {/* Hero Section: Two columns on desktop (1024px+), above the fold */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pt-2 sm:pt-6">

            {/* Left column: Headline & Subtext */}
            <div className="lg:col-span-5 space-y-4 pt-1 lg:pt-4">
              <div className="font-mono text-xs font-semibold tracking-wider text-[#C2410C] uppercase">
                AI Prompt Enhancer &bull; Prompt Improver &bull; AI Productivity
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[46px] font-semibold text-[#111827] leading-[1.14] tracking-[-0.01em]">
                Say it simply. <br className="hidden sm:inline" />
                <span className="text-[#C2410C]">Ask AI better.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#374151] max-w-[65ch] leading-relaxed">
                TejasAI is the free AI prompt enhancer, prompt improver, and prompt generator. An intelligent AI writing assistant that transforms your thoughts into high-impact ChatGPT prompts, Claude instructions, and Gemini queries.
              </p>

              <p className="text-sm sm:text-base text-[#6B7280] max-w-[65ch] leading-relaxed">
                AI models give vague answers when given vague prompts. TejasAI quietly adds the right context, tone, and format so you get production-grade output on the first try—boosting your everyday AI productivity.
              </p>
            </div>

            {/* Right column: The Input Card */}
            <div id="prompt-tool" className="lg:col-span-7 space-y-3 scroll-mt-24">

              {/* Error Message with Retry */}
              {error && (
                <div className="mb-4">
                  <ErrorAlert
                    error={error}
                    onDismiss={() => setError(null)}
                    onRetry={() => handleEnhance()}
                  />
                </div>
              )}

              {/* The Input Card */}
              <PromptInput
                prompt={prompt}
                setPrompt={setPrompt}
                onEnhance={() => handleEnhance()}
                isLoading={isLoading}
                textareaRef={textareaRef}
              />

              {/* Recent prompts small text link */}
              <RecentPrompts
                recentPrompts={recentPrompts}
                onSelectPrompt={(selectedText) => {
                  setPrompt(selectedText);
                  if (textareaRef.current) textareaRef.current.focus();
                }}
                onClearRecent={handleClearRecent}
              />

            </div>

          </section>

          {/* Results Section (Smooth-scrolled to upon result arrival) */}
          <div id="results-section" className="scroll-mt-24">
            <OutputDisplay
              originalPrompt={lastOriginalPrompt || prompt}
              enhancedPrompt={enhancedPrompt}
              whyBetter={whyBetter}
              isLoading={isLoading}
              onRetry={() => handleEnhance(lastOriginalPrompt || prompt)}
              onEdit={handleEdit}
              onTweak={handleTweak}
              onShowToast={triggerToast}
            />
          </div>

          {/* Examples Section: 3 before/after cards */}
          <ExamplesGallery onSelectExample={handleSelectSample} />

          {/* How It Works Section: 3 numbered steps */}
          <HowItWorks />

          {/* Browser Extension Section: On-page direct download & setup */}
          <ExtensionSection />

          {/* FAQ Section */}
          <FaqSection />

        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#FFFFFF] border border-[#EDE8E1] hover:border-[#C2410C] text-[#C2410C] shadow-md hover:shadow-lg flex items-center justify-center transition-all hover:bg-[#FAF8F5] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C]"
        >
          <ChevronUp className="w-5 h-5" strokeWidth={2.25} />
        </button>
      )}

    </div>
  );
}
