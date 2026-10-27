import React, { useState } from 'react';

/**
 * Editorial Extensions & Integrations Section.
 * Unified editorial theme matching TejasAI design system.
 * Sequence:
 * - Universal Browser Extension
 * - Visual Studio Code Extension
 * - Google Antigravity IDE Extension
 */
export function ExtensionSection() {
  const [copiedChrome, setCopiedChrome] = useState(false);
  const [copiedVscode, setCopiedVscode] = useState(false);
  const [copiedMcp, setCopiedMcp] = useState(false);

  const handleCopyChromeUrl = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopiedChrome(true);
    setTimeout(() => setCopiedChrome(false), 2000);
  };

  const handleCopyVscode = () => {
    navigator.clipboard.writeText('code --install-extension tejasai.tejasai-vscode');
    setCopiedVscode(true);
    setTimeout(() => setCopiedVscode(false), 2000);
  };

  const handleCopyMcp = () => {
    const mcpConfig = JSON.stringify(
      {
        mcpServers: {
          tejasai: {
            command: 'node',
            args: ['tejasai-antigravity/tejasai-mcp-server.js'],
          },
        },
      },
      null,
      2
    );
    navigator.clipboard.writeText(mcpConfig);
    setCopiedMcp(true);
    setTimeout(() => setCopiedMcp(false), 2000);
  };

  return (
    <section id="extension" className="scroll-mt-24 pt-16 sm:pt-24 border-t border-[#EDE8E1]">
      
      {/* Section Header */}
      <div className="space-y-3 mb-12 sm:mb-16 max-w-3xl">
        <div className="font-mono text-xs font-semibold text-[#C2410C] uppercase tracking-wider">
          TejasAI Extensions &amp; Integrations
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#111827] tracking-tight">
          Enhance prompts everywhere you write, code, and build.
        </h2>
        <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
          From universal browser composers to professional code editors and agentic IDEs, TejasAI integrates directly where you work to eliminate prompt iteration cycles.
        </p>
      </div>

      {/* Three Open Editorial Extension Sections */}
      <div className="space-y-16 sm:space-y-20">

        {/* =========================================================================
            UNIVERSAL BROWSER EXTENSION (FIRST)
           ========================================================================= */}
        <div className="space-y-8">
          <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-[#EDE8E1]">
            <div className="font-mono text-xs font-semibold text-[#C2410C] uppercase tracking-wider">
              Universal Browser Extension
            </div>
            <div className="font-mono text-xs text-[#6B7280]">
              Manifest V3 &bull; Chrome, Brave, Edge
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* Left Column: Direct Download & Specifications */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-3">
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#111827] leading-snug">
                  Enhance prompts directly inside web AI composers.
                </h3>
                <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
                  An in-composer trigger that sits right beside the send button in ChatGPT, Claude, Google Gemini, Perplexity, DeepSeek, and Grok. One click transforms raw thoughts into high-context prompts before sending.
                </p>
              </div>

              {/* Download Action */}
              <div className="pt-1">
                <a
                  href="/tejasai-extension.zip"
                  download="tejasai-extension.zip"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-semibold tracking-wide transition-colors cursor-pointer"
                >
                  Download Extension (.zip)
                </a>
              </div>

              {/* Privacy & Specifications */}
              <div className="space-y-2 pt-4 border-t border-[#EDE8E1]">
                <h4 className="font-serif text-base font-semibold text-[#111827]">
                  Built with privacy by default
                </h4>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                  Zero prompt retention, no background keystroke monitoring, and no account required. The extension runs locally in your browser and only enhances text when you explicitly click the TejasAI trigger.
                </p>
              </div>

              {/* Supported AI Tools */}
              <div className="space-y-1.5 pt-4 border-t border-[#EDE8E1]">
                <div className="font-mono text-xs font-semibold text-[#111827] uppercase tracking-wider">
                  Supported Platforms
                </div>
                <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                  ChatGPT, Claude, Google Gemini, Perplexity, DeepSeek, and Grok.
                </p>
              </div>
            </div>

            {/* Right Column: Open Setup Flow */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E1]">
                <h4 className="font-serif text-lg font-semibold text-[#111827]">
                  Three-step installation
                </h4>
                <span className="font-mono text-xs text-[#9CA3AF]">Under a minute</span>
              </div>

              <div className="space-y-6 text-xs sm:text-sm text-[#4B5563]">
                <div className="space-y-1">
                  <div className="font-mono text-xs font-semibold text-[#C2410C] uppercase tracking-wider">
                    Extract
                  </div>
                  <h5 className="font-serif text-base font-semibold text-[#111827]">
                    Unzip the downloaded file
                  </h5>
                  <p className="leading-relaxed">
                    Download <code className="font-mono text-xs text-[#111827]">tejasai-extension.zip</code> and extract the contents to a permanent folder on your computer.
                  </p>
                </div>

                <div className="space-y-1 pt-4 border-t border-[#EDE8E1]">
                  <div className="font-mono text-xs font-semibold text-[#C2410C] uppercase tracking-wider">
                    Developer Mode
                  </div>
                  <h5 className="font-serif text-base font-semibold text-[#111827]">
                    Open extensions and enable developer mode
                  </h5>
                  <p className="leading-relaxed">
                    Navigate to{' '}
                    <button
                      type="button"
                      onClick={handleCopyChromeUrl}
                      className="font-mono text-[#C2410C] hover:text-[#9A3412] underline underline-offset-2 cursor-pointer inline"
                    >
                      chrome://extensions
                    </button>
                    {copiedChrome && <span className="text-[#C2410C] font-mono text-xs ml-1">(copied)</span>}
                    {' '}and turn on the Developer mode toggle in the top-right corner.
                  </p>
                </div>

                <div className="space-y-1 pt-4 border-t border-[#EDE8E1]">
                  <div className="font-mono text-xs font-semibold text-[#C2410C] uppercase tracking-wider">
                    Load
                  </div>
                  <h5 className="font-serif text-base font-semibold text-[#111827]">
                    Click &ldquo;Load unpacked&rdquo;
                  </h5>
                  <p className="leading-relaxed">
                    In your extensions manager, click <strong>Load unpacked</strong> and select the extracted <code className="font-mono text-xs text-[#111827]">tejasai-browser-extension</code> directory.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EDE8E1] space-y-1.5 text-xs text-[#6B7280] leading-relaxed">
                <p>
                  <strong className="text-[#B91C1C] font-semibold">Important Note:</strong> Do not delete or move the extracted <code className="font-mono text-[11px] text-[#111827]">tejasai-browser-extension</code> folder after installation. Chrome runs the extension directly from this directory.
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* =========================================================================
            VISUAL STUDIO CODE EXTENSION (SECOND)
           ========================================================================= */}
        <div className="space-y-8 pt-12 sm:pt-16 border-t border-[#EDE8E1]">
          <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-[#EDE8E1]">
            <div className="font-mono text-xs font-semibold text-[#C2410C] uppercase tracking-wider">
              Visual Studio Code Extension
            </div>
            <div className="font-mono text-xs text-[#6B7280]">
              Visual Studio Marketplace &bull; Free &amp; Open-Source
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* Left Column: Details & Install */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-3">
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#111827] leading-snug">
                  TejasAI for Visual Studio Code &amp; GitHub Copilot.
                </h3>
                <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
                  Supercharge your vibe-coding workflow without switching apps. Highlight any draft in your editor and enhance it via context menu or keyboard shortcuts, access the interactive Prompt Studio sidebar with follow-up clarification questions, and summon <code className="font-mono text-xs bg-white px-1.5 py-0.5 border border-[#EDE8E1] text-[#C2410C]">@tejasai</code> directly inside GitHub Copilot Chat.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href="https://marketplace.visualstudio.com/items?itemName=tejasai.tejasai-vscode"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#111827] hover:bg-[#C2410C] text-white text-sm font-semibold tracking-wide transition-colors text-center"
                >
                  Install from Marketplace
                </a>
                <button
                  type="button"
                  onClick={handleCopyVscode}
                  className="inline-flex items-center justify-between gap-3 px-4 py-3 bg-white border border-[#EDE8E1] hover:border-[#C2410C] text-[#374151] text-xs font-mono transition-colors cursor-pointer text-left"
                  title="Click to copy terminal command"
                >
                  <span className="truncate">code --install-extension tejasai...</span>
                  <span className="text-[#C2410C] font-sans font-semibold text-[11px] shrink-0">
                    {copiedVscode ? 'Copied!' : 'Copy CLI'}
                  </span>
                </button>
              </div>

              {/* Capabilities */}
              <div className="space-y-2 pt-4 border-t border-[#EDE8E1]">
                <h4 className="font-serif text-base font-semibold text-[#111827]">
                  In-Editor Prompt Enhancement
                </h4>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                  Right-click any selected text and enhance it in-place. If the result needs adjustment, instant undo is always one keystroke away.
                </p>
              </div>
            </div>

            {/* Right Column: Shortcuts & Copilot Chat */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E1]">
                <h4 className="font-serif text-lg font-semibold text-[#111827]">
                  Keyboard shortcuts &amp; commands
                </h4>
                <span className="font-mono text-xs text-[#9CA3AF]">Zero mouse clicks</span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-[#4B5563]">
                <div className="flex items-center justify-between py-2 border-b border-[#EDE8E1]">
                  <div>
                    <strong className="text-[#111827] block font-medium">Enhance &amp; Replace Selection</strong>
                    <span className="text-xs text-[#6B7280]">Transforms selected text into a production prompt directly in file</span>
                  </div>
                  <kbd className="font-mono bg-white border border-[#EDE8E1] px-2 py-1 text-xs text-[#111827] shrink-0">Ctrl+Alt+R</kbd>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#EDE8E1]">
                  <div>
                    <strong className="text-[#111827] block font-medium">Undo Last Prompt Replacement</strong>
                    <span className="text-xs text-[#6B7280]">Safely reverts file to your original text draft</span>
                  </div>
                  <kbd className="font-mono bg-white border border-[#EDE8E1] px-2 py-1 text-xs text-[#111827] shrink-0">Ctrl+Alt+Z</kbd>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#EDE8E1]">
                  <div>
                    <strong className="text-[#111827] block font-medium">Open Prompt Studio Sidebar</strong>
                    <span className="text-xs text-[#6B7280]">Interactive clarifying questions and domain templates</span>
                  </div>
                  <kbd className="font-mono bg-white border border-[#EDE8E1] px-2 py-1 text-xs text-[#111827] shrink-0">Ctrl+Alt+T</kbd>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <strong className="text-[#111827] block font-medium">GitHub Copilot Chat Participant</strong>
                    <span className="text-xs text-[#6B7280]">Summon TejasAI to sharpen prompts directly within Copilot Chat</span>
                  </div>
                  <code className="font-mono text-[#C2410C] font-semibold text-xs shrink-0">@tejasai</code>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* =========================================================================
            GOOGLE ANTIGRAVITY IDE EXTENSION (THIRD)
           ========================================================================= */}
        <div className="space-y-8 pt-12 sm:pt-16 border-t border-[#EDE8E1]">
          <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-[#EDE8E1]">
            <div className="font-mono text-xs font-semibold text-[#C2410C] uppercase tracking-wider">
              Google Antigravity IDE Integration
            </div>
            <div className="font-mono text-xs text-[#6B7280]">
              Open VSX Registry &bull; Model Context Protocol &bull; Agent Skill
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* Left Column: Details & Open VSX */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-3">
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#111827] leading-snug">
                  Precision prompt engineering for Antigravity &amp; agentic coding.
                </h3>
                <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
                  Google Antigravity natively connects to the <strong>Open VSX Registry</strong>, allowing you to search and download the TejasAI extension directly from the IDE's Extensions view. You can also connect Antigravity AI coding agents via our Model Context Protocol (MCP) server so agents sharpen prompt instructions automatically before launching multi-file edits or debugging sessions.
                </p>
              </div>

              {/* Action */}
              <div className="pt-1">
                <a
                  href="https://open-vsx.org/?term=tejasai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#111827] hover:bg-[#C2410C] text-white text-sm font-semibold tracking-wide transition-colors text-center"
                >
                  Search on Open VSX Registry
                </a>
              </div>

              {/* In-IDE Extensions Search */}
              <div className="space-y-2 pt-4 border-t border-[#EDE8E1]">
                <h4 className="font-serif text-base font-semibold text-[#111827]">
                  Install from Antigravity Extensions View
                </h4>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                  Open Extensions in Antigravity (<kbd className="font-mono bg-white border border-[#EDE8E1] px-1.5 py-0.5 text-[11px] text-[#111827]">Ctrl+Shift+X</kbd>), search <strong className="text-[#111827]">TejasAI</strong> on Open VSX Registry, and click <strong>Install</strong>.
                </p>
              </div>

              {/* Studio Canvas */}
              <div className="space-y-1.5 pt-4 border-t border-[#EDE8E1]">
                <div className="font-mono text-xs font-semibold text-[#111827] uppercase tracking-wider">
                  Developer Canvas &amp; Agent Skill
                </div>
                <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                  Includes the <code className="font-mono text-xs text-[#111827]">tejasai-vibe-coder</code> agent skill. Run <code className="font-mono text-xs text-[#111827]">npm start</code> inside <code className="font-mono text-xs text-[#111827]">tejasai-antigravity</code> for the local dark developer canvas (port 3030).
                </p>
              </div>
            </div>

            {/* Right Column: MCP Stdio Server Configuration */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E1]">
                <h4 className="font-serif text-lg font-semibold text-[#111827]">
                  Model Context Protocol (MCP) Setup
                </h4>
                <button
                  type="button"
                  onClick={handleCopyMcp}
                  className="text-[#C2410C] hover:text-[#9A3412] transition-colors cursor-pointer font-sans text-xs font-semibold"
                >
                  {copiedMcp ? 'Copied Config!' : 'Copy MCP Config'}
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                Add this entry to your workspace <code className="font-mono text-xs text-[#111827]">.agents/mcp_config.json</code> or global <code className="font-mono text-xs text-[#111827]">~/.gemini/config/mcp_config.json</code>:
              </p>

              <pre className="bg-white border border-[#EDE8E1] p-4 text-[#111827] overflow-x-auto font-mono text-xs leading-relaxed scrollbar-none">
{`{
  "mcpServers": {
    "tejasai": {
      "command": "node",
      "args": ["tejasai-antigravity/tejasai-mcp-server.js"]
    }
  }
}`}
              </pre>

              <p className="text-xs text-[#6B7280] leading-relaxed pt-1">
                Gives Antigravity agents direct access to <code className="font-mono text-xs text-[#C2410C]">tejasai_enhance_prompt</code> and <code className="font-mono text-xs text-[#C2410C]">tejasai_analyze_clarify</code> tools before code generation.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
