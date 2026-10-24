import React, { useState, useMemo } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { PROMPT_TEMPLATES } from '../data/promptTemplates';
import { enhancePromptApi } from '../services/api';
import { isFavorite, toggleFavorite } from '../services/favoritesService';

export function PromptBuilder({ onSendToMain, onShowToast }) {
  const [activeCategoryId, setActiveCategoryId] = useState('coding');

  const currentTemplate = useMemo(() => {
    return PROMPT_TEMPLATES.find((t) => t.id === activeCategoryId) || PROMPT_TEMPLATES[0];
  }, [activeCategoryId]);

  // Form values state per category
  const [formValues, setFormValues] = useState(() => {
    const initial = {};
    PROMPT_TEMPLATES.forEach((tpl) => {
      initial[tpl.id] = {};
      tpl.fields.forEach((f) => {
        initial[tpl.id][f.id] = f.defaultValue || '';
      });
    });
    return initial;
  });

  const currentValues = useMemo(() => formValues[activeCategoryId] || {}, [formValues, activeCategoryId]);

  // Generated prompt & editing
  const [isEditingManually, setIsEditingManually] = useState(false);
  const [manualPrompt, setManualPrompt] = useState('');

  // AI Enhancement state inside builder
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState(null);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Calculate live generated prompt from form values
  const generatedPrompt = useMemo(() => {
    if (isEditingManually) {
      return manualPrompt;
    }
    return currentTemplate.buildPrompt(currentValues);
  }, [currentTemplate, currentValues, isEditingManually, manualPrompt]);

  // Active prompt displayed (enhanced if available, else generated/manual)
  const activePromptText = enhancedResult?.enhancedPrompt || generatedPrompt;

  // Star / Favorite state
  const isStarred = isFavorite(activePromptText);

  // Reset manual prompt when switching templates
  const handleCategoryChange = (catId) => {
    setActiveCategoryId(catId);
    setIsEditingManually(false);
    setManualPrompt('');
    setEnhancedResult(null);
  };

  const handleFieldChange = (fieldId, val) => {
    setFormValues((prev) => ({
      ...prev,
      [activeCategoryId]: {
        ...prev[activeCategoryId],
        [fieldId]: val,
      },
    }));
    if (enhancedResult) {
      setEnhancedResult(null);
    }
    if (isEditingManually) {
      setIsEditingManually(false);
    }
  };

  // Load sample preset
  const handleLoadExample = (example) => {
    setFormValues((prev) => ({
      ...prev,
      [activeCategoryId]: {
        ...prev[activeCategoryId],
        ...example.values,
      },
    }));
    setIsEditingManually(false);
    setEnhancedResult(null);
    if (onShowToast) onShowToast(`Loaded preset: "${example.name}"`);
  };

  // Reset current form to defaults
  const handleReset = () => {
    setFormValues((prev) => {
      const resetCategory = {};
      currentTemplate.fields.forEach((f) => {
        resetCategory[f.id] = f.defaultValue || '';
      });
      return {
        ...prev,
        [activeCategoryId]: resetCategory,
      };
    });
    setIsEditingManually(false);
    setManualPrompt('');
    setEnhancedResult(null);
    if (onShowToast) onShowToast('Reset form to template defaults.');
  };

  // Copy prompt
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activePromptText);
      setCopied(true);
      if (onShowToast) onShowToast('Prompt copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (onShowToast) onShowToast('Failed to copy to clipboard.');
    }
  };

  // Star / Favorite toggle
  const handleToggleStar = () => {
    try {
      const res = toggleFavorite({
        prompt: activePromptText,
        title: `${currentTemplate.name}: ${(currentValues.task || currentValues.topic || currentValues.subject || activePromptText.slice(0, 35))}`,
        category: currentTemplate.id,
        whyBetter: enhancedResult?.whyBetter || [],
        source: 'builder',
      });
      if (onShowToast) {
        onShowToast(res.isStarred ? 'Saved to Favorites!' : 'Removed from Favorites.');
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Could not update favorite.');
    }
  };

  // AI Enhance directly within builder
  const handleEnhance = async () => {
    if (!activePromptText.trim() || isEnhancing) return;
    setIsEnhancing(true);

    try {
      const data = await enhancePromptApi({
        prompt: activePromptText,
        targetAI: 'any',
      });
      setEnhancedResult(data);
      if (onShowToast) onShowToast('Prompt enhanced with TejasAI engine!');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Enhancement failed. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Send to main enhancer input
  const handleSendToMain = () => {
    if (onSendToMain) {
      onSendToMain(activePromptText);
    }
  };

  const wordCount = activePromptText.trim() ? activePromptText.trim().split(/\s+/).length : 0;
  const charCount = activePromptText.length;

  return (
    <section id="prompt-builder" className="scroll-mt-24 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#EDE8E1] pb-6">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#111827]">
            Build structured prompts for any domain.
          </h2>
          <p className="text-sm sm:text-base text-[#6B7280] mt-1 max-w-2xl leading-relaxed">
            Choose a tailored framework, fill in your requirements, and generate production-ready prompts designed for ChatGPT, Claude, and Gemini.
          </p>
        </div>

        {/* Preset sample links */}
        {currentTemplate.examples && currentTemplate.examples.length > 0 && (
          <div className="flex items-center gap-2 text-xs shrink-0 flex-wrap">
            <span className="text-[#9CA3AF]">Presets:</span>
            {currentTemplate.examples.map((ex, i) => (
              <React.Fragment key={ex.name}>
                {i > 0 && <span className="text-[#D1D5DB]">&bull;</span>}
                <button
                  type="button"
                  onClick={() => handleLoadExample(ex)}
                  className="text-[#6B7280] hover:text-[#111827] underline underline-offset-4 decoration-[#D1D5DB] hover:decoration-[#111827] transition-colors cursor-pointer"
                >
                  {ex.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Category Tab Bar (Clean editorial navigation, zero clip-art icons) */}
      <div className="flex items-center gap-6 sm:gap-8 border-b border-[#EDE8E1] overflow-x-auto no-scrollbar pb-px touch-pan-x">
        {PROMPT_TEMPLATES.map((tpl) => {
          const isActive = tpl.id === activeCategoryId;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleCategoryChange(tpl.id)}
              className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer border-b-2 -mb-px shrink-0 ${
                isActive
                  ? 'border-[#111827] text-[#111827] font-semibold'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {tpl.name}
            </button>
          );
        })}
      </div>

      {/* Main Builder Columns: Open Editorial Form & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Form Specifications */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-start sm:items-baseline justify-between gap-2 pb-3 border-b border-[#EDE8E1]">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#111827]">
                {currentTemplate.name} Specifications
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {currentTemplate.description}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[#9CA3AF] hover:text-[#C2410C] transition-colors cursor-pointer"
            >
              Reset defaults
            </button>
          </div>

          <div className="space-y-4">
            {currentTemplate.fields.map((field) => {
              const val = currentValues[field.id] || '';
              return (
                <div key={field.id} className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <label className="text-xs font-semibold text-[#374151]">
                      {field.label}
                    </label>
                    {!field.required && (
                      <span className="text-[11px] text-[#9CA3AF]">Optional</span>
                    )}
                  </div>

                  {field.type === 'select' ? (
                    <div className="relative">
                      <select
                        value={val}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full text-xs sm:text-sm bg-[#FFFFFF] text-[#111827] border border-[#EDE8E1] px-3.5 py-2.5 pr-8 rounded-none focus:outline-none focus:border-[#111827] transition-colors appearance-none cursor-pointer"
                      >
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#9CA3AF] absolute right-3 top-3 pointer-events-none" />
                    </div>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={val}
                      placeholder={field.placeholder}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full text-xs sm:text-sm bg-[#FFFFFF] text-[#111827] border border-[#EDE8E1] p-3 rounded-none focus:outline-none focus:border-[#111827] transition-colors resize-y font-sans leading-relaxed"
                    />
                  ) : (
                    <input
                      type="text"
                      value={val}
                      placeholder={field.placeholder}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full text-xs sm:text-sm bg-[#FFFFFF] text-[#111827] border border-[#EDE8E1] px-3.5 py-2.5 rounded-none focus:outline-none focus:border-[#111827] transition-colors font-sans"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Prompt Canvas & Action Suite */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-start sm:items-baseline justify-between gap-3 pb-3 border-b border-[#EDE8E1] flex-wrap">
            <div className="flex items-center gap-2.5">
              <h3 className="font-serif text-lg font-semibold text-[#111827]">
                {enhancedResult ? 'Enhanced Prompt' : 'Structured Prompt'}
              </h3>
              {enhancedResult && (
                <span className="font-mono text-[11px] text-[#C2410C] font-semibold uppercase tracking-wider">
                  &bull; AI Optimized
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (!isEditingManually) {
                    setManualPrompt(activePromptText);
                  }
                  setIsEditingManually(!isEditingManually);
                }}
                className="text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer font-medium"
              >
                {isEditingManually ? 'View Live' : 'Edit Prompt'}
              </button>
              <button
                type="button"
                onClick={handleToggleStar}
                className={`transition-colors cursor-pointer font-medium ${
                  isStarred ? 'text-[#C2410C]' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {isStarred ? '★ In Favorites' : '☆ Save to Favorites'}
              </button>
            </div>
          </div>

          {/* Prompt Canvas / Editor (Single Clean Border, Zero Nested Boxes, Natural Height) */}
          {isEditingManually ? (
            <textarea
              rows={Math.max(14, (manualPrompt || '').split('\n').length + 2)}
              value={manualPrompt}
              onChange={(e) => setManualPrompt(e.target.value)}
              className="w-full text-xs sm:text-sm bg-[#FFFFFF] text-[#111827] border border-[#EDE8E1] p-4 sm:p-5 rounded-none focus:outline-none focus:border-[#111827] font-mono leading-relaxed resize-y min-h-[300px]"
            />
          ) : (
            <div className="bg-[#FFFFFF] border border-[#EDE8E1] p-4 sm:p-5 text-xs sm:text-sm text-[#111827] font-mono whitespace-pre-wrap leading-relaxed min-h-[300px] selection:bg-[#111827] selection:text-white">
              {activePromptText}
            </div>
          )}

          {/* Editorial Optimization Summary */}
          {enhancedResult && enhancedResult.whyBetter && enhancedResult.whyBetter.length > 0 && (
            <div className="py-1 space-y-1.5">
              <div className="text-xs font-semibold text-[#111827]">
                Optimization improvements:
              </div>
              <ul className="text-xs text-[#6B7280] space-y-1 list-disc pl-4 leading-relaxed">
                {enhancedResult.whyBetter.map((bullet, idx) => (
                  <li key={idx}>{bullet}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Stats Bar */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#9CA3AF] pt-1">
            <span>{wordCount} words &bull; {charCount} characters</span>
            <span>{currentTemplate.name} framework</span>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleEnhance}
              disabled={isEnhancing}
              className="w-full px-5 py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs sm:text-sm font-semibold tracking-wide transition-colors cursor-pointer disabled:opacity-60 text-center"
            >
              {isEnhancing ? 'Enhancing with AI...' : enhancedResult ? 'Re-Enhance with TejasAI' : 'Enhance with TejasAI'}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-[#111827] hover:bg-[#374151] text-white text-xs sm:text-sm font-semibold tracking-wide transition-colors cursor-pointer text-center"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#22C55E]" />
                  <span>Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          </div>

          {/* Secondary Link to Main Composer */}
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={handleSendToMain}
              className="text-xs font-medium text-[#C2410C] hover:text-[#9A3412] transition-colors cursor-pointer"
            >
              Open in Main Composer &rarr;
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
