# CP Forge

The open-source operating system for DSA, Competitive Programming, and coding interviews.

CP Forge turns scattered coding practice into a personalized training system. It is local-first, privacy-first, zero-telemetry, and built for people who want more than solved-count vanity metrics.

> Solved count is vanity. Mistake reduction is growth.

## One Command Demo

```bash
npx cp-forge launch --cf your_codeforces_handle --leetcode your_leetcode_handle --goal amazon --days 45
```

CP Forge initializes a local workspace, syncs optional public data, analyzes weak topics, builds a daily plan, schedules revision, creates an upsolve queue, exports files, and prints the next useful action.

```text
CP Forge Report
Goal: Amazon SDE Interview
Timeline: 45 days
Language: C++

Detected strengths:
- Binary Search
- Greedy
- Implementation

Detected weak areas:
- Dynamic Programming
- Trees
- Sliding Window
- Graph BFS

Generated:
- 45-day Amazon DSA plan
- Personalized problem sheet
- Review calendar
- Mistake tracker
- Upsolve queue
- Google Sheets CSV
- Notion Markdown
- Obsidian notes
- GitHub portfolio report

Next action:
Solve 3 sliding-window problems today because this is your weakest high-frequency Amazon pattern.
```

## Why CP Forge Exists

Most tools track what you solved. CP Forge tracks why you improved.

It combines:

- DSA roadmaps
- Competitive programming ladders
- Company-wise prep sheets
- Codeforces tracking
- LeetCode tracking through local imports and extension parsing
- Mistake bank
- Upsolve queue
- Spaced repetition
- Interactive skill-tree mindmap
- Charts
- Chrome extension
- VS Code extension
- Local dashboard
- Google Sheets export
- Notion and Obsidian export
- GitHub portfolio generator

## What It Builds

CP Forge creates a local `.cpforge/` workspace:

```text
.cpforge/
  config.json
  profile.json
  accounts.json
  problems.json
  progress.json
  mistakes.json
  reviews.json
  upsolve.json
  contests.json
  mindmaps.json
  notes/
  exports/
  cache/
```

No account is required for core features. Network sync is optional, cached, rate-limited, and documented in [PRIVACY.md](./PRIVACY.md).

## Apps

- `apps/cli` - the `cp-forge` command-line product
- `apps/web-dashboard` - local-first React dashboard
- `apps/chrome-extension` - Manifest V3 companion for Codeforces and LeetCode
- `apps/vscode-extension` - VS Code solving-session companion
- `apps/docs-site` - documentation site

## Packages

- `packages/schemas` - Zod data contracts
- `packages/storage` - local workspace import/export/delete
- `packages/platform-adapters` - Codeforces API, DOM import, custom imports
- `packages/roadmap-engine` - personalized plans and mindmap trees
- `packages/sheet-engine` - practice sheets and filters
- `packages/recommendation-engine` - next action, weak topic, and daily plan logic
- `packages/mistake-engine` - mistake bank and statistics
- `packages/review-scheduler` - Anki-style review intervals
- `packages/upsolve-engine` - upsolve prioritization
- `packages/contest-engine` - contest alerts and virtual contest planning
- `packages/analytics-engine` - progress and readiness metrics
- `packages/export-engine` - CSV, Markdown, JSON, ICS, HTML, SVG
- `packages/portfolio-engine` - GitHub README and portfolio reports
- `packages/ui` - reusable mindmap and chart primitives
- `packages/utils` - dates, slugs, formatting, stable IDs

## Installation

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
pnpm build
```

Run the CLI locally:

```bash
pnpm --filter @cp-forge/cli dev -- launch --goal amazon --days 45 --offline
```

Run the dashboard:

```bash
pnpm --filter @cp-forge/web-dashboard dev
```

## CLI

```bash
cp-forge init --cf tourist --language cpp --goal cp
cp-forge launch --cf tourist --goal cp --days 45
cp-forge sync --cf tourist
cp-forge roadmap --goal interview --company amazon --days 45
cp-forge sheet --pattern sliding-window
cp-forge doctor
cp-forge next --weak-only
cp-forge review today
cp-forge upsolve priority
cp-forge mistakes stats
cp-forge mindmap --export html
cp-forge chart --type weakness --export svg
cp-forge export --format sheets
cp-forge portfolio --github-readme
```

## Privacy

CP Forge is local-first:

- no tracking
- no telemetry
- no hidden backend
- no external analytics
- no paid API required
- no AI API required
- no account required for core features
- import/export/delete all local data

Optional Codeforces sync uses public anonymous API endpoints with caching and one-request-per-two-second queueing.

## Roadmaps And Sheets

The repo includes static DSA, CP, company, language, role-based, and time-based roadmaps plus CSV/Markdown/JSON sheets. The engines can merge these with local progress and mistake data.

## Screenshots

Demo assets are planned in [docs/screenshots.md](./docs/screenshots.md). The dashboard and extension are designed around screenshot-worthy skill trees, weak-topic charts, and daily training rituals.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The project is intentionally modular so contributors can improve one roadmap, one adapter, one export format, or one UI surface without touching everything else.

## License

MIT. See [LICENSE](./LICENSE).
