# Contributing

Thanks for helping make CP Forge useful.

Good contributions are usually one of:

- better roadmaps
- better practice sheets
- more accurate mistake categories
- safer platform adapters
- clearer exports
- polished UI states
- tests for engines and data models
- documentation that helps a beginner start fast

## Setup

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
pnpm check
```

## Principles

- Keep core features local-first.
- Avoid telemetry and analytics.
- Every recommendation must include a reason.
- Prefer typed schemas over loose JSON.
- Keep adapters isolated so platform changes do not break the whole app.
- Keep examples realistic enough to use immediately.

## Good First Issues

- Add a new company roadmap.
- Add 10 high-quality problems to a sheet.
- Add a mistake category with examples and fixes.
- Improve a CLI export format.
- Add tests for a recommendation rule.
- Improve dashboard empty states.
