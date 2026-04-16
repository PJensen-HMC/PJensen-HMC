---
name: Azure DevOps access — HMCgit
description: Org, project, repo IDs, PAT, git auth, and PR API pattern for CoreServices Azure DevOps
type: reference
originSessionId: ff02ecf6-0f34-408f-9af1-3a9c65cd2113
---
## Org / Project / Repos

| Key | Value |
|---|---|
| Org | `HarvMgmt` |
| Project | `HMCgit` |
| Project ID | `96a4c2dc-5191-4138-b48a-5c51d6e54ef6` |
| CoreServices repo ID | `f48392ab-901f-4c10-a470-952030eddfad` |
| Web URL | https://dev.azure.com/HarvMgmt/HMCgit/_git/CoreServices |

## PAT

Stored in `~/.claude/.secrets` (gitignored). Run `init.sh` to create on a fresh machine.

Owner: jensenp@hmc.harvard.edu

## Git push auth (PAT as username in URL)

```bash
git push -u "https://<PAT>@dev.azure.com/HarvMgmt/HMCgit/_git/CoreServices" <branch>
```

## NuGet source name

`HMCgitNuget` — set creds with:
```bash
dotnet nuget update source HMCgitNuget --username "jensenp@hmc.harvard.edu" --password "<PAT>" --store-password-in-clear-text
```

## Create PR via REST API

```bash
curl -s -X POST \
  "https://dev.azure.com/HarvMgmt/HMCgit/_apis/git/repositories/CoreServices/pullrequests?api-version=7.1" \
  -H "Content-Type: application/json" \
  -u ":<PAT>" \
  -d '{
    "title": "<title>",
    "description": "<description>",
    "sourceRefName": "refs/heads/<source-branch>",
    "targetRefName": "refs/heads/<target-branch>",
    "isDraft": false
  }'
```

Response includes `pullRequestId` — PR URL: `https://dev.azure.com/HarvMgmt/HMCgit/_git/CoreServices/pullrequest/<id>`

## Default reviewers (auto-assigned)

- Fitz, Michael — fitzm@hmc.harvard.edu
- Majewski, Derek — majewskid@hmc.harvard.edu
- Gilkeson, Michael — gilkesonm@hmc.harvard.edu

## Default PR target branch

`dev`
