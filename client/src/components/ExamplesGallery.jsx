import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const THREE_EXAMPLES = [
  {
    category: 'Work email',
    raw: 'Write a sick leave email to my manager for 2 days due to fever.',
    better: 'Please write a professional, polite sick leave email to my manager for a 2-day absence due to fever. Include clear dates, mention that I will monitor urgent emails, and provide a polite closing.',
  },
  {
    category: 'Study',
    raw: 'Explain photosynthesis simply for my science class.',
    better: 'Explain how photosynthesis works using everyday kitchen analogies for a 7th-grade science class. Keep the explanation under 4 short paragraphs and define chlorophyll simply.',
  },
  {
    category: 'Product sales',
    raw: 'Write a 3-sentence description for handmade cotton kurtas for my online shop.',
    better: 'Write a friendly, 3-sentence product description for handcrafted pure cotton kurtas. Highlight breathable comfort, artisan stitching, and everyday versatility with a clear call to shop.',
  },
];

export function ExamplesGallery({ onSelectExample }) {
  return (
    <section id="examples" className="scroll-mt-24 pt-16 sm:pt-24 border-t border-[#EDE8E1]">
      {/* Section Header */}
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-[#111827] tracking-tight">
          See the difference
        </h2>
        <p className="text-sm sm:text-base text-[#6B7280] max-w-[65ch] leading-relaxed">
          Compare rough everyday requests with structured prompts that get the right answer immediately.
        </p>
      </div>

      {/* 3 Human-crafted Editorial Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {THREE_EXAMPLES.map((item, idx) => (
          <div
            key={idx}
            className="rounded-none border border-[#EDE8E1] bg-[#FFFFFF] p-6 shadow-xs flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              {/* Category */}
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] block">
                {item.category}
              </span>

              {/* Original Draft */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-[#6B7280] block">
                  You write:
                </span>
                <p className="text-sm text-[#4B5563] leading-relaxed">
                  &ldquo;{item.raw}&rdquo;
                </p>
              </div>

              {/* Clean Hairline Divider */}
              <div className="border-t border-[#EDE8E1]"></div>

              {/* Improved Version */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-[#111827] block">
                  You get:
                </span>
                <p className="text-sm text-[#374151] leading-relaxed font-light">
                  &ldquo;{item.better}&rdquo;
                </p>
              </div>
            </div>

            {/* Bottom link: Try this example */}
            <div className="pt-4 border-t border-[#EDE8E1]">
              <button
                type="button"
                onClick={() => onSelectExample(item.raw)}
                className="text-xs sm:text-sm font-medium text-[#C2410C] hover:text-[#9A3412] inline-flex items-center space-x-1 cursor-pointer"
              >
                <span>Try this example</span>
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
