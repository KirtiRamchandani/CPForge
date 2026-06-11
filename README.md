<div align="center">

# CP Forge

### Stop collecting problem lists. Start training like you mean it.

**One command → daily plan · weak-topic fixes · spaced review · mistake bank · 11k+ problems · zero accounts**

[![CI](https://github.com/KirtiRamchandani/CPForge/actions/workflows/ci.yml/badge.svg)](https://github.com/KirtiRamchandani/CPForge/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node 20+](https://img.shields.io/badge/node-20%2B-42d392)](https://nodejs.org)
[![Local-first](https://img.shields.io/badge/telemetry-none-8bd3ff)](PRIVACY.md)

[**Try live dashboard →**](https://kirtiramchandani.github.io/CPForge/dashboard/) · [Install](#-install-in-one-minute) · [60-second start](#-60-second-start) · [Why CP Forge](#-why-cp-forge-wins)

<br />

<img src="docs/assets/dashboard-preview.svg" alt="CP Forge dashboard — readiness, skill tree, daily plan" width="820" />

<br />

<p><strong>11,237</strong> Codeforces problems · <strong>1,765</strong> curated interview problems · <strong>17</strong> dashboard views · <strong>0</strong> cloud accounts required</p>

<p><em>Solved count is vanity. Mistake reduction is growth.</em></p>

</div>

---

## The problem everyone feels

You open LeetCode. You open Codeforces. You bookmark another sheet. You solve randomly. You forget what you learned. You repeat the same bugs in contests and interviews.

**CP Forge replaces chaos with a system** — the same way a gym program beats "just go lift sometimes."

<table>
<tr>
<th width="50%">Without CP Forge</th>
<th width="50%">With CP Forge</th>
</tr>
<tr>
<td>Random problem picking</td>
<td><code>cp-forge next</code> tells you <strong>what</strong> and <strong>why</strong></td>
</tr>
<tr>
<td>Spreadsheets you never update</td>
<td>Auto daily plan + exports to Sheets, Notion, Obsidian</td>
</tr>
<tr>
<td>Same off-by-one bug for 6 months</td>
<td>Mistake bank + spaced review catches patterns</td>
</tr>
<tr>
<td>Contest failures vanish</td>
<td>Upsolve queue prioritizes what actually moves rating</td>
</tr>
<tr>
<td>Another SaaS tracker with login</td>
<td><strong>100% local</strong> in <code>.cpforge/</code> — yours forever</td>
</tr>
</table>

---

## ⚡ 60-second start

```bash
git clone https://github.com/KirtiRamchandani/CPForge.git && cd CPForge
./scripts/install.sh          # Windows: ./scripts/install.ps1
cp-forge launch --goal amazon --days 45 --offline
cp-forge today                # warmup + mains + review + reflection
cp-forge doctor               # diagnosis + prescription
cp-forge next                 # next problem with reason + time estimate
```

**What you get immediately:**

```text
CP Forge Report
Goal: amazon · Timeline: 45 days · Language: cpp

Strengths: arrays, hashing, implementation
Weak areas: sliding-window, dynamic-programming, graphs

Generated: 45-day plan · review calendar · mistake bank · upsolve queue
           Google Sheets CSV · Obsidian notes · portfolio report

Next action → Solve sliding-window problems today (weakest Amazon pattern)
```

<img src="docs/assets/terminal-demo.svg" alt="CP Forge terminal workflow" width="720" />

---

## 🧠 Why CP Forge wins

CP Forge is the **open-source training OS** — NeetCode structure + Striver sheets + Codeforces tracking + spaced repetition + a local dashboard, in one repo you own.

| Capability | CP Forge | Static sheet | Generic tracker |
|------------|:--------:|:--------------:|:---------------:|
| Personalized daily plan with **why** | ✅ | ❌ | ⚠️ |
| 11k+ Codeforces search | ✅ | ❌ | ❌ |
| Mistake bank + categories | ✅ | ❌ | ⚠️ |
| Spaced repetition scheduler | ✅ | ❌ | ⚠️ |
| Company readiness radar | ✅ | ❌ | ❌ |
| Chrome + VS Code + CLI | ✅ | ❌ | ⚠️ |
| Works offline, no account | ✅ | ✅ | ❌ |
| Open source (MIT) | ✅ | ⚠️ | ❌ |

---

## 👤 Built for you

| You are… | Start here |
|----------|------------|
| **Interview candidate** (30–60 days) | `cp-forge launch --goal amazon --days 45` |
| **CP grinder** (800 → 1600) | `cp-forge sync --cf handle --all` + `cp-forge contest --upcoming` |
| **College student** | `roadmaps/role-based/student.md` + `cp-forge sheet --topic arrays` |
| **ICPC team** | `roadmaps/role-based/icpc-contestant.md` + `cp-forge team` |

---

## 🛠 Install in one minute

### Linux / macOS
```bash
git clone https://github.com/KirtiRamchandani/CPForge.git
cd CPForge
./scripts/install.sh
cp-forge launch --goal amazon --days 45 --offline
```

### Windows (PowerShell)
```powershell
git clone https://github.com/KirtiRamchandani/CPForge.git
cd CPForge
./scripts/install.ps1
cp-forge launch --goal amazon --days 45 --offline
```

### npm (after release)
```bash
npm install -g cp-forge
cp-forge launch --goal amazon --days 45
```

**Requirements:** Node.js 20+, pnpm 9+ (via corepack). Optional: Chrome, VS Code.

---

## 📊 Dashboard — your command center

[**Open live demo →**](https://kirtiramchandani.github.io/CPForge/dashboard/)

```bash
pnpm --filter @cp-forge/web-dashboard dev
cp-forge dashboard
# Import .cpforge/exports/dashboard-data.json
```

**17 views:** Home · Today · Progress · Roadmaps · Mindmap · Sheets · Charts · Contests · Weaknesses · Mistakes · Upsolve · Reviews · Companies · Platforms · Portfolio · Notes · Settings

- Interactive skill tree (canvas + tree modes)
- Sheet actions: mark solved, note, review, mistake — no context switching
- **Company readiness radar** for Amazon, Google, Meta, …
- Search **11,000+ Codeforces** problems instantly
- Pattern mastery scores on Progress tab
- `Ctrl+K` command palette

---

## 🌐 Chrome extension — practice where you already are

Works on **Codeforces · LeetCode · AtCoder · GFG · CSES · CodeChef · HackerRank · InterviewBit**

```bash
pnpm --filter @cp-forge/chrome-extension build
# chrome://extensions → Load unpacked → apps/chrome-extension/dist
```

- Sidebar: timer, notes, status, mistake reminders, code checklist
- **Contest cockpit** on live Codeforces rounds
- Popup: today's plan + mini skill tree
- Export → `cp-forge extension-import sync.json`

---

## ⌨️ CLI power commands

| Command | What it does |
|---------|--------------|
| `cp-forge launch` | Full bootstrap: sync, plans, exports, next action |
| `cp-forge doctor` | Training diagnosis + prescription |
| `cp-forge next` | Next problem with reason + time estimate |
| `cp-forge sheet --company amazon` | Filter 1,765+ curated problems |
| `cp-forge review today` | Spaced repetition queue |
| `cp-forge upsolve priority` | Failed / attempted problem queue |
| `cp-forge mistakes add` | Log off-by-one, TLE, wrong DP state… |
| `cp-forge mindmap --export html` | Interactive skill tree |
| `cp-forge contest --rating 1400` | Virtual contest block |
| `cp-forge portfolio --github-readme` | Training profile for GitHub |
| `cp-forge export --format sqlite` | SQL dump of your workspace |
| `cp-forge rate <id> --stars 5` | Personal problem quality rating |

<details>
<summary><strong>All commands</strong></summary>

Also: `init`, `sync`, `roadmap`, `chart`, `import`, `dashboard`, `today`, `stuck`, `flashcards`, `notebook`, `team`, `profile-card`, `pack`, `reset`.

Run `cp-forge <command> --help` for flags.

</details>

---

## 🔒 Privacy by design

No tracking. No telemetry. No required API keys. Optional Codeforces sync uses **public endpoints only**, with 2-second rate limiting and local cache. Your data lives in `.cpforge/` — export or delete anytime. [PRIVACY.md](PRIVACY.md)

---

## 🗂 What's inside

```
apps/       cli · web-dashboard · chrome-extension · vscode-extension · docs-site
packages/   roadmap, sheet, review, mistake, contest, analytics engines
roadmaps/   DSA · CP · company · role-based · time-based
sheets/     topic · pattern · company · placement CSV/JSON
datasets/   11k CF cache · company patterns
```

```bash
pnpm check     # typecheck + test + build
bash scripts/terminal-demo.sh   # full walkthrough script
```

---

## 🚀 Star this repo if CP Forge saves you even one repeated mistake

<div align="center">

If this helps your grind — **star ⭐ the repo** so more devs find a local-first alternative to random solving.

[⭐ Star CP Forge on GitHub](https://github.com/KirtiRamchandani/CPForge)

MIT © [KirtiRamchandani](https://github.com/KirtiRamchandani) · [Contributing](CONTRIBUTING.md) · [Roadmap](ROADMAP.md) · [Architecture](docs/architecture.md)

</div>
