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

`init.sh` will prompt for secrets on first run, then:
- Set git identity
- Configure NuGet credentials against the HMCgitNuget Azure DevOps feed
- Patch ADO remote URLs with PAT auth
- Pull all repos listed in `repos.list`

## What's here

| Path | Purpose |
|---|---|
| `init.sh` | Machine bootstrap — run once on fresh box |
| `pr.sh` | Create Azure DevOps PRs from CLI |
| `repos.list` | List of repos to pull on init |
| `.bashrc` | Shell config |
| `CLAUDE.md` | Claude Code project instructions |
| `.claude/statusline.sh` | NetHack-style Claude Code status line |
| `.claude/settings.json` | Claude Code settings |
| `.claude/plugins/local/hmc-tools/` | Custom Claude skills (upgrade-hmc-pkgs, etc.) |
| `.claude/projects/-home-devadmin/memory/` | Claude Code persistent memory |

## Secrets

Secrets live in `~/.claude/.secrets` (gitignored). `init.sh` creates it on first run.
See `.claude/.secrets.example` for the template.

## Claude skills

**hmc-tools** (local, this repo):
- `/upgrade-hmc-pkgs` — bump all `HMC.*` NuGet packages to latest from HMCgitNuget feed
- `/hmc_dot_net_list_pkgs` — audit `HMC.*` packages across repos; current vs latest, no changes made

**caveman** (marketplace — reinstall on fresh machine):
```bash
claude plugin install caveman
```

## Repos

| Repo | Remote |
|---|---|
| `~/Shared` | `HarvMgmt/HMCgit/_git/Shared` |
| `~/CoreServices` | `HarvMgmt/HMCgit/_git/CoreServices` |
| `~/Crimson.Legacy` | `HarvMgmt/HMCgit/_git/Crimson.Legacy` |
| `~/caveman` | `github.com/JuliusBrussee/caveman` |
