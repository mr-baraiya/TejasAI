# Changelog

All notable changes to TejasAI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-10-24

### Added
- Multi-Framework Dynamic Prompt Builder: Interactive studio supporting 6 domain frameworks (Coding & Engineering, Education & Study, Professional Writing, Product & Marketing, Research & Analysis, and Image Generation).
- Universal Browser Extension (Manifest V3): Full in-composer support across 6 major AI platforms (ChatGPT, Claude, Google Gemini, Perplexity, DeepSeek, and Grok).
- Extension In-Popup Studio: Direct access to prompt builder templates, prompt enhancement, and local favorites directly from the browser action popup.
- Phosphor Icons Design System: Migrated the entire web interface and browser extension from Lucide to Phosphor Icons (@phosphor-icons/react on web, optimized zero-dependency inline SVGs in extension).
- Automated Fallback Redundancy: Seamless failover circuit from primary Groq LPUs to Google Gemini Flash for continuous availability under high load or rate limits.
- GitHub Sponsors Integration: Added .github/FUNDING.yml configuration and dedicated funding section for open-source support.
- Pre-packaged Extension Distribution: Direct zip package download (tejasai-extension.zip) served from client public directory for zero-friction installation.

### Changed
- Refactored all modal action icons in Footer and drawers to use solid fill weights for improved contrast and visual hierarchy.
- Updated root README.md with comprehensive technical documentation, executive summaries, API specifications, and architectural diagrams without icons or emojis.
- Standardized package versions across root package.json, client package.json, and browser extension manifest.json to 1.1.0.

### Fixed
- Fixed Vite dependency pre-bundling optimization cache issue (504 Outdated Optimize Dep) by explicitly including @phosphor-icons/react in optimizeDeps.
- Fixed missing getFavorites import in client application root.
- Fixed Chromium 115+ permissions policy violation warning regarding unload handlers by ensuring clean listener teardown.
- Hardened git repository against credential leakage by strictly verifying server/.env gitignore rules.

---

## [1.0.0] - 2026-10-22

### Added
- Initial release of TejasAI open-source prompt enhancement engine.
- High-speed sub-300ms prompt rewriting powered by Groq LPU cloud.
- Express API gateway with /api/enhance and /api/health endpoints.
- Rate limiting and input boundary validation.
- Initial browser extension content scripts for ChatGPT, Gemini, and Claude.
- Basic prompt history and side-by-side diffing comparison view.
