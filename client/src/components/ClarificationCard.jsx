import React, { useState } from 'react';
import { ArrowRight, X, FastForward, CheckCircle } from '@phosphor-icons/react';

export function ClarificationCard({
  prompt,
  questionIndex = 1,
  totalQuestionsMax = 3,
  question,
  clarificationHistory = [],
  onSubmitAnswer,
  onSkip,
  onCancel,
  isLoading = false,
}) {
  const [selectedOption, setSelectedOption] = useState('');
  const [customOtherText, setCustomOtherText] = useState('');
  const [numberValue, setNumberValue] = useState('');

  if (!question) return null;

  const isOtherSelected = selectedOption === 'Other';
  const isNumberType = question.type === 'number';
  const isYesNoType = question.type === 'yes_no';

  const canSubmit = isNumberType
    ? Boolean(numberValue || selectedOption)
    : isOtherSelected
      ? Boolean(customOtherText.trim() || selectedOption)
      : Boolean(selectedOption);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!canSubmit || isLoading) return;

    let finalAnswer = selectedOption;
    if (isNumberType && numberValue) {
      finalAnswer = numberValue.trim();
    } else if (isOtherSelected) {
      finalAnswer = customOtherText.trim() ? `Other: ${customOtherText.trim()}` : 'Other';
    }

    onSubmitAnswer({
      question: question.text,
      answer: finalAnswer,
    });

    // Reset local selection for next question
    setSelectedOption('');
    setCustomOtherText('');
    setNumberValue('');
  };

  return (
    <div className="w-full bg-[#FFFDF5] border border-[#EDE8E1] rounded-xl p-5 sm:p-7 shadow-sm transition-all animate-fadeIn">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EDE8E1]">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E]">
            Clarification {questionIndex} of {totalQuestionsMax}
          </span>
          <span className="text-xs text-[#8A8178] hidden sm:inline">
            Smart prompt refinement
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="text-[#9CA3AF] hover:text-[#111827] p-1 rounded transition-colors cursor-pointer"
          title="Cancel and return to editor"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Original Prompt Context */}
      <div className="mb-4">
        <span className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-medium block mb-1">
          Improving Prompt:
        </span>
        <p className="text-xs sm:text-sm text-[#4B5563] italic line-clamp-2 bg-[#FAF8F5] px-3 py-2 rounded border border-[#EDE8E1]/80">
          &ldquo;{prompt}&rdquo;
        </p>
      </div>

      {/* Clarification History (if any previous questions answered) */}
      {clarificationHistory.length > 0 && (
        <div className="mb-4 space-y-1.5 bg-[#FAF8F5]/60 p-3 rounded-lg border border-[#EDE8E1]/60">
          <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-semibold block mb-1">
            Answered so far:
          </span>
          {clarificationHistory.map((item, idx) => (
            <div key={idx} className="flex items-start text-xs text-[#4B5563]">
              <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] mr-1.5 mt-0.5 shrink-0" weight="fill" />
              <span>
                <span className="font-medium text-[#111827]">{item.question}:</span>{' '}
                <span className="text-[#C2410C] font-mono">{item.answer}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Current Question */}
      <div className="mb-5">
        <h3 className="font-serif text-lg sm:text-xl text-[#111827] font-medium leading-snug">
          {question.text}
        </h3>
        <p className="text-xs text-[#8A8178] mt-1">
          Select the option that best matches your goal, or skip to enhance immediately.
        </p>
      </div>

      {/* Answer Options */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Yes/No Type */}
        {isYesNoType && (
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {['Yes', 'No'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSelectedOption(opt)}
                className={`py-2.5 px-4 rounded-lg text-sm font-medium border text-center transition-all cursor-pointer ${
                  selectedOption === opt
                    ? 'border-[#C2410C] bg-[#FFFBF5] text-[#C2410C] shadow-xs ring-1 ring-[#C2410C]'
                    : 'border-[#EDE8E1] bg-[#FFFFFF] text-[#374151] hover:border-[#9CA3AF] hover:text-[#111827]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Number Type */}
        {isNumberType && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(question.options || ['1', '3', '5', '10']).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setSelectedOption(num);
                    setNumberValue('');
                  }}
                  className={`py-2 px-4 rounded-lg text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                    selectedOption === num && !numberValue
                      ? 'border-[#C2410C] bg-[#FFFBF5] text-[#C2410C] ring-1 ring-[#C2410C]'
                      : 'border-[#EDE8E1] bg-[#FFFFFF] text-[#374151] hover:border-[#9CA3AF]'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2 max-w-xs pt-1">
              <span className="text-xs text-[#8A8178]">Or specify:</span>
              <input
                type="number"
                min="1"
                max="1000"
                placeholder="Custom #"
                value={numberValue}
                onChange={(e) => {
                  setNumberValue(e.target.value);
                  setSelectedOption('');
                }}
                className="w-24 px-2.5 py-1.5 text-xs sm:text-sm border border-[#EDE8E1] rounded-md bg-[#FFFFFF] text-[#111827] focus:border-[#C2410C] outline-none"
              />
            </div>
          </div>
        )}

        {/* Multiple Choice Type */}
        {!isYesNoType && !isNumberType && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(question.options || []).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedOption(opt)}
                  className={`p-3 text-left rounded-lg text-xs sm:text-sm border transition-all cursor-pointer flex items-center justify-between ${
                    selectedOption === opt
                      ? 'border-[#C2410C] bg-[#FFFBF5] text-[#111827] ring-1 ring-[#C2410C] shadow-xs'
                      : 'border-[#EDE8E1] bg-[#FFFFFF] text-[#374151] hover:border-[#9CA3AF] hover:text-[#111827]'
                  }`}
                >
                  <span className="font-medium">{opt}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                      selectedOption === opt
                        ? 'border-[#C2410C] bg-[#C2410C]'
                        : 'border-[#D1D5DB]'
                    }`}
                  >
                    {selectedOption === opt && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              ))}

              {/* Optional "Other" Choice if not already in options */}
              {question.hasOther !== false && !(question.options || []).includes('Other') && (
                <button
                  type="button"
                  onClick={() => setSelectedOption('Other')}
                  className={`p-3 text-left rounded-lg text-xs sm:text-sm border transition-all cursor-pointer flex items-center justify-between ${
                    isOtherSelected
                      ? 'border-[#C2410C] bg-[#FFFBF5] text-[#111827] ring-1 ring-[#C2410C] shadow-xs'
                      : 'border-[#EDE8E1] bg-[#FFFFFF] text-[#374151] hover:border-[#9CA3AF] hover:text-[#111827]'
                  }`}
                >
                  <span className="font-medium">Other / Custom</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                      isOtherSelected
                        ? 'border-[#C2410C] bg-[#C2410C]'
                        : 'border-[#D1D5DB]'
                    }`}
                  >
                    {isOtherSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              )}
            </div>

            {/* Custom Other Text Box */}
            {isOtherSelected && (
              <div className="pt-2 animate-fadeIn">
                <input
                  type="text"
                  maxLength={120}
                  autoFocus
                  placeholder="Type your specific requirement (e.g. Pet shelter portfolio)..."
                  value={customOtherText}
                  onChange={(e) => setCustomOtherText(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-[#C2410C] rounded-lg bg-[#FFFFFF] text-[#111827] focus:outline-none ring-1 ring-[#C2410C]/30"
                />
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#EDE8E1]/80">
          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            className="text-xs text-[#8A8178] hover:text-[#111827] flex items-center space-x-1 transition-colors cursor-pointer order-2 sm:order-1"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Skip remaining questions &amp; enhance now</span>
          </button>

          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center space-x-1.5 transition-all order-1 sm:order-2 ${
              canSubmit && !isLoading
                ? 'bg-[#C2410C] hover:bg-[#9A3412] text-white shadow-sm cursor-pointer'
                : 'bg-[#EDE8E1] text-[#9CA3AF] cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span>Analyzing...</span>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
