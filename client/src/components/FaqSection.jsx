import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQS = [
  {
    q: 'Is it free?',
    a: 'Yes. TejasAI is completely free to use. There are no paid tiers, subscriptions, or credit card requirements.',
  },
  {
    q: 'Where does my text go?',
    a: 'Your text is sent securely over HTTPS to our AI provider (Groq) to generate the enhanced prompt. We do not store, log, or sell your text on our servers.',
  },
  {
    q: 'Which AI should I paste the result into?',
    a: 'You can paste the result into ChatGPT, Google Gemini, Claude, Microsoft Copilot, or any other LLM. The prompt is written to work reliably across all major AI tools.',
  },
  {
    q: 'Can I use it for school or work?',
    a: 'Yes. Many people use it to draft emails, summarize study notes, write product listings, and structure work requests.',
  },
  {
    q: 'Does it work in other languages?',
    a: 'Currently, TejasAI is optimized specifically for clear, natural English.',
  },
];

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggleFaq = (idx) => {
    setOpenIdx((prev) => (prev === idx ? -1 : idx));
  };

  return (
    <section id="faq" className="scroll-mt-24 pt-16 sm:pt-24 border-t border-[#E7E0D6]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Heading, Subtext, and Contact */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#111827] tracking-tight leading-snug">
            Frequently asked questions
          </h2>
          <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
            Short, honest answers about privacy, supported models, and how TejasAI works.
          </p>
          <div className="pt-2 text-xs sm:text-sm text-[#6B7280]">
            Have a different question?{' '}
            <a
              href="mailto:baraiyavishalbhai32@gmail.com"
              className="font-medium text-[#C2410C] hover:text-[#9A3412] underline underline-offset-2"
            >
              Email support
            </a>
          </div>
        </div>

        {/* Right Column: Unified Q&A Card with Hairline Dividers */}
        <div className="lg:col-span-8">
          <div className="rounded-[12px] border border-[#E7E0D6] bg-[#FFFFFF] divide-y divide-[#E7E0D6] shadow-xs overflow-hidden">
            {FAQS.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div key={idx} className="transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-[#FAF8F5] transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm sm:text-base font-medium text-[#111827] pr-4">
                      {faq.q}
                    </span>
                    <span className="shrink-0 w-6 h-6 rounded-full border border-[#E7E0D6] bg-[#FFFFFF] flex items-center justify-center text-[#6B7280] shadow-2xs">
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5" strokeWidth={1.75} />
                      ) : (
                        <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm text-[#4B5563] leading-relaxed border-t border-[#E7E0D6]/60 bg-[#FAF8F5]/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
