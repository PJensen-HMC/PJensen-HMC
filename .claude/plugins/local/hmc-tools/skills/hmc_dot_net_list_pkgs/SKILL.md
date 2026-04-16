---
name: hmc_dot_net_list_pkgs
description: Lists all HMC.* NuGet packages in use across repos, showing current vs latest available. Read-only audit — no changes made. Use when the user says "list hmc pkgs", "show hmc packages", "what hmc packages", "audit hmc", or invokes /hmc_dot_net_list_pkgs.
argument-hint: [path/to/repo-or.sln]
allowed-tools: [Bash, Glob]
---

# List HMC Packages

Read-only audit of all `HMC.*` NuGet packages in use. Shows current version, latest available, and upgrade status.

## Arguments

User invoked with: $ARGUMENTS

Parse arguments:
- First arg (optional): path to `.sln` file or repo directory. Default: both `/home/devadmin/Shared/HMC.Shared.sln` and all `.sln` files under `/home/devadmin/CoreServices`.

## Steps

### 1. Resolve targets

Same resolution logic as `upgrade-hmc-pkgs`:
- `.sln` path → use directly
- Directory → find `.sln` files with `Glob`
- No arg → process both `Shared` and `CoreServices`

### 2. Query outdated HMC packages

For each `.sln` target:

```bash
dotnet list <target> package --outdated --source HMCgitNuget 2>&1
```

Also run without `--outdated` to catch packages already at latest:

```bash
dotnet list <target> package --source HMCgitNuget 2>&1
```

Parse both. For each `HMC.*` package, capture:
- Package name
- Current (resolved) version
- Latest version (from `--outdated` output; if absent, current = latest)

If feed auth fails (401), stop and report:
> Feed auth required — run `~/init.sh` to configure NuGet credentials.

### 3. Report

Output a single consolidated table across all targets:

| Package | Current | Latest | Status |
|---------|---------|--------|--------|
| HMC.Shared.Types | 3.0.0.2 | 3.0.0.3 | OUTDATED |
| HMC.Shared.Web | 3.0.0.8 | 3.0.0.8 | OK |
| ... | | | |

Status values:
- `OK` — current = latest
- `OUTDATED` — upgrade available
- `UNKNOWN` — could not resolve latest

Finish with a summary line:
> N packages checked. X outdated. Run `/upgrade-hmc-pkgs` to upgrade.

If nothing outdated, say so and exit cleanly.
