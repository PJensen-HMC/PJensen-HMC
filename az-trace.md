# CODEX Skill: Trace Runtime Behavior to Source, Deployment, Configuration, and Telemetry

## Purpose

Use this skill when investigating a service behavior, startup issue, runtime regression, configuration mismatch, deployment discrepancy, or environment-specific difference.

The goal is not to guess the cause. The goal is to build an evidence chain that connects:

1. What code was deployed.
2. When it was deployed.
3. What configuration was available.
4. What the runtime logged.
5. What telemetry observed.
6. Whether the service actually served traffic afterward.
7. Which hypothesis is supported or disproven.

Default posture: read-only, evidence-first, no secret exposure.

---

## Rules

* Do not print secrets, connection strings, keys, tokens, passwords, certificates, or raw secret values.
* Prefer metadata over values when inspecting configuration.
* Use UTC timestamps unless the user explicitly asks otherwise.
* Record exact commands run.
* Record the time window searched.
* Record what each command proved, disproved, or failed to prove.
* Do not infer from absence of evidence unless log coverage is established.
* Do not mutate cloud resources unless the user explicitly authorizes it.
* Do not clean up files unless the path is verified and scoped to the working directory.
* When comparing environments, use the same query shape and time window logic for each environment.

---

## Required Inputs

Collect or infer the following before tracing:

```text
SERVICE_NAME=<service-name>
RESOURCE_GROUP=<resource-group>
ENVIRONMENT=<environment-name>
REPO_PATH=<local-repo-path>
START_TIME_UTC=<start-of-investigation-window>
END_TIME_UTC=<end-of-investigation-window>
KNOWN_GOOD_TIME_UTC=<optional-known-good-time>
KNOWN_BAD_TIME_UTC=<optional-known-bad-time>
SEARCH_SIGNATURE=<neutral-error-or-behavior-string>
```

Optional:

```text
APP_INSIGHTS_NAME=<application-insights-resource>
LOG_ANALYTICS_WORKSPACE_NAME=<workspace-name>
APP_CONFIG_PRIMARY=<primary-app-config-name>
APP_CONFIG_SECONDARY=<secondary-app-config-name>
CONFIG_KEY_PREFIX=<service-config-prefix>
DEPLOYMENT_ID=<deployment-id>
COMMIT_SHA=<commit-sha>
BUILD_ID=<build-id>
```

---

## Phase 1: Establish Deployment Timeline

Find recent deployments for the service.

```powershell
az webapp log deployment list `
  --name <SERVICE_NAME> `
  --resource-group <RESOURCE_GROUP> `
  --output json
```

Extract:

```text
deployment_id
build_id
commit_sha
deployment_time_utc
deployed_by
status
message
```

Use this to identify:

```text
last known good deployment
first suspected bad deployment
current deployment
deployment gap
rollback candidate
```

Evidence note:

```text
This proves which deployment records exist in the platform history. It does not, by itself, prove which code is currently running or whether the service started successfully.
```

---

## Phase 2: Fetch and Inspect Deployed Source

Fetch the deployed commit.

```powershell
git -C <REPO_PATH> fetch origin <COMMIT_SHA>
```

Inspect files that govern startup, dependency registration, configuration binding, feature flags, persistence, clients, middleware, hosted services, or runtime composition.

```powershell
git -C <REPO_PATH> show <COMMIT_SHA>:<path-to-startup-or-composition-file>
```

```powershell
git -C <REPO_PATH> show <COMMIT_SHA>:<path-to-relevant-service-file>
```

Search the deployed commit for the neutral behavior signature.

```powershell
git -C <REPO_PATH> grep -n "<SEARCH_SIGNATURE>" <COMMIT_SHA>
```

Search for related configuration keys or code paths.

```powershell
git -C <REPO_PATH> grep -n "<CONFIG_KEY_OR_COMPONENT_NAME>" <COMMIT_SHA>
```

Evidence note:

```text
This proves what the deployed source expected at that commit. It does not prove the runtime had matching configuration or that the deployed artifact matches the commit unless the deployment metadata is trusted.
```

---

## Phase 3: Download and Search Platform Logs

Download platform logs.

```powershell
az webapp log download `
  --name <SERVICE_NAME> `
  --resource-group <RESOURCE_GROUP> `
  --log-file <SERVICE_NAME>-logs.zip
```

Expand logs.

```powershell
Expand-Archive `
  -LiteralPath <SERVICE_NAME>-logs.zip `
  -DestinationPath <SERVICE_NAME>-logs `
  -Force
