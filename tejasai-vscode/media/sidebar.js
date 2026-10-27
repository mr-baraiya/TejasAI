/**
 * TejasAI VS Code Sidebar Webview Client Script
 *
 * Coordinates UI state and messaging with VS Code extension host.
 */

// Acquire VS Code API
const vscode = acquireVsCodeApi();

// State
let currentTweak = '';
let lastEnhancedText = '';
let developerTemplates = {};
let activeCategory = 'feature';
let activeTemplateId = '';
let favorites = [];

// DOM Elements
const apiStatusDot = document.getElementById('api-status-dot');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const favCountSpan = document.getElementById('fav-count');

// Tab 1 Elements
const promptInput = document.getElementById('prompt-input');
const charCounter = document.getElementById('char-counter');
const targetModelSelect = document.getElementById('target-model-select');
const tweakChips = document.querySelectorAll('.chip-btn');
const enhanceBtn = document.getElementById('enhance-btn');
const enhancedOutput = document.getElementById('enhanced-output');
const whyBetterPanel = document.getElementById('why-better-panel');
const whyBetterList = document.getElementById('why-better-list');
const btnSaveFav = document.getElementById('btn-save-fav');
const btnSendCopilot = document.getElementById('btn-send-copilot');
const btnCopy = document.getElementById('btn-copy');
const btnReplace = document.getElementById('btn-replace');

// Tab 2 Elements
const categorySelect = document.getElementById('category-select');
const templateSelect = document.getElementById('template-select');
const templateFields = document.getElementById('template-fields');
const btnBuildTemplate = document.getElementById('btn-build-template');
const templateOutput = document.getElementById('template-output');
const btnTemplateToCopilot = document.getElementById('btn-template-to-copilot');
const btnTemplateCopy = document.getElementById('btn-template-copy');

// Tab 3 Elements
const favSearch = document.getElementById('fav-search');
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
      tabButtons.forEach((b) => b.classList.remove('active'));
      tabPanels.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(target)?.classList.add('active');
    });
  });
}

// 2. Enhancer Flow
function setupEnhancer() {
  promptInput?.addEventListener('input', updateCharCount);

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

  enhanceBtn?.addEventListener('click', () => {
    const text = promptInput?.value.trim();
    if (!text || text.length < 3) return;

    enhanceBtn.disabled = true;
    enhanceBtn.textContent = 'Enhancing...';

    vscode.postMessage({
      type: 'ENHANCE_PROMPT',
      payload: {
        prompt: text,
        targetAI: targetModelSelect?.value || 'any',
        tweak: currentTweak,
        previousResult: lastEnhancedText,
      },
    });
  });

  btnCopy?.addEventListener('click', () => {
    if (!lastEnhancedText) return;
    vscode.postMessage({ type: 'COPY_TEXT', text: lastEnhancedText });
  });

  btnReplace?.addEventListener('click', () => {
    if (!lastEnhancedText) return;
    vscode.postMessage({ type: 'REPLACE_IN_EDITOR', text: lastEnhancedText });
  });

  btnSendCopilot?.addEventListener('click', () => {
    if (!lastEnhancedText) return;
    vscode.postMessage({ type: 'SEND_TO_COPILOT', text: lastEnhancedText });
  });

  btnSaveFav?.addEventListener('click', () => {
    if (!lastEnhancedText) return;
    vscode.postMessage({
      type: 'SAVE_FAVORITE',
      payload: {
        title: promptInput?.value.slice(0, 30) + '...',
        prompt: lastEnhancedText,
        category: 'enhanced',
      },
    });
  });
}

function updateCharCount() {
  if (!charCounter || !promptInput) return;
  const count = promptInput.value.length;
  charCounter.textContent = `${count}/1500`;
}

