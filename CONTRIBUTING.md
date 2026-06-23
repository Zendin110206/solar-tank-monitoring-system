# Contributing

This repository is currently in the foundation scaffold phase.

## Working Rules

- Keep public repository content free from real credentials, private telemetry, network details, and organization-specific deployment data.
- Use dummy data or simulator payloads for examples.
- Prefer small, reviewable commits.
- Keep domain logic testable and separate from UI code.
- Document assumptions when real hardware or deployment details are not yet confirmed.

## Commit Style

Use concise conventional-style commit messages:

```text
docs(readme): improve repository overview
chore(repo): add project structure scaffold
feat(domain): add tank volume calculation
test(domain): cover runtime status thresholds
```

## Local Checks

Before pushing implementation changes, run:

```powershell
pnpm check
```
