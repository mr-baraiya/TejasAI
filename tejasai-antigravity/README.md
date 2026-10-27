# TejasAI Integration for Google Antigravity

Production-ready prompt engineering and vibe-coding integration for **Google Antigravity**. Directly connects Antigravity AI coding agents to the live TejasAI inference engine (`https://tejasai-eta.vercel.app/api`).

---

## Features

1. **Live Prompt Enhancement**: Transforms rough ideas or conversational instructions into structured, production-grade specifications before launching agent coding tasks.
2. **Interactive Antigravity Studio UI**: A dedicated dark-mode developer canvas designed to match Antigravity IDE and VS Code Dark theme (no ChatGPT icons, no web terracotta).
3. **Developer-Focused Prompt Templates**:
   - **Feature Development**: End-to-end architecture specifications and REST/GraphQL API contracts.
   - **Debugging & Fixes**: Root-cause analysis, reproduction isolation, race conditions, memory leaks.
   - **Code Generation**: Type-safe clean functions, accessible components, service abstractions.
   - **Refactoring**: SOLID decoupling, legacy modernization, algorithmic performance tuning.
   - **Testing**: Complete unit and integration test suites, boundary fuzzing, mock isolation.
4. **Model Context Protocol (MCP) Server**: Stdio transport protocol exposing `tejasai_enhance_prompt`, `tejasai_analyze_clarify`, `tejasai_get_developer_template`, and `tejasai_manage_favorites` directly into Antigravity agents' toolset.
5. **Antigravity Custom Skill**: `tejasai-vibe-coder` teaches the agent when and how to sharpen instructions before executing vibe-coding tasks.
6. **Favorites & Reusable Prompts**: Easily bookmark and catalog proven prompts with instant reload and clipboard copy.

---

## Quick Start

### 1. Run the Studio UI
```bash
cd tejasai-antigravity
npm start
```
Open [http://localhost:3030](http://localhost:3030) in your browser or Antigravity browser webview.

### 2. Enhance Prompts from the Terminal
```bash
node cli/tejasai-cli.js "Implement distributed rate limiter using Redis and sliding window"
```

### 3. Antigravity Agent MCP Setup
Add this entry to your `~/.gemini/config/mcp_config.json` (or workspace `.agents/mcp_config.json`):

```json
{
  "mcpServers": {
    "tejasai": {
      "command": "node",
      "args": ["<path-to-tejasai-antigravity>/tejasai-mcp-server.js"]
    }
  }
}
```

Now, anytime you tell Antigravity *"enhance my prompt for auth"* or *"generate a vibe coding plan for search"*, the agent can invoke `tejasai_enhance_prompt` directly!
