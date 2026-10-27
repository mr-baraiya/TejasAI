/**
 * TejasAI VS Code Sidebar Webview Client Script
 *
 * Coordinates UI state, clarification flow, diff view, templates, and favorites.
 */

// Acquire VS Code API
const vscode = acquireVsCodeApi();

// State
let currentTweak = '';
let lastEnhancedText = '';
let lastOriginalDraft = '';
let isDiffViewActive = false;
let developerTemplates = {};
let activeCategory = 'feature';
let activeTemplateId = '';
let favorites = [];
let activeFavFilter = 'all';

// Clarification State
let activeClarificationSession = null;
let selectedOptionValue = null;

// DOM Elements
const apiStatusDot = document.getElementById('api-status-dot');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const favCountSpan = document.getElementById('fav-count');

// Tab 1 Elements
const promptInput = document.getElementById('prompt-input');
const charCounter = document.getElementById('char-counter');
const btnClearDraft = document.getElementById('btn-clear-draft');
const targetModelSelect = document.getElementById('target-model-select');
const tweakChips = document.querySelectorAll('.chip-btn');
const enhanceBtn = document.getElementById('enhance-btn');
const enhanceBtnText = document.getElementById('enhance-btn-text');
const loadingBar = document.getElementById('loading-bar');

// Error & Retry Card
const errorCard = document.getElementById('error-card');
const errorMessage = document.getElementById('error-message');
const btnRetryEnhance = document.getElementById('btn-retry-enhance');

// Clarification Card Elements
const clarifyCard = document.getElementById('clarify-card');
const clarifyCount = document.getElementById('clarify-count');
const clarifyQuestion = document.getElementById('clarify-question');
const clarifyOptions = document.getElementById('clarify-options');
const clarifyOtherWrap = document.getElementById('clarify-other-wrap');
const clarifyOtherInput = document.getElementById('clarify-other-input');
const btnClarifySkip = document.getElementById('btn-clarify-skip');
const btnClarifySubmit = document.getElementById('btn-clarify-submit');

// Output Card Elements
const outputCard = document.getElementById('output-card');
const outputStats = document.getElementById('output-stats');
const btnToggleDiff = document.getElementById('btn-toggle-diff');
const btnSaveFav = document.getElementById('btn-save-fav');
const enhancedOutput = document.getElementById('enhanced-output');
const diffOutputPanel = document.getElementById('diff-output-panel');
const diffOriginalText = document.getElementById('diff-original-text');
const diffEnhancedText = document.getElementById('diff-enhanced-text');
const whyBetterPanel = document.getElementById('why-better-panel');
const whyBetterList = document.getElementById('why-better-list');

// Action Buttons
const btnSendCopilot = document.getElementById('btn-send-copilot');
const btnCopy = document.getElementById('btn-copy');
const copyTextSpan = document.getElementById('copy-text');
const btnReplace = document.getElementById('btn-replace');
const btnUndoReplace = document.getElementById('btn-undo-replace');

// Tab 2 Elements
const categorySelect = document.getElementById('category-select');
const templateSelect = document.getElementById('template-select');
const templateFields = document.getElementById('template-fields');
const btnBuildTemplate = document.getElementById('btn-build-template');
const templateOutput = document.getElementById('template-output');
const btnTemplateToDraft = document.getElementById('btn-template-to-draft');
const btnTemplateToCopilot = document.getElementById('btn-template-to-copilot');
const btnTemplateCopy = document.getElementById('btn-template-copy');

// Tab 3 Elements
const favSearch = document.getElementById('fav-search');
const favFilterChips = document.querySelectorAll('.fav-filter-chip');
const favoritesList = document.getElementById('favorites-list');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupEnhancer();
  setupTemplates();
  setupFavorites();

  // Notify extension host that webview is ready
  vscode.postMessage({ type: 'WEBVIEW_READY' });
});

