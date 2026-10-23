import React from 'react';

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 pt-16 sm:pt-24 border-t border-[#EDE8E1]">
      {/* Section Header */}
      <div className="space-y-3 mb-10 sm:mb-14 max-w-2xl">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#111827] tracking-tight">
          How drafts become precision prompts.
        </h2>
        <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
          AI models don&apos;t need complex prompt-engineering tricks. They just need clear context, realistic constraints, and an explicit target format.
        </p>
      </div>

      {/* Open Editorial Columns — Zero Cards, Zero Boxes, Zero Top Lines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        {/* Phase 01 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold tracking-wider text-[#C2410C] uppercase">
              Phase 01
            </span>
            <span className="text-xs font-mono text-[#9CA3AF]">
              Rough thought
            </span>
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#111827]">
            Say it in your own words
          </h3>
          <p className="text-sm text-[#4B5563] leading-relaxed">
            Write your request naturally, exactly as you would describe it to a teammate. No prompt formulas, technical jargon, or &ldquo;act as a world-class expert&rdquo; clichés needed.
          </p>
        </div>

        {/* Phase 02 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold tracking-wider text-[#C2410C] uppercase">
              Phase 02
            </span>
            <span className="text-xs font-mono text-[#9CA3AF]">
              The engine
            </span>
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#111827]">
            Framing &amp; constraints
          </h3>
          <p className="text-sm text-[#4B5563] leading-relaxed">
            TejasAI establishes the persona, introduces domain-specific context, and sets strict negative constraints so the AI skips introductory pleasantries and avoids hallucinations.
          </p>
        </div>

        {/* Phase 03 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold tracking-wider text-[#C2410C] uppercase">
              Phase 03
            </span>
            <span className="text-xs font-mono text-[#9CA3AF]">
              Any model
            </span>
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#111827]">
            Universal, one-shot results
          </h3>
          <p className="text-sm text-[#4B5563] leading-relaxed">
            Copy the structured prompt into ChatGPT, Claude, Gemini, DeepSeek, or Grok. You get an in-depth, production-ready answer on the first attempt without endless follow-ups.
          </p>
        </div>
      </div>
    </section>
  );
}
