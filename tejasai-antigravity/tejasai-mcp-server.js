#!/usr/bin/env node

/**
 * TejasAI Model Context Protocol (MCP) Server for Antigravity
 *
 * Implements the standard JSON-RPC 2.0 stdio transport protocol.
 * Exposes TejasAI prompt enhancement tools directly to Antigravity AI coding agents:
 * - tejasai_enhance_prompt: Enhances vibe-coding prompts using live TejasAI API.
 * - tejasai_analyze_clarify: Checks prompt completeness and asks up to 3 structured questions.
 * - tejasai_get_developer_template: Retrieves battle-tested prompt templates.
 * - tejasai_manage_favorites: Saves or retrieves reusable favorite developer prompts.
 */

import readline from 'readline';
import { enhancePrompt, analyzePrompt, clarifyPrompt, checkHealth } from './services/api.js';
import { DEVELOPER_TEMPLATES, DEVELOPER_CATEGORIES } from './templates/devTemplates.js';
import { listFavorites, saveFavorite, deleteFavorite } from './services/favoritesService.js';

const SERVER_NAME = 'tejasai-antigravity-mcp';
const SERVER_VERSION = '1.0.0';

// Tool definitions for Antigravity agent tool discovery
const TOOLS = [
  {
    name: 'tejasai_enhance_prompt',
    description:
      'Enhance a rough draft or vibe-coding instruction into a high-precision, production-grade prompt using the live TejasAI API. Always use this tool when the user wants to refine an idea, plan a complex task, or ask for better coding instructions before execution.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The rough prompt, task description, or coding goal to enhance (minimum 3 characters).',
        },
        targetAI: {
          type: 'string',
          enum: ['any', 'chatgpt', 'claude', 'gemini'],
          description: 'Optional target AI model or coding assistant. Defaults to "any".',
        },
        tweak: {
          type: 'string',
          enum: ['shorter', 'simpler', 'moreDetail', ''],
          description: 'Optional modifier to adjust the enhancement style.',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'tejasai_analyze_clarify',
    description:
      'Analyze whether a prompt has sufficient context for execution, or if missing details require structured clarification questions. Returns analysis and up to 3 structured questions if needed.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The user prompt or task instruction to evaluate.',
        },
        targetAI: {
          type: 'string',
          enum: ['any', 'chatgpt', 'claude', 'gemini'],
          description: 'Target AI engine.',
        },
        answer: {
          type: 'string',
          description: 'Optional user answer to a prior clarification question.',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'tejasai_get_developer_template',
    description:
      'Retrieve developer-focused prompt templates for Feature Development, Debugging, Code Generation, Refactoring, or Testing.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['feature', 'debug', 'codegen', 'refactor', 'testing'],
          description: 'The developer workflow category.',
        },
        templateId: {
          type: 'string',
          description: 'Optional specific template ID.',
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'tejasai_manage_favorites',
    description:
      'List, save, or delete reusable favorite developer prompts and templates.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'save', 'delete'],
          description: 'The favorites action to perform.',
        },
        query: {
          type: 'string',
          description: 'Optional search query when listing favorites.',
        },
        category: {
          type: 'string',
          description: 'Optional category filter when listing or saving.',
        },
        title: {
          type: 'string',
          description: 'Title for the prompt when saving.',
        },
        prompt: {
          type: 'string',
          description: 'Prompt content when saving.',
        },
        id: {
          type: 'string',
          description: 'Favorite ID when deleting.',
        },
      },
      required: ['action'],
    },
  },
];

