# Interview Candidate Roadmap

For engineers targeting FAANG and product companies within 30–60 days.

## Phase 1 (Days 1–15): Pattern coverage
- Arrays, strings, two pointers, sliding window, binary search
- `cp-forge sheet --pattern sliding-window --limit 25`
- Target: 2 mediums/day with design doc notes

## Phase 2 (Days 16–30): Depth
- Trees, graphs, heap, intervals, top-K
- Company focus: `cp-forge roadmap --company amazon --days 30`
- Mock checklist from dashboard Companies tab

## Phase 3 (Days 31–45): Consolidation
- Dynamic programming (1D → 2D → state compression intro)
- `cp-forge review overdue` before new problems
- `cp-forge upsolve priority` for failed mocks

## Phase 4 (Days 46–60): Simulation
- Timed sets: 2 problems / 90 min
- `cp-forge stuck` when blocked > 25 min
- Export Notion/Obsidian for interview journal

## Metrics to watch
- Readiness score in dashboard
- Mistake category trends (off-by-one, wrong DP state)
- Company radar chart per target firm

```bash
cp-forge launch --goal amazon --days 45
cp-forge sheet --company google --limit 40
cp-forge export --format notion
```
