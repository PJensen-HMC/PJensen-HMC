---
name: Dotfiles repo — canonical location
description: Dotfiles repo is git-initialized at ~/; remote is PJensen-HMC/PJensen-HMC on GitHub
type: project
originSessionId: ff02ecf6-0f34-408f-9af1-3a9c65cd2113
---
Dotfiles repo lives directly at `~/`, tracking `origin/main` on `https://github.com/PJensen-HMC/PJensen-HMC.git`.

**Why:** Migration completed 2026-04-16. `/tmp/dotfiles` was temp checkout — now deleted. `~/` is canonical.

**How to apply:** Edit tracked files in place at `~/`. Commit and push directly from `~/`. No copy step needed. GH PAT in remote URL (sourced from `~/.claude/.secrets`).