// Handle incoming messages from extension host
window.addEventListener('message', (event) => {
  const message = event.data;
  switch (message.type) {
    case 'INIT_DATA':
      developerTemplates = message.templates || {};
      favorites = message.favorites || [];
      updateStatus(message.isOnline);
      populateTemplateDropdown();
      renderFavorites();
      break;

    case 'STATUS_UPDATE':
      updateStatus(message.isOnline);
      break;

    case 'ENHANCE_RESULT':
      handleEnhanceResult(message);
      break;

    case 'CLARIFICATION_QUESTION':
      handleClarificationQuestion(message);
      break;

    case 'UNDO_STATE':
      if (btnUndoReplace) {
        btnUndoReplace.disabled = !message.canUndo;
      }
      break;

    case 'TEMPLATE_RESULT':
      handleTemplateResult(message);
      break;

    case 'FAVORITES_UPDATED':
      favorites = message.favorites || [];
      renderFavorites();
      break;

    case 'SET_INPUT_TEXT':
      if (promptInput) {
        promptInput.value = message.text || '';
        updateCharCount();
        switchTab('tab-enhance');
      }
      break;
  }
});

function updateStatus(isOnline) {
  if (!apiStatusDot) return;
  apiStatusDot.className = isOnline ? 'status-dot online' : 'status-dot offline';
  apiStatusDot.title = isOnline ? 'Live TejasAI API Connected' : 'API Offline / Unreachable';
}

// 1. Tab Switching
function setupTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      switchTab(target);
    });
  });
}

function switchTab(targetId) {
  tabButtons.forEach((b) => {
    const isTarget = b.getAttribute('data-tab') === targetId;
    b.classList.toggle('active', isTarget);
    b.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  tabPanels.forEach((p) => {
    p.classList.toggle('active', p.id === targetId);
  });
}

// 2. Enhancer Flow
function setupEnhancer() {
  promptInput?.addEventListener('input', updateCharCount);

  btnClearDraft?.addEventListener('click', () => {
    if (!promptInput) return;
    promptInput.value = '';
    updateCharCount();
    promptInput.focus();
  });

  tweakChips.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tweak = btn.getAttribute('data-tweak');
      if (currentTweak === tweak) {
        currentTweak = '';
        btn.classList.remove('active');
      } else {
        tweakChips.forEach((b) => b.classList.remove('active'));
        currentTweak = tweak;
        btn.classList.add('active');
      }
    });
  });

  enhanceBtn?.addEventListener('click', () => triggerEnhance());
  btnRetryEnhance?.addEventListener('click', () => triggerEnhance());

  // Submit Answer to Clarification Question
  btnClarifySubmit?.addEventListener('click', () => {
    if (!activeClarificationSession || !activeClarificationSession.currentQuestion) return;
    let answer = selectedOptionValue;
    if (selectedOptionValue === 'Other' && clarifyOtherInput?.value.trim()) {
      answer = `Other: ${clarifyOtherInput.value.trim()}`;
    } else if (!selectedOptionValue && clarifyOtherInput?.value.trim()) {
      answer = clarifyOtherInput.value.trim();
    }
    if (!answer) return;

    btnClarifySubmit.disabled = true;
    btnClarifySubmit.textContent = 'Submitting...';
    if (loadingBar) loadingBar.style.display = 'block';

    vscode.postMessage({
      type: 'CLARIFY_ANSWER',
      payload: {
        prompt: activeClarificationSession.originalPrompt,
        targetAI: activeClarificationSession.targetAI,
        clarificationHistory: activeClarificationSession.clarificationHistory,
        currentQuestion: activeClarificationSession.currentQuestion,
        answer,
        skip: false,
      },
    });
  });

  // Skip Clarification Question
  btnClarifySkip?.addEventListener('click', () => {
    if (!activeClarificationSession || !activeClarificationSession.currentQuestion) return;

    btnClarifySkip.disabled = true;
    btnClarifySkip.textContent = 'Skipping...';
    if (loadingBar) loadingBar.style.display = 'block';

    vscode.postMessage({
      type: 'CLARIFY_ANSWER',
      payload: {
        prompt: activeClarificationSession.originalPrompt,
        targetAI: activeClarificationSession.targetAI,
        clarificationHistory: activeClarificationSession.clarificationHistory,
        currentQuestion: activeClarificationSession.currentQuestion,
        answer: 'Skipped',
        skip: true,
      },
    });
  });

  clarifyOtherInput?.addEventListener('input', () => {
    if (selectedOptionValue === 'Other') {
      if (btnClarifySubmit) btnClarifySubmit.disabled = !clarifyOtherInput.value.trim();
    } else if (clarifyOtherInput.value.trim().length > 0) {
      if (btnClarifySubmit) btnClarifySubmit.disabled = false;
    }
  });

  // Toggle Diff View
  btnToggleDiff?.addEventListener('click', () => {
    isDiffViewActive = !isDiffViewActive;
    updateDiffViewState();
  });

  // Copy Action
  btnCopy?.addEventListener('click', () => {
    if (!lastEnhancedText) return;
    vscode.postMessage({ type: 'COPY_TEXT', text: lastEnhancedText });
    if (copyTextSpan) {
      const orig = copyTextSpan.textContent;
      copyTextSpan.textContent = '✓ Copied!';
      setTimeout(() => {
        copyTextSpan.textContent = orig;
      }, 1500);
    }
  });

  // Replace in Editor
  btnReplace?.addEventListener('click', () => {
    if (!lastEnhancedText) return;
    vscode.postMessage({ type: 'REPLACE_IN_EDITOR', text: lastEnhancedText });
  });

  // Undo Replace
  btnUndoReplace?.addEventListener('click', () => {
    vscode.postMessage({ type: 'UNDO_REPLACE' });
  });

  // Send to Copilot Chat
  btnSendCopilot?.addEventListener('click', () => {
    if (!lastEnhancedText) return;
    vscode.postMessage({ type: 'SEND_TO_COPILOT', text: lastEnhancedText });
  });

  // Save to Favorites
  btnSaveFav?.addEventListener('click', () => {
    if (!lastEnhancedText) return;
    const rawTitle = promptInput?.value.trim() || 'Enhanced Prompt';
    const cleanTitle = rawTitle.replace(/\s+/g, ' ');
    const title = cleanTitle.length > 36 ? cleanTitle.slice(0, 36) + '…' : cleanTitle;
    vscode.postMessage({
      type: 'SAVE_FAVORITE',
      payload: {
        title,
        prompt: lastEnhancedText,
        category: 'enhanced',
      },
    });
  });
}

