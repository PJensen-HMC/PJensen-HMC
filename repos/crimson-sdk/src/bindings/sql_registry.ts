import type mssql from "mssql";
import type {
  SQLDatabase,
  SQLParameters,
  SQLParameterValue,
  SQLRegistry,
} from "../capabilities/sql.ts";
import { RuntimeError } from "../runtime_error.ts";
import type { SQLServerBindingDescriptor } from "./config.ts";

export interface SQLAdapter {
  query<T extends Record<string, unknown>>(
    statement: string,
    parameters: SQLParameters,
  ): Promise<T[]>;
  close(): Promise<void>;
}

export type SQLAdapterFactory = (
  binding: string,
  descriptor: SQLServerBindingDescriptor,
  connectionString: string,
) => SQLAdapter;

const PARAMETER_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
let modulePromise: Promise<typeof mssql> | undefined;

function loadMssql(): Promise<typeof mssql> {
  modulePromise ??= import("mssql").then((module) => module.default);
  return modulePromise;
}

function safeDriverErrorDetails(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const candidate = error as { code?: unknown; number?: unknown };
  const details: string[] = [];
  if (
    typeof candidate.code === "string" &&
    /^[A-Z][A-Z0-9_]{1,31}$/.test(candidate.code)
  ) {
    details.push(`code ${candidate.code}`);
  }
  if (Number.isSafeInteger(candidate.number)) {
    details.push(`number ${candidate.number}`);
  }
  return details.length === 0 ? "" : ` (${details.join(", ")})`;
}

function assertStatement(statement: string): void {
  if (!statement.trim()) {
    throw new RuntimeError("SQL query statement is required");
  }
}

function assertParameters(parameters: SQLParameters): void {
  for (const [name, value] of Object.entries(parameters)) {
    if (!PARAMETER_NAME.test(name) || /^p\d+$/i.test(name)) {
      throw new RuntimeError(`Invalid SQL parameter name: "${name}"`);
    }
    if (
      value !== null &&
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "bigint" &&
      typeof value !== "boolean" &&
      !(value instanceof Date) &&
      !(value instanceof Uint8Array)
    ) {
      throw new RuntimeError(`Unsupported SQL parameter value: "${name}"`);
    }
  }
}

function createSQLServerAdapter(
  binding: string,
  descriptor: SQLServerBindingDescriptor,
  connectionString: string,
): SQLAdapter {
  let poolPromise: Promise<mssql.ConnectionPool> | undefined;

  const connect = (): Promise<mssql.ConnectionPool> => {
    if (!poolPromise) {
      poolPromise = (async () => {
        try {
          const sql = await loadMssql();
          const config = sql.ConnectionPool.parseConnectionString(
            connectionString,
          );
          if (descriptor.connectionTimeoutMs !== undefined) {
            config.connectionTimeout = descriptor.connectionTimeoutMs;
          }
          if (descriptor.requestTimeoutMs !== undefined) {
            config.requestTimeout = descriptor.requestTimeoutMs;
          }
          if (descriptor.pool !== undefined) {
            config.pool = {
              ...config.pool,
              ...(descriptor.pool.max === undefined
                ? {}
                : { max: descriptor.pool.max }),
              ...(descriptor.pool.min === undefined
                ? {}
                : { min: descriptor.pool.min }),
              ...(descriptor.pool.idleTimeoutMs === undefined
                ? {}
                : { idleTimeoutMillis: descriptor.pool.idleTimeoutMs }),
            };
          }
          return await new sql.ConnectionPool(config).connect();
        } catch (error) {
          poolPromise = undefined;
          throw new RuntimeError(
            `SQL connection failed for binding "${binding}"${
              safeDriverErrorDetails(error)
            }`,
          );
        }
      })();
    }
    return poolPromise;
  };

  return Object.freeze({
    async query<T extends Record<string, unknown>>(
      statement: string,
      parameters: SQLParameters,
    ): Promise<T[]> {
      try {
        const pool = await connect();
        const request = pool.request();
        for (const [name, value] of Object.entries(parameters)) {
          request.input(name, value as SQLParameterValue);
        }
        const result = await request.query<T>(statement);
        return Array.from(result.recordset ?? []);
      } catch (error) {
        if (error instanceof RuntimeError) throw error;
        throw new RuntimeError(
          `SQL query failed for binding "${binding}"${
            safeDriverErrorDetails(error)
          }`,
        );
      }
    },
    async close(): Promise<void> {
      const current = poolPromise;
      poolPromise = undefined;
      if (!current) return;
      let pool: mssql.ConnectionPool;
      try {
        pool = await current;
      } catch {
        // A failed connection creates no live pool and its original error was
        // already reported by query(). Shutdown must not mask that error.
        return;
      }
      try {
        await pool.close();
      } catch {
        throw new RuntimeError(`SQL close failed for binding "${binding}"`);
      }
    },
  });
}

export function createSQLRegistry(
  descriptors: Readonly<Record<string, SQLServerBindingDescriptor>>,
  resolvedSecrets: ReadonlyMap<string, string>,
  adapterFactory: SQLAdapterFactory = createSQLServerAdapter,
): SQLRegistry {
  const adapters = new Map<string, SQLAdapter>();
  const databases = new Map<string, SQLDatabase>();

  for (const [name, descriptor] of Object.entries(descriptors)) {
    const connectionString = resolvedSecrets.get(
      descriptor.connectionStringSecret,
    );
    if (!connectionString) {
      throw new RuntimeError(
        `Secret reference for SQL binding "${name}" could not be resolved`,
      );
    }
    const adapter = adapterFactory(name, descriptor, connectionString);
    adapters.set(name, adapter);
    databases.set(
      name,
      Object.freeze({
        async query<T extends Record<string, unknown>>(
          statement: string,
          parameters: SQLParameters = {},
        ): Promise<T[]> {
          assertStatement(statement);
          assertParameters(parameters);
          return await adapter.query<T>(statement, parameters);
        },
      }),
    );
  }

  return Object.freeze({
    database(name: string): SQLDatabase {
      const database = databases.get(name);
      if (!database) {
        throw new RuntimeError(`SQL binding not granted: "${name}"`);
      }
      return database;
    },
    async close(): Promise<void> {
      await Promise.all(
        [...adapters.values()].map((adapter) => adapter.close()),
      );
    },
  });
}