```

Search for deployment markers, known timestamps, runtime failures, startup messages, container failures, and the neutral signature.

```powershell
rg -n "<START_DATE>|<END_DATE>|<BUILD_ID>|<DEPLOYMENT_ID>|<SEARCH_SIGNATURE>|Unhandled exception|Container start failed|Application Error|startup|shutdown" <SERVICE_NAME>-logs
```

Evidence note:

```text
This proves what exists inside the downloaded platform log bundle. It does not prove complete runtime coverage unless logs are present across the full time window.
```

---

## Phase 4: Verify Log Coverage

Check whether logs cover the suspected window.

Look for:

```text
earliest runtime log timestamp
latest runtime log timestamp
deployment records
console/runtime records
gaps
rotated logs
missing windows
```

If runtime logs are absent for the target period, state that clearly.

```text
Downloaded platform logs contain deployment records for <window>, but runtime logs only cover <actual-window>. This bundle cannot prove runtime behavior outside that actual window.
```

---

## Phase 5: Locate Observability Resources

List resources in the target resource group.

```powershell
az resource list `
  --resource-group <RESOURCE_GROUP> `
  --output table
```

Find:

```text
Application Insights
Log Analytics workspace
App Configuration
Key Vault
Storage accounts
Container apps / app services
Managed identities
```

Get Log Analytics workspace ID.

```powershell
az monitor log-analytics workspace show `
  --resource-group <RESOURCE_GROUP> `
  --workspace-name <LOG_ANALYTICS_WORKSPACE_NAME> `
  --query customerId `
  -o tsv
```

Install CLI extensions only if needed.

```powershell
az extension add --name application-insights --yes
```

```powershell
az extension add --name log-analytics --yes
```

---

## Phase 6: Query Exceptions

Search Application Insights exceptions across the suspected window.

```powershell
az monitor app-insights query `
  --app <APP_INSIGHTS_NAME> `
  --resource-group <RESOURCE_GROUP> `
  --analytics-query "exceptions
    | where timestamp between (datetime(<START_TIME_UTC>) .. datetime(<END_TIME_UTC>))
    | where tostring(outerMessage) contains '<SEARCH_SIGNATURE>'
        or tostring(details) contains '<SEARCH_SIGNATURE>'
        or tostring(type) contains '<SEARCH_SIGNATURE>'
    | project timestamp, cloud_RoleName, problemId, type, outerMessage
    | order by timestamp asc" `
  --output table
```

Evidence note:

```text
This proves whether telemetry captured exceptions matching the signature during the selected window. Empty results do not prove absence unless telemetry ingestion and sampling are understood.
```

---

## Phase 7: Query Console and Runtime Logs

Search broad runtime logs around the deployment.

```powershell
az monitor log-analytics query `
  --workspace <WORKSPACE_CUSTOMER_ID> `
  --analytics-query "search *
    | where TimeGenerated between (datetime(<START_TIME_UTC>) .. datetime(<END_TIME_UTC>))
    | where * contains '<SERVICE_NAME>'
        or * contains '<SEARCH_SIGNATURE>'
        or * contains '<COMPONENT_NAME>'
    | summarize count() by Type
    | order by count_ desc" `
  --output table
```

Inspect console logs.

```powershell
az monitor log-analytics query `
  --workspace <WORKSPACE_CUSTOMER_ID> `
  --analytics-query "AppServiceConsoleLogs
    | where TimeGenerated between (datetime(<START_TIME_UTC>) .. datetime(<END_TIME_UTC>))
    | where _ResourceId has '<SERVICE_NAME>'
    | project TimeGenerated, ResultDescription
    | order by TimeGenerated asc
    | take 100" `
  --output table
```

Summarize suspected signatures.

```powershell
az monitor log-analytics query `
  --workspace <WORKSPACE_CUSTOMER_ID> `
  --analytics-query "AppServiceConsoleLogs
    | where TimeGenerated between (datetime(<START_TIME_UTC>) .. datetime(<END_TIME_UTC>))
    | where _ResourceId has '<SERVICE_NAME>'
    | summarize
        signatureHits=countif(ResultDescription contains '<SEARCH_SIGNATURE>'),
        unhandled=countif(ResultDescription contains 'Unhandled exception'),
        startupFailures=countif(ResultDescription contains 'startup' or ResultDescription contains 'Container start failed' or ResultDescription contains 'Application Error'),
        firstLog=min(TimeGenerated),
        lastLog=max(TimeGenerated),
        total=count()" `
  --output table
