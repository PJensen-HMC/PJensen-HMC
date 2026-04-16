---
name: Always update README when adding a skill
description: Every new hmc-tools skill must be documented in README.md before pushing
type: feedback
originSessionId: ff02ecf6-0f34-408f-9af1-3a9c65cd2113
---
Always update `/tmp/dotfiles/README.md` (or wherever the dotfiles repo lives) when adding a new skill to hmc-tools.

**Why:** README is the repo's visible surface — skills that aren't listed there are invisible on fresh machines.

**How to apply:** New skill + README update + push to GitHub. All three, every time. Never leave a skill local-only.