function triggerEnhance() {
  const text = promptInput?.value.trim();
  if (!text || text.length < 3) {
    showError('Please enter a draft prompt with at least 3 characters.');
    return;
  }

  lastOriginalDraft = text;
  enhanceBtn.disabled = true;
  if (enhanceBtnText) enhanceBtnText.textContent = 'Analyzing prompt...';
  if (loadingBar) loadingBar.style.display = 'block';
  if (errorCard) errorCard.style.display = 'none';
  if (clarifyCard) clarifyCard.style.display = 'none';

  // Set pending indicator in output card during analysis
  if (enhancedOutput) {
    enhancedOutput.className = 'output-content empty';
    enhancedOutput.textContent = 'TejasAI inference in progress...';
  }

  // Quick tweaks skip clarification questions and enhance directly
  if (currentTweak) {
    vscode.postMessage({
      type: 'ENHANCE_PROMPT',
      payload: {
        prompt: text,
        targetAI: targetModelSelect?.value || 'any',
        tweak: currentTweak,
        previousResult: lastEnhancedText,
      },
    });
    return;
  }

  // Interactive flow with follow-up clarification questions
  activeClarificationSession = {
    originalPrompt: text,
    targetAI: targetModelSelect?.value || 'any',
    clarificationHistory: [],
    currentQuestion: null,
  };

  vscode.postMessage({
    type: 'ANALYZE_PROMPT',
    payload: {
      prompt: text,
      targetAI: targetModelSelect?.value || 'any',
    },
  });
}

function updateCharCount() {
  if (!charCounter || !promptInput) return;
  const count = promptInput.value.length;
  charCounter.textContent = `${count}/1500`;
}

function showError(msg) {
  if (loadingBar) loadingBar.style.display = 'none';
  if (errorCard && errorMessage) {
    errorMessage.textContent = msg;
    errorCard.style.display = 'flex';
  }
  if (enhanceBtn) enhanceBtn.disabled = false;
  if (enhanceBtnText) enhanceBtnText.textContent = 'Enhance with TejasAI';
}