```

Evidence note:

```text
This gives the runtime shape of the failure window: frequency, first sighting, last sighting, and surrounding startup behavior.
```

---

## Phase 8: Prove Whether the Service Served Traffic

Query requests after deployment.

```powershell
az monitor log-analytics query `
  --workspace <WORKSPACE_CUSTOMER_ID> `
  --analytics-query "AppRequests
    | where TimeGenerated between (datetime(<START_TIME_UTC>) .. datetime(<END_TIME_UTC>))
    | where _ResourceId has '<SERVICE_NAME>'
        or AppRoleName has '<SERVICE_HINT>'
        or Url has '<SERVICE_HINT>'
    | summarize
        total=count(),
        success=countif(Success == true),
        failed=countif(Success == false),
        firstSeen=min(TimeGenerated),
        lastSeen=max(TimeGenerated)
      by AppRoleName, _ResourceId
    | order by total desc" `
  --output table
```

Evidence note:

```text
This distinguishes a service that failed completely from a service that failed only on a path, during startup retry, during cold start, or under selected requests.
```

---

## Phase 9: Confirm the Current Failure Signature

Narrow the query around the suspected bad event.

```powershell
az monitor log-analytics query `
  --workspace <WORKSPACE_CUSTOMER_ID> `
  --analytics-query "AppServiceConsoleLogs
    | where TimeGenerated between (datetime(<BAD_START_TIME_UTC>) .. datetime(<BAD_END_TIME_UTC>))
    | where _ResourceId has '<SERVICE_NAME>'
    | where ResultDescription contains '<SEARCH_SIGNATURE>'
        or ResultDescription contains 'Unhandled exception'
        or ResultDescription contains '<COMPONENT_NAME>'
    | project TimeGenerated, ResultDescription
    | order by TimeGenerated asc
    | take 100" `
  --output table
```

Evidence note:

```text
This captures the high-resolution event shape around the suspected failure.
```

---

## Phase 10: Inspect Configuration Metadata

List non-secret metadata for the service prefix and label.

```powershell
az appconfig kv list `
  --name <APP_CONFIG_PRIMARY> `
  --key "<CONFIG_KEY_PREFIX>:*" `
  --label <ENVIRONMENT_LABEL> `
  --fields key label last_modified content_type `
  --output table
```

List metadata across labels for the relevant config family.

```powershell
az appconfig kv list `
  --name <APP_CONFIG_PRIMARY> `
  --key "<CONFIG_KEY_PREFIX>:<CONFIG_FAMILY>:*" `
  --label * `
  --fields key label last_modified content_type `
  --output table
```

Repeat against secondary configuration stores if the environment uses them.

```powershell
az appconfig kv list `
  --name <APP_CONFIG_SECONDARY> `
  --key "<CONFIG_KEY_PREFIX>:<CONFIG_FAMILY>:*" `
  --label * `
  --fields key label last_modified content_type `
  --output table
```

Evidence note:

```text
This proves which keys exist, under which labels, and when metadata last changed. It avoids exposing values.
```

---

## Phase 11: Inspect Configuration Revisions

Show revisions for suspected old and new key shapes, casing variants, prefixes, labels, or renamed paths.

```powershell
az appconfig revision list `
  --name <APP_CONFIG_PRIMARY> `
  --key "<SUSPECTED_CONFIG_KEY>" `
  --fields key label last_modified `
  --output table
```

If value inspection is necessary, do not print secrets. Use targeted confirmation only, and redact output.

```powershell
az appconfig revision list `
  --name <APP_CONFIG_PRIMARY> `
  --key "<SUSPECTED_CONFIG_KEY>" `
  --fields key label last_modified content_type `
  --output table
```

Evidence note:

```text
This can prove whether a key existed before, changed casing, moved labels, was deleted, or was added after the deployment.
```

---

## Phase 12: Inspect Shared Configuration Loading Code

Search configuration libraries and bootstrap paths.

```powershell
rg -n "Select|Trim|Prefix|Label|Refresh|AppConfig|Configuration|KeyVault|Environment|ConnectionString" <REPO_PATH>
```

Open relevant files.

```powershell
Get-Content <REPO_PATH>\<path-to-configuration-extension>
```

```powershell
Get-Content <REPO_PATH>\<path-to-configuration-provider>
```

Determine:

```text
configuration source order
shared config prefix
service config prefix
environment label behavior
prefix trimming behavior
refresh behavior
fallback behavior
case sensitivity assumptions
secondary/tertiary source behavior
Key Vault reference behavior
local override behavior
```

Evidence note:

```text
This proves how configuration should be loaded and transformed before application code reads it.
```

---

## Phase 13: Search Local and Cloud Settings Sources

Search known repositories and configuration stores for service config.

