<div align="center">

# CP Forge

**One command turns your coding practice into a personalized training system.**

Local-first · Privacy-first · 11,000+ Codeforces problems · Zero telemetry

[![CI](https://github.com/KirtiRamchandani/CPForge/actions/workflows/ci.yml/badge.svg)](https://github.com/KirtiRamchandani/CPForge/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Install](#install) · [Quick start](#quick-start-60-seconds) · [CLI](#cli-reference) · [Dashboard](#dashboard) · [Extension](#chrome-extension) · [Docs](docs/architecture.md)

<br />

<img src="docs/assets/dashboard-preview.svg" alt="CP Forge dashboard" width="820" />

<br />

*Solved count is vanity. Mistake reduction is growth.*

</div>

---

## What is CP Forge?

CP Forge is the **open-source training OS** for DSA, competitive programming, and coding interviews. It combines roadmaps, curated sheets, spaced review, upsolve queues, mistake tracking, virtual contests, and a local dashboard — without accounts, cloud lock-in, or tracking.

| You get | Not another |
|--------|-------------|
| Personalized daily plans with **why** | Static problem lists |
| 11k+ CF + Blind 75 + NeetCode packs | Spreadsheet copy-paste |
| Mistake bank + spaced repetition | Solve-count vanity metrics |
| Chrome + VS Code + CLI + dashboard | Yet another tracker tab |

---

## Install

### Option A — From source (recommended)

**Linux / macOS**
```bash
git clone https://github.com/KirtiRamchandani/CPForge.git
cd CPForge
./scripts/install.sh
cp-forge launch --goal amazon --days 45 --offline
```

**Windows (PowerShell)**
```powershell
git clone https://github.com/KirtiRamchandani/CPForge.git
cd CPForge
./scripts/install.ps1
cp-forge launch --goal amazon --days 45 --offline
```

The installer runs `pnpm install`, builds all apps, and links `cp-forge` to `~/.local/bin` (or `%USERPROFILE%\.local\bin` on Windows).

### Option B — Manual dev setup

```bash
git clone https://github.com/KirtiRamchandani/CPForge.git && cd CPForge
corepack enable && pnpm install && pnpm build
node apps/cli/dist/index.js --help
```

### Option C — npm (after release tag)

```bash
npm install -g cp-forge
cp-forge launch --goal amazon --days 45 --offline
```

### Requirements

- **Node.js 20+**
- **pnpm 9+** (via corepack)
- Optional: **Chrome** for extension, **VS Code** for editor companion

---

## Quick start (60 seconds)

```bash
cp-forge launch --cf YOUR_CF_HANDLE --goal amazon --days 45
cp-forge today          # warmup + mains + review + reflection
cp-forge doctor         # diagnosis + prescription
cp-forge next           # next problem with reason
cp-forge dashboard      # export data for web UI
```

**Example output**

```text
CP Forge Report
Goal: amazon · Timeline: 45 days · Language: cpp

Strengths: arrays, hashing, implementation
Weak areas: dynamic-programming, sliding-window, graphs

Generated: 45-day plan · review calendar · mistake bank · upsolve queue
           Google Sheets CSV · Obsidian notes · portfolio report

Next action → Solve sliding-window problems today (weakest Amazon pattern)
```

Everything is stored locally in `.cpforge/` — export or delete anytime.

---

## CLI reference

| Command | Purpose |
|---------|---------|
| `cp-forge init` | Create `.cpforge/` workspace |
| `cp-forge launch` | Full bootstrap: sync, plans, exports, next action |
| `cp-forge sync --cf handle` | Pull public Codeforces submissions (rate-limited) |
| `cp-forge roadmap --goal dsa\|cp\|amazon` | Personalized skill-tree plan |
| `cp-forge sheet --topic dp --pattern "sliding-window"` | Filter 11k+ problem bank |
| `cp-forge doctor` | Training diagnosis + prescription |
| `cp-forge next` | Next problem with reason + time estimate |
| `cp-forge review today` | Spaced repetition queue |
| `cp-forge upsolve priority` | Failed / attempted problem queue |
| `cp-forge mistakes add` | Log off-by-one, TLE, wrong DP state, … |
| `cp-forge contest --rating 1400 --upcoming` | Virtual contest + CF schedule |
| `cp-forge mindmap --export html` | Interactive skill tree |
| `cp-forge chart --type weakness --export svg` | Progress / weakness charts |
| `cp-forge export --format sheets\|notion\|obsidian` | CSV, MD, ICS, JSON |
| `cp-forge portfolio --github-readme --html` | Training profile |
| `cp-forge pack add blind-75\|neetcode-150\|cf-specialist` | Community packs |
| `cp-forge extension-import sync.json` | Merge Chrome extension sessions |
| `cp-forge dashboard` | Export JSON for web dashboard |
| `cp-forge rate <id> --stars 5` | Personal problem quality rating |
| `cp-forge sync --codechef handle` | Save CodeChef handle (extension for live track) |

<details>
<summary><strong>All commands</strong></summary>

Also available: `today`, `stuck`, `flashcards`, `notebook`, `team`, `profile-card`, `import`, `reset`, `sync --offline`.

Run `cp-forge <command> --help` for flags.

</details>

---

## Dashboard

```bash
pnpm --filter @cp-forge/web-dashboard dev
cp-forge dashboard
# Open http://127.0.0.1:5173 → Import .cpforge/exports/dashboard-data.json
```

**17 views:** Home, Today, Progress, Roadmaps, Mindmap, Sheets, Charts, Contests, Weaknesses, Mistakes, Upsolve, Reviews, Companies, Platforms, Portfolio, Notes, Settings.

- Skill tree with click-to-progress (tree + canvas)
- Sheet actions: mark solved, note, review, mistake
- Company readiness radar charts
- 11k Codeforces search panel
- Activity grid + rating buckets
- Import/export `.cpforge` JSON

**Live demo:** [GitHub Pages dashboard](https://kirtiramchandani.github.io/CPForge/dashboard/) (after Pages enabled)

---

## Chrome extension

```bash
pnpm --filter @cp-forge/chrome-extension build
# Load unpacked: apps/chrome-extension/dist in chrome://extensions
```

On **LeetCode** and **Codeforces** problem pages:

- Sidebar: status, notes, timer, checklist
- Local save via `chrome.storage.local`
- **Export sync** → `cp-forge extension-import cpforge-extension-sync.json`

Popup shows today's plan; Options stores CF/LC handles.

---

## VS Code extension

```bash
pnpm --filter @cp-forge/vscode-extension build
# Install .vsix from release or run Extension Development Host
```

Commands: Start Problem, Add Mistake, Mark Solved, Add Note, Export Session → writes to `.cpforge/`.

---

## Problem bank

| Source | Count |
|--------|------:|
| Codeforces API cache | 11,237 |
| Blind 75 / NeetCode curated | 75+ |
| Company & pattern sheets | CSV/JSON |

Refresh CF cache: `node scripts/fetch-cf-problemset.mjs`  
Rebuild curated merge: `node scripts/sync-problem-bank.mjs`

---

## Monorepo

```
apps/          cli · web-dashboard · chrome-extension · vscode-extension · docs-site
packages/      engines (roadmap, sheet, review, mistake, contest, analytics, …)
roadmaps/      DSA · CP · company · language paths
sheets/        topic · pattern · company · placement CSV/JSON
packs/         blind-75 · neetcode-150 · cf-specialist · amazon-45
datasets/      topics · patterns · CF problemset cache
```

```bash
pnpm check     # typecheck + test + build
pnpm --filter @cp-forge/docs-site dev
```

---

## Privacy

No tracking. No telemetry. No required API keys. Optional Codeforces sync uses public endpoints with 2s rate limiting and local cache. See [PRIVACY.md](PRIVACY.md).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) · [ROADMAP.md](ROADMAP.md) · [launch plan](docs/launch-plan.md)

---

<div align="center">

MIT © [KirtiRamchandani](https://github.com/KirtiRamchandani)

**If CP Forge helps your grind, star the repo.**

</div>
