/**
 * TejasAI Browser Extension - Popup Script
 *
 * Manages user preferences and reflects live API health status.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const masterToggle = document.getElementById('master-toggle');
  const siteToggles = document.querySelectorAll('.site-toggle');
  const statusBar = document.getElementById('status-bar');
  const statusText = document.getElementById('status-text');

  let currentSettings = {
    enabled: true,
    sites: {
      chatgpt: true,
      gemini: true,
      perplexity: true,
      deepseek: true,
      claude: true,
      grok: true,
    },
  };

  // 1. Fetch current settings from background
  chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (settings) => {
    if (settings) {
      currentSettings = settings;

      masterToggle.checked = Boolean(settings.enabled);

      siteToggles.forEach((checkbox) => {
        const siteKey = checkbox.getAttribute('data-site');
        checkbox.checked = settings.sites?.[siteKey] !== false;
      });
    }
  });

  // 2. Perform live API health check
  chrome.runtime.sendMessage({ action: 'CHECK_HEALTH' }, (health) => {
    statusBar.classList.remove('status-checking');

    if (health && health.status === 'online') {
      statusBar.classList.add('status-online');
      const model = health.groqModel ? ` (${health.groqModel.split('/')[1] || health.groqModel})` : '';
      statusText.textContent = `Connected to TejasAI${model}`;
    } else {
      statusBar.classList.add('status-offline');
      statusText.textContent = 'Backend offline or unreachable';
    }
  });

  // Helper to persist settings
  function persistSettings() {
    chrome.runtime.sendMessage({
      action: 'SAVE_SETTINGS',
      payload: currentSettings,
    });
  }

  // 3. Event Listeners
  masterToggle.addEventListener('change', (e) => {
    currentSettings.enabled = e.target.checked;
    persistSettings();
  });

  siteToggles.forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const siteKey = e.target.getAttribute('data-site');
      if (!currentSettings.sites) currentSettings.sites = {};
      currentSettings.sites[siteKey] = e.target.checked;
      persistSettings();
    });
  });
});
