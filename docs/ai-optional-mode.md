# AI-Optional Mode

CP Forge is **local-first by default**. AI assistance is optional and disabled unless you explicitly enable it in the future.

## Current behavior (v0.2)

- `profile.aiAssistEnabled` defaults to `false` in `.cpforge/workspace.json`
- No network calls to LLM providers from the CLI, dashboard, or extensions
- All recommendations are rule-based (`recommendation-engine`, `doctor`, `stuck`)

## Planned (future release)

When enabled, AI mode may offer:

- Hint generation from your notes (never full solutions by default)
- Mistake pattern explanations tied to your mistake bank
- Mock interview follow-up questions

## Privacy

- AI features will require explicit opt-in per workspace
- No training on user data
- Offline mode always available

## Enable stub (today)

Set in `.cpforge/workspace.json`:

```json
{
  "profile": {
    "aiAssistEnabled": false
  }
}
```

The dashboard Settings tab shows current status.
