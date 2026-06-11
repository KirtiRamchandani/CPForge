# Architecture

CP Forge is a local-first monorepo. Apps are thin surfaces over typed packages.

```mermaid
flowchart TD
  CLI["apps/cli"] --> Core["packages/core"]
  Dashboard["apps/web-dashboard"] --> Core
  Chrome["apps/chrome-extension"] --> Schemas["packages/schemas"]
  VSCode["apps/vscode-extension"] --> Schemas
  Core --> Storage["packages/storage"]
  Core --> Roadmap["packages/roadmap-engine"]
  Core --> Sheets["packages/sheet-engine"]
  Core --> Recs["packages/recommendation-engine"]
  Core --> Export["packages/export-engine"]
  Core --> Analytics["packages/analytics-engine"]
  Adapters["packages/platform-adapters"] --> Storage
```

## Local-First Contract

The `.cpforge/` workspace is the source of truth for the CLI. Browser data lives in browser-local stores. Exports are explicit files, not uploads.

## Adapter Isolation

Platform integrations are isolated in `packages/platform-adapters`. Codeforces API sync is stable and public. LeetCode network behavior is optional and must fail gracefully.
