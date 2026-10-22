import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const EXAMPLES = [
  {
    category: 'Engineering',
    tag: 'API & Reliability',
    raw: 'make this api call retry if it fails',
    better:
      'Write a clean TypeScript wrapper for this fetch call with exponential backoff. Retry up to 3 times on 429 or 5xx errors, enforce a 10s timeout via AbortSignal, and fail fast on 4xx client errors.',
  },
  {
    category: 'Workplace',
    tag: 'Team Communication',
    raw: 'tell my team the launch is delayed to friday',
    better:
      'Draft a calm, clear Slack announcement informing the team that the release is moving to Friday. Explain the testing rationale in one sentence, list the two remaining blocker tasks, and invite questions.',
  },
  {
    category: 'Learning',
    tag: 'Technical Concepts',
    raw: 'explain postgres indexing simply',
    better:
      'Explain B-Tree indexing in PostgreSQL to a developer who knows basic SQL. Use a library catalogue analogy, illustrate read vs write performance tradeoffs, and give 3 rules for choosing indexed columns.',
  },
];

export function ExamplesGallery({ onSelectExample }) {
  return (
    <section id="examples" className="scroll-mt-24 pt-16 sm:pt-24 border-t border-[#EDE8E1]">
      {/* Section Header */}
      <div className="space-y-3 mb-10 sm:mb-14 max-w-2xl">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#111827] tracking-tight">
          Real prompts before and after.
        </h2>
        <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
          See how small amounts of context and clear boundaries turn vague drafts into production-ready answers.
        </p>
      </div>

      {/* Open Editorial Columns — Zero Cards, Zero Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        {EXAMPLES.map((item, idx) => (
          <div
            key={idx}
            className="space-y-4 flex flex-col justify-between"
          >
              <div className="space-y-4">
                {/* Category & Tag */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold tracking-wider text-[#C2410C] uppercase">
                    {item.category}
                  </span>
                  <span className="text-xs font-mono text-[#9CA3AF]">
                    {item.tag}
                  </span>
                </div>

                {/* Rough Draft */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#9CA3AF] block">
                    Rough draft
                  </span>
                  <p className="text-sm text-[#6B7280] italic leading-relaxed">
                    &ldquo;{item.raw}&rdquo;
                  </p>
                </div>

                {/* TejasAI Prompt */}
                <div className="space-y-1.5 pt-3 border-t border-[#EDE8E1]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#111827] font-semibold block">
                    TejasAI prompt
                  </span>
                  <p className="text-sm text-[#111827] leading-relaxed">
                    &ldquo;{item.better}&rdquo;
                  </p>
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-4 border-t border-[#EDE8E1]">
                <button
                  type="button"
                  onClick={() => onSelectExample(item.raw)}
                  className="text-xs font-medium text-[#C2410C] hover:text-[#9A3412] inline-flex items-center gap-1 transition-colors cursor-pointer group"
                >
                  <span>Try this in editor</span>
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
        ))}
      </div>
    </section>
  );
}