// Handles tool execution
async function handleCallTool(name, args) {
  switch (name) {
    case 'tejasai_enhance_prompt': {
      const res = await enhancePrompt({
        prompt: args.prompt,
        targetAI: args.targetAI || 'any',
        tweak: args.tweak || '',
      });

      if (!res.success) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Enhancement Error: ${res.error || 'Failed to enhance prompt.'}` }],
        };
      }

      const whyBetterText = Array.isArray(res.whyBetter) && res.whyBetter.length > 0
        ? `\n\nWhy this is better:\n${res.whyBetter.map((b) => `• ${b}`).join('\n')}`
        : '';

      return {
        content: [
          {
            type: 'text',
            text: `### Enhanced Prompt\n\n${res.enhancedPrompt}${whyBetterText}`,
          },
        ],
      };
    }

    case 'tejasai_analyze_clarify': {
      if (args.answer) {
        const res = await clarifyPrompt({
          prompt: args.prompt,
          targetAI: args.targetAI || 'any',
          answer: args.answer,
        });
        if (res?.question?.options) res.question.options = res.question.options.slice(0, 3);
        if (res?.nextQuestion?.options) res.nextQuestion.options = res.nextQuestion.options.slice(0, 3);
        return {
          content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
        };
      }

      const res = await analyzePrompt({
        prompt: args.prompt,
        targetAI: args.targetAI || 'any',
      });
      if (res?.question?.options) res.question.options = res.question.options.slice(0, 3);
      if (res?.nextQuestion?.options) res.nextQuestion.options = res.nextQuestion.options.slice(0, 3);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }

    case 'tejasai_get_developer_template': {
      const categoryTemplates = DEVELOPER_TEMPLATES[args.category] || [];
      if (args.templateId) {
        const found = categoryTemplates.find((t) => t.id === args.templateId);
        if (!found) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Template "${args.templateId}" not found in category "${args.category}".` }],
          };
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(found, null, 2) }],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                category: args.category,
                templates: categoryTemplates.map((t) => ({
                  id: t.id,
                  title: t.title,
                  description: t.description,
                  fields: t.fields,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'tejasai_manage_favorites': {
      if (args.action === 'list') {
        const favs = listFavorites(args.query || '', args.category || '');
        return {
          content: [{ type: 'text', text: JSON.stringify(favs, null, 2) }],
        };
      }

      if (args.action === 'save') {
        const saved = saveFavorite({
          title: args.title,
          prompt: args.prompt,
          category: args.category,
        });
        return {
          content: [{ type: 'text', text: `Saved favorite "${saved.title}" (ID: ${saved.id}) successfully.` }],
        };
      }

      if (args.action === 'delete') {
        deleteFavorite(args.id);
        return {
          content: [{ type: 'text', text: `Deleted favorite ${args.id}.` }],
        };
      }

      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown favorites action "${args.action}".` }],
      };
    }

    default:
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      };
  }
}

// JSON-RPC 2.0 stdio communication loop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

function sendResponse(id, result, error = null) {
  const payload = {
    jsonrpc: '2.0',
    id,
  };
  if (error) {
    payload.error = error;
  } else {
    payload.result = result;
  }
  process.stdout.write(JSON.stringify(payload) + '\n');
}

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    return sendResponse(null, null, { code: -32700, message: 'Parse error' });
  }

  const { id, method, params } = msg;

  if (method === 'initialize') {
    return sendResponse(id, {
      protocolVersion: '2024-11-05',
      serverInfo: {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      capabilities: {
        tools: {},
      },
    });
  }

  if (method === 'notifications/initialized') {
    // Notification from client; no response needed
    return;
  }

  if (method === 'tools/list') {
    return sendResponse(id, {
      tools: TOOLS,
    });
  }

  if (method === 'tools/call') {
    try {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const result = await handleCallTool(toolName, toolArgs);
      return sendResponse(id, result);
    } catch (err) {
      return sendResponse(id, null, {
        code: -32603,
        message: err.message || 'Internal tool execution error',
      });
    }
  }

  if (method === 'ping') {
    return sendResponse(id, {});
  }

  // Method not found
  if (id !== undefined && id !== null) {
    return sendResponse(id, null, {
      code: -32601,
      message: `Method not found: ${method}`,
    });
  }
});
