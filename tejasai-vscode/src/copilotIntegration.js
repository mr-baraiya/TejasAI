/**
 * TejasAI GitHub Copilot Chat Integration
 *
 * Implements a VS Code Chat Participant (@tejasai) allowing users to
 * enhance prompts directly inside the Copilot Chat interface before
 * delegating coding tasks to GitHub Copilot's AI coding agent.
 */

const vscode = require('vscode');
const { enhancePrompt } = require('./api');
const { DEVELOPER_TEMPLATES } = require('./devTemplates');

/**
 * Registers the @tejasai Chat Participant in VS Code.
 *
 * @param {vscode.ExtensionContext} context
 */
function registerCopilotParticipant(context) {
  // Verify if vscode.chat API is supported in current editor environment
  if (!vscode.chat || typeof vscode.chat.createChatParticipant !== 'function') {
    return;
  }

  const participant = vscode.chat.createChatParticipant('tejasai', async (request, chatContext, stream, token) => {
    const command = request.command;
    const promptInput = request.prompt.trim();

    if (!promptInput && command !== 'help') {
      stream.markdown('Please provide a prompt or coding instruction to enhance with TejasAI.\n\n*Example:* `@tejasai /enhance Build a WebSocket server with room broadcasting`');
      return;
    }

    if (token && token.isCancellationRequested) {
      return;
    }

    stream.progress('Enhancing prompt with live TejasAI AI...');

    switch (command) {
      case 'feature':
      case 'debug':
      case 'refactor':
      case 'test': {
        const categoryMap = {
          feature: 'feature',
          debug: 'debug',
          refactor: 'refactor',
          test: 'testing',
        };
        const cat = categoryMap[command];
        const templates = DEVELOPER_TEMPLATES[cat] || [];
        const template = templates[0];

        let structuredPrompt = promptInput;
        if (template) {
          structuredPrompt = template.build({
            name: promptInput,
            tech: 'the project stack',
            requirements: promptInput,
            error: promptInput,
            code: promptInput,
            target: promptInput,
            unit: promptInput,
          });
        }

        const result = await enhancePrompt({ prompt: structuredPrompt, targetAI: 'chatgpt' });
        if (token && token.isCancellationRequested) return;
        renderChatResult(stream, result, promptInput);
        break;
      }

      case 'enhance':
      default: {
        const result = await enhancePrompt({ prompt: promptInput, targetAI: 'chatgpt' });
        if (token && token.isCancellationRequested) return;
        renderChatResult(stream, result, promptInput);
        break;
      }
    }
  });

  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'logo.png');
  context.subscriptions.push(participant);
}

function renderChatResult(stream, result, originalPrompt) {
  if (!result.success) {
    stream.markdown(`⚠️ **TejasAI Error:** ${result.error || 'Failed to enhance prompt.'}\n\nPlease verify network connectivity to \`https://tejasai-eta.vercel.app/api\`.`);
    return;
  }

  stream.markdown(`### ✨ TejasAI Enhanced Prompt\n\n`);
  stream.markdown(`> **Draft:** *${escapeMarkdown(originalPrompt)}*\n\n`);
  stream.markdown('```markdown\n' + result.enhancedPrompt + '\n```\n\n');

  if (Array.isArray(result.whyBetter) && result.whyBetter.length > 0) {
    stream.markdown(`**Why this prompt is better for Copilot:**\n`);
    result.whyBetter.forEach((point) => {
      stream.markdown(`- ${escapeMarkdown(point)}\n`);
    });
    stream.markdown('\n');
  }

  if (typeof stream.button === 'function') {
    try {
      stream.button({
        command: 'tejasai.sendToCopilot',
        title: '🚀 Launch in Copilot Agent',
        arguments: [result.enhancedPrompt],
      });
    } catch {
      // Safe fallback if stream.button is not supported in host environment
    }
  }
}

function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/([_*[\]()~`>#+=|{}.!-])/g, '\\$1');
}

module.exports = {
  registerCopilotParticipant,
};
