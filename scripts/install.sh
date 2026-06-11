#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "CP Forge installer"
echo "=================="

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20+ is required. Install from https://nodejs.org/"
  exit 1
fi

if command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
  corepack prepare pnpm@latest --activate >/dev/null 2>&1 || true
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Installing pnpm..."
  npm install -g pnpm
fi

echo "Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

echo "Building CP Forge..."
pnpm build

CLI="$ROOT/apps/cli/dist/index.js"
if [[ ! -f "$CLI" ]]; then
  echo "Build failed: CLI not found at $CLI"
  exit 1
fi

LINK_DIR="${CP_FORGE_BIN_DIR:-$HOME/.local/bin}"
mkdir -p "$LINK_DIR"
WRAPPER="$LINK_DIR/cp-forge"
cat > "$WRAPPER" <<EOF
#!/usr/bin/env bash
exec node "$CLI" "\$@"
EOF
chmod +x "$WRAPPER"

echo ""
echo "CP Forge is ready."
echo "  cp-forge launch --goal amazon --days 45 --offline"
echo ""
echo "CLI installed to: $WRAPPER"
echo "Add to PATH if needed: export PATH=\"$LINK_DIR:\$PATH\""

if [[ "${1:-}" == "--launch" ]]; then
  node "$CLI" launch --goal amazon --days 45 --offline
fi
