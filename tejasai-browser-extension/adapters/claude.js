/**
 * TejasAI Site Adapter - Anthropic Claude (claude.ai)
 *
 * Supports Claude's ProseMirror contenteditable editor.
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
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
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

  findAttachContainer(inputEl) {
    if (!inputEl) return null;

    const submitBtn = this.findSubmitButton();
    if (submitBtn && submitBtn.parentElement) {
      return submitBtn.parentElement;
    }

    const fieldset = inputEl.closest('fieldset') || inputEl.parentElement;
    const actions = fieldset?.querySelector('.flex.items-center.justify-between, .flex.items-center.gap-2');
    if (actions) return actions;

    return inputEl.parentElement;
  },

  findSubmitButton() {
    const selectors = [
      'button[aria-label="Send Message"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send"]',
      'fieldset button[type="button"]:last-child',
    ];

    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn && btn.offsetParent !== null) return btn;
    }
    return null;
  },

  canAutoEnhance() {
    return true;
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
