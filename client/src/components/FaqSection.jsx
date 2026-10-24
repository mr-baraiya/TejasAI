import React, { useState } from 'react';
import { Plus } from '@phosphor-icons/react';

const FAQS = [
  {
    q: 'What makes TejasAI the best AI prompt enhancer and prompt improver?',
    a: 'TejasAI functions as a high-precision AI prompt enhancer, prompt improver, and prompt generator. It analyzes your informal request, injects objective constraints, eliminates ambiguity, and formats the output so models like ChatGPT, Claude, and Gemini deliver comprehensive answers on your very first try.',
  },
  {
    q: 'Can I use TejasAI to generate ChatGPT prompts?',
    a: 'Yes. TejasAI is specifically calibrated to create structured ChatGPT prompts (for GPT-4o, o1, and ChatGPT Plus). It structures clear persona roles, contextual guardrails, and output delimiters so you get reliable, high-depth output from OpenAI models.',
  },
  {
    q: 'How does an AI writing assistant boost my AI productivity?',
    a: 'TejasAI acts as your dedicated AI writing assistant and prompt improver, eliminating the frustrating back-and-forth of rewriting prompts multiple times. By delivering production-grade prompts in under 300 milliseconds, it saves you hours of iteration every week—maximizing your day-to-day AI productivity.',
  },
  {
    q: 'Is TejasAI free to use?',
    a: 'Yes. TejasAI is completely free. There are no subscriptions, credit cards, or account sign-ups required.',
  },
  {
    q: 'Which AI model powers the enhancer?',
    a: 'TejasAI runs on ultra-low latency Groq LPUs using open-weights models specifically calibrated to identify intent, set negative constraints, and output clean structure in under 300 milliseconds.',
  },
  {
    q: 'Is my text private and secure?',
    a: 'Yes. Your draft is sent over encrypted HTTPS solely to generate the rewritten prompt. We do not store, log, or train on your inputs, and nothing is ever sold to third parties.',
  },
  {
    q: 'Which AI tools can I paste the result into?',
    a: 'Any modern model. The generated prompts are universal and tested to produce reliable, high-depth responses in ChatGPT, Claude, Google Gemini, Perplexity, DeepSeek, and Grok.',
  },
  {
    q: 'Is TejasAI affiliated with ChatGPT, Google, Claude, or other AI providers?',
    a: 'No. TejasAI is an independent prompt optimization tool. We are not affiliated with, endorsed by, or sponsored by OpenAI, Google, Anthropic, Perplexity AI, DeepSeek, or xAI. All platform names and trademarks belong to their respective owners.',
  },
  {
    q: 'Do I need to know any prompt engineering?',
    a: 'Not at all. The entire purpose of TejasAI is to let you write informal, everyday sentences while the engine handles persona framing, technical boundaries, and output formatting.',
  },
  {
    q: 'Does it support languages other than English?',
    a: 'Currently, TejasAI is focused specifically on natural, idiomatic English to ensure the highest output quality across all AI models.',
  },
];

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggleFaq = (idx) => {
    setOpenIdx((prev) => (prev === idx ? -1 : idx));
  };

  return (
    <section id="faq" className="scroll-mt-24 pt-16 sm:pt-24 border-t border-[#EDE8E1]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        
        {/* Left Column: Heading, Subtext, and Contact */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#111827] tracking-tight leading-snug">
            Frequently asked questions
          </h2>
          <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
            Straightforward details on privacy, latency, supported AI models, and how the tool operates.
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

        {/* Right Column: Open Minimalist Accordion (Zero Boxes, Zero Cards) */}
        <div className="lg:col-span-8 border-t border-[#EDE8E1]">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="border-b border-[#EDE8E1]">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full py-5 flex items-center justify-between text-left cursor-pointer group transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-medium text-[#111827] group-hover:text-[#C2410C] transition-colors pr-6">
                    {faq.q}
                  </span>
                  <span className="shrink-0 text-[#9CA3AF] group-hover:text-[#C2410C] transition-colors">
                    <Plus
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isOpen ? 'rotate-45 text-[#C2410C]' : ''
                      }`}
                      weight="bold"
                    />
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-6 pr-6 text-sm sm:text-base text-[#4B5563] leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
