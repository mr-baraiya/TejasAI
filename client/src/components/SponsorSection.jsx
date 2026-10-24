import React from 'react';
import { ArrowSquareOut } from '@phosphor-icons/react';

/**
 * Editorial Open-Source Sponsor Section for TejasAI.
 * Features the official GitHub Sponsors card iframe, mission commitments, and direct funding link.
 */
export function SponsorSection() {
  return (
    <section id="sponsor" className="scroll-mt-24 pt-16 sm:pt-24 border-t border-[#EDE8E1]">
      <div className="space-y-10 sm:space-y-14">
        
        {/* Section Header */}
        <div className="max-w-2xl space-y-3">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#111827] tracking-tight">
            Support the independence of TejasAI.
          </h2>
          <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
            TejasAI is developed and maintained as a public utility for developers, researchers, and creators. We charge no subscription fees, show no advertisements, and never sell or monetize prompt data.
          </p>
        </div>

        {/* Two-Column Grid: Funding Commitments on Left, Official GitHub Sponsor Card on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Why Sponsoring Matters */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="font-serif text-lg font-semibold text-[#111827]">
              Where your sponsorship goes
            </h3>
            
            <ul className="space-y-4 text-xs sm:text-sm text-[#374151]">
              <li className="flex items-start gap-3">
                <span className="font-mono text-[#C2410C] font-semibold shrink-0 mt-0.5">01</span>
                <div>
                  <strong className="text-[#111827] block font-medium">Sub-300ms Cloud Inference</strong>
                  <span className="text-[#6B7280]">
                    Funding dedicated Groq LPU capacity and automated multi-region server redundancy to keep prompt rewrites near-instantaneous.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-[#C2410C] font-semibold shrink-0 mt-0.5">02</span>
                <div>
                  <strong className="text-[#111827] block font-medium">100% Free Public Utility</strong>
                  <span className="text-[#6B7280]">
                    Keeping the web app, prompt studio, and browser extension free without paywalls or restrictive tiers.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-[#C2410C] font-semibold shrink-0 mt-0.5">03</span>
                <div>
                  <strong className="text-[#111827] block font-medium">Continuous Adapter Updates</strong>
                  <span className="text-[#6B7280]">
                    Rapidly maintaining DOM injection adapters whenever ChatGPT, Claude, Gemini, DeepSeek, Perplexity, or Grok release UI updates.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-mono text-[#C2410C] font-semibold shrink-0 mt-0.5">04</span>
                <div>
                  <strong className="text-[#111827] block font-medium">Official Browser Store Listings</strong>
                  <span className="text-[#6B7280]">
                    Covering developer account fees and verified release pipelines for Chrome Web Store and Firefox Add-ons.
                  </span>
                </div>
              </li>
            </ul>

            <div className="pt-2">
              <a
                href="https://github.com/sponsors/mr-baraiya"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111827] hover:bg-[#374151] text-white text-xs sm:text-sm font-semibold tracking-wide transition-colors cursor-pointer"
              >
                <span>Sponsor on GitHub</span>
                <ArrowSquareOut className="w-4 h-4 text-[#9CA3AF]" />
              </a>
            </div>
          </div>

          {/* Right Column: GitHub Sponsor Card */}
          <div className="lg:col-span-7 flex flex-col items-center sm:items-start space-y-4">
            
            {/* Authentic GitHub Sponsors Card */}
            <div className="w-full max-w-[600px] bg-[#0d1117] text-white border border-[#30363d] rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                <div className="flex items-start gap-4 flex-1">
                  {/* Profile avatar with link */}
                  <a
                    href="https://github.com/mr-baraiya"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 transition-opacity hover:opacity-90 mt-0.5"
                    title="@mr-baraiya"
                  >
                    <img
                      src="https://avatars.githubusercontent.com/u/142961593?s=96&v=4"
                      alt="Vishal Baraiya"
                      className="w-12 h-12 rounded-full object-cover ring-1 ring-[#30363d]"
                    />
                  </a>

                  {/* Title & Bio with proper gap */}
                  <div className="space-y-1.5 flex-1 pr-1">
                    <a
                      href="https://github.com/sponsors/mr-baraiya"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-sm sm:text-base text-white hover:text-[#58a6ff] transition-colors leading-snug block"
                    >
                      Sponsor Vishal Baraiya on GitHub Sponsors
                    </a>
                    <p className="text-xs sm:text-[13px] text-[#c9d1d9] leading-relaxed">
                      I&apos;m building TejasAI to make writing better AI prompts easier for everyone. Your support helps me cover API and hosting costs and keep improving the tool. ❤️
                    </p>
                  </div>
                </div>

                {/* Official GitHub Sponsor Button */}
                <div className="shrink-0 self-end sm:self-center pl-1 sm:pl-2">
                  <iframe
                    src="https://github.com/sponsors/mr-baraiya/button"
                    title="Sponsor mr-baraiya"
                    height="32"
                    width="114"
                    className="border-0 rounded-md shrink-0 block"
                    style={{ border: 0, borderRadius: '6px' }}
                  />
                </div>

              </div>
            </div>

            {/* Subtle Tier Context (Unboxed) */}
            <div className="w-full max-w-[600px] text-xs text-[#6B7280] leading-relaxed pt-1">
              <span className="font-medium text-[#111827] block mb-0.5">Flexible sponsorship tiers</span>
              GitHub Sponsors supports custom one-time contributions and monthly tiers starting from $1. Every contribution keeps TejasAI 100% free for everyone.
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
