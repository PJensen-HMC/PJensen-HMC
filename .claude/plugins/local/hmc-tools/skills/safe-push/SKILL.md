---
name: safe-push
description: Gated git push — always shows repo path, remote URL, branch, and outgoing commits before pushing. Requires explicit user confirmation. Use when the user says "push", "safe push", or invokes /safe-push.
argument-hint: [--force]
allowed-tools: [Bash, AskUserQuestion]
---

# Safe Push

Never push silently. Always surface exactly where you are and what you're about to send.

## Arguments

User invoked with: $ARGUMENTS

Parse: optional `--force` flag → becomes `git push --force`

## Steps

### 1. Gather context

```bash
pwd
git remote -v
git branch --show-current
git log @{u}..HEAD --oneline 2>/dev/null
```

If `@{u}..HEAD` fails (no upstream), fall back to `git log --oneline -10`.

Sanitize remote URL before displaying — strip embedded credentials:
replace `https://[^@]+@` with `https://`

### 2. Present the gate

Show this block clearly before asking anything:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PUSH GATE
  Repo:    <pwd>
  Remote:  origin → <sanitized URL>
  Branch:  <current> → origin/<current>
  Force:   <yes/no>

  Outgoing commits:
    <sha> <message>
    ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. Require explicit approval

Use AskUserQuestion:
> "Push N commit(s) to [remote name] ([sanitized URL]) on branch [branch]? (yes / no)"

Do NOT push unless the user responds with yes / y / confirm / go / ship it.
Any other response → abort, report "Push cancelled."

### 4. Execute

If approved:
```bash
SAFE_PUSH=1 git push [--force]
```

`SAFE_PUSH=1` is required — the global pre-push hook blocks any push without it.

Report the result verbatim.
