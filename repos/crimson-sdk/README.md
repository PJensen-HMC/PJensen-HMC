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

## Sending Azure Service Bus messages

The runtime may provide a Service Bus connection string without exposing it to
app code:

```ts
const env = createEnv({
  // Existing runtime configuration...
  serviceBus: {
    connectionString: Deno.env.get("AZURE_SERVICE_BUS_CONNECTION_STRING")!,
  },
});

await env.SERVICE_BUS.send("queue-or-topic", {
  eventType: "note-attachment-missing",
  attachmentId: "41889919-2FF6-4C2C-8450-D4860ECACC7A",
});
```

Messages are serialized as JSON. Keep the connection string in runtime secret
configuration; do not expose it through `env.CONFIGURATION` or commit it.

## Reindexing Research Management entries

```ts
await env.NOTES.reindex(
  [{
    entryType: "Attachment", // "Attachment" | "Document" | "Note"
    id: "0b67ca3b-1f6a-4e60-a51f-7765e2e08fdc",
  }],
  {
    fireAndForget: true,
    force: true,
    quality: "med", // "low" | "med" | "high"
    hardDelete: false,
  },
);
```

All PATCH query options are explicit. Entry IDs are validated as SQL-style
`uniqueidentifier` values before the request is sent.

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

`fromEnv` reads `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET`.
`StaticTokenProvider` is available for local tests and controlled development
scenarios; do not commit real tokens.

Runtime service routes are configured separately from service base URLs. This
keeps deployment-specific paths out of capability bindings and leaves room for
additional named endpoints:

```ts
const serviceRoutes = {
  notifications: {
    events: "/hmc-notifications/api/v1/Events",
  },
};
```

The notifications events route is public. Pass `userId` in the `send` options to
place it on the query string, or include it in the event metadata property bag.
An authenticated caller does not need to provide it explicitly.

## Live note attachment integration test

The opt-in integration test reads the recovery TSV, downloads every unique
attachment, and writes a resumable manifest beside the input file. Supply a
fresh token through the process environment; never commit it.

```powershell
$env:RUN_CRIMSON_NOTES_ATTACHMENT_INTEGRATION = "1"
$env:CRIMSON_NOTES_TOKEN = "<fresh bearer token>"
deno task test:notes-attachments
```

By default it reads
`C:\Users\jensenp\AppData\Local\Temp\missing_2026_note_attachment_ids.txt` and
writes to the sibling `missing_2026_note_attachment_ids_downloads` directory.
Override those paths with `CRIMSON_NOTES_ATTACHMENT_ID_FILE` and
`CRIMSON_NOTES_ATTACHMENT_OUTPUT`. Existing completed IDs are skipped.
