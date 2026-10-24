import React, { useState } from 'react';

/**
 * Open editorial Browser Extension section.
 * Designed with zero artificial cards, zero nested boxes, and zero generic icons.
 * Follows TejasAI's handcrafted typographic layout.
 */
export function ExtensionSection() {
  const [copiedChrome, setCopiedChrome] = useState(false);
  const [copiedEdge, setCopiedEdge] = useState(false);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'chrome') {
      setCopiedChrome(true);
      setTimeout(() => setCopiedChrome(false), 2000);
    } else {
      setCopiedEdge(true);
      setTimeout(() => setCopiedEdge(false), 2000);
    }
  };

  return (
    <section id="extension" className="scroll-mt-24 pt-16 sm:pt-24 border-t border-[#EDE8E1]">
      {/* Section Header */}
      <div className="space-y-3 mb-10 sm:mb-14 max-w-2xl">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#111827] tracking-tight">
          Enhance prompts directly inside your AI tools.
        </h2>
        <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
          An in-composer button that sits right beside the send button in ChatGPT, Claude, Gemini, Perplexity, DeepSeek, and Grok. One click transforms raw thoughts into high-context prompts before sending.
        </p>
      </div>

      {/* Open Two-Column Editorial Layout — Zero Cards, Zero Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        
        {/* Left Column: Direct Download & Specifications */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Download Action */}
          <div className="space-y-3">
            <a
              href="/tejasai-extension.zip"
              download="tejasai-extension.zip"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-semibold tracking-wide transition-colors cursor-pointer"
            >
              Download Extension (.zip)
            </a>
            <div className="font-mono text-xs text-[#6B7280]">
              v1.1.0 &bull; Manifest V3 &bull; Chrome, Edge, Brave
            </div>
          </div>

          {/* Privacy & Security (Natural editorial text, zero clip-art icons) */}
          <div className="space-y-2 border-t border-[#EDE8E1] pt-6">
            <h3 className="font-serif text-base font-semibold text-[#111827]">
              Built with privacy by default
            </h3>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
              Zero prompt retention, no background keystroke monitoring, and no account required. The extension runs locally in your browser and only enhances text when you explicitly click the TejasAI button.
            </p>
          </div>

          {/* Supported AI Tools (Typographic list, zero nested cards) */}
          <div className="space-y-2 border-t border-[#EDE8E1] pt-6">
            <div className="font-mono text-xs font-semibold text-[#111827] uppercase tracking-wider">
              Supported Platforms
            </div>
            <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
              ChatGPT, Claude, Google Gemini, Perplexity, DeepSeek, and Grok.
            </p>
          </div>

        </div>

        {/* Right Column: Open 3-Step Setup */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E1]">
            <h3 className="font-serif text-lg font-semibold text-[#111827]">
              Three-step installation
            </h3>
            <span className="font-mono text-xs text-[#9CA3AF]">Under a minute</span>
          </div>

          <div className="space-y-6">
            {/* Step 01 */}
            <div className="space-y-2">
              <div className="font-mono text-xs font-semibold text-[#C2410C] uppercase tracking-wider">
                Step 01 &bull; Extract
              </div>
              <h4 className="font-serif text-base font-semibold text-[#111827]">
                Unzip the downloaded file
              </h4>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                Download <code className="font-mono text-xs text-[#111827]">tejasai-extension.zip</code> and extract the contents to a folder on your computer.
              </p>
            </div>

            {/* Step 02 */}
            <div className="space-y-2 border-t border-[#EDE8E1] pt-6">
              <div className="font-mono text-xs font-semibold text-[#C2410C] uppercase tracking-wider">
                Step 02 &bull; Developer Mode
              </div>
              <h4 className="font-serif text-base font-semibold text-[#111827]">
                Open extensions and enable developer mode
              </h4>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                Navigate to your browser&apos;s extension manager and turn on the Developer mode toggle in the top-right corner:
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleCopy('chrome://extensions', 'chrome')}
                  className="font-mono text-[#C2410C] hover:text-[#9A3412] underline underline-offset-2 cursor-pointer"
                >
                  chrome://extensions {copiedChrome ? '(copied)' : ''}
                </button>
                <span className="text-[#D1D5DB]">&bull;</span>
                <button
                  type="button"
                  onClick={() => handleCopy('edge://extensions', 'edge')}
                  className="font-mono text-[#C2410C] hover:text-[#9A3412] underline underline-offset-2 cursor-pointer"
                >
                  edge://extensions {copiedEdge ? '(copied)' : ''}
                </button>
              </div>
            </div>

            {/* Step 03 */}
            <div className="space-y-2 border-t border-[#EDE8E1] pt-6">
              <div className="font-mono text-xs font-semibold text-[#C2410C] uppercase tracking-wider">
                Step 03 &bull; Load
              </div>
              <h4 className="font-serif text-base font-semibold text-[#111827]">
                Click &ldquo;Load unpacked&rdquo;
              </h4>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                In your extensions manager, click <strong>Load unpacked</strong> and choose the extracted <code className="font-mono text-xs text-[#111827]">tejasai-browser-extension</code> directory.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#EDE8E1] space-y-2 text-xs leading-relaxed">
            <p className="text-[#374151]">
              <strong className="text-[#B91C1C] font-semibold">Important Note:</strong> Do not delete or move the extracted <code className="font-mono text-xs text-[#111827]">tejasai-browser-extension</code> folder after installation. Chrome runs the extension directly from this directory—if it is deleted or moved, the extension will stop working.
            </p>
            <p className="text-[#6B7280]">
              Tip: Pin the TejasAI icon to your browser bar for quick access to individual AI site toggles.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
