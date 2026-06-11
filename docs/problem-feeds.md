# Live problem feeds

CP Forge keeps Codeforces and LeetCode catalogs fresh so learners always search current problems.

## For learners (local)

```bash
cp-forge bank refresh          # CF + LeetCode → .cpforge/cache/
cp-forge bank status           # last update + counts
cp-forge bank new              # sample of newly added problems
cp-forge sheet --topic graphs  # uses expanded bank (curated + cached feeds)
```

Caches live in:

- `.cpforge/cache/cf-problemset.json`
- `.cpforge/cache/leetcode-problemset.json`
- `.cpforge/cache/feed-manifest.json`

## For maintainers (repo)

```bash
pnpm refresh-feeds             # fetch both platforms, rebuild indexes + bank
pnpm fetch-lc                  # LeetCode only
pnpm fetch-cf                  # Codeforces only
```

Outputs:

| File | Purpose |
|------|---------|
| `datasets/cf-problemset-cache.json` | Full CF API dump (~11k) |
| `datasets/leetcode-problemset-cache.json` | Free LC catalog (~3k) |
| `datasets/feed-manifest.json` | Counts + new-problem samples |
| `apps/web-dashboard/public/cf-search-index.json` | Dashboard CF search |
| `apps/web-dashboard/public/leetcode-search-index.json` | Dashboard LC search |

## Automation

GitHub Actions workflow `.github/workflows/refresh-problems.yml` runs **weekly** (Mondays 06:00 UTC) and commits feed updates when counts change.

## Privacy

- Codeforces: public `problemset.problems` API (rate-limited 2s)
- LeetCode: public GraphQL `questionList` (free problems only, rate-limited ~1.2s/page)
- No account required for catalog refresh (separate from `cp-forge sync --leetcode handle` submission sync)
