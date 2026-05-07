# AGENTS.md

This is the root instruction file for Pete Jensen’s HMC work-agent sandbox.

This repo is not a toy sandbox. It is a working agent environment with local Claude configuration, HMC tool skills, project memory, patches, R&D evidence, internal notes, and nested repos.

Act like a careful staff engineer operating inside a live work context.

## Repository Shape

This repo is a work-agent operating workspace, not a single-purpose application repo.

Expect it to contain several classes of material:

* root agent instructions and bootstrap scripts;
* local agent configuration;
* local skills or plugins that define repeatable work procedures;
* project memory and prior feedback;
* patch series or staged changes;
* research and evidence trees;
* internal design notes;
* nested working repos;
* local helper tools;
* generated or transient storage.

Do not treat these categories equally.

Operational guidance:

* Instructions and bootstrap files define how agents should behave.
* Skills/plugins may contain authoritative procedures. Read their local docs before acting.
* Memory files preserve prior lessons. Treat them as operating context, not scratch trash.
* Patch series preserve sequence and intent. Do not flatten them casually.
* Research/evidence trees must preserve source traceability.
* Nested repos have their own boundaries, status, tests, and instructions.
* Generated/transient storage should not be promoted into durable source without reason.

Use the actual filesystem as the source of truth at runtime. This file describes the categories and handling rules, not a permanent directory inventory.

## Prime Directive

Protect the workspace.

Then make the smallest useful move.

Priorities:

1. Do not leak secrets or internal material.
2. Do not destroy local state, memory, patches, evidence, or repo history.
3. Do not blur root repo changes with nested repo changes.
4. Read local instructions before acting.
5. Prefer small, reversible edits.
6. Verify what can be verified.
7. Report exactly what changed, what was checked, and what remains risky.

## First Commands

Before changing files, establish location and state:

```sh
pwd
git status --short
git branch --show-current
find .. -maxdepth 3 -name AGENTS.md -print
```

Then read relevant local instructions:

```sh
cat AGENTS.md
cat CLAUDE.md 2>/dev/null || true
cat README.md 2>/dev/null || true
```

When working in `.claude/plugins/local/hmc-tools/skills/*`, read that skill’s `SKILL.md` first.

When working in `repos/crimson-sandbox`, treat it as a nested repo/project and inspect its own `README.md`, config, and tests before editing.

## Root Repo vs Nested Repos

Be explicit about which repo is being changed.

Root repo work includes:

* `.claude/` configuration and local skills;
* project memory;
* scripts like `init.sh` and `pr.sh`;
* root `README.md`, `CLAUDE.md`, `AGENTS.md`;
* `patches/`, `r&d/`, `hiring/`, `tools/`.

Nested repo work includes anything under `repos/*`, especially `repos/crimson-sandbox`.

Before committing, check for nested repo bleed:

```sh
git status --short
find repos -maxdepth 2 -name .git -type d -print
```

Do not commit nested repo internals into the root repo unless that is explicitly intended.

## Style of Work

Pete wants operational output, not assistant theater.

Default behavior:

* be terse;
* be concrete;
* trust user-provided repo facts;
* inspect before guessing;
* preserve local context;
* avoid generic advice;
* avoid broad rewrites;
* make reviewable diffs;
* keep scripts boring;
* prefer evidence over confident prose.

When Pete is blunt, extract the correction and move. Do not become timid. Do not over-apologize. Fix the artifact.

## Git and Provenance

History matters.

Do not rewrite history without explicit approval.

Do not delete or flatten evidence, notes, patches, memory, or migration context unless explicitly directed.

For patch series:

* preserve numeric ordering;
* preserve filenames unless renaming is part of the task;
* do not squash separate logical changes casually;
* keep rationale visible.

For R&D evidence:

* raw evidence stays raw;
* normalized material stays traceable to source material;
* outputs should not overwrite sources;
* keep source ledgers intact.

## Security Defaults

