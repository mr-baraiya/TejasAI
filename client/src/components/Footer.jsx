import React, { useState } from 'react';
import { X } from 'lucide-react';

export function Footer() {
  const [modalType, setModalType] = useState(null); // 'privacy' | 'terms' | null

  return (
    <>
      <footer className="mt-24 border-t border-[#EDE8E1] bg-[#FFFFFF] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280]">
          
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

          {/* Links on right */}
          <div className="flex items-center space-x-6">
            <button
              type="button"
              onClick={() => setModalType('privacy')}
              className="text-[#6B7280] hover:text-[#111827] cursor-pointer transition-colors"
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => setModalType('terms')}
              className="text-[#6B7280] hover:text-[#111827] cursor-pointer transition-colors"
            >
              Terms
            </button>
            <a
              href="mailto:baraiyavishalbhai32@gmail.com"
              className="text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              Contact
            </a>
          </div>

        </div>
      </footer>

      {/* Simple Privacy & Terms Modal */}
      {modalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setModalType(null)}
        >
          <div
            className="w-full max-w-lg rounded-none border border-[#EDE8E1] bg-[#FFFFFF] p-6 shadow-md space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E1]">
              <h3 className="text-base font-semibold text-[#111827]">
                {modalType === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                aria-label="Close modal"
                className="p-1 rounded-none text-[#6B7280] hover:text-[#111827] cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            {modalType === 'privacy' ? (
              <div className="text-sm text-[#374151] space-y-3 leading-relaxed">
                <p>
                  <strong>No Data Storage:</strong> We do not store, log, or sell what you type on our servers. Your text is processed in real time and discarded immediately after generating the enhanced prompt.
                </p>
                <p>
                  <strong>AI Processing:</strong> Prompt improvements are generated securely using the qwen/qwen3.8-27b model via Groq API inference over encrypted HTTPS.
                </p>
                <p>
                  <strong>Local Storage:</strong> Recent prompts are saved exclusively inside your browser&apos;s local storage so you can access them on this device. They are never transmitted to our database.
                </p>
                <p>
                  <strong>No Tracking:</strong> TejasAI uses no tracking cookies, analytics pixels, or user account trackers.
                </p>
              </div>
            ) : (
              <div className="text-sm text-[#374151] space-y-3 leading-relaxed">
                <p>
                  <strong>Service Overview:</strong> TejasAI is a free assistant that helps everyday users rewrite informal thoughts into clear instructions for AI tools.
                </p>
                <p>
                  <strong>Usage:</strong> The service is provided &ldquo;as is&rdquo; without warranties of any kind. You retain full ownership and responsibility for any prompts you submit and how you use the output.
                </p>
                <p>
                  <strong>Acceptable Use:</strong> You agree not to submit unlawful, harmful, or abusive content. Requests that violate safety policies may be refused.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-[#EDE8E1] flex justify-end">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-none bg-[#111827] text-white text-xs font-medium cursor-pointer"
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
