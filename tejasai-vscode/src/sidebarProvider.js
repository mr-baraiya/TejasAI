/**
 * TejasAI VS Code Extension - Sidebar Webview View Provider
 *
 * Implements vscode.WebviewViewProvider for the TejasAI Prompt Studio.
 */

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { enhancePrompt, checkHealth } = require('./api');
const { DEVELOPER_TEMPLATES } = require('./devTemplates');
const { FavoritesManager } = require('./favoritesManager');

class TejasAiSidebarProvider {
  constructor(extensionUri, context) {
    this._extensionUri = extensionUri;
    this._context = context;
    this._favoritesManager = new FavoritesManager(context);
    this._view = undefined;
  }

  resolveWebviewView(webviewView, context, _token) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'WEBVIEW_READY': {
          const health = await checkHealth();
          this._view.webview.postMessage({
            type: 'INIT_DATA',
            templates: DEVELOPER_TEMPLATES,
            favorites: this._favoritesManager.getFavorites(),
            isOnline: health.online,
          });
          break;
        }

        case 'ENHANCE_PROMPT': {
          const { prompt, targetAI, tweak, previousResult } = data.payload;
          const result = await enhancePrompt({
            prompt,
            targetAI,
            tweak,
            previousResult,
          });
          this._view.webview.postMessage({
            type: 'ENHANCE_RESULT',
            ...result,
          });
          break;
        }

        case 'BUILD_TEMPLATE_PROMPT': {
          const { category, templateId, values } = data.payload;
          const categoryList = DEVELOPER_TEMPLATES[category] || [];
          const template = categoryList.find((t) => t.id === templateId) || categoryList[0];
          if (!template) {
            this._view.webview.postMessage({
              type: 'TEMPLATE_RESULT',
              success: false,
              error: 'Template not found',
            });
            return;
          }

          const assembled = template.build(values);
          const enhanced = await enhancePrompt({ prompt: assembled, targetAI: 'any' });

          this._view.webview.postMessage({
            type: 'TEMPLATE_RESULT',
            success: true,
            prompt: enhanced.success ? enhanced.enhancedPrompt : assembled,
            whyBetter: enhanced.whyBetter || [],
          });
          break;
        }

        case 'COPY_TEXT': {
          if (data.text) {
            await vscode.env.clipboard.writeText(data.text);
            vscode.window.showInformationMessage('TejasAI: Copied prompt to clipboard!');
          }
          break;
        }

        case 'REPLACE_IN_EDITOR': {
          const editor = vscode.window.activeTextEditor;
          if (!editor) {
            vscode.window.showWarningMessage('No active editor open to replace text.');
            return;
          }

          const selection = editor.selection;
          editor.edit((editBuilder) => {
            if (selection.isEmpty) {
              editBuilder.insert(selection.active, data.text);
            } else {
              editBuilder.replace(selection, data.text);
            }
          });
          vscode.window.showInformationMessage('TejasAI: Prompt inserted into active editor!');
          break;
        }

        case 'SEND_TO_COPILOT': {
          if (!data.text) return;
          await sendPromptToCopilot(data.text);
          break;
        }

        case 'SAVE_FAVORITE': {
          try {
            this._favoritesManager.saveFavorite(data.payload);
            this._view.webview.postMessage({
              type: 'FAVORITES_UPDATED',
              favorites: this._favoritesManager.getFavorites(),
            });
            vscode.window.showInformationMessage('TejasAI: Prompt saved to favorites!');
          } catch (err) {
            vscode.window.showErrorMessage(err.message);
          }
          break;
        }

        case 'DELETE_FAVORITE': {
          this._favoritesManager.deleteFavorite(data.id);
          this._view.webview.postMessage({
            type: 'FAVORITES_UPDATED',
            favorites: this._favoritesManager.getFavorites(),
          });
          break;
        }
      }
    });
  }

  setInputText(text) {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'SET_INPUT_TEXT',
        text,
      });
      this._view.show?.(true);
    }
  }

  _getHtmlForWebview(webview) {
    const htmlPath = path.join(this._extensionUri.fsPath, 'media', 'sidebar.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.js')
    );
    const logoUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'logo.png')
    );

    html = html.replace('{{stylesUri}}', stylesUri.toString());
    html = html.replace('{{scriptUri}}', scriptUri.toString());
    html = html.replace('{{logoUri}}', logoUri.toString());

    return html;
  }
}

/**
 * Sends a prompt directly into GitHub Copilot Chat
 */
async function sendPromptToCopilot(promptText) {
  try {
    // Copy to clipboard first so user can also paste anytime
    await vscode.env.clipboard.writeText(promptText);

    // Try executing standard VS Code / GitHub Copilot Chat command
    // workbench.action.chat.open opens Copilot Chat with a query parameter
    try {
      await vscode.commands.executeCommand('workbench.action.chat.open', {
        query: promptText,
      });
      vscode.window.showInformationMessage('Sent enhanced prompt to GitHub Copilot Chat!');
    } catch {
      // Fallback: open chat and notify user
      await vscode.commands.executeCommand('workbench.action.chat.open');
      vscode.window.showInformationMessage('Prompt copied to clipboard! Paste into Copilot Chat.');
    }
  } catch (err) {
    vscode.window.showErrorMessage(`Could not open Copilot Chat: ${err.message}`);
  }
}

module.exports = {
  TejasAiSidebarProvider,
  sendPromptToCopilot,
};
