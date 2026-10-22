import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  Edit3,
  ChevronDown,
  ChevronUp,
  Share2,
  Scissors,
  Smile,
  PlusCircle,
  MessageCircle,
  Send,
} from 'lucide-react';

export function OutputDisplay({
  originalPrompt,
  enhancedPrompt,
  whyBetter = [],
  isLoading,
  onRetry,
  onEdit,
  onTweak,
  onShowToast,
}) {
  const [copied, setCopied] = useState(false);
  const [showWhyBetter, setShowWhyBetter] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const shareContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareContainerRef.current && !shareContainerRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showShareMenu]);

  // Skeleton loading view
  if (isLoading && !enhancedPrompt) {
    return (
      <div className="pt-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          <div className="rounded-none border border-[#F0EBE3] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs space-y-3">
            <div className="h-4 w-28 bg-[#F0EBE3] rounded-none animate-pulse"></div>
            <div className="h-4 w-full bg-[#FAF8F5] rounded-none animate-pulse"></div>
            <div className="h-4 w-3/4 bg-[#FAF8F5] rounded-none animate-pulse"></div>
          </div>
          <div className="rounded-none border border-[#F0EBE3] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs space-y-3">
            <div className="h-4 w-32 bg-[#F0EBE3] rounded-none animate-pulse"></div>
            <div className="h-4 w-full bg-[#FAF8F5] rounded-none animate-pulse"></div>
            <div className="h-4 w-5/6 bg-[#FAF8F5] rounded-none animate-pulse"></div>
            <div className="h-4 w-2/3 bg-[#FAF8F5] rounded-none animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!enhancedPrompt) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(enhancedPrompt);
      setCopied(true);
      if (onShowToast) onShowToast('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = enhancedPrompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      if (onShowToast) onShowToast('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

function ChatGptIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .5154 4.9108 6.051 6.051 0 0 0 6.51 2.9A6.0651 6.0651 0 0 0 19.0193 19.818a5.9847 5.9847 0 0 0 3.9977-2.9 6.0462 6.0462 0 0 0-.7351-7.0969zm-7.973 11.2785a4.0326 4.0326 0 0 1-2.29-1.252l3.712-2.1436V13.88l3.12 1.8037a4.0483 4.0483 0 0 1-4.542 5.4159zm-10.741-3.6937a4.0326 4.0326 0 0 1-.5047-2.5857l3.712 2.1436v2.5407l-2.025-1.1699a4.0483 4.0483 0 0 1-1.1823-.9287zm-1.8037-7.2333a4.0357 4.0357 0 0 1 1.7853-2.274l3.122 1.8027v4.2863l-3.122-1.8027a4.0483 4.0483 0 0 1-.1785-2.0123zm13.3853 4.2863L12.551 13.59v-4.287l3.1203-1.8027a4.0452 4.0452 0 0 1 4.7215 6.294l-3.1213-1.8027zm-5.7725-7.6534-3.712-2.1436a4.0483 4.0483 0 0 1 6.012-1.3787l-3.712 2.1436v1.3787zm-4.321 2.5034L5.65 7.6416a4.0483 4.0483 0 0 1 5.932-3.8055l-3.121 1.8027v4.2863z" />
    </svg>
  );
}

function GeminiIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93a12.3 12.3 0 0 1 3.81 2.58 12.3 12.3 0 0 1 2.58 3.81z" />
    </svg>
  );
}

function PerplexityIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z" />
    </svg>
  );
}

function DeepSeekIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 0 1-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 0 0-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 0 1-.465.137 9.597 9.597 0 0 0-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 0 0 1.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 0 1 1.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 0 1 .415-.287.302.302 0 0 1 .2.288.306.306 0 0 1-.31.307.303.303 0 0 1-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 0 1-.035-.419c.047-.193.18-.328.375-.355.207-.028.384.106.425.295.008.035.004.08-.205.319z" />
    </svg>
  );
}

function ClaudeIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
    </svg>
  );
}