```powershell
rg -n "<CONFIG_KEY_PREFIX>|<CONFIG_FAMILY>|<OLD_KEY_SHAPE>|<NEW_KEY_SHAPE>|cloud-appsettings|appsettings|<SERVICE_NAME>" `
  <ROOT_REPOS_PATH> `
  -g "*.json" `
  -g "*.yml" `
  -g "*.yaml" `
  -g "*.cs" `
  -g "*.ps1" `
  -g "*.bicep" `
  -g "*.tf"
```

Find config files by name.

```powershell
rg --files <ROOT_REPOS_PATH> | rg "cloud-appsettings|cloud\.appsettings|appsettings|<SERVICE_NAME>|<CONFIG_KEY_PREFIX>"
```

Evidence note:

```text
This helps determine whether the visible checkout is the current source of truth or an older/local copy.
```

---

## Phase 14: Compare Code, Config, and Runtime

Build a small matrix.

```text
Question                                         Result
------------------------------------------------ -----------------------------
Which commit was deployed?                       <commit>
What did that commit require?                    <required inputs/config/code path>
Did the required config exist at deploy time?     <yes/no/unknown>
Did runtime logs cover the target window?         <yes/no/partial>
Was the signature present before deployment?      <yes/no/unknown>
Was the signature present after deployment?       <yes/no/unknown>
Did the service serve traffic afterward?          <yes/no/partial>
Was telemetry ingestion active?                   <yes/no/unknown>
Was config changed after deployment?              <yes/no/unknown>
Does local behavior match cloud behavior?         <yes/no/unknown>
```

---

## Phase 15: Classify the Finding

Use one of these classifications:

```text
Code regression
Configuration drift
Deployment/artifact mismatch
Environment mismatch
Dependency/version mismatch
Infrastructure/runtime change
Secret/reference resolution failure
Telemetry gap
Log retention gap
Data-shape change
Partial path failure
Cold-start/startup-only failure
Unknown; more evidence required
```

Do not overstate certainty.

Preferred language:

```text
The evidence supports X.
The evidence rules out Y.
The evidence does not yet prove Z.
The available logs do not cover the required window.
The deployed code required A by <timestamp>.
The configuration metadata shows B existed/did not exist under label C as of <timestamp>.
The service did/did not serve traffic after <timestamp>.
```

Avoid:

```text
Clearly caused by...
Definitely...
Must have...
Probably...
Seems like...
```

---

## Phase 16: Produce Final Trace Report

Use this structure.

```md
# Runtime Trace Report

## Scope

Service: `<SERVICE_NAME>`
Environment: `<ENVIRONMENT>`
Window: `<START_TIME_UTC>` to `<END_TIME_UTC>`
Signature: `<SEARCH_SIGNATURE>`

## Executive Finding

One paragraph. State only what is supported by evidence.

## Timeline

| UTC Time | Event | Evidence |
|---|---|---|
| `<time>` | `<deployment/config/log/request event>` | `<command/query/source>` |

## Deployed Code

- Deployment ID:
- Build ID:
- Commit:
- Files inspected:
- Required runtime inputs:
- Relevant code paths:

## Runtime Evidence

- First matching log:
- Last matching log:
- Count of matching logs:
- Startup behavior:
- Request behavior:
- Traffic served after deployment:

## Configuration Evidence

- Config stores checked:
- Labels checked:
- Key families checked:
- Relevant metadata:
- Revisions checked:
- Gaps:

## Source-of-Truth Evidence

- Repositories searched:
- Files found:
- Files missing:
- Source-of-truth status:

## Ruled Out

- `<hypothesis>` because `<evidence>`.

## Still Open

- `<question>` because `<missing evidence>`.

## Conclusion

State the narrowest defensible conclusion.
```

---

## Cleanup

Only delete files that were created by this trace and verified to be inside the working directory.

```powershell
$zip = Resolve-Path -LiteralPath <SERVICE_NAME>-logs.zip
$dir = Resolve-Path -LiteralPath <SERVICE_NAME>-logs

if ($zip.Path -like '<EXPECTED_WORKING_DIRECTORY>\*' -and $dir.Path -like '<EXPECTED_WORKING_DIRECTORY>\*') {
  Remove-Item -LiteralPath $zip.Path -Force
  Remove-Item -LiteralPath $dir.Path -Recurse -Force
}
```

---

## Codex Behavior Contract

When using this skill, Codex must:

1. Treat every command as evidence collection, not proof by narration.
2. Preserve exact commands.
3. Preserve timestamps.
4. Avoid exposing secrets.
5. Separate what was searched from what was found.
6. Separate runtime evidence from deployment evidence.
7. Separate configuration metadata from configuration values.
8. Mark log gaps explicitly.
9. Avoid claiming causality until code, config, runtime, and telemetry line up.
10. End with the narrowest defensible conclusion.
