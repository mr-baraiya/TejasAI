import React, { useState } from 'react';
import { X, Download, Copy, Check } from 'lucide-react';

export function ExtensionModal({ isOpen, onClose }) {
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="extension-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-[#FFFBF5] border border-[#EDE8E1] p-6 sm:p-8 shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 p-1 text-[#9CA3AF] hover:text-[#111827] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        {/* Brand Kicker */}
        <div className="flex items-center gap-2 mb-3">
          <img
            src="/logo.png"
            alt="TejasAI"
            className="w-6 h-6 object-cover shadow-xs"
          />
          <span className="text-xs font-semibold tracking-wider uppercase text-[#C2410C]">
            Chrome Extension
          </span>
        </div>

        {/* Serif Headline & Subtext */}
        <h3 id="extension-modal-title" className="font-serif text-2xl font-semibold text-[#111827] leading-tight mb-2">
          Bring TejasAI to your browser.
        </h3>
        <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-6">
          An in-composer enhance button that works natively inside ChatGPT, Claude, Gemini, Perplexity, and DeepSeek.
        </p>

        {/* Direct Download Release Card */}
        <div className="border border-[#EDE8E1] bg-[#FFFFFF] p-3.5 sm:p-4 mb-6 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs sm:text-sm font-semibold text-[#111827]">
                tejasai-extension.zip
              </div>
              <div className="text-[11px] text-[#9CA3AF]">
                Manifest V3 • Chrome, Brave, Edge
              </div>
            </div>
            <a
              href="/tejasai-extension.zip"
              download="tejasai-extension.zip"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold tracking-wide transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        </div>

        {/* 3 Step Installation Flow */}
        <div className="space-y-3 pt-4 border-t border-[#EDE8E1]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
            Setup in 3 steps
          </div>

          <ol className="space-y-3 text-xs text-[#374151]">
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-[11px] text-[#C2410C] font-bold shrink-0 mt-0.5">01</span>
              <span>Unzip the downloaded file on your computer.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-[11px] text-[#C2410C] font-bold shrink-0 mt-0.5">02</span>
              <span>
                In your browser, visit{' '}
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  title="Click to copy chrome://extensions"
                  className="font-mono bg-[#EDE8E1] text-[#111827] px-1.5 py-0.5 text-[11px] hover:bg-[#DDD6CB] transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>chrome://extensions</span>
                  {copiedUrl ? <Check className="w-3 h-3 text-[#16A34A]" /> : <Copy className="w-3 h-3 text-[#6B7280]" />}
                </button>
                {' '}and turn on <strong>Developer mode</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-[11px] text-[#C2410C] font-bold shrink-0 mt-0.5">03</span>
              <span>Click <strong>Load unpacked</strong> and select the unzipped folder.</span>
            </li>
          </ol>
        </div>

        {/* Minimal Footer */}
        <div className="mt-6 pt-4 border-t border-[#EDE8E1] flex items-center justify-between text-[11px] text-[#9CA3AF]">
          <span>Free • Zero data retention</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#111827] font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
