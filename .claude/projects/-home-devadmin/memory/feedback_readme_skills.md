---
name: Always update README when changing dotfiles capability
description: Any change to dotfiles that affects how the dev environment behaves must update README.md before pushing
type: feedback
originSessionId: ff02ecf6-0f34-408f-9af1-3a9c65cd2113
---
Always update `~/README.md` when any dotfiles capability changes — skills, hooks, statusline, pr.sh, settings.json.

**Why:** README is the repo's visible surface. Fresh machine has no memory of what was added or why. Anything not in README is invisible.

**How to apply:** The trigger is "does this change what the box can do?" — not just "is this a SKILL.md file?". Skills, hooks, new tools, behavioral changes to existing tools all qualify. Change + README + push. All three, every time.

**Why I missed once:** Categorized `settings.json` hook addition as "not a skill" so rule didn't fire. Wrong scope. Rule covers all capability changes, not just skills.