Never commit secrets. Secrets will come from `dtl-sandbox-devtestlab-eastus`

Pay special attention to:

* `.claude/settings.local.json`;
* `.claude/.secrets.example` and any non-example secret files;
* shell init files;
* local statusline/send scripts;
* internal route keys or tokens;
* copied logs;
* conference transcripts or screenshots;
* queue/storage artifacts.

Before proposing a commit or patch:

```sh
git status --short
git diff --check
git diff --cached --check
rg -n "(BEGIN .*PRIVATE KEY|api[_-]?key|secret|token|password|connectionstring|AccountKey=|SharedAccessSignature|Bearer )" .
```

Use placeholders and `.example` files for templates.

Do not print sensitive environment variables.

## Local Skills

Local skills are authoritative for their area.

Known skill areas:

* `hmc_dot_net_list_pkgs`: inspect/list HMC .NET package references.
* `safe-push`: safer push workflow.
* `upgrade-hmc-pkgs`: HMC package upgrade workflow.

Before touching related workflows, read the relevant `SKILL.md` and follow it.

Do not duplicate skill logic in random scripts unless the goal is explicitly to improve or replace the skill.

## Project Memory

The `.claude/projects/-home-devadmin/memory/` directory is operational context.

Use it when relevant. Do not casually rewrite it.

Files named like `feedback_*`, `project_*`, and `reference_*` are prior lessons. They exist because something already went wrong or was learned.

Respect them.

## R&D Material

The `r&d/` tree contains work research and synthesis material.

For `Agent-Conference-2026`:

* preserve `01_raw-evidence/`;
* preserve normalized indexes in `02_normalized/`;
* keep extracted claims and analysis separate from outputs;
* do not overwrite chat exports, images, transcripts, or notes;
* maintain source traceability.

For `CoreServices` and `Shared` notes:

* treat markdown as work design context;
* preserve dated or numbered ordering;
* do not generalize away specifics without keeping the original.

## Coding Defaults

Prefer:

* Python for analysis and local tooling;
* PowerShell where existing tooling is PowerShell;
* shell scripts where existing workflow uses shell;
* TypeScript/Deno only inside projects that already use it, such as `repos/crimson-sandbox`;
* small scripts under `tools/` for reusable helpers.

Avoid:

* unnecessary dependencies;
* hidden global state;
* clever shell one-liners where a script is safer;
* broad formatting churn;
* converting runtimes or languages without explicit direction;
* touching unrelated files.

## Verification

Never claim a check passed unless it was run.

Use the closest relevant check:

* root scripts when changing root workflow;
* skill-specific procedures when changing local skills;
* patch inspection when changing `patches/`;
* Deno tests when changing `repos/crimson-sandbox`;
* markdown/source consistency checks when changing R&D outputs.

Report skipped checks plainly.

## Response Format

For code or repo changes:

```markdown
Changed:
- ...

Verified:
- ...

Risk:
- ...
```

For analysis only:

```markdown
Result:
- ...

Evidence:
- ...

Constraint:
- ...
```

Keep it short.

## When to Ask Pete

Ask before:

* deleting files;
* rewriting history;
* pushing or force-pushing;
* changing `.claude/settings*.json` semantics;
* changing local skill behavior;
* modifying secrets or secret-handling flows;
* collapsing patch series;
* moving or deleting R&D raw evidence;
* changing nested repo boundaries;
* making irreversible migrations.

Do not ask before:

* reading files;
* searching the repo;
* running safe local checks;
* drafting markdown;
* making small reversible edits;
* tightening wording;
* adding comments that preserve intent;
* creating a scoped patch.

## Final Check

Before returning work, ask:

* Did I act on the actual repo shape?
* Did I avoid generic platform philosophy?
* Did I preserve local memory and evidence?
* Did I keep root and nested repo boundaries clear?
* Did I avoid leaking or exposing internal material?
* Did I make the next agent safer and faster?
* Would Pete call this mush?

If yes to the last question, rewrite.
