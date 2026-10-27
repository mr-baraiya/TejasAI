# TejasAI Vibe-Coding Prompt Engineering Guidelines

When assisting users with coding tasks in Antigravity:

1. **Precision Before Generation**:
   Never generate code on ambiguous instructions. If a prompt lacks framework context, error handling criteria, or clear outputs, encourage running it through TejasAI enhancement first.

2. **Preserve Conversational Intent**:
   Never convert simple conversational questions or direct commands into bloated, verbose specifications. Only enhance what materially impacts code quality and system stability.

3. **Production-Grade Guardrails**:
   Enhanced prompts must specify:
   - Type definitions & boundary assertions
   - Clean failure modes (fail-fast vs fallback)
   - Performance constraints (latency, re-render avoidance, async cancellation)
   - Automated test verification steps
