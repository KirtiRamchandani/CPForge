# Privacy

CP Forge is local-first and privacy-first.

## What CP Forge Does Not Do

- No tracking
- No telemetry
- No hidden analytics
- No required backend
- No required account
- No required paid API
- No required AI API
- No selling user data
- No uploading problem data without explicit user action

## Local Data

The CLI stores data in `.cpforge/` inside your workspace. Browser extension data uses `chrome.storage.local` for settings and IndexedDB for problem data, notes, mistakes, reviews, and upsolve queues. Dashboard data can be imported from `.cpforge` exports or stored locally in the browser.

You can export, import, and delete all local data.

## Network Requests

Network requests are optional. The product remains useful offline with static roadmaps, sheets, local notes, mistake tracking, reviews, and exports.

Documented optional requests:

| Feature | Endpoint | Purpose | Default |
| --- | --- | --- | --- |
| Codeforces sync | `https://codeforces.com/api/problemset.problems` | Fetch public problemset metadata | User-triggered |
| Codeforces sync | `https://codeforces.com/api/user.status?handle=...` | Fetch public submissions for a handle | User-triggered |
| Codeforces sync | `https://codeforces.com/api/user.info?handles=...` | Fetch public profile data | User-triggered |
| Codeforces sync | `https://codeforces.com/api/user.rating?handle=...` | Fetch public rating history | User-triggered |
| Codeforces sync | `https://codeforces.com/api/contest.list` | Fetch public contest list and alerts | User-triggered |
| LeetCode import | local DOM/content script | Parse visible page data locally | Extension only |
| LeetCode GraphQL | LeetCode GraphQL endpoint | Optional unstable adapter | Disabled unless enabled |

Codeforces requests are cached, queued, and rate-limited to at most one request every two seconds.

## AI

CP Forge has no AI dependency. A future optional AI mode may exist only when a user provides their own key and explicitly enables it.
