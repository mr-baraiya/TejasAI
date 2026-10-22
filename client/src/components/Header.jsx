import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

/**
 * Clean, professional Header with solid #C2410C square mark and simple navigation.
 * No emojis, no pills, no purple logo.
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
    <header className="sticky top-0 z-40 bg-[#FFFBF5] border-b border-[#E7E0D6]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Wordmark with User's Official Logo */}
          <a
            href="#"
            onClick={handleLogoClick}
            className="flex items-center space-x-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] rounded-[8px] p-1 -m-1"
            title="TejasAI"
          >
            <img
              src="/logo.png"
              alt="TejasAI Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-[7px] object-cover shrink-0 shadow-xs"
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
                className="text-sm font-medium text-[#6B7280] hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] rounded-[6px] py-1 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="p-2 rounded-[8px] border border-[#E7E0D6] bg-[#FFFFFF] text-[#374151] hover:text-[#111827] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" strokeWidth={1.75} /> : <Menu className="w-5 h-5" strokeWidth={1.75} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E7E0D6] bg-[#FFFBF5] px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block text-sm font-medium text-[#374151] hover:text-[#C2410C] px-3 py-2 rounded-[8px] hover:bg-[#FFFFFF]"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
