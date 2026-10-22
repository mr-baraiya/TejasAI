import React from 'react';

/**
 * Single, clean How It Works section.
 * 3 numbered steps with plain numbers, neutral borders, and short descriptions.
 */
export function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Type in your own words',
      desc: "Write what you need help with. You don't need prompt engineering, special keywords, or technical instructions.",
    },
    {
      step: '02',
      title: 'We rewrite for clarity',
      desc: 'TejasAI identifies your goal, audience, and preferred format, structuring the request so the AI understands it on the first attempt.',
    },
    {
      step: '03',
      title: 'Paste into any AI',
      desc: 'Copy your enhanced prompt and paste it into ChatGPT, Gemini, or Claude to get direct, high-quality answers immediately.',
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-24 pt-16 sm:pt-24 border-t border-[#EDE8E1]">
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-[#111827] tracking-tight">
          How it works
        </h2>
        <p className="text-sm sm:text-base text-[#6B7280] max-w-[65ch] leading-relaxed">
          Three simple steps to better AI results.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((item) => (
          <div
            key={item.step}
            className="rounded-none border border-[#EDE8E1] bg-[#FFFFFF] p-6 shadow-xs space-y-3"
          >
            <span className="text-xs font-semibold text-[#6B7280] block">
              Step {item.step}
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-[#111827]">
              {item.title}
            </h3>
            <p className="text-sm text-[#374151] leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
