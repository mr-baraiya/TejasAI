# TejasAI for VS Code & GitHub Copilot

> **AI Prompt Enhancer, Developer Templates, and Vibe-Coding Integration for VS Code**  
> Powered directly by the live TejasAI inference engine (`https://tejasai-eta.vercel.app/api`).

---

## Key Features

1. **Right-Click Context Menu Enhancement**:
   - Highlight any prompt, task description, or code block in any file.
   - Right-click and choose **TejasAI: Enhance Selected Prompt** or **TejasAI: Enhance & Replace Selection in Editor**.
   - Directly calls the live TejasAI API and shows the result with options to copy, replace, or send to Copilot.

2. **Dedicated TejasAI Sidebar (Prompt Studio)**:
   - Dedicated Activity Bar icon with custom prompt engineering workspace.
   - Live character counter (up to 1,500 characters).
   - Target model selector (ChatGPT/Copilot, Claude, Gemini, Any AI).
   - Instant tweak buttons: *Shorter*, *Simpler*, *More Detail*.
   - Output canvas showing the enhanced prompt, "Why this prompt is better" explanations, and quick copy/replace actions.
   - Built with native VS Code theme variables (`--vscode-editor-background`, `--vscode-button-background`, etc.) for seamless light/dark theme adaptation without ChatGPT branding.

3. **Developer-Focused Prompt Templates**:
   - **Feature Development**: Architecture & implementation specs, REST/GraphQL endpoint contracts.
   - **Debugging & Fixes**: Root-cause analysis, reproduction isolation, race conditions.
   - **Code Generation**: Type-safe clean functions, accessible components, service abstractions.
   - **Refactoring**: SOLID decoupling, legacy modernization, performance tuning.
   - **Testing & QA**: Comprehensive unit/integration test suites, boundary fuzzing.

4. **GitHub Copilot Chat Participant (`@tejasai`)**:
   - Open GitHub Copilot Chat and type `@tejasai /enhance <rough prompt>` or `@tejasai /feature ...`.
   - TejasAI refines your prompt and provides an interactive **Launch in Copilot Agent** button.
   - Allows true *vibe coding*: speak informally, let TejasAI inject structural guardrails, and let Copilot implement it with precision.

5. **Favorites & Reusable Prompts**:
   - Save frequently used prompts and customized templates directly to VS Code storage.
   - Filter, search, and reload favorites with a single click.

---

## Installation & Development

### Local Sideload / Development
1. Open this workspace in VS Code.
2. Open the **Run and Debug** panel (`Ctrl+Shift+D` or `Cmd+Shift+D`).
3. Press **F5** (or run Extension Development Host) to test the extension in a new VS Code window.

### Package into `.vsix`
To install into any standard VS Code instance:
```bash
cd tejasai-vscode
npx -y @vscode/vsce package
code --install-extension tejasai-vscode-1.0.0.vsix
```
