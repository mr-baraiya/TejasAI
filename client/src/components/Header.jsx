import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

/**
 * Clean, human Header matching TejasAI's editorial aesthetic.
 * All navigation links share consistent typography with no artificial borders or icons.
 */
export function Header({ onNewPrompt, hasActivePrompt = false }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (onNewPrompt && hasActivePrompt) {
      onNewPrompt();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: 'Examples', href: '#examples' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Extension', href: '#extension' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FFFBF5] border-b border-[#EDE8E1]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Wordmark with User's Official Logo */}
            <a
              href="#"
              onClick={handleLogoClick}
              className="flex items-center space-x-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] rounded-none p-1 -m-1"
              title="TejasAI"
            >
              <img
                src="/logo.png"
                alt="TejasAI Logo"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-none object-cover shrink-0 shadow-xs"
              />
              <span className="text-lg font-semibold tracking-tight text-[#111827]">
                TejasAI
              </span>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-sm font-medium text-[#6B7280] hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] rounded-none py-1 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Mobile menu button (borderless, no box) */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="p-1.5 text-[#374151] hover:text-[#111827] focus-visible:outline-none cursor-pointer"
              >
                <Menu className="w-6 h-6" strokeWidth={1.75} />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile drawer backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer from right side up to 50% of screen */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-1/2 bg-[#FFFBF5] border-l border-[#EDE8E1] shadow-2xl flex flex-col md:hidden transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-end h-16 px-4 border-b border-[#EDE8E1]">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="p-1.5 text-[#374151] hover:text-[#111827] focus-visible:outline-none cursor-pointer"
          >
            <X className="w-6 h-6" strokeWidth={1.75} />
          </button>
        </div>

        <nav className="flex-1 px-5 py-6 space-y-4 overflow-y-auto scrollbar-none">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block text-sm font-medium text-[#374151] hover:text-[#C2410C] py-1 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
}
