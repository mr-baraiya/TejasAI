import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, ShieldWarning } from '@phosphor-icons/react';

export function Footer() {
  const [modalType, setModalType] = useState(null); // 'privacy' | 'terms' | 'policy' | null

  // Support direct public URLs (/privacy, /terms, /policy, /content-policy) and hash links
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      const hash = window.location.hash.toLowerCase();

      if (path === '/privacy' || hash === '#privacy') {
        setModalType('privacy');
      } else if (path === '/terms' || hash === '#terms') {
        setModalType('terms');
      } else if (path === '/policy' || path === '/content-policy' || hash === '#policy') {
        setModalType('policy');
      } else if (path === '' || path === '/') {
        setModalType(null);
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const openModal = (type) => {
    setModalType(type);
    const targetPath = type === 'policy' ? '/policy' : `/${type}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  const closeModal = () => {
    setModalType(null);
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
    }
  };

  return (
    <>
      <footer className="mt-24 border-t border-[#EDE8E1] bg-[#FFFFFF] py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Main Footer Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
            
            {/* Wordmark on left */}
            <div className="flex items-center space-x-2.5">
              <img
                src="/logo.png"
                alt="TejasAI Logo"
                className="w-5 h-5 rounded-none object-cover shrink-0"
              />
              <span className="font-semibold text-[#111827]">
                TejasAI
              </span>
              <span>&copy; {new Date().getFullYear()}</span>
            </div>

            {/* Links and Sponsor on right */}
            <div className="flex items-center space-x-5 sm:space-x-6 flex-wrap justify-center">
              <iframe
                src="https://github.com/sponsors/mr-baraiya/button"
                title="Sponsor mr-baraiya"
                height="32"
                width="114"
                className="border-0 shrink-0"
                style={{ border: 0, borderRadius: '6px' }}
              />
              <a
                href="https://github.com/sponsors/mr-baraiya"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6B7280] hover:text-[#C2410C] font-medium transition-colors"
              >
                Sponsor
              </a>
              <button
                type="button"
                onClick={() => openModal('privacy')}
                className="text-[#6B7280] hover:text-[#111827] cursor-pointer transition-colors"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => openModal('terms')}
                className="text-[#6B7280] hover:text-[#111827] cursor-pointer transition-colors"
              >
                Terms of Service
              </button>
              <button
                type="button"
                onClick={() => openModal('policy')}
                className="text-[#6B7280] hover:text-[#111827] cursor-pointer transition-colors"
              >
                Content Policy
              </button>
              <a
                href="mailto:baraiyavishalbhai32@gmail.com"
                className="text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                Support
              </a>
            </div>

          </div>

          {/* Editorial Semantic Keyword Index & Independent Disclaimer Banner */}
          <div className="space-y-2 text-xs text-[#6B7280] leading-relaxed">
            <p>
              <strong>TejasAI</strong> — Free AI prompt enhancer, prompt improver, and AI writing assistant. Generate structured ChatGPT prompts and accelerate your AI productivity.
            </p>
            <p className="text-[11px] text-[#9CA3AF] text-center sm:text-left">
              <strong>Disclaimer:</strong> TejasAI is an independent prompt optimization tool. It is not affiliated with, sponsored by, or endorsed by OpenAI, Google, Anthropic, Perplexity AI, DeepSeek, xAI, or any of their respective affiliates. All product names, logos, and brands (ChatGPT, Gemini, Claude, Perplexity, DeepSeek, Grok) are property of their respective trademark holders.
            </p>
          </div>

        </div>
      </footer>

      {/* Comprehensive Privacy & Terms Modal */}
      {modalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-xl rounded-none border border-[#EDE8E1] bg-[#FFFBF5] p-6 sm:p-8 shadow-xl space-y-5 max-h-[85vh] overflow-y-auto scrollbar-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-[#EDE8E1]">
              <div className="flex items-center space-x-2">
                {modalType === 'privacy' && <ShieldCheck className="w-5 h-5 text-[#C2410C]" weight="fill" />}
                {modalType === 'terms' && <FileText className="w-5 h-5 text-[#C2410C]" weight="fill" />}
                {modalType === 'policy' && <ShieldWarning className="w-5 h-5 text-[#C2410C]" weight="fill" />}
                <h3 className="text-lg font-serif font-semibold text-[#111827]">
                  {modalType === 'privacy'
                    ? 'Privacy Policy'
                    : modalType === 'terms'
                    ? 'Terms of Service'
                    : 'Content Policy'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close modal"
                className="p-1 rounded-none text-[#6B7280] hover:text-[#111827] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalType === 'privacy' && (
              <div className="text-xs sm:text-sm text-[#374151] space-y-4 leading-relaxed">
                <div>
                  <h4 className="font-semibold text-[#111827] mb-1">1. Zero Prompt Logging & Ephemeral Processing</h4>
                  <p>
                    We do not store, log, or sell the text prompts you submit. When you request an enhancement, your prompt is transmitted securely over HTTPS and processed ephemerally in server RAM solely to generate the rewritten prompt. It is completely discarded immediately after the response is sent.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#111827] mb-1">2. Client-Side Only Storage</h4>
                  <p>
                    Your recent prompt history on the website is saved exclusively in your web browser&apos;s local storage (<code className="bg-[#EDE8E1] px-1 py-0.5 rounded-none font-mono text-xs">localStorage</code>). It never leaves your machine, is never synced to a remote database, and can be cleared at any time directly through your browser settings.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#111827] mb-1">3. Browser Extension Privacy</h4>
                  <p>
                    The TejasAI browser extension operates on minimal permissions (<code className="bg-[#EDE8E1] px-1 py-0.5 rounded-none font-mono text-xs">storage</code> only) to save your preferences. It only activates on designated AI tool domains (ChatGPT, Gemini, Claude, Perplexity, DeepSeek, Grok). Prompt enhancement is 100% user-initiated: text is transmitted only when you explicitly click the &ldquo;Enhance&rdquo; button. It never records keystrokes or accesses private browsing tabs.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#111827] mb-1">4. Zero Tracking & Third-Party Cookies</h4>
                  <p>
                    TejasAI does not use third-party analytics trackers, advertising cookies, behavioral fingerprinting, or marketing pixels.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#111827] mb-1">5. Contact Information</h4>
                  <p>
                    For privacy inquiries or technical questions, contact us directly at{' '}
                    <a href="mailto:baraiyavishalbhai32@gmail.com" className="text-[#C2410C] underline font-medium">
                      baraiyavishalbhai32@gmail.com
                    </a>.
                  </p>
                </div>
              </div>
            )}

            {modalType === 'terms' && (
              <div className="text-xs sm:text-sm text-[#374151] space-y-4 leading-relaxed">
                <div>
                  <h4 className="font-semibold text-[#111827] mb-1">1. Service Description & Independence</h4>
                  <p>
                    TejasAI is an independent prompt optimization tool developed to help users structure, clarify, and articulate their thoughts into clear instructions. TejasAI is not affiliated with, sponsored by, or endorsed by OpenAI, Google, Anthropic, Perplexity AI, DeepSeek, or xAI.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#111827] mb-1">2. User Ownership & Responsibility</h4>
                  <p>
                    You retain all rights to the text prompts you input and the enhanced outputs generated. You are solely responsible for reviewing and verifying generated prompts before submitting them to any third-party AI provider, and for complying with the terms of service of those respective platforms.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#111827] mb-1">3. Acceptable Use</h4>
                  <p>
                    You agree not to use TejasAI for unlawful purposes, including generating harmful, harassing, defamatory, or abusive content, or attempting to bypass safety controls of AI providers. We reserve the right to limit or terminate access to anyone misusing the service.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#111827] mb-1">4. Disclaimer of Warranties & Limitation of Liability</h4>
                  <p>
                    The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, whether express or implied. TejasAI does not guarantee the accuracy, completeness, or suitability of generated prompts. Under no circumstances shall TejasAI or its developers be liable for any direct, indirect, incidental, or consequential damages resulting from your use of the service.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#111827] mb-1">5. Support & Contact</h4>
                  <p>
                    For questions regarding these terms, contact us at{' '}
                    <a href="mailto:baraiyavishalbhai32@gmail.com" className="text-[#C2410C] underline font-medium">
                      baraiyavishalbhai32@gmail.com
                    </a>.
                  </p>
                </div>
              </div>
            )}

            {modalType === 'policy' && (
              <div className="text-xs sm:text-sm text-[#374151] space-y-4 leading-relaxed">
                <div>
                  <h4 className="font-semibold text-[#111827] mb-1">1. Context-Aware Evaluation (No Blind Keyword Blocking)</h4>
                  <p>
                    TejasAI does not block requests based solely on isolated words (such as &ldquo;adult&rdquo;, &ldquo;sex&rdquo;, or casual profanity). Instead, our moderation engine evaluates the holistic context, intent, and objective of your request.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#111827] mb-1">2. Legitimate & Supported Categories</h4>
                  <p className="mb-2">We fully support and responsibly enhance prompts in the following domains:</p>
                  <ul className="list-disc pl-5 space-y-1 text-[#4B5563]">
                    <li><strong>Educational & Academic:</strong> Curricula on health, human biology, reproduction, history, literature, and sociological analysis.</li>
                    <li><strong>Medical & Clinical Healthcare:</strong> STI symptoms/prevention, reproductive anatomy, urology, gynecology, adult-onset health conditions, and clinical research.</li>
                    <li><strong>Creative Writing:</strong> Romance, character relationships, drama, and emotional narratives (non-explicit).</li>
                    <li><strong>Defensive Cybersecurity:</strong> Vulnerability assessment, input sanitization, secure coding, firewall rules, and defensive architecture.</li>
                    <li><strong>Casual Profanity & Venting:</strong> Everyday expressions and slang without harassment or abuse (e.g., &ldquo;fix this damn loop&rdquo;).</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-[#111827] mb-1">3. Disallowed Content</h4>
                  <p className="mb-2">To prevent real-world harm, TejasAI disallows prompts requesting:</p>
                  <ul className="list-disc pl-5 space-y-1 text-[#4B5563]">
                    <li><strong>Child Exploitation or Abuse:</strong> Any exploitation or endangerment of minors (zero tolerance).</li>
                    <li><strong>Sexually Explicit Erotica & Pornography:</strong> Generating explicit sexual acts, hardcore erotica, or graphic pornographic narratives.</li>
                    <li><strong>Weapons & Physical Harm:</strong> Instructions for manufacturing firearms, explosives, chemical/biological weapons, or promoting violence.</li>
                    <li><strong>Malware & Unauthorized Access:</strong> Creating ransomware, keyloggers, botnets, or unauthorized account hacking tools.</li>
                    <li><strong>Self-Harm & Suicide:</strong> Instructions or encouragement for self-harm or suicide.</li>
                    <li><strong>Non-Consensual Material & Doxxing:</strong> Voyeurism, non-consensual imagery, or publishing private personal information.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-[#111827] mb-1">4. Respectful Refusals & Zero Sensitive Logging</h4>
                  <p>
                    When a request conflicts with our Content Policy, TejasAI returns a concise, respectful explanation rather than enhancing the prompt. Sensitive prompts are never saved to disk, logged to a database, or shared with third parties.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-3.5 border-t border-[#EDE8E1] flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-none bg-[#111827] hover:bg-[#374151] text-white text-xs font-semibold tracking-wide cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
