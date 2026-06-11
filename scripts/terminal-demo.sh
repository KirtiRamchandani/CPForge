#!/usr/bin/env bash
# Terminal demo script for README GIFs and launch posts.
set -euo pipefail

echo "=== CP Forge terminal demo ==="
cp-forge init 2>/dev/null || true
cp-forge launch --goal amazon --days 45 --offline
cp-forge doctor
cp-forge next --weak-only
cp-forge sheet --company amazon --limit 5 --format markdown
cp-forge mindmap --goal dsa --export html
cp-forge review today
cp-forge rate leetcode-two-sum --stars 5 2>/dev/null || true
cp-forge dashboard
echo "Open apps/web-dashboard and import .cpforge/exports/dashboard-data.json"
