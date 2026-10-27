/**
 * TejasAI VS Code Extension - Main Entry Point
 *
 * Implements:
 * 1. Right-click context menu commands (Enhance Selection, Replace Selection)
 * 2. Dedicated TejasAI Sidebar with templates and favorites
 * 3. Direct integration with GitHub Copilot Chat for vibe coding
 */

const vscode = require('vscode');
const { enhancePrompt } = require('./src/api');
const { TejasAiSidebarProvider, sendPromptToCopilot } = require('./src/sidebarProvider');
const { registerCopilotParticipant } = require('./src/copilotIntegration');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('[TejasAI] Activating TejasAI VS Code Extension...');

  // 1. Register Sidebar Webview View Provider
  const sidebarProvider = new TejasAiSidebarProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('tejasai.sidebarView', sidebarProvider)
  );

  // 2. Command: Enhance Selected Prompt
  const enhanceSelectionCmd = vscode.commands.registerCommand(
    'tejasai.enhanceSelectedPrompt',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Please open a file and select text to enhance.');
        return;
      }

      const selection = editor.selection;
      const text = editor.document.getText(selection).trim();

      if (!text || text.length < 3) {
        vscode.window.showWarningMessage('Please highlight a prompt or instruction with at least 3 characters.');
        return;
      }

      // Populate sidebar and reveal it
      sidebarProvider.setInputText(text);

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'TejasAI: Enhancing prompt with live AI...',
          cancellable: false,
        },
        async () => {
          const result = await enhancePrompt({ prompt: text, targetAI: 'any' });

          if (!result.success) {
            vscode.window.showErrorMessage(`TejasAI Error: ${result.error || 'Failed to enhance prompt.'}`);
            return;
          }

          const action = await vscode.window.showInformationMessage(
            'Prompt enhanced successfully by TejasAI!',
            'Copy to Clipboard',
            'Replace Selection',
            'Send to Copilot'
          );

          if (action === 'Copy to Clipboard') {
            await vscode.env.clipboard.writeText(result.enhancedPrompt);
            vscode.window.showInformationMessage('Copied enhanced prompt to clipboard!');
          } else if (action === 'Replace Selection') {
            editor.edit((editBuilder) => {
              editBuilder.replace(selection, result.enhancedPrompt);
            });
            vscode.window.showInformationMessage('Replaced selection with enhanced prompt!');
          } else if (action === 'Send to Copilot') {
            await sendPromptToCopilot(result.enhancedPrompt);
          }
        }
      );
    }
  );

  // 3. Command: Enhance & Replace Selection directly
  const enhanceAndReplaceCmd = vscode.commands.registerCommand(
    'tejasai.enhanceAndReplaceSelection',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.selection;
      const text = editor.document.getText(selection).trim();
      if (!text || text.length < 3) {
        vscode.window.showWarningMessage('Please highlight a prompt to enhance.');
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'TejasAI: Enhancing and replacing prompt...',
          cancellable: false,
        },
        async () => {
          const result = await enhancePrompt({ prompt: text, targetAI: 'any' });
          if (!result.success) {
            vscode.window.showErrorMessage(`TejasAI Error: ${result.error}`);
            return;
          }

          editor.edit((editBuilder) => {
            editBuilder.replace(selection, result.enhancedPrompt);
          });
          vscode.window.showInformationMessage('Replaced with enhanced prompt!');
        }
      );
    }
  );

  // 4. Command: Send to GitHub Copilot Chat
  const sendToCopilotCmd = vscode.commands.registerCommand(
    'tejasai.sendToCopilot',
    async (providedPrompt) => {
      let promptToSend = typeof providedPrompt === 'string' ? providedPrompt : null;

      if (!promptToSend) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const selection = editor.selection;
          promptToSend = editor.document.getText(selection).trim();
        }
      }

      if (!promptToSend) {
        vscode.window.showWarningMessage('No prompt selected to send to Copilot.');
        return;
      }

      // If prompt isn't already enhanced, enhance it first
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'TejasAI: Preparing prompt for GitHub Copilot...',
          cancellable: false,
        },
        async () => {
          let finalPrompt = promptToSend;
          // Enhance with live AI
          const result = await enhancePrompt({ prompt: promptToSend, targetAI: 'chatgpt' });
          if (result.success && result.enhancedPrompt) {
            finalPrompt = result.enhancedPrompt;
          }

          await sendPromptToCopilot(finalPrompt);
        }
      );
    }
  );

  // 5. Command: Open Sidebar
  const openSidebarCmd = vscode.commands.registerCommand('tejasai.openSidebar', () => {
    vscode.commands.executeCommand('workbench.view.extension.tejasai-view-container');
  });

  // 6. Register GitHub Copilot Chat Participant (@tejasai)
  registerCopilotParticipant(context);

  context.subscriptions.push(
    enhanceSelectionCmd,
    enhanceAndReplaceCmd,
    sendToCopilotCmd,
    openSidebarCmd
  );

  console.log('[TejasAI] TejasAI VS Code Extension successfully activated.');
}

function deactivate() {
  console.log('[TejasAI] TejasAI VS Code Extension deactivated.');
}

module.exports = {
  activate,
  deactivate,
};