function handleClarificationQuestion(message) {
  if (loadingBar) loadingBar.style.display = 'none';
  if (errorCard) errorCard.style.display = 'none';
  enhanceBtn.disabled = false;
  if (enhanceBtnText) enhanceBtnText.textContent = 'Enhance with TejasAI';

  const q = message.question;
  if (!q) return;

  if (!activeClarificationSession) {
    activeClarificationSession = {
      originalPrompt: promptInput?.value.trim() || '',
      targetAI: targetModelSelect?.value || 'any',
      clarificationHistory: message.clarificationHistory || [],
      currentQuestion: q,
    };
  } else {
    activeClarificationSession.currentQuestion = q;
    if (message.clarificationHistory) {
      activeClarificationSession.clarificationHistory = message.clarificationHistory;
    }
  }

  // While clarification is in progress, show subtle pending status on output
  if (outputCard) {
    outputCard.style.display = 'flex';
  }
  if (enhancedOutput) {
    enhancedOutput.className = 'output-content empty';
    enhancedOutput.textContent = 'Answering clarification questions to generate high-precision prompt...';
  }
  if (btnToggleDiff) btnToggleDiff.style.display = 'none';
  if (diffOutputPanel) diffOutputPanel.style.display = 'none';
  if (whyBetterPanel) whyBetterPanel.style.display = 'none';
  if (outputStats) outputStats.style.display = 'none';

  // Update header and count
  const qIndex = message.questionIndex || (activeClarificationSession.clarificationHistory.length + 1);
  const maxQ = message.maxQuestions || 3;
  if (clarifyCount) clarifyCount.textContent = `Question ${qIndex} of ${maxQ}`;
  if (clarifyQuestion) clarifyQuestion.textContent = q.question || 'Please clarify your goal:';

  // Render options with multi-line wrap
  selectedOptionValue = null;
  if (clarifyOptions) {
    clarifyOptions.innerHTML = '';
    let rawOptions;
    if (q.type === 'yes_no') {
      rawOptions = ['Yes', 'No'];
    } else {
      const baseOpts = (Array.isArray(q.options) && q.options.length > 0 ? q.options : ['Option 1', 'Option 2', 'Option 3'])
        .filter((o) => String(o).toLowerCase() !== 'other')
        .slice(0, 3);
      rawOptions = [...baseOpts, 'Other'];
    }

    rawOptions.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'clarify-opt-btn';
      btn.textContent = String(opt);
      btn.title = String(opt);
      btn.addEventListener('click', () => {
        document.querySelectorAll('.clarify-opt-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedOptionValue = String(opt);

        if (String(opt).toLowerCase() === 'other') {
          if (clarifyOtherWrap) clarifyOtherWrap.style.display = 'block';
          if (clarifyOtherInput) {
            clarifyOtherInput.focus();
            if (btnClarifySubmit) btnClarifySubmit.disabled = !clarifyOtherInput.value.trim();
          }
        } else {
          if (clarifyOtherWrap) clarifyOtherWrap.style.display = 'none';
          if (clarifyOtherInput) clarifyOtherInput.value = '';
          if (btnClarifySubmit) btnClarifySubmit.disabled = false;
        }
      });
      clarifyOptions.appendChild(btn);
    });
  }

  if (clarifyOtherInput) clarifyOtherInput.value = '';
  if (btnClarifySubmit) {
    btnClarifySubmit.disabled = true;
    btnClarifySubmit.textContent = 'Submit Answer';
  }
  if (btnClarifySkip) {
    btnClarifySkip.disabled = false;
    btnClarifySkip.textContent = 'Skip';
  }
  if (clarifyCard) clarifyCard.style.display = 'flex';
}

function handleEnhanceResult(message) {
  if (loadingBar) loadingBar.style.display = 'none';
  enhanceBtn.disabled = false;
  if (enhanceBtnText) enhanceBtnText.textContent = 'Enhance with TejasAI';
  if (clarifyCard) clarifyCard.style.display = 'none';
  activeClarificationSession = null;

  if (!message.success) {
    showError(message.error || 'Failed to enhance prompt. Please check connectivity.');
    return;
  }

  if (errorCard) errorCard.style.display = 'none';
  if (outputCard) outputCard.style.display = 'flex';

  lastEnhancedText = message.enhancedPrompt || '';
  enhancedOutput.className = 'output-content';
  enhancedOutput.textContent = lastEnhancedText;

  // Calculate word count comparison
  const origWords = (lastOriginalDraft || promptInput?.value || '').trim().split(/\s+/).filter(Boolean).length;
  const enhWords = lastEnhancedText.trim().split(/\s+/).filter(Boolean).length;
  if (outputStats && enhWords > 0) {
    const diffPct = origWords > 0 ? Math.round(((enhWords - origWords) / origWords) * 100) : 0;
    outputStats.textContent = `${origWords}w ➔ ${enhWords}w (${diffPct >= 0 ? '+' : ''}${diffPct}%)`;
    outputStats.style.display = 'inline-block';
  }

  // Populate diff view
  if (diffOriginalText) diffOriginalText.textContent = lastOriginalDraft || '(Draft empty)';
  if (diffEnhancedText) diffEnhancedText.textContent = lastEnhancedText;
  if (btnToggleDiff) btnToggleDiff.style.display = 'inline-block';

  // Reset to standard enhanced view
  isDiffViewActive = false;
  updateDiffViewState();

  if (Array.isArray(message.whyBetter) && message.whyBetter.length > 0) {
    whyBetterList.innerHTML = message.whyBetter.map((w) => `<li>${escapeHtml(w)}</li>`).join('');
    whyBetterPanel.style.display = 'block';
  } else {
    whyBetterPanel.style.display = 'none';
  }

  btnSendCopilot.disabled = false;
  btnCopy.disabled = false;
  btnReplace.disabled = false;
  btnSaveFav.style.display = 'inline-block';
}

