/**
 * TejasAI Site Adapter - DeepSeek (chat.deepseek.com)
 *
 * Supports DeepSeek's modern textarea chat interface with scoped composer container.
 * Injects Enhance button in the bottom-right toolbar beside the paperclip and send button.
 */

window.TejasAIAdapters = window.TejasAIAdapters || {};

window.TejasAIAdapters['deepseek'] = {
  id: 'deepseek',
  name: 'DeepSeek',
  targetAI: 'deepseek',

  matches(hostname) {
    return hostname.includes('deepseek.com');
  },

  getButtonIcon() {
    return `
      <svg class="tejasai-deepseek-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.5C12 2.5 12.3 8.2 14.5 10.5C16.8 12.7 22.5 13 22.5 13C22.5 13 16.8 13.3 14.5 15.5C12.3 17.8 12 23.5 12 23.5C12 23.5 11.7 17.8 9.5 15.5C7.2 13.3 1.5 13 1.5 13C1.5 13 7.2 12.7 9.5 10.5C11.7 8.2 12 2.5 12 2.5Z" fill="currentColor"/>
        <path d="M19 3.5C19 3.5 19.2 5.8 20.1 6.7C21 7.6 23.3 7.7 23.3 7.7C23.3 7.7 21 7.9 20.1 8.8C19.2 9.7 19 12 19 12C19 12 18.8 9.7 17.9 8.8C17 7.9 14.7 7.7 14.7 7.7C14.7 7.7 17 7.6 17.9 6.7C18.8 5.8 19 3.5 19 3.5Z" fill="currentColor" opacity="0.85"/>
      </svg>
    `;
  },

  findInput() {
    const selectors = [
      'textarea#chat-input',
      'textarea[placeholder*="Message DeepSeek" i]',
      'textarea[placeholder*="Ask anything" i]',
      'textarea[placeholder*="Send a message" i]',
      'textarea[placeholder*="DeepSeek" i]',
      'textarea.ds-textarea',
      'textarea[tabindex="0"]',
      'main textarea',
      'div[contenteditable="true"]',
      'form textarea',
      'textarea',
    ];

    for (const sel of selectors) {
      const candidates = document.querySelectorAll(sel);
      for (const el of candidates) {
        if (el && !el.closest('header, nav, aside, [role="navigation"]')) {
          if (el.offsetParent !== null) return el;
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) return el;
        }
      }
    }

    // Direct fallback if offsetParent is null due to flex/transform/fixed containers
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && !el.closest('header, nav, aside, [role="navigation"]')) {
        return el;
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

    const form = inputEl.closest('form');
    if (form) return form;

    // Ascend from inputEl until we find the composer card that contains action buttons
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

      const hasActions = parent.querySelectorAll('svg, button, [role="button"], div[class*="button"]').length >= 2;
      const rect = parent.getBoundingClientRect ? parent.getBoundingClientRect() : null;
      if (hasActions && rect && rect.height > 50 && rect.width > 200) {
        return parent;
      }
      parent = parent.parentElement;
    }

    return inputEl.closest('main') || inputEl.parentElement;
  },

  findSubmitButton(inputEl) {
    const el = inputEl || this.findInput();
    const box = el ? this.getComposerBox(el) : null;
    const scope = box || document;

    const selectors = [
      'button[aria-label*="Send" i]',
      'div[role="button"][aria-label*="Send" i]',
      'button[aria-label*="Submit" i]',
      'div[role="button"][aria-label*="Submit" i]',
      'button[aria-label*="发送" i]',
      'div[role="button"][aria-label*="发送" i]',
      '.chat-input-send-button',
      'div[class*="send-button"]',
      'button[class*="send"]',
      'div[class*="send"]',
      'button[data-testid*="send" i]',
      'div[data-testid*="send" i]',
      'div[aria-disabled]:has(svg)',
    ];

    for (const sel of selectors) {
      const candidates = scope.querySelectorAll(sel);
      for (const btn of candidates) {
        if (
          btn &&
          !btn.closest('header, nav, aside') &&
          !btn.classList.contains('tejasai-enhance-button')
        ) {
          return btn;
        }
      }
    }

    // Fallback: The send button is the last interactive icon/button in the composer card
    if (box) {
      const candidates = Array.from(
        box.querySelectorAll('button, [role="button"], div[class*="button"], div[class*="icon"], div:has(svg path)')
      ).filter(
        (b) =>
          !b.closest('header, nav, aside') &&
          !b.classList.contains('tejasai-enhance-button') &&
          !b.contains(inputEl)
      );

      if (candidates.length >= 1) {
        return candidates[candidates.length - 1];
      }
    }

    return null;
  },

  findAttachContainer(inputEl) {
    if (!inputEl) return null;
    const box = this.getComposerBox(inputEl);
    const submitBtn = this.findSubmitButton(inputEl);

    if (submitBtn && box) {
      // 1. Ascend from submitBtn to find the horizontal right-side actions row (holding paperclip + send button).
      let current = submitBtn.parentElement;
      while (current && current !== box && current !== document.body) {
        const style = window.getComputedStyle(current);
        const isColumn = style.flexDirection.includes('column') || style.flexDirection.includes('column-reverse');
        const rect = current.getBoundingClientRect ? current.getBoundingClientRect() : null;
        const isWideEnough = rect ? rect.width > 40 : true;

        if (isColumn) {
          current = current.parentElement;
          continue;
        }

        const clickables = Array.from(
          current.querySelectorAll('button, [role="button"], div:has(svg), svg')
        ).filter((b) => !b.classList.contains('tejasai-enhance-button'));

        const totalBoxClickables = box.querySelectorAll('button, [role="button"], div:has(svg)').length;

        // Right cluster has paperclip + send button
        if (clickables.length >= 2 && clickables.length < totalBoxClickables && isWideEnough) {
          return current;
        }

        // If this is the bottom toolbar row containing both left and right groups:
        if (clickables.length >= 2 && isWideEnough) {
          for (const child of current.children) {
            if (child.contains(submitBtn)) {
              return child;
            }
          }
          return current;
        }

        current = current.parentElement;
      }

      if (submitBtn.parentElement && submitBtn.parentElement !== box) {
        return submitBtn.parentElement;
      }
    }

    // Direct search for the bottom toolbar within box
    if (box) {
      const toolbars = Array.from(box.querySelectorAll('div')).filter((d) => {
        const st = window.getComputedStyle(d);
        return (st.display.includes('flex') || st.display.includes('inline-flex')) && !d.contains(inputEl);
      });
      if (toolbars.length > 0) {
        const lastToolbar = toolbars[toolbars.length - 1];
        if (submitBtn && lastToolbar.contains(submitBtn)) {
          for (const ch of lastToolbar.children) {
            if (ch.contains(submitBtn)) return ch;
          }
        }
        return lastToolbar;
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
