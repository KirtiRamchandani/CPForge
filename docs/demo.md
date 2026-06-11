# Demo

Run the full terminal walkthrough:

```bash
bash scripts/terminal-demo.sh
```

Or step by step:

```bash
npx cp-forge launch --goal amazon --days 45 --offline
cp-forge doctor
cp-forge next --weak-only
cp-forge mindmap --export html
cp-forge portfolio --github-readme
cp-forge rate <problem-id> --stars 5
cp-forge sync --codechef your_handle
```

## Live dashboard

```bash
pnpm --filter @cp-forge/web-dashboard dev
cp-forge dashboard
# Import .cpforge/exports/dashboard-data.json at http://127.0.0.1:5173
```

## GitHub Pages

After enabling Pages on the repo: `https://kirtiramchandani.github.io/CPForge/dashboard/`

Show:

- Daily plan
- Weak topics + company radar
- Interactive mindmap
- Sheet row actions (solved, note, review, mistake)
- Mistake bank
- Exported portfolio