function updateDiffViewState() {
  if (!btnToggleDiff) return;
  if (isDiffViewActive) {
    btnToggleDiff.classList.add('active');
    btnToggleDiff.textContent = 'Enhanced View';
    if (enhancedOutput) enhancedOutput.style.display = 'none';
    if (diffOutputPanel) diffOutputPanel.style.display = 'flex';
  } else {
    btnToggleDiff.classList.remove('active');
    btnToggleDiff.textContent = 'Diff';
    if (enhancedOutput) enhancedOutput.style.display = 'block';
    if (diffOutputPanel) diffOutputPanel.style.display = 'none';
  }
}

// 3. Developer Templates Flow
function setupTemplates() {
  categorySelect?.addEventListener('change', () => {
    activeCategory = categorySelect.value;
    populateTemplateDropdown();
  });

  templateSelect?.addEventListener('change', () => {
    activeTemplateId = templateSelect.value;
    renderTemplateFields();
  });

  btnBuildTemplate?.addEventListener('click', () => {
    const list = developerTemplates[activeCategory] || [];
    const template = list.find((t) => t.id === activeTemplateId) || list[0];
    if (!template) return;

    const values = {};
    template.fields.forEach((f) => {
      const input = document.getElementById(`f-${f.id}`);
      values[f.id] = input?.value || '';
    });

    btnBuildTemplate.disabled = true;
    btnBuildTemplate.textContent = 'Generating & Enhancing...';
    templateOutput.value = 'Contacting live TejasAI inference...';

    vscode.postMessage({
      type: 'BUILD_TEMPLATE_PROMPT',
      payload: {
        category: activeCategory,
        templateId: activeTemplateId,
        values,
      },
    });
  });

  btnTemplateToDraft?.addEventListener('click', () => {
    const text = templateOutput?.value;
    if (!text || !promptInput) return;
    promptInput.value = text;
    updateCharCount();
    switchTab('tab-enhance');
    promptInput.focus();
  });

  btnTemplateCopy?.addEventListener('click', () => {
    const text = templateOutput?.value;
    if (!text) return;
    vscode.postMessage({ type: 'COPY_TEXT', text });
    btnTemplateCopy.textContent = '✓ Copied!';
    setTimeout(() => {
      btnTemplateCopy.textContent = 'Copy';
    }, 1500);
  });

  btnTemplateToCopilot?.addEventListener('click', () => {
    const text = templateOutput?.value;
    if (!text) return;
    vscode.postMessage({ type: 'SEND_TO_COPILOT', text });
  });
}

function populateTemplateDropdown() {
  if (!templateSelect) return;
  const list = developerTemplates[activeCategory] || [];
  templateSelect.innerHTML = list
    .map((t) => `<option value="${t.id}">${escapeHtml(t.title)}</option>`)
    .join('');
  if (list.length > 0) {
    activeTemplateId = list[0].id;
    renderTemplateFields();
  }
}

function renderTemplateFields() {
  if (!templateFields) return;
  const list = developerTemplates[activeCategory] || [];
  const template = list.find((t) => t.id === activeTemplateId) || list[0];
  if (!template) {
    templateFields.innerHTML = '';
    return;
  }

  templateFields.innerHTML = template.fields
    .map(
      (f) => `
    <div class="input-group">
      <label class="field-label" for="f-${f.id}">${escapeHtml(f.label)}</label>
      <input type="text" id="f-${f.id}" class="vscode-input" placeholder="${escapeHtml(f.placeholder || '')}" />
    </div>
  `
    )
    .join('');
}

