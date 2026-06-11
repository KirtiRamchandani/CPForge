# Ecosystem

CP Forge ships as a monorepo today. Optional satellite repos can split content for faster community contributions.

## In this repo

| Path | Purpose |
|------|---------|
| `roadmaps/` | DSA, CP, company, role-based, time-based plans |
| `sheets/` | CSV/JSON problem sheets and company packs |
| `datasets/` | Codeforces cache, company tags |
| `apps/cli` | `cp-forge` npm package |
| `apps/web-dashboard` | Local dashboard (also on GitHub Pages) |
| `apps/chrome-extension` | Browser companion |
| `apps/vscode-extension` | Editor companion |

## Future satellites (optional)

| Repo | Contents |
|------|----------|
| `cp-forge-roadmaps` | Community roadmaps only |
| `cp-forge-sheets` | Curated sheet PRs |
| `cp-forge-packs` | Blind-75, NeetCode, ICPC packs |

Contributors can PR to the monorepo first; maintainers may mirror to satellites later.

## Install surfaces

- **npm:** `npm i -g cp-forge` (on release tag)
- **GitHub:** clone + `scripts/install.ps1` or `install.sh`
- **Chrome:** load unpacked from `apps/chrome-extension/dist`
- **VS Code:** install `.vsix` from GitHub Releases

## Links

- Docs site: `/` on GitHub Pages
- Dashboard demo: `/dashboard`
- Issues: GitHub Issues with `good first issue` label
