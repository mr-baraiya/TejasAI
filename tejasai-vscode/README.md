# TejasAI for VS Code & GitHub Copilot

> **Production-grade AI Prompt Enhancer, Developer Templates, and Vibe-Coding Companion for VS Code**  
> Powered directly by the live TejasAI inference engine (`https://tejasai-eta.vercel.app/api`).

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/tejasai.tejasai-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=tejasai.tejasai-vscode)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Why TejasAI for Vibe Coding?

Vibe coding with GitHub Copilot, Cursor, or ChatGPT works best when rough, conversational ideas are transformed into structured, context-rich engineering specifications. TejasAI lives right inside your editor and turns rough prompts into production-ready prompts with one keystroke.

---

## Key Features

### 1. Prompt Studio Sidebar
- **Dedicated Activity Bar Tab** (`Ctrl+Alt+T` / `Cmd+Alt+T`): Always accessible alongside your files.
- **Theme-Native UI**: Dynamically conforms to your active VS Code theme (Dark+, Light+, Solarized, GitHub Dark, etc.) using native `--vscode-*` CSS tokens.
- **Live Clarification Assistant**: When a prompt is ambiguous, TejasAI dynamically asks targeted clarification questions with one-click response pills and auto-regeneration.
- **Before / After Diff Comparison**: Easily toggle between clean enhanced output and a side-by-side diff comparing your original draft against the enhanced prompt.
- **Word Count & Metrics Badge**: View real-time expansion statistics (e.g. `12 ➔ 94 words (+683%)`).
- **Instant Quick-Tweak Filters**: Refine with *Shorter*, *Simpler*, *More Detail*, or *Bullet Points*.
- **Copy, Replace, and Safe Undo**: Copy to clipboard with instant visual feedback or replace editor selection with one-click undo support.

### 2. Keyboard Shortcuts & Context Menus
| Action | Windows / Linux | macOS | When |
|---|---|---|---|
| **Enhance Selection** | `Ctrl+Alt+E` | `Cmd+Alt+E` | Text selected in editor |
| **Enhance & Replace Selection** | `Ctrl+Alt+R` | `Cmd+Alt+R` | Text selected in editor |
| **Open Prompt Studio** | `Ctrl+Alt+T` | `Cmd+Alt+T` | Always |
| **Undo Last Replacement** | `Ctrl+Alt+Z` | `Cmd+Alt+Z` | Replacement active |

Right-click any text in the editor to access these commands directly from the editor context menu.

### 3. GitHub Copilot Chat Participant (`@tejasai`)
Enhance prompts directly within GitHub Copilot Chat:
- `@tejasai /enhance <rough prompt>`: General prompt enhancement with live AI.
- `@tejasai /feature <feature name>`: Structure an end-to-end engineering spec.
- `@tejasai /debug <error message>`: Structure a root-cause isolation plan.
- `@tejasai /refactor <code target>`: Clean architecture & SOLID refactor spec.
- `@tejasai /test <unit/function>`: Comprehensive unit & boundary test suite.
- **Launch in Copilot Agent**: One-click handoff button passes the enhanced prompt into Copilot with structural guardrails attached.

### 4. Developer Templates
13 curated developer presets organized across 5 categories:
- **Feature**: Architecture & Implementation Spec, REST / GraphQL Endpoint Contract, Accessible UI Component.
- **Debug**: Root-Cause Analysis, Concurrency & Memory Leak Debugger, Cross-Browser Compatibility Fix.
- **Codegen**: Type-Safe Clean Service, Database Schema & Migration, CLI Tool Implementation.
- **Refactor**: SOLID Decoupling & Modularization, Legacy Code Modernization, Performance & Complexity Reduction.
- **Testing**: Comprehensive Unit Test Suite, End-to-End & Integration Test.

### 5. Searchable Favorites & Custom Prompts
- Save any draft or enhanced prompt to local VS Code storage.
- Search and filter by category chips (`Feature`, `Debug`, `Refactor`, `Testing`, `Custom`).
- Inline rename and edit favorite titles and prompts.
- Insert into Prompt Studio with a single click.

---

## Security & Privacy

- **Zero Client-Side Secrets**: All AI provider API keys (Gemini, Groq, Claude, OpenAI) remain safely encrypted on the backend server.
- **Direct Workspace Safety**: Replacements always preserve undo history, ensuring your source code is never altered unexpectedly.
- **Private Data Isolation**: No local code is indexed or stored outside the active enhancement query.

---

## Installation

### From VS Code Marketplace
1. Open VS Code.
2. Press `Ctrl+P` (or `Cmd+P`) and type:
   ```text
   ext install tejasai.tejasai-vscode
   ```
3. Or search for **TejasAI** in the Extensions view (`Ctrl+Shift+X`).

### Manual VSIX Sideload
```bash
code --install-extension tejasai-vscode-1.0.3.vsix
```

---

## Contributing & Development

```bash
# Clone the repository
git clone https://github.com/mr-baraiya/TejasAI.git
cd TejasAI/tejasai-vscode

# Open in VS Code
code .

# Press F5 to launch the Extension Development Host window
```

---

## License

MIT © [TejasAI Team](https://tejasai-eta.vercel.app)
