import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import type { SQLParameters } from "../src/capabilities/sql.ts";
import {
  prepareBindingSnapshot,
  type SQLServerBindingDescriptor,
} from "../src/bindings/config.ts";
import {
  createSQLRegistry,
  type SQLAdapter,
  type SQLAdapterFactory,
} from "../src/bindings/sql_registry.ts";
import { RuntimeError } from "../src/runtime_error.ts";
import { createMockEnv } from "../src/testing.ts";

const descriptor: SQLServerBindingDescriptor = {
  provider: "sql-server",
  connectionStringSecret: "DocManagementDbConnection",
  connectionTimeoutMs: 10_000,
  requestTimeoutMs: 20_000,
  pool: { max: 5, min: 0, idleTimeoutMs: 30_000 },
};

Deno.test("SQL snapshot validates, resolves, copies, and hides secrets", () => {
  const input = {
    version: "sql-v1",
    api: {},
    queues: {},
    sql: { documents: descriptor },
  };
  const prepared = prepareBindingSnapshot(input, {
    get: (name) =>
      name === descriptor.connectionStringSecret
        ? "Server=test;Password=not-exposed"
        : undefined,
  });

  input.sql.documents.requestTimeoutMs = 99;
  assertEquals(prepared.snapshot.sql?.documents.requestTimeoutMs, 20_000);
  assertEquals(Object.isFrozen(prepared.snapshot), true);
  assertEquals(
    JSON.stringify(prepared.snapshot).includes("not-exposed"),
    false,
  );
});

Deno.test("SQL snapshot rejects invalid providers, settings, and secrets", () => {
  const make = (sql: Record<string, SQLServerBindingDescriptor>) => ({
    version: "sql-v1",
    api: {},
    queues: {},
    sql,
  });

  assertThrows(
    () =>
      prepareBindingSnapshot(
        make({
          bad: {
            ...descriptor,
            provider: "other",
          } as unknown as SQLServerBindingDescriptor,
        }),
        { get: () => "secret" },
      ),
    RuntimeError,
    "Unsupported SQL provider",
  );
  assertThrows(
    () =>
      prepareBindingSnapshot(
        make({ bad: { ...descriptor, requestTimeoutMs: 0 } }),
        { get: () => "secret" },
      ),
    RuntimeError,
    "positive requestTimeoutMs",
  );
  assertThrows(
    () =>
      prepareBindingSnapshot(make({ bad: descriptor }), {
        get: () => undefined,
      }),
    RuntimeError,
    "could not be resolved",
  );
});

Deno.test("SQL registry resolves bindings, binds parameters, and closes adapters", async () => {
  let receivedStatement = "";
  let receivedParameters: SQLParameters = {};
  let receivedSecret = "";
  let closeCount = 0;
  const factory: SQLAdapterFactory = (_name, _descriptor, secret) => {
    receivedSecret = secret;
    const adapter: SQLAdapter = {
      query: <T extends Record<string, unknown>>(
        statement: string,
        parameters: SQLParameters,
      ) => {
        receivedStatement = statement;
        receivedParameters = parameters;
        return Promise.resolve([{ Id: "a" }] as unknown as T[]);
      },
      close: () => {
        closeCount++;
        return Promise.resolve();
      },
    };
    return adapter;
  };
  const registry = createSQLRegistry(
    { documents: descriptor },
    new Map([[descriptor.connectionStringSecret, "connection-secret"]]),
    factory,
  );

  const rows = await registry.database("documents").query<{ Id: string }>(
    "SELECT Id FROM Research.Attachments WHERE Id = @id",
    { id: "a" },
  );
  assertEquals(rows, [{ Id: "a" }]);
  assertEquals(
    receivedStatement,
    "SELECT Id FROM Research.Attachments WHERE Id = @id",
  );
  assertEquals(receivedParameters, { id: "a" });
  assertEquals(receivedSecret, "connection-secret");
  assertEquals(Object.isFrozen(registry.database("documents")), true);

  await registry.close();
  assertEquals(closeCount, 1);
});

Deno.test("SQL registry rejects unknown bindings and unsafe parameter names", async () => {
  const registry = createSQLRegistry(
    { documents: descriptor },
    new Map([[descriptor.connectionStringSecret, "connection-secret"]]),
    () => ({
      query: () => Promise.resolve([]),
      close: () => Promise.resolve(),
    }),
  );

  assertThrows(
    () => registry.database("ungranted"),
    RuntimeError,
    "not granted",
  );
  await assertRejects(
    () => registry.database("documents").query("   "),
    RuntimeError,
    "statement is required",
  );
  await assertRejects(
    () =>
      registry.database("documents").query("SELECT @bad", { "bad-name": 1 }),
    RuntimeError,
    "Invalid SQL parameter name",
  );
});

Deno.test("mock env supports named SQL databases", async () => {
  const env = createMockEnv({
    SQL: {
      documents: (statement, parameters) => [{ statement, id: parameters.id }],
    },
  });
  const rows = await env.SQL.database("documents").query(
    "SELECT @id AS id",
    { id: 7 },
  );
  assertEquals(rows, [{ statement: "SELECT @id AS id", id: 7 }]);
});
