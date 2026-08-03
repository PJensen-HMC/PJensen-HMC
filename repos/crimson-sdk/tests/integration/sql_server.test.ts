import { assertEquals } from "@std/assert";
import { createEnv, StaticTokenProvider } from "../../src/mod.ts";

const RUN_INTEGRATION = Deno.env.get("RUN_CRIMSON_SQL_INTEGRATION") === "1";

Deno.test({
  name: "SQL queries DocMgmt through a named binding",
  ignore: !RUN_INTEGRATION,
  // Tedious uses Node-compatible TLS resources that Deno's sanitizer cannot
  // observe closing even after ConnectionPool.close() resolves.
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const connectionString = Deno.env.get("CRIMSON_SQL_CONNECTION_STRING");
    if (!connectionString) {
      throw new Error(
        "CRIMSON_SQL_CONNECTION_STRING must contain the DocMgmt connection string",
      );
    }

    const unusedUrl = "https://unused.invalid";
    const env = createEnv({
      appIdentity: {
        appId: "sql-integration-test",
        appName: "SQL integration test",
        tenantId: "hmc",
        grantedScopes: [],
      },
      tokens: new StaticTokenProvider({}),
      bindingSnapshot: {
        version: "sql-integration-test",
        api: {},
        queues: {},
        sql: {
          "doc-management": {
            provider: "sql-server",
            connectionStringSecret: "DocManagementDbConnection",
            connectionTimeoutMs: 15_000,
            requestTimeoutMs: 30_000,
            pool: { max: 1, min: 0, idleTimeoutMs: 5_000 },
          },
        },
      },
      secrets: {
        get: (name) =>
          name === "DocManagementDbConnection" ? connectionString : undefined,
      },
      serviceUrls: {
        fabric: unusedUrl,
        ai: unusedUrl,
        notifications: unusedUrl,
        tasks: unusedUrl,
        universes: unusedUrl,
        web: unusedUrl,
        cosmos: unusedUrl,
      },
      serviceRoutes: { notifications: { events: "/unused" } },
    });

    try {
      const rows = await env.SQL.database("doc-management").query(
        "SELECT TOP 1 Id, Name, FileType, CachedFileSize " +
          "FROM [Research].[ResearchAttachments]",
      );
      assertEquals(rows.length, 1);
      console.log(`DocMgmt query returned ${rows.length} row`);
      console.log(`Columns: ${Object.keys(rows[0]).join(", ")}`);
    } finally {
      await env.SQL.close();
    }
  },
});