function handleTemplateResult(message) {
  btnBuildTemplate.disabled = false;
  btnBuildTemplate.textContent = 'Generate & Enhance Template';

  if (!message.success) {
    templateOutput.value = `Error: ${message.error || 'Failed to build template.'}`;
    return;
  }

  templateOutput.value = message.prompt || '';
  btnTemplateCopy.disabled = false;
  btnTemplateToCopilot.disabled = false;
  if (btnTemplateToDraft) btnTemplateToDraft.style.display = 'inline';
}

// 4. Favorites Flow
function setupFavorites() {
  favSearch?.addEventListener('input', () => renderFavorites());

  favFilterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      favFilterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activeFavFilter = chip.getAttribute('data-filter') || 'all';
      renderFavorites();
    });
  });
}

function renderFavorites() {
  if (favCountSpan) {
    favCountSpan.textContent = String(favorites.length);
  }

  if (!favoritesList) return;

  const query = (favSearch?.value || '').trim().toLowerCase();

  let filtered = favorites.filter((f) => {
    // Category filter
    if (activeFavFilter !== 'all' && f.category !== activeFavFilter) {
      return false;
    }
    // Search query filter
    if (query) {
      const titleMatch = (f.title || '').toLowerCase().includes(query);
      const promptMatch = (f.prompt || '').toLowerCase().includes(query);
      return titleMatch || promptMatch;
    }
    return true;
  });

  if (filtered.length === 0) {
    favoritesList.innerHTML = `
      <div class="output-content empty" style="text-align:center; padding: 20px 0;">
        ${query ? 'No favorites match your search.' : 'No saved prompts yet. Click the bookmark icon on any enhanced prompt to save it.'}
      </div>
    `;
    return;
  }

  favoritesList.innerHTML = filtered
    .map((fav) => {
      const cat = (fav.category || 'custom').toLowerCase();
      const catClass = `fav-cat-${cat}`;
      return `
    <div class="fav-item-card" data-id="${fav.id}">
      <div class="fav-item-header">
        <span class="fav-item-title" title="${escapeHtml(fav.title)}">${escapeHtml(fav.title)}</span>
        <span class="fav-item-category ${catClass}">${escapeHtml(fav.category || 'custom')}</span>
      </div>
      <div class="fav-item-snippet" title="${escapeHtml(fav.prompt)}">${escapeHtml(fav.prompt)}</div>
      <div class="fav-item-actions">
        <button type="button" class="fav-pill-btn primary use-draft-btn" data-id="${fav.id}" title="Load this prompt into Draft">
          Use in Draft
        </button>
        <div class="fav-action-btn-group">
          <button type="button" class="fav-pill-btn copy-fav-btn" data-id="${fav.id}" title="Copy to clipboard">
            Copy
          </button>
          <button type="button" class="fav-pill-btn rename-fav-btn" data-id="${fav.id}" title="Rename prompt">
            Rename
          </button>
          <button type="button" class="fav-pill-btn delete delete-fav-btn" data-id="${fav.id}" title="Delete from saved">
            Delete
          </button>
        </div>
      </div>
    </div>
  `;
    })
    .join('');

  // Attach handlers to cards
  favoritesList.querySelectorAll('.use-draft-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = favorites.find((f) => f.id === id);
      if (item && promptInput) {
        promptInput.value = item.prompt;
        updateCharCount();
        switchTab('tab-enhance');
        promptInput.focus();
      }
    });
  });

  favoritesList.querySelectorAll('.copy-fav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = favorites.find((f) => f.id === id);
      if (item) {
        vscode.postMessage({ type: 'COPY_TEXT', text: item.prompt });
        const orig = btn.textContent;
        btn.textContent = '✓ Copied';
        setTimeout(() => {
          btn.textContent = orig;
        }, 1500);
      }
    });
  });

  favoritesList.querySelectorAll('.rename-fav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = favorites.find((f) => f.id === id);
      if (!item) return;
      const newTitle = prompt('Enter a new title for this prompt:', item.title);
      if (newTitle && newTitle.trim()) {
        vscode.postMessage({
          type: 'UPDATE_FAVORITE',
          id,
          payload: { title: newTitle.trim() },
        });
      }
    });
  });

  favoritesList.querySelectorAll('.delete-fav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Delete this saved prompt from your favorites?')) {
        vscode.postMessage({ type: 'DELETE_FAVORITE', id });
      }
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
