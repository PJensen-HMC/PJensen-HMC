# PJensen-HMC dotfiles

Pete Jensen's machine bootstrap — HMC dev environment. Clone into `~/` and run `init.sh`.

## Fresh machine setup

```bash
git init ~/
cd ~/
git remote add origin https://github.com/PJensen-HMC/PJensen-HMC.git
git pull origin main
~/init.sh
```

`init.sh` prompts for secrets on first run, then:
- Sets git identity
- Configures NuGet credentials against the HMCgitNuget Azure DevOps feed
- Patches ADO remote URLs with PAT auth
- Pulls all repos listed in `repos.list`

## Bootstrap / Machine Setup

| File | Purpose |
|---|---|
| `init.sh` | Single-command fresh-box init (secrets → git identity → NuGet → remote URLs → pull repos) |
| `repos.list` | Declarative list of repos pulled on init |
| `pr.sh` | Create Azure DevOps PRs from CLI; auto-detects repo, adds required reviewer, injects Claude Code footer |

## Secrets

Secrets live in `~/.claude/.secrets` (gitignored). `init.sh` creates it on first run.
See `.claude/.secrets.example` for the template — fields: `ADO_USER`, `ADO_PAT`, `GH_PAT`.

## Repos

| Repo | Remote |
|---|---|
| `~/Shared` | `HarvMgmt/HMCgit/_git/Shared` |
| `~/CoreServices` | `HarvMgmt/HMCgit/_git/CoreServices` |
| `~/Crimson.Legacy` | `HarvMgmt/HMCgit/_git/Crimson.Legacy` |
| `~/caveman` | `github.com/JuliusBrussee/caveman` |

## Claude Skills

### hmc-tools (local, this repo)

| Skill | Description |
|---|---|
| `/upgrade-hmc-pkgs` | Bump all `HMC.*` NuGet packages to latest from HMCgitNuget; supports `--dry-run`; build-verifies after upgrade |
| `/hmc_dot_net_list_pkgs` | Read-only audit of `HMC.*` packages across repos — current vs latest table, no changes made |
| `/safe-push` | Gated `git push`; shows repo/remote/branch/commits, requires explicit confirmation; sanitizes PAT from display |

### caveman (marketplace — reinstall on fresh machine)

```bash
claude plugin install caveman
```

## Claude Code Hooks

Configured in `.claude/settings.json`:

| Event | Matcher | Purpose |
|---|---|---|
| `UserPromptSubmit` | any | `touch .thinking` — signals Claude is processing |
| `PreToolUse` | any | Writes current tool name → `.current-tool` (feeds statusline) |
| `PreToolUse` | `Bash` | **Push gate** — blocks `git push` without `SAFE_PUSH=1` env var |
| `PreToolUse` | `Edit\|Write` | Writes filename → `.current-tool-ctx` |
| `PreToolUse` | `Read` | Writes filename → `.current-tool-ctx` |
| `PreToolUse` | `Grep\|Glob` | Writes search pattern → `.current-tool-ctx` |
| `PostToolUse` | `Bash` | Writes last active git root → `.last-git-dir` |
| `Stop` | any | Clears `.thinking`, `.current-tool`, `.current-tool-ctx` |

## Statusline

NetHack-style Claude Code status bar (`statusline.sh` / `statusline.py`). Three lines rendered each turn:

**Line 1 — Dungeon message:** context-aware flavor text; escalates at 70/80/90/95% context saturation.

**Line 2 — Corridor:** scrolling dungeon in ANSI color:
- `@` player position = context% across floor width; drifts ±1/sec for animation
- `f` cat pet trailing one step behind player
- `d` demon appears when Claude is thinking; wand-zap bolt (`-`) flashes every 4s
- `>` stairs appear near right wall when context ≥ 85%
- `+`/`/` doors open as player passes through
- Scattered items (`)`  `%`  `!`  `?`  `^`  `$`) seeded by session hash — stable per session

**Line 3 — Stats:** `Dlvl:N  $:cost  HP:ctx(100)  Pw:in(out)  AC:N  T:dur  spinner model  cwd  git-remote  [CAVEMAN]`
- `AC` reflects model tier: Opus=2, Sonnet=4, Haiku=7
- `Dlvl` stable 1–9 per session (derived from session hash)
- HP color: green → yellow → red by context saturation
- Active tool replaces braille spinner with NetHack symbol: `!`=Bash, `/`=Edit, `[`=Write, `?`=Read, `"`=Grep/Glob, `&`=Agent, `*`=WebSearch/Fetch, `=`=Task tools
- `[CAVEMAN]` badge when caveman mode active; `.term-cols` written each prompt for width-adaptive corridor

## Persistent Memory

`.claude/projects/-home-devadmin/memory/` — tracked in this repo:

| File | Contents |
|---|---|
| `feedback_branch_and_scope.md` | Branch naming convention; conservative change scope |
| `feedback_readme_skills.md` | Update README when adding new skills |
| `feedback_trust_user_assertions.md` | Trust user assertions; do not re-verify |
| `project_dotfiles_backup.md` | Dotfiles reorganization plan |
| `project_indexing_crypto.md` | Indexing work blocked on Shared.Crypto merge |
| `reference_azure_devops.md` | Org/project/repo IDs, PAT patterns, PR REST API |

## R&D Spikes

Tracked markdown in `r&d/`:

| File | Topic |
|---|---|
| `ai-agent-strategy.md` | AI agent strategy |
| `agent-framework-spike.md` | Agent framework evaluation |
| `indexing-topology.md` | Search indexing topology |
| `semantic-kernel-spike.md` | Semantic Kernel evaluation |
