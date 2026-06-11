# Security

CP Forge is designed to avoid unnecessary risk by staying local-first.

## Reporting

Please open a private security advisory or contact maintainers before disclosing sensitive issues publicly.

## Scope

Security-sensitive areas:

- Browser extension permissions
- Optional platform adapters
- Import parsers
- File export paths
- VS Code extension workspace access

## Rules

- Do not add hidden backends.
- Do not add telemetry.
- Do not exfiltrate user code, notes, mistakes, handles, or exports.
- Keep permissions minimal.
- Treat imported CSV, JSON, Markdown, and HTML as untrusted.
