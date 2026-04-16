---
name: upgrade-hmc-pkgs
description: Upgrades all HMC.* NuGet packages in a repo to their latest versions from the HMCgitNuget feed. Use when the user says "upgrade hmc pkgs", "update hmc packages", "bump hmc", or invokes /upgrade-hmc-pkgs.
argument-hint: [path/to/repo-or.sln] [--dry-run]
allowed-tools: [Bash, Read, Edit, Glob, Grep]
---

# Upgrade HMC Packages

Upgrade all `HMC.*` NuGet packages to latest versions from the `HMCgitNuget` feed.

## Arguments

User invoked with: $ARGUMENTS

Parse arguments:
- First arg (optional): path to `.sln` file or repo directory. Default: `/home/devadmin/CoreServices` then `/home/devadmin/Shared`.
- `--dry-run`: report what would change, make no edits.

## Steps

### 1. Resolve target

If argument is a `.sln` file path, use it directly.
If argument is a directory, find `.sln` files inside with `Glob`.
If no argument, process both `/home/devadmin/Shared/HMC.Shared.sln` and `/home/devadmin/CoreServices` (all `.sln` files there).

### 2. Find outdated HMC packages

For each `.sln` or `.csproj` target, run:

```bash
dotnet list <target> package --outdated --source HMCgitNuget 2>&1
```

Parse output. Extract rows where package name starts with `HMC.`. Each row has:
- Package name
- Current (resolved) version
- Latest version available

Skip packages where current == latest.

If feed auth fails (error contains "Unable to load the service index" or "401"), stop and report:
> Feed auth required. Set AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET and retry, or run `dotnet nuget update source HMCgitNuget --username <user> --password <PAT>`.

### 3. Upgrade each outdated package

For each outdated `HMC.*` package found, identify which `.csproj` files reference it (grep `PackageReference.*<PackageName>`).

For each referencing `.csproj`:

```bash
dotnet add <project.csproj> package <PackageName> --version <LatestVersion> --source HMCgitNuget
```

In `--dry-run` mode: report the commands that would run without executing them.

### 4. Build verification

After all upgrades, run a build to verify nothing broke:

```bash
dotnet build <sln> 2>&1 | grep ": error "
```

Report errors if any. If no errors, confirm build clean.

### 5. Summary

Report table:

| Package | Old Version | New Version | Projects Updated |
|---------|-------------|-------------|-----------------|
| ...     | ...         | ...         | ...             |

If nothing outdated, say so and exit cleanly.
