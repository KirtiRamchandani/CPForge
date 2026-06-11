# Releasing CP Forge v0.2.0

## Prerequisites

1. GitHub repo secret `NPM_TOKEN` with publish access
2. GitHub Pages enabled: Settings → Pages → Source: GitHub Actions
3. All checks green: `corepack pnpm check`

## Publish npm + GitHub Release

```bash
git tag v0.2.0
git push origin v0.2.0
```

The [release workflow](.github/workflows/release.yml) will:

- Run typecheck, test, build
- Publish `cp-forge` to npm
- Attach CLI tarball, Chrome zip, VSIX to GitHub Release

## Manual store uploads

- **Chrome Web Store:** upload `release/cp-forge-chrome.zip`
- **VS Code Marketplace:** upload `release/cp-forge.vsix` or use `vsce publish`

## Post-release

- Verify [live dashboard](https://kirtiramchandani.github.io/CPForge/dashboard/)
- `npm install -g cp-forge@0.2.0`
- Update README badge if npm publish succeeds
