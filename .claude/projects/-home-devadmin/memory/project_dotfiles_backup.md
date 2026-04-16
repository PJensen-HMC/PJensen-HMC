---
name: Dotfiles/backup repo — planned reorganization
description: Current backup in ~/.claude is temporary; will move to ~/dotfiles or similar with personal remote
type: project
originSessionId: ff02ecf6-0f34-408f-9af1-3a9c65cd2113
---
Current backup repo lives at `~/.claude/` with local bare remote at `~/git/statusline.git`.

**Why:** Temporary setup. User plans to reorganize.

**Planned state:**
- Git repo rooted in home folder (e.g. `~/dotfiles` or `~/`)
- Remote = user's personal remote (not local bare repo)

**How to apply:** Don't further entrench `~/.claude/` as the canonical backup location. When reorganization comes, help migrate tracked files to new repo root and re-point remote.
