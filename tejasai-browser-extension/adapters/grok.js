/**
 * TejasAI Site Adapter - Grok (grok.com & x.com/i/grok)
 *
 * Supports both standalone grok.com and X/Twitter Grok interfaces.
 * Handles both standard textarea composers and contenteditable/Draft.js editors.
 */

window.TejasAIAdapters = window.TejasAIAdapters || {};

window.TejasAIAdapters['grok'] = {
  id: 'grok',
  name: 'Grok',
  targetAI: 'grok',

  matches(hostname) {
    return (
      hostname.includes('grok.com') ||
      hostname.includes('x.com') ||
      hostname.includes('twitter.com')
    );
  },

  getButtonIcon() {
    return `
      <svg class="tejasai-grok-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.5C12 2.5 12.3 8.2 14.5 10.5C16.8 12.7 22.5 13 22.5 13C22.5 13 16.8 13.3 14.5 15.5C12.3 17.8 12 23.5 12 23.5C12 23.5 11.7 17.8 9.5 15.5C7.2 13.3 1.5 13 1.5 13C1.5 13 7.2 12.7 9.5 10.5C11.7 8.2 12 2.5 12 2.5Z" fill="currentColor"/>
        <path d="M19 3.5C19 3.5 19.2 5.8 20.1 6.7C21 7.6 23.3 7.7 23.3 7.7C23.3 7.7 21 7.9 20.1 8.8C19.2 9.7 19 12 19 12C19 12 18.8 9.7 17.9 8.8C17 7.9 14.7 7.7 14.7 7.7C14.7 7.7 17 7.6 17.9 6.7C18.8 5.8 19 3.5 19 3.5Z" fill="currentColor" opacity="0.85"/>
      </svg>
    `;
  },

  findInput() {
    const isXPlatform =
      window.location.hostname.includes('x.com') ||
      window.location.hostname.includes('twitter.com');

    // On X/Twitter, only target when in Grok mode/route or inside a Grok composer
    if (isXPlatform && !window.location.pathname.includes('/grok')) {
      const grokContainer = document.querySelector(
        '[data-testid="grok-input"], [aria-label*="Grok" i], [placeholder*="Ask Grok" i]'
      );
      if (!grokContainer) return null;
    }

    const selectors = [
      // Grok standalone (grok.com)
      'textarea[placeholder*="slash" i]',
      'textarea[placeholder*="Type" i]',
      'textarea[placeholder*="Ask Grok" i]',
      'textarea[placeholder*="Ask anything" i]',
      'textarea[placeholder*="Drag and drop" i]',
      'textarea[aria-label*="Ask Grok" i]',
      'textarea[aria-label*="Ask" i]',
      'textarea[aria-label*="Grok" i]',
      'div[contenteditable="true"][data-placeholder*="slash" i]',
      'div[contenteditable="true"][data-placeholder*="Type" i]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"][data-placeholder*="Grok" i]',
      'div[contenteditable="true"][data-placeholder*="Ask" i]',
      'div[contenteditable="true"][data-placeholder*="Drag and drop" i]',
      'textarea[data-testid="grok-input"]',
      'div[data-testid="grok-input"]',
      // X.com / Twitter Grok tab
      'div[data-testid="grok-composer"] div[contenteditable="true"]',
      'div[data-testid="tweetTextarea_0"]',
      'form textarea',
      'textarea',
    ];

    for (const sel of selectors) {
      const candidates = document.querySelectorAll(sel);
      for (const el of candidates) {
        if (el && el.offsetParent !== null && !el.closest('header, nav, aside, [role="dialog"]:not([aria-label*="Grok" i])')) {
          return el;
        }
      }
    }

    return null;
  },

  getText(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      return el.value ? el.value.trim() : '';
    }
    return el.innerText ? el.innerText.trim() : (el.textContent ? el.textContent.trim() : '');
  },

  setText(el, text) {
    if (!el) return false;
    el.focus();

    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const descriptor = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      );
      if (descriptor && descriptor.set) {
        descriptor.set.call(el, text);
      } else {
        el.value = text;
      }

      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    // ContentEditable / Draft.js / ProseMirror
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);

      const success = document.execCommand('insertText', false, text);
      if (success) {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(
          new InputEvent('input', {
            bubbles: true,
            inputType: 'insertText',
            data: text,
          })
        );
        return true;
      }
    } catch {
      // Fallback below
    }

    // Direct DOM manipulation fallback
    el.innerHTML = '';
    const lines = text.split('\n');
    lines.forEach((line) => {
      const p = document.createElement('p');
      if (line.trim().length === 0) {
        p.appendChild(document.createElement('br'));
      } else {
        p.textContent = line;
      }
      el.appendChild(p);
    });

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: text,
      })
    );
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  },

  getComposerBox(inputEl) {
    if (!inputEl) return null;

    // 1. Direct form wrapper if present
    const form = inputEl.closest('form');
    if (form) return form;

    // 2. The composer card is the lowest ancestor of inputEl that contains buttons
    let parent = inputEl.parentElement;
    while (parent && parent !== document.body && parent.tagName !== 'MAIN') {
      if (
        parent.id === '__next' ||
        parent.id === 'root' ||
        parent.tagName === 'BODY' ||
        parent.tagName === 'HTML'
      ) {
        break;
      }

      if (parent.querySelectorAll('button, [role="button"]').length >= 2) {
        return parent;
      }
      parent = parent.parentElement;
    }

    return inputEl.parentElement;
  },

  findSubmitButton(inputEl) {
    const el = inputEl || this.findInput();
    const box = el ? this.getComposerBox(el) : null;
    const scope = box || document;

    // 1. Explicit send / submit button attributes
    const selectors = [
      'button[aria-label*="Send" i]',
      'button[aria-label*="Submit" i]',
      'button[aria-label*="Ask" i]',
      'button[aria-label*="Grok" i]',
      'button[data-testid="grok-submit-button"]',
      'button[data-testid="tweetButtonInline"]',
      'button[data-testid="tweetButton"]',
      'button[type="submit"]',
    ];

    for (const sel of selectors) {
      const btn = scope.querySelector(sel);
      if (btn && btn.offsetParent !== null && !btn.closest('header, nav, aside')) {
        return btn;
      }
    }

    // 2. The primary action button on Grok is the last button in the composer card
    if (box) {
      const allButtons = Array.from(box.querySelectorAll('button, [role="button"]')).filter(
        (b) =>
          b.offsetParent !== null &&
          !b.closest('header, nav, aside') &&
          !b.classList.contains('tejasai-enhance-button')
      );

      if (allButtons.length >= 1) {
        return allButtons[allButtons.length - 1];
      }
    }

    return null;
  },

  findAttachContainer(inputEl) {
    if (!inputEl) return null;
    const box = this.getComposerBox(inputEl);
    const submitBtn = this.findSubmitButton(inputEl);

    if (submitBtn) {
      // 1. Ascend from submitBtn to find the horizontal right-side cluster (Fast, mic, waveform/submit).
      // We must NEVER return submitBtn's private wrapper to avoid vertical offsets.
      let current = submitBtn.parentElement;
      while (current && current !== box && current !== document.body) {
        const buttons = Array.from(current.querySelectorAll('button, [role="button"]')).filter(
          (b) => !b.classList.contains('tejasai-enhance-button')
        );
        const cardButtons = box ? box.querySelectorAll('button, [role="button"]').length : 99;

        // Skip any container that only has 1 button (the submitBtn itself) or is a column
        const isColumn = window.getComputedStyle(current).flexDirection.includes('column');
        if (buttons.length <= 1 || isColumn) {
          current = current.parentElement;
          continue;
        }

        // Right-side cluster contains multiple action buttons (Fast, mic, submit) but leaves out the left '+' button
        if (buttons.length >= 2 && buttons.length < cardButtons) {
          return current;
        }

        if (current.children.length >= 2 && !isColumn && buttons.length < cardButtons) {
          return current;
        }

        current = current.parentElement;
      }

      // 2. Fallback: climb out of submitBtn's private wrapper
      let wrapper = submitBtn;
      while (wrapper.parentElement && wrapper.parentElement !== box && wrapper.parentElement !== document.body) {
        const parentButtons = Array.from(wrapper.parentElement.querySelectorAll('button, [role="button"]')).filter(
          (b) => !b.classList.contains('tejasai-enhance-button')
        );
        const isParentCol = window.getComputedStyle(wrapper.parentElement).flexDirection.includes('column');
        if ((parentButtons.length > 1 || wrapper.parentElement.children.length > 1) && !isParentCol) {
          return wrapper.parentElement;
        }
        wrapper = wrapper.parentElement;
      }

      // 3. Fallback to toolbar within card
      if (submitBtn.parentElement?.parentElement && box?.contains(submitBtn.parentElement.parentElement)) {
        return submitBtn.parentElement.parentElement;
      }
    }

    return box || inputEl.parentElement;
  },

  canAutoEnhance() {
    return false;
  },

  submitPrompt(inputEl, submitBtn) {
    if (submitBtn && !submitBtn.disabled && !submitBtn.getAttribute('aria-disabled')) {
      submitBtn.click();
      return true;
    }

    if (inputEl) {
      inputEl.focus();
      inputEl.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
        })
      );
      return true;
    }
    return false;
  },
};
