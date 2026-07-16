# Crimson SDK sandbox

An early Deno/TypeScript SDK for Crimson micro-apps. It exposes a typed
`CrimsonSDKEnv` whose bindings mediate access to AI, APIs, configuration,
Cosmos, Fabric, notes, notifications, tasks, universes, and web search.

## Commands

```powershell
deno task test
deno task check
deno task lint
deno fmt --check
```

## Defining an app

```ts
import { defineCrimsonApp } from "@crimsonsdk/sdk";

export default defineCrimsonApp(async (env) => {
  const identity = env.CONFIGURATION.getIdentity();
  const universes = await env.UNIVERSES.list();
  return { identity, universes };
});
```

Use `createMockEnv` from `@crimsonsdk/sdk/testing` in unit tests. See the
liquidity dashboard under `tests/sample/` for a full example.

## Runtime authentication

Runtime bindings obtain scoped bearer tokens through the `TokenProvider`
contract. `AccessToken.expiresAt` is always milliseconds since the Unix epoch.

For Azure client credentials:

```ts
import { AzureTokenProvider } from "@crimsonsdk/sdk/auth";

const tokens = AzureTokenProvider.fromEnv({
  "crimson.api": "api://crimson-api",
  "crimson.fabric": "api://crimson-fabric",
  "crimson.ai": "api://crimson-ai",
  "crimson.notifications": "api://crimson-notifications",
  "crimson.tasks": "api://crimson-tasks",
  "crimson.notes": "api://crimson-notes",
  "crimson.universes": "api://crimson-universes",
  "crimson.web": "api://crimson-web",
  "crimson.cosmos": "api://crimson-cosmos",
});
```

`fromEnv` reads `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and
`AZURE_CLIENT_SECRET`. `StaticTokenProvider` is available for local tests and
controlled development scenarios; do not commit real tokens.
