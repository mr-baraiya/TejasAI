#!/usr/bin/env node

/**
 * TejasAI CLI for Antigravity Vibe Coding
 *
 * Usage:
 *   node cli/tejasai-cli.js "Implement a WebSocket server with room broadcasting"
 *   node cli/tejasai-cli.js --ui [starts local studio server]
 *   node cli/tejasai-cli.js --template debug
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { enhancePrompt, checkHealth } from '../services/api.js';
import { DEVELOPER_TEMPLATES } from '../templates/devTemplates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = process.argv.slice(2);

async function main() {
  if (args.includes('--ui') || args.includes('-u')) {
    startUiServer();
    return;
  }

  if (args.includes('--template') || args.includes('-t')) {
    const catIndex = Math.max(args.indexOf('--template'), args.indexOf('-t')) + 1;
    const cat = args[catIndex] || 'feature';
    const templates = DEVELOPER_TEMPLATES[cat];
    if (!templates) {
      console.log(`Available categories: ${Object.keys(DEVELOPER_TEMPLATES).join(', ')}`);
      return;
    }
    console.log(`\n=== TEJASAI DEVELOPER TEMPLATES: ${cat.toUpperCase()} ===\n`);
    templates.forEach((t) => {
      console.log(`• ${t.title} (${t.id})`);
      console.log(`  ${t.description}`);
      console.log(`  Fields: ${t.fields.map((f) => f.label).join(', ')}\n`);
    });
    return;
  }

  if (args.includes('--health')) {
    console.log('Checking live TejasAI backend health...');
    const h = await checkHealth();
    console.log(JSON.stringify(h, null, 2));
    return;
  }

  const promptText = args.filter((a) => !a.startsWith('-')).join(' ');

  if (!promptText || promptText.trim().length === 0) {
    printHelp();
    return;
  }

  console.log('\n[TejasAI] Enhancing prompt with live AI...\n');
  const result = await enhancePrompt({ prompt: promptText });

  if (!result.success) {
    console.error(`Error: ${result.error || 'Enhancement failed.'}`);
    process.exit(1);
  }

  console.log('------------------------------------------------------------');
  console.log('ENHANCED PROMPT:');
  console.log('------------------------------------------------------------');
  console.log(result.enhancedPrompt);
  console.log('------------------------------------------------------------\n');

  if (Array.isArray(result.whyBetter) && result.whyBetter.length > 0) {
    console.log('WHY THIS IS BETTER:');
    result.whyBetter.forEach((b) => console.log(`• ${b}`));
    console.log('');
  }
}

function startUiServer() {
  const PORT = process.env.PORT || 3030;
  const uiDir = path.resolve(__dirname, '../ui');
  const rootDir = path.resolve(__dirname, '..');

  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';

    let filePath = path.join(uiDir, reqPath);

    // Support serving templates/devTemplates.js
    if (reqPath.startsWith('/templates/')) {
      filePath = path.join(rootDir, reqPath);
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    });
  });

  server.listen(PORT, () => {
    console.log(`\n============================================================`);
    console.log(`TejasAI Antigravity Studio UI is running!`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Live API: https://tejasai-eta.vercel.app/api`);
    console.log(`============================================================\n`);
  });
}

function printHelp() {
  console.log(`
TejasAI Antigravity Integration CLI

Usage:
  node cli/tejasai-cli.js "<prompt>"      Enhance a prompt directly in terminal
  node cli/tejasai-cli.js --ui            Start interactive developer prompt studio UI
  node cli/tejasai-cli.js --template <cat> List developer templates (feature, debug, codegen, refactor, testing)
  node cli/tejasai-cli.js --health        Verify connection to live backend
`);
}

main();