const AI_TOOLS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: ChatGptIcon,
    getUrl: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
    title: 'Open in ChatGPT',
    brandHover: 'hover:text-[#10A37F]',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: GeminiIcon,
    getUrl: (prompt) => `https://gemini.google.com/app?prompt=${encodeURIComponent(prompt)}`,
    title: 'Open Gemini (Prompt copied to clipboard - press Ctrl+V to paste)',
    brandHover: 'hover:text-[#1A73E8]',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    icon: PerplexityIcon,
    getUrl: (prompt) => `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`,
    title: 'Open in Perplexity',
    brandHover: 'hover:text-[#1FB8CD]',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: DeepSeekIcon,
    getUrl: (prompt) => `https://chat.deepseek.com/?q=${encodeURIComponent(prompt)}`,
    title: 'Open DeepSeek (Prompt copied to clipboard - press Ctrl+V to paste)',
    brandHover: 'hover:text-[#4D6BFE]',
  },
  {
    id: 'claude',
    name: 'Claude',
    icon: ClaudeIcon,
    getUrl: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
    title: 'Open in Claude',
    brandHover: 'hover:text-[#D97757]',
  },
];

  const getWhatsAppShareUrl = () => {
    const maxLen = 1200;
    const body =
      enhancedPrompt.length > maxLen
        ? `${enhancedPrompt.slice(0, maxLen)}...\n\n(Enhanced with TejasAI)`
        : `${enhancedPrompt}\n\n(Enhanced with TejasAI)`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(body)}`;
  };

  const getTwitterShareUrl = () => {
    const maxLen = 220;
    const body =
      enhancedPrompt.length > maxLen
        ? `${enhancedPrompt.slice(0, maxLen)}...`
        : enhancedPrompt;
    const tweet = `Check out this prompt enhanced with TejasAI:\n\n"${body}"`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
  };

  const handleShareClick = async () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(
      typeof navigator !== 'undefined' ? navigator.userAgent : ''
    );
    if (isMobile && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'TejasAI Enhanced Prompt',
          text: enhancedPrompt,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    setShowShareMenu((prev) => !prev);
  };

  const handleShareCopy = async () => {
    try {
      await navigator.clipboard.writeText(enhancedPrompt);
      setShareCopied(true);
      if (onShowToast) onShowToast('Prompt copied to clipboard');
      setTimeout(() => {
        setShareCopied(false);
        setShowShareMenu(false);
      }, 1200);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = enhancedPrompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShareCopied(true);
      if (onShowToast) onShowToast('Prompt copied to clipboard');
      setTimeout(() => {
        setShareCopied(false);
        setShowShareMenu(false);
      }, 1200);
    }
  };

  const handleOpenAi = (tool) => {
    let copied = false;
    try {
      const textArea = document.createElement('textarea');
      textArea.value = enhancedPrompt;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      copied = document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch {
      // ignore
    }

    if (!copied && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(enhancedPrompt).catch(() => {});
    }

    if (onShowToast) {
      if (tool.id === 'gemini') {
        onShowToast('Prompt copied! In Gemini, press Ctrl+V to paste');
      } else if (tool.id === 'deepseek') {
        onShowToast('Prompt copied! In DeepSeek, press Ctrl+V to paste');
      } else {
        onShowToast(`Opening ${tool.name}... (Prompt copied to clipboard)`);
      }
    }
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        
        {/* Card 1: What you wrote */}
        <div className="rounded-none border border-[#F0EBE3] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs flex flex-col justify-start">
          <div className="pb-3 mb-3 border-b border-[#F2ECE4]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              What you wrote
            </h3>
          </div>
          <p className="text-sm sm:text-base text-[#374151] leading-relaxed whitespace-pre-wrap">
            {originalPrompt}
          </p>
        </div>

        {/* Card 2: Better version */}
        <div className="rounded-none border border-[#F0EBE3] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="pb-3 border-b border-[#F2ECE4] flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
                Better version
              </h3>
            </div>

            <div className="text-sm sm:text-base text-[#111827] font-normal leading-relaxed whitespace-pre-wrap selection:bg-[#C2410C] selection:text-white">
              {enhancedPrompt}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3.5 border-t border-[#F2ECE4] space-y-2.5">
            <div className="flex items-center justify-between gap-1 sm:gap-2 flex-nowrap overflow-x-auto scrollbar-none">
              {/* Primary Actions: sleek h-8 sharp buttons */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`h-8 px-2 sm:px-3 rounded-none font-medium text-xs transition-colors flex items-center justify-center space-x-1 sm:space-x-1.5 cursor-pointer shadow-xs shrink-0 whitespace-nowrap ${
                    copied
                      ? 'bg-[#15803D] text-white border border-[#15803D]'
                      : 'bg-[#C2410C] hover:bg-[#9A3412] text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Copy<span className="hidden sm:inline"> prompt</span></span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onRetry}
                  disabled={isLoading}
                  className="h-8 px-1.5 sm:px-2.5 rounded-none text-xs font-medium text-[#4B5563] hover:text-[#111827] hover:bg-[#F3EFEA] flex items-center space-x-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
                  <span>Try<span className="hidden sm:inline"> again</span></span>
                </button>

                <button
                  type="button"
                  onClick={onEdit}
                  className="h-8 px-1.5 sm:px-2.5 rounded-none text-xs font-medium text-[#4B5563] hover:text-[#111827] hover:bg-[#F3EFEA] flex items-center space-x-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Edit</span>
                </button>
              </div>

              {/* Share */}
              <div className="relative shrink-0" ref={shareContainerRef}>
                <button
                  type="button"
                  onClick={handleShareClick}
                  className="h-8 px-1.5 sm:px-2.5 rounded-none text-xs font-medium text-[#4B5563] hover:text-[#111827] hover:bg-[#F3EFEA] flex items-center space-x-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
                  aria-label="Share enhanced prompt"
                  aria-expanded={showShareMenu}
                >
                  <Share2 className="w-3.5 h-3.5 text-[#6B7280]" strokeWidth={1.75} />
                  <span>Share</span>
                </button>

                  {showShareMenu && (
                    <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#FFFFFF] border border-[#F0EBE3] rounded-none shadow-lg py-1.5 z-30">
                      <button
                        type="button"
                        onClick={handleShareCopy}
                        className="w-full px-3 py-2 text-xs text-[#374151] hover:bg-[#FAF8F5] flex items-center justify-between transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center space-x-2.5">
                          {shareCopied ? (
                            <Check className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={2} />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#6B7280]" strokeWidth={1.75} />
                          )}
                          <span className={shareCopied ? 'text-[#15803D] font-medium' : ''}>
                            {shareCopied ? 'Copied to clipboard' : 'Copy prompt text'}
                          </span>
                        </div>
                      </button>

                      <a
                        href={getWhatsAppShareUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowShareMenu(false)}
                        className="w-full px-3 py-2 text-xs text-[#374151] hover:bg-[#FAF8F5] flex items-center space-x-2.5 transition-colors text-left"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" strokeWidth={1.75} />
                        <span>Share on WhatsApp</span>
                      </a>

                      <a
                        href={getTwitterShareUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowShareMenu(false)}
                        className="w-full px-3 py-2 text-xs text-[#374151] hover:bg-[#FAF8F5] flex items-center space-x-2.5 transition-colors text-left"
                      >
                        <svg className="w-3.5 h-3.5 text-[#111827] fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span>Share on X</span>
                      </a>

                      {typeof navigator !== 'undefined' && !!navigator.share && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.share({
                                title: 'TejasAI Enhanced Prompt',
                                text: enhancedPrompt,
                              });
                            } catch (err) {
                              if (err.name !== 'AbortError') console.warn(err);
                            }
                            setShowShareMenu(false);
                          }}
                          className="w-full px-3 py-2 text-xs text-[#374151] hover:bg-[#FAF8F5] flex items-center space-x-2.5 transition-colors text-left border-t border-[#EDE8E1] mt-1 pt-2 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5 text-[#6B7280]" strokeWidth={1.75} />
                          <span>More device options...</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

            {/* AI Tools Launch Bar: ChatGPT, Gemini, Perplexity, DeepSeek, Claude */}
            <div className="pt-2.5 border-t border-[#F2ECE4] flex items-center gap-1 text-xs">
              <span className="text-xs font-medium text-[#6B7280] mr-1 shrink-0">
                Open in:
              </span>
              {AI_TOOLS.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <a
                    key={tool.id}
                    href={tool.getUrl(enhancedPrompt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleOpenAi(tool)}
                    title={tool.title}
                    aria-label={tool.title}
                    className={`w-7.5 h-7.5 rounded-none text-[#4B5563] hover:bg-[#F3EFEA] flex items-center justify-center transition-colors cursor-pointer shrink-0 ${tool.brandHover}`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </a>
                );
              })}
            </div>

            {/* Quick Tweaks */}
            <div className="pt-2 border-t border-[#F2ECE4] flex items-center gap-1 sm:gap-1.5 flex-nowrap overflow-x-auto scrollbar-none text-xs">
              <span className="text-xs text-[#6B7280] mr-0.5 shrink-0">Tweak:</span>
              <button
                type="button"
                onClick={() => onTweak('shorter')}
                disabled={isLoading}
                className="h-7 px-1.5 sm:px-2 rounded-none hover:bg-[#F3EFEA] text-xs font-medium text-[#4B5563] hover:text-[#111827] flex items-center space-x-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
              >
                <Scissors className="w-3 h-3 text-[#6B7280]" strokeWidth={1.75} />
                <span>Shorter</span>
              </button>
              <button
                type="button"
                onClick={() => onTweak('simpler')}
                disabled={isLoading}
                className="h-7 px-1.5 sm:px-2 rounded-none hover:bg-[#F3EFEA] text-xs font-medium text-[#4B5563] hover:text-[#111827] flex items-center space-x-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
              >
                <Smile className="w-3 h-3 text-[#6B7280]" strokeWidth={1.75} />
                <span>Simpler</span>
              </button>
              <button
                type="button"
                onClick={() => onTweak('moreDetail')}
                disabled={isLoading}
                className="h-7 px-1.5 sm:px-2 rounded-none hover:bg-[#F3EFEA] text-xs font-medium text-[#4B5563] hover:text-[#111827] flex items-center space-x-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
              >
                <PlusCircle className="w-3 h-3 text-[#6B7280]" strokeWidth={1.75} />
                <span><span className="hidden sm:inline">More </span>Detail</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion: Why is this better? */}
      {whyBetter && whyBetter.length > 0 && (
        <div className="rounded-none border border-[#F0EBE3] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs">
          <button
            type="button"
            onClick={() => setShowWhyBetter((prev) => !prev)}
            className="w-full flex items-center justify-between text-left text-sm font-semibold text-[#111827] cursor-pointer"
          >
            <span>Why this version works better</span>
            {showWhyBetter ? (
              <ChevronUp className="w-4 h-4 text-[#6B7280]" strokeWidth={1.75} />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6B7280]" strokeWidth={1.75} />
            )}
          </button>

          {showWhyBetter && (
            <ul className="mt-3 space-y-2 text-sm text-[#374151] border-t border-[#F2ECE4] pt-3">
              {whyBetter.map((bullet, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-[#C2410C] font-semibold">•</span>
                  <span className="leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
