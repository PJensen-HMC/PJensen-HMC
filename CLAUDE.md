# CLAUDE.md

Guidance for Claude Code (claude.ai/code) in this repo.

## Repos

Three sibling repos under `/home/devadmin/`:

| Dir | Purpose |
|---|---|
| `Shared/` | C# NuGet library monorepo (HMC.Shared.*). Published to internal Azure DevOps feed at version `3.0.0.x`. |
| `CoreServices/` | ASP.NET Core microservices (Core, Chat, ChatAI, Calendar, Tasks, Workflow, Notifications). |
| `Crimson.Legacy/` | Legacy TFS code migrating into CoreServices/Crimson. Touch minimally. |

## Tooling

`ripgrep` (`rg`) at `/usr/bin/rg`. Prefer for all codebase searches via `Bash`.

## Build & Test

All repos pin to .NET 10 (`global.json`). Same commands across repos — substitute `.sln` path.

```bash
dotnet restore Shared/HMC.Shared.sln
dotnet build   Shared/HMC.Shared.sln
dotnet test    Shared/Tests/HMC.Shared.Types.Tests/HMC.Shared.Types.Tests.csproj --no-build
```

Run single test project by path. Most `Shared/` tests need no credentials; exceptions:

- `HMC.Shared.Configuration.Tests` / `Messaging.Tests` / `UserService.Tests` / `GraphClient.Tests` — require Azure env vars (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`, `AzureAppConfiguration`).
- `Messaging.Tests` hits live Azure Service Bus, takes ~90 s.

Clean `Shared` build = **161 warnings, 0 errors** — no new errors. Check errors only: `dotnet build ... 2>&1 | grep ": error "`.

## Key Conventions (Shared)

**Target frameworks:**
- All new projects → `net10.0`
- `HMC.Shared.Types` and `HMC.Shared.Utilities.Http` must stay `netstandard2.1` (Excel/.NET Framework compat). No `ImplicitUsings` on these.

**Required `.csproj` properties for `net10.0` projects:**
```xml
<Nullable>enable</Nullable>
<ImplicitUsings>enable</ImplicitUsings>
<AllowMissingPrunePackageData>true</AllowMissingPrunePackageData>
```

**Serialization:** Always Newtonsoft.Json, never `System.Text.Json`.

**DI registration:** Follow extension method pattern in `Shared/HMC.Shared.Web/ServiceExtensions.cs` (`UseHMCServices`) and `MvcExtensions.cs` (`AddHMCMvc`).

**Expose internals to tests** via `<AssemblyAttribute>` in library `.csproj` (see `HMC.Shared.UserService.csproj`), not `[assembly: InternalsVisibleTo]` in source.

**New library:** Add to `HMC.Shared.sln`, include standard `.csproj` properties, add `Tests/HMC.Shared.*.Tests/` project.

## Architecture Notes

- `HMC.Shared.Configuration` wraps Azure App Configuration (`AzureConfigurator`) — all services load config there.
- `HMC.Shared.Messaging` = Service Bus abstraction (`ICommand`/`IQuery`/`IEvent`, `IBusPublisher`/`IBusSubscriber`).
- `HMC.Shared.Database` provides `HMCDbContextBase` (EF Core + SQL Server). `HMC.Shared.Database.Cosmos` for Cosmos.
- `HMC.Shared.Web` wires Swagger, JWT/OIDC, CORS, SignalR, NewtonsoftJson in one call.
- Client libs (`*Client`) = thin typed HTTP wrappers over HMC internal APIs; service libs (`Services.*`) = in-process implementations.
- `HMC.Shared.Statistics` depends on private `HMC.Calculator` from `HMCgitNuget` — restore fails if unauthenticated.