function handleEnhanceResult(message) {
  enhanceBtn.disabled = false;
  enhanceBtn.textContent = 'Enhance with TejasAI';

  if (!message.success) {
    enhancedOutput.className = 'output-content';
    enhancedOutput.textContent = `Error: ${message.error || 'Failed to enhance prompt.'}`;
    return;
  }

  lastEnhancedText = message.enhancedPrompt || '';
  enhancedOutput.className = 'output-content';
  enhancedOutput.textContent = lastEnhancedText;

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

  btnTemplateCopy?.addEventListener('click', () => {
    const text = templateOutput?.value;
    if (!text) return;
    vscode.postMessage({ type: 'COPY_TEXT', text });
  });

  btnTemplateToCopilot?.addEventListener('click', () => {
    const text = templateOutput?.value;
    if (!text) return;
    vscode.postMessage({ type: 'SEND_TO_COPILOT', text });
  });
}

function populateTemplateDropdown() {
  const list = developerTemplates[activeCategory] || [];
  if (!templateSelect) return;
  templateSelect.innerHTML = list.map((t) => `<option value="${t.id}">${t.title}</option>`).join('');
  if (list.length > 0) {
    activeTemplateId = list[0].id;
    renderTemplateFields();
  }
}

function renderTemplateFields() {
  const list = developerTemplates[activeCategory] || [];
  const template = list.find((t) => t.id === activeTemplateId) || list[0];
  if (!template || !templateFields) return;

  templateFields.innerHTML = template.fields
    .map(
      (f) => `
    <div class="field-group">
      <label class="field-label" for="f-${f.id}">${f.label}</label>
      <input type="text" id="f-${f.id}" class="vscode-input" placeholder="${f.placeholder || ''}" />
    </div>
  `
    )
    .join('');
}

function handleTemplateResult(message) {
  btnBuildTemplate.disabled = false;
  btnBuildTemplate.textContent = 'Generate & Enhance Template';

  if (!message.success) {
    templateOutput.value = `Error: ${message.error || 'Failed to assemble template.'}`;
    return;
  }

  templateOutput.value = message.prompt || '';
  btnTemplateCopy.disabled = false;
  btnTemplateToCopilot.disabled = false;
}

// 4. Favorites System
function setupFavorites() {
  favSearch?.addEventListener('input', renderFavorites);
}

function renderFavorites() {
  if (favCountSpan) favCountSpan.textContent = favorites.length;
  if (!favoritesList) return;

  const query = favSearch?.value.toLowerCase() || '';
  const filtered = favorites.filter(
    (f) => f.title.toLowerCase().includes(query) || f.prompt.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    favoritesList.innerHTML = `
      <div style="font-size:11px; color:var(--vscode-descriptionForeground); text-align:center; padding:20px 0;">
        No favorite prompts found.
      </div>
    `;
    return;
  }

  favoritesList.innerHTML = filtered
    .map(
      (fav) => `
    <div class="fav-card">
      <div class="fav-title">${escapeHtml(fav.title)}</div>
      <div class="fav-preview">${escapeHtml(fav.prompt)}</div>
      <div class="fav-actions">
        <button type="button" class="btn-icon" title="Load into input" onclick="window.__loadFav('${fav.id}')">
          <span>Load</span>
        </button>
        <button type="button" class="btn-icon" title="Copy" onclick="window.__copyFav('${fav.id}')">
          <span>Copy</span>
        </button>
        <button type="button" class="btn-icon" title="Send to Copilot" onclick="window.__copilotFav('${fav.id}')">
          <span>Copilot</span>
        </button>
        <button type="button" class="btn-icon" title="Delete" onclick="window.__deleteFav('${fav.id}')">
          <span>✕</span>
        </button>
      </div>
    </div>
  `
    )
    .join('');
}

window.__loadFav = (id) => {
  const item = favorites.find((f) => f.id === id);
  if (!item || !promptInput) return;
  promptInput.value = item.prompt;
  updateCharCount();
  document.querySelector('.tab-btn[data-tab="tab-enhance"]')?.click();
};

window.__copyFav = (id) => {
  const item = favorites.find((f) => f.id === id);
  if (!item) return;
  vscode.postMessage({ type: 'COPY_TEXT', text: item.prompt });
};

window.__copilotFav = (id) => {
  const item = favorites.find((f) => f.id === id);
  if (!item) return;
  vscode.postMessage({ type: 'SEND_TO_COPILOT', text: item.prompt });
};

window.__deleteFav = (id) => {
  vscode.postMessage({ type: 'DELETE_FAVORITE', id });
};

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
