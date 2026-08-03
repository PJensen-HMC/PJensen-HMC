# Crimson SDK sandbox

An early Deno/TypeScript SDK for Crimson micro-apps. Infrastructure is granted
through versioned, immutable binding snapshots and exposed through a typed
`CrimsonSDKEnv`.

## Commands

```powershell
deno task test
deno task check
deno task lint
deno fmt --check
```

## Config-driven bindings

The runtime validates and copies the complete snapshot before constructing the
environment. Descriptors contain target metadata and secret references; apps do
not receive descriptors, endpoints, tokens, or connection strings.

```ts
const bindingSnapshot = {
  version: "2026-07-30.1",
  api: {
    "hmc-researchmanagement": {
      baseUrl: "https://crimson.hmc.harvard.edu/hmc-researchmanagement",
      auth: { kind: "bearer", scope: "api://research-management" },
    },
  },
  queues: {
    "research-indexing": {
      provider: "azure-service-bus",
      entity: "research-indexing",
      connectionStringSecret: "AzureServiceBus",
      capabilities: ["send", "inspect"],
    },
  },
  sql: {
    "research-management": {
      provider: "sql-server",
      connectionStringSecret: "ResearchManagementSql",
      connectionTimeoutMs: 15_000,
      requestTimeoutMs: 30_000,
      pool: { max: 5, min: 0, idleTimeoutMs: 30_000 },
    },
  },
};
```

`SecretProvider.get(name)` resolves references during environment construction.
Configuration changes create a new snapshot/version; a running environment is
not mutated.

## Named API services

```ts
const research = env.API.service("hmc-researchmanagement");
const response = await research.patch("/api/v1/Indexing", payload, {
  query: {
    fireAndForget: true,
    force: true,
    quality: "med",
    hardDelete: false,
  },
});

if (!response.ok) throw new Error(`HTTP ${response.status}`);
```

Only granted names resolve. Paths must be relative to the configured base URL.
Convenience verbs JSON-serialize request bodies and return standard `Response`
objects. `fetch()` is the escape hatch for binary, streaming, or non-JSON
bodies.

## Queues

```ts
await env.QUEUES.send("research-indexing", {
  entryType: "Attachment",
  id: "0b67ca3b-1f6a-4e60-a51f-7765e2e08fdc",
});
```

Queue bindings are provider-neutral. The Azure Service Bus adapter owns
connection-string parsing, SAS generation, entity scoping, and REST transport.
Messages are JSON serialized. Runtime counts are available only when the binding
explicitly grants `inspect`:

```ts
const stats = await env.QUEUES.stats("research-indexing");
console.log(stats.activeMessageCount);
console.log(stats.deadLetterMessageCount);
console.log(stats.totalMessageCount);
```

Azure queue inspection uses the Service Bus Atom management endpoint and
requires a credential with `Manage` rights. Counts are operational snapshots;
avoid tight polling loops. A binding with no `capabilities` field defaults to
`["send"]`.

## SQL Server

SQL Server databases are granted by name and resolved from secret-backed
connection strings. Applications never receive the connection string or target
descriptor.

```ts
interface NoteRow extends Record<string, unknown> {
  Id: string;
  Subject: string;
}

const database = env.SQL.database("research-management");
const rows = await database.query<NoteRow>(
  "SELECT Id, Subject FROM dbo.Notes WHERE Id = @id",
  { id: "41889919-2FF6-4C2C-8450-D4860ECACC7A" },
);
```

Parameters are bound through the SQL Server driver; do not interpolate values
into SQL text. The initial SDK surface intentionally exposes queries only.
Read-only access must also be enforced by the database credential because SQL
text cannot be safely classified by a client-side prefix check. Runtime hosts
can call `await env.SQL.close()` during shutdown to close all lazy connection
pools.

The live connectivity check is opt-in and performs exactly one read-only query:

```powershell
$env:RUN_CRIMSON_SQL_INTEGRATION = "1"
$env:CRIMSON_SQL_CONNECTION_STRING = "<SQL Server connection string>"
deno task test:sql
```

It reads `Id`, `Name`, `FileType`, and `CachedFileSize` from one
`[Research].[ResearchAttachments]` row, prints only the returned column names,
and always closes its connection pool. The credential is process-only and is
never written to configuration, logs, or source.

## Typed HMC clients

HMC routes are optional clients composed over an `APIService`:

```ts
import { createResearchManagementClient } from "@crimsonsdk/sdk/clients";

const research = createResearchManagementClient(
  env.API.service("hmc-researchmanagement"),
);

const attachment = await research.downloadAttachment(attachmentId);
await research.reindex(entries, {
  fireAndForget: true,
  force: true,
  quality: "med",
  hardDelete: false,
});
```

The same package exports `createNotesClient` for note deposits. The kernel has
no Research Management or Notes routes and exposes neither `env.NOTES` nor
`env.SERVICE_BUS`.

## Testing

Use named mocks from `@crimsonsdk/sdk/testing`:

```ts
const env = createMockEnv({
  API: {
    risk: { get: () => Promise.resolve(Response.json({ limit: 10 })) },
  },
  QUEUES: {
    indexing: (message) => messages.push(message),
  },
});
```

## Runtime authentication

`TokenProvider` accepts configuration-driven scope strings.
`AccessToken.expiresAt` is milliseconds since the Unix epoch.
`AzureTokenProvider.fromEnv()` reads `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and
`AZURE_CLIENT_SECRET`; never commit real tokens or service connection strings.

## Live recovery tests

The recovery tests are opt-in and ignored by default. The attachment test reads
the ID file, downloads every unique attachment, and writes a resumable manifest.
The bulk reindex test reads that manifest and expects 1,002 entries. It issues
no PATCH unless `RUN_CRIMSON_NOTES_REINDEX_INTEGRATION=1` is explicitly set.

```powershell
$env:RUN_CRIMSON_NOTES_ATTACHMENT_INTEGRATION = "1"
$env:CRIMSON_NOTES_TOKEN = "<fresh bearer token>"
deno task test:notes-attachments
```

The default input is
`C:\Users\jensenp\AppData\Local\Temp\missing_2026_note_attachment_ids.txt`; the
default output is its sibling `missing_2026_note_attachment_ids_downloads`
directory. Override these with `CRIMSON_NOTES_ATTACHMENT_ID_FILE` and
`CRIMSON_NOTES_ATTACHMENT_OUTPUT`.

### Queue depth watcher

The queue stats integration test watches `index-document-command` at a bounded,
non-aggressive interval. It defaults to 11 samples over a ten-minute window;
intervals below 30 seconds are rejected. The connection string must reference a
SAS policy with `Manage` rights.

```powershell
$env:RUN_CRIMSON_QUEUE_STATS_INTEGRATION = "1"
$env:CRIMSON_SERVICE_BUS_CONNECTION_STRING = "<Service Bus connection string>"
$env:CRIMSON_QUEUE_STATS_SAMPLES = "11"
$env:CRIMSON_QUEUE_STATS_INTERVAL_MS = "60000"
deno task test:queue-stats
```

The connection string is read only from the process environment and is never
written to the binding snapshot, logs, or repository.
