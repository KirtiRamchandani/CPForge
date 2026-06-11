<div align="center">

# CP Forge

**The personal training OS for DSA, competitive programming, and interviews.**

Local-first · Privacy-first · Zero telemetry

[![CI](https://github.com/KirtiRamchandani/CPForge/actions/workflows/ci.yml/badge.svg)](https://github.com/KirtiRamchandani/CPForge/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Dashboard](#dashboard) · [CLI](#cli-in-30-seconds) · [Extensions](#extensions) · [Docs](docs/architecture.md) · [Privacy](PRIVACY.md)

</div>

---

> **Solved count is vanity. Mistake reduction is growth.**

CP Forge turns scattered practice into one system: roadmaps, sheets, spaced review, upsolve queues, mistake tracking, and a coach that tells you **what to solve next** — not just what you already solved.

<p align="center">
  <img src="docs/assets/dashboard-preview.svg" alt="CP Forge dashboard skill tree and analytics" width="780" />
</p>

## Try it in one command

```bash
git clone https://github.com/KirtiRamchandani/CPForge.git && cd CPForge
corepack enable && pnpm install && pnpm build
node apps/cli/dist/index.js launch --goal amazon --days 45 --offline
```

```text
Next action → Solve sliding-window problems today
             (weakest high-frequency Amazon pattern in your data)

Generated locally → 45-day plan · review calendar · mistake bank · CSV/MD exports
```

No account. No cloud. Everything lives in `.cpforge/`.

---

## Why CP Forge

| Typical tracker | CP Forge |
| --- | --- |
| Counts solves | Tracks **why** you improved |
| Static problem lists | **Personalized** sheets from weak topics |
| Forget failed problems | **Upsolve queue** with priority |
| Repeat the same bugs | **Mistake bank** + spaced **review** |
| Spread across 6 tabs | **CLI + dashboard + browser + editor** |

---

## Features

**Plan** — Company roadmaps (Amazon, Google, Meta…), DSA & CP skill trees, 45-day launch plans  
**Practice** — 80+ curated problems, Blind 75 pack, pattern & company sheets  
**Improve** — Weak-area detection, stuck diagnosis, daily & weekly coach plans  
**Remember** — Anki-style reviews, upsolve prioritization, mistake categories  
**Export** — Google Sheets CSV, Notion/Obsidian notes, portfolio SVG, calendar ICS  
**Extend** — Chrome sidebar on LeetCode/Codeforces, VS Code solving sessions  

<details>
<summary><strong>Full CLI surface</strong></summary>

```bash
cp-forge init --cf tourist --language cpp --goal cp
cp-forge today · doctor · next · review · upsolve · mistakes
cp-forge sheet --pattern sliding-window · roadmap --goal amazon --days 45
cp-forge mindmap --export html · chart --type weakness --export svg
cp-forge flashcards · notebook · pack · portfolio · profile-card
cp-forge dashboard   # exports data for the web app
```

</details>

---

## Dashboard

```bash
pnpm --filter @cp-forge/web-dashboard dev
# In another terminal:
node apps/cli/dist/index.js dashboard
# Import .cpforge/exports/dashboard-data.json in the UI
```

Skill tree · today's plan · weakness charts · mistake bank · portfolio — all from your local workspace.

---

## Extensions

| Surface | What it does |
| --- | --- |
| **Chrome** | Sidebar on LC/CF problem pages — status, notes, checklist (saved locally) |
| **VS Code** | Start problem, log mistakes, mark solved → `.cpforge/` |
| **Docs site** | `pnpm --filter @cp-forge/docs-site dev` |

---

## CLI in 30 seconds

```bash
cp-forge launch --goal amazon --days 45 --offline   # bootstrap everything
cp-forge today                                       # warmup + mains + reflection
cp-forge stuck                                       # why progress stalled
cp-forge sync --cf your_handle                       # optional CF submissions
```

---

## Develop

```bash
pnpm install
pnpm check          # typecheck + test + build
pnpm --filter @cp-forge/cli dev -- --help
```

Monorepo: `apps/` (cli, dashboard, extensions, docs) · `packages/` (engines, schemas, storage) · `roadmaps/` · `sheets/` · `packs/`

See [CONTRIBUTING.md](CONTRIBUTING.md) · [ROADMAP.md](ROADMAP.md) · [architecture](docs/architecture.md)

---

## Privacy

No tracking. No telemetry. No required API keys. Optional Codeforces sync uses public endpoints with local cache and rate limiting. [Full policy →](PRIVACY.md)

---

<div align="center">

MIT © [KirtiRamchandani](https://github.com/KirtiRamchandani)

**Star the repo if CP Forge helps your grind.**

</div>
