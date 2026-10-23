/**
 * TejasAI Site Adapter - Anthropic Claude (claude.ai)
 *
 * Supports Claude's ProseMirror contenteditable editor.
 * Positions Enhance button in the bottom-right action cluster next to the submit/waveform button,
 * keeping the left-side controls (+, Chat, Cowork) untouched.
 */

window.TejasAIAdapters = window.TejasAIAdapters || {};

window.TejasAIAdapters['claude'] = {
  id: 'claude',
  name: 'Claude',
  targetAI: 'claude',

  matches(hostname) {
    return hostname.includes('claude.ai');
  },

  findInput() {
    const selectors = [
      'div.ProseMirror[contenteditable="true"]',
      'div[contenteditable="true"][data-placeholder]',
      'fieldset div[contenteditable="true"]',
      'div[role="textbox"][contenteditable="true"]',
      'div[contenteditable="true"]',
    ];

    for (const sel of selectors) {
      const candidates = document.querySelectorAll(sel);
      for (const el of candidates) {
        if (el && el.offsetParent !== null && !el.closest('header, nav, aside')) {
          return el;
        }
      }
    }

    // Fallback if offsetParent is null (e.g. in some flex containers)
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && !el.closest('header, nav, aside')) return el;
    }
    return null;
  },

  getText(el) {
    if (!el) return '';
    return el.innerText ? el.innerText.trim() : (el.textContent ? el.textContent.trim() : '');
  },

  setText(el, text) {
    if (!el) return false;
    el.focus();

    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);

      const success = document.execCommand('insertText', false, text);
      if (success) {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    } catch {
      // Fallback
    }

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
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  },

  getComposerBox(inputEl) {
    if (!inputEl) return null;

    // Check lowest ancestor of inputEl that contains at least 2 buttons (the composer card)
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

    const fieldset = inputEl.closest('fieldset');
    if (fieldset) return fieldset;
    const form = inputEl.closest('form');
    if (form) return form;

    return inputEl.closest('main') || inputEl.parentElement;
  },

  findSubmitButton(inputEl) {
    const el = inputEl || this.findInput();
    const box = el ? this.getComposerBox(el) : null;
    const scope = box || document;

    // 1. Explicit send button attributes (active when text is present)
    const sendSelectors = [
      'button[aria-label="Send Message"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label*="Send" i]',
      'button[aria-label*="Submit" i]',
      'button[data-testid*="send" i]',
    ];

    for (const sel of sendSelectors) {
      const candidates = scope.querySelectorAll(sel);
      for (const btn of candidates) {
        if (
          btn &&
          btn.offsetParent !== null &&
          !btn.closest('header, nav, aside') &&
          !btn.classList.contains('tejasai-enhance-button')
        ) {
          return btn;
        }
      }
    }

    // 2. Claude's voice / call / waveform action button (idle state when input is empty)
    const idleActionSelectors = [
      'button[aria-label*="voice" i]',
      'button[aria-label*="audio" i]',
      'button[aria-label*="call" i]',
      'button[aria-label*="waveform" i]',
      'button[aria-label*="record" i]',
      'button[aria-label*="dictat" i]',
      'button[data-testid*="voice" i]',
      'button[data-testid*="call" i]',
    ];

    for (const sel of idleActionSelectors) {
      const candidates = scope.querySelectorAll(sel);
      for (const btn of candidates) {
        if (
          btn &&
          btn.offsetParent !== null &&
          !btn.closest('header, nav, aside') &&
          !btn.classList.contains('tejasai-enhance-button')
        ) {
          return btn;
        }
      }
    }

    // 3. Fallback: The primary action button is the last button in the composer card
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

    if (submitBtn && box) {
      // Ascend from submitBtn to find the horizontal right-side actions row (holding mic, model, and send button).
      // Crucial requirements for Claude web:
      // 1. Must NEVER return submitBtn's private single-button wrapper (which is a 32px box that causes vertical stacking).
      // 2. Must be a horizontal flex row with width > 60px.
      // 3. Must hold multiple interactive controls (mic, model selector, send).
      let current = submitBtn.parentElement;
      while (current && current !== box && current !== document.body) {
        const buttons = Array.from(current.querySelectorAll('button, [role="button"]')).filter(
          (b) => !b.classList.contains('tejasai-enhance-button')
        );

        const style = window.getComputedStyle(current);
        const isColumn = style.flexDirection.includes('column') || style.flexDirection.includes('column-reverse');
        const rect = current.getBoundingClientRect ? current.getBoundingClientRect() : null;
        const isWideEnough = rect ? rect.width > 60 : true;

        // Skip any private container that only has 1 button (the submitBtn itself) or is a column or narrow
        if (buttons.length <= 1 || isColumn || !isWideEnough) {
          current = current.parentElement;
          continue;
        }

        const allCardButtons = box.querySelectorAll('button, [role="button"]').length;

        // Ideal: this container holds the right-side cluster only (mic, model, and send)
        if (buttons.length >= 2 && buttons.length < allCardButtons) {
          return current;
        }

        // If we reached the main bottom toolbar that holds both left (+, Chat, Cowork) and right groups:
        // Find the specific direct child of the toolbar that contains submitBtn (the right cluster)!
        if (buttons.length >= 2) {
          for (const child of current.children) {
            if (child.contains(submitBtn)) {
              const childButtons = Array.from(child.querySelectorAll('button, [role="button"]')).filter(
                (b) => !b.classList.contains('tejasai-enhance-button')
              );
              const childStyle = window.getComputedStyle(child);
              const childIsCol = childStyle.flexDirection.includes('column');
              const childRect = child.getBoundingClientRect ? child.getBoundingClientRect() : null;
              const childIsWide = childRect ? childRect.width > 60 : true;

              if (!childIsCol && childIsWide && (childButtons.length >= 1 || child.children.length >= 2)) {
                return child;
              }
            }
          }
          return current;
        }

        current = current.parentElement;
      }

      // Fallback: If no intermediate cluster, ascend to submitBtn's parent's parent
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
    if (submitBtn && !submitBtn.disabled) {
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
