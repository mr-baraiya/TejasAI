/**
 * TejasAI Site Adapter - Perplexity AI (perplexity.ai)
 *
 * Supports Perplexity's React textarea search, follow-up inputs,
 * and scoped composer bottom toolbars.
 */

window.TejasAIAdapters = window.TejasAIAdapters || {};

window.TejasAIAdapters['perplexity'] = {
  id: 'perplexity',
  name: 'Perplexity',
  targetAI: 'perplexity',

  matches(hostname) {
    return hostname.includes('perplexity.ai');
  },

  findInput() {
    const selectors = [
      'main textarea',
      'main div[contenteditable="true"]',
      'textarea[placeholder*="connectors" i]',
      'textarea[placeholder*="Type @" i]',
      'textarea[placeholder*="Ask" i]',
      'textarea[placeholder*="Search" i]',
      'textarea[placeholder*="question" i]',
      'textarea[placeholder*="follow-up" i]',
      'div[data-testid="search-input"] textarea',
      '[data-testid="search-input"]',
      'form textarea',
      'textarea.overflow-auto',
      'div[contenteditable="true"]',
      'textarea',
    ];

    for (const sel of selectors) {
      const candidates = document.querySelectorAll(sel);
      for (const el of candidates) {
        // Exclude inputs in top navigation, header, or sidebar
        if (el && el.offsetParent !== null && !el.closest('header, nav, aside, [role="navigation"]')) {
          return el;
        }
      }
    }
    return null;
  },

  getText(el) {
    if (!el) return '';
    return el.value ? el.value.trim() : (el.innerText ? el.innerText.trim() : (el.textContent ? el.textContent.trim() : ''));
  },

  setText(el, text) {
    if (!el) return false;
    el.focus();

    // Standard React synthetic input setter
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
    if (descriptor && descriptor.set) {
      descriptor.set.call(el, text);
    } else {
      el.value = text;
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  },

  getComposerBox(inputEl) {
    if (!inputEl) return null;

    // 1. Direct form wrapper
    const form = inputEl.closest('form');
    if (form) return form;

    // 2. Ascend parents until we reach the composer card (card container with buttons)
    let parent = inputEl.parentElement;
    while (parent && parent !== document.body && parent.tagName !== 'MAIN') {
      const hasActionButtons = parent.querySelector('button');
      const isCardContainer =
        parent.tagName === 'DIV' &&
        (parent.className.includes('rounded') ||
          parent.className.includes('border') ||
          parent.className.includes('bg-') ||
          parent.className.includes('shadow') ||
          parent.getAttribute('data-testid')?.includes('search'));

      if (hasActionButtons && isCardContainer) {
        return parent;
      }
      parent = parent.parentElement;
    }

    return inputEl.closest('main') || inputEl.parentElement;
  },

  getRightCluster(inputEl) {
    const box = this.getComposerBox(inputEl);
    if (!box) return null;

    const toolbarSelectors = [
      'div.flex.items-center.justify-between',
      'div.flex.justify-between',
      'div[class*="toolbar"]',
      'div[class*="bottom"]',
      'div.flex.items-center:last-child',
    ];

    for (const sel of toolbarSelectors) {
      const bar = box.querySelector(sel);
      if (bar && bar !== inputEl && bar.offsetParent !== null) {
        if (bar.children.length >= 2) {
          const lastChild = bar.lastElementChild;
          if (lastChild && lastChild.offsetParent !== null) return lastChild;
        }
        const rightCluster =
          bar.querySelector('div.flex.items-center:has(button), div.flex:has(button)') ||
          bar.lastElementChild;
        if (rightCluster && rightCluster.offsetParent !== null) {
          return rightCluster;
        }
        return bar;
      }
    }
    return null;
  },

  findAttachContainer(inputEl) {
    if (!inputEl) return null;

    // 1. Right cluster inside composer box
    const rightCluster = this.getRightCluster(inputEl);
    if (rightCluster) {
      return rightCluster;
    }

    const box = this.getComposerBox(inputEl);
    if (!box) return inputEl.parentElement;

    // 2. Next to submit button if found inside box
    const submitBtn = this.findSubmitButton(inputEl);
    if (submitBtn && submitBtn.parentElement && box.contains(submitBtn)) {
      return submitBtn.parentElement;
    }

    return box || inputEl.parentElement;
  },

  findSubmitButton(inputEl) {
    const el = inputEl || this.findInput();
    const box = el ? this.getComposerBox(el) : null;
    const scope = box || document.querySelector('main') || document;

    const selectors = [
      'button[aria-label*="Submit" i]',
      'button[aria-label*="Submit query" i]',
      'button[aria-label*="Send" i]',
      'button[aria-label*="Ask" i]',
      'button[data-testid="submit-button"]',
      'button[data-testid="search-button"]',
      'button[data-testid="send-button"]',
      'button.bg-super',
      'button[type="submit"]',
    ];

    for (const sel of selectors) {
      const btn = scope.querySelector(sel);
      if (btn && btn.offsetParent !== null && !btn.closest('header, nav, aside')) {
        return btn;
      }
    }

    // If submit button morphs or is the circular voice/submit icon at the end of the composer
    if (box) {
      const toolbar =
        box.querySelector('div.flex.items-center.justify-between, div.flex.justify-between') ||
        box.querySelector('div[class*="toolbar"]');
      if (toolbar) {
        const rightCluster =
          toolbar.querySelector('div.flex.items-center:has(button), div.flex:has(button)') ||
          toolbar.lastElementChild;
        if (rightCluster) {
          const buttons = rightCluster.querySelectorAll('button');
          if (buttons.length > 0) {
            return buttons[buttons.length - 1];
          }
        }
      }
    }

    return null;
  },

  canAutoEnhance() {
    return true;
  },

  submitPrompt(inputEl, submitBtn) {
    if (submitBtn && !submitBtn.disabled && !submitBtn.getAttribute('aria-disabled')) {
      submitBtn.click();
      return true;
    }

    if (inputEl) {
      inputEl.focus();
      inputEl.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
      }));
      return true;
    }
    return false;
  },
};
