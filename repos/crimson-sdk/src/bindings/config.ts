import { RuntimeError } from "../runtime_error.ts";

export type APIAuthDescriptor =
  | { kind: "none" }
  | { kind: "bearer"; scope: string };

export interface APIBindingDescriptor {
  baseUrl: string;
  auth: APIAuthDescriptor;
  defaultHeaders?: Record<string, string>;
}

export type QueueCapability = "send" | "inspect";

export interface AzureServiceBusQueueDescriptor {
  provider: "azure-service-bus";
  entity: string;
  connectionStringSecret: string;
  sasTokenTtlSeconds?: number;
  capabilities?: readonly QueueCapability[];
}

export type QueueBindingDescriptor = AzureServiceBusQueueDescriptor;

export interface SQLPoolDescriptor {
  max?: number;
  min?: number;
  idleTimeoutMs?: number;
}

export interface SQLServerBindingDescriptor {
  provider: "sql-server";
  connectionStringSecret: string;
  connectionTimeoutMs?: number;
  requestTimeoutMs?: number;
  pool?: SQLPoolDescriptor;
}

export interface BindingSnapshot {
  version: string;
  api: Record<string, APIBindingDescriptor>;
  queues: Record<string, QueueBindingDescriptor>;
  sql?: Record<string, SQLServerBindingDescriptor>;
}

export interface SecretProvider {
  get(name: string): string | undefined;
}

export interface PreparedBindingSnapshot {
  snapshot: Readonly<BindingSnapshot>;
  resolvedSecrets: ReadonlyMap<string, string>;
}

const BINDING_NAME = /^[A-Za-z][A-Za-z0-9._-]*$/;

function assertBindingName(name: string): void {
  if (!BINDING_NAME.test(name)) {
    throw new RuntimeError(`Invalid binding name: "${name}"`);
  }
}

function validateBaseUrl(name: string, value: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch (cause) {
    throw new RuntimeError(`Invalid base URL for API binding "${name}"`, cause);
  }
  if (
    !["http:", "https:"].includes(url.protocol) || url.username ||
    url.password || url.search || url.hash
  ) {
    throw new RuntimeError(
      `API binding "${name}" requires an HTTP(S) base URL without credentials, query, or fragment`,
    );
  }
}

function validateEntity(name: string, entity: string): void {
  const normalized = entity.replace(/^\/+|\/+$/g, "");
  const segments = normalized.split("/");
  if (
    !normalized ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new RuntimeError(`Invalid entity for queue binding "${name}"`);
  }
}

function validateSQLDescriptor(
  name: string,
  descriptor: SQLServerBindingDescriptor,
): void {
  if (descriptor.provider !== "sql-server") {
    throw new RuntimeError(`Unsupported SQL provider for binding "${name}"`);
  }
  if (!descriptor.connectionStringSecret?.trim()) {
    throw new RuntimeError(
      `SQL binding "${name}" requires a connection string secret reference`,
    );
  }
  for (
    const [property, value] of [
      ["connectionTimeoutMs", descriptor.connectionTimeoutMs],
      ["requestTimeoutMs", descriptor.requestTimeoutMs],
      ["pool.max", descriptor.pool?.max],
      ["pool.idleTimeoutMs", descriptor.pool?.idleTimeoutMs],
    ] as const
  ) {
    if (value !== undefined && (!Number.isInteger(value) || value < 1)) {
      throw new RuntimeError(
        `SQL binding "${name}" requires a positive ${property}`,
      );
    }
  }
  if (
    descriptor.pool?.min !== undefined &&
    (!Number.isInteger(descriptor.pool.min) || descriptor.pool.min < 0)
  ) {
    throw new RuntimeError(
      `SQL binding "${name}" requires a non-negative pool.min`,
    );
  }
  if (
    descriptor.pool?.max !== undefined &&
    descriptor.pool?.min !== undefined &&
    descriptor.pool.min > descriptor.pool.max
  ) {
    throw new RuntimeError(
      `SQL binding "${name}" requires pool.min not to exceed pool.max`,
    );
  }
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
  }
  return value;
}

export function prepareBindingSnapshot(
  input: BindingSnapshot,
  secrets: SecretProvider,
): PreparedBindingSnapshot {
  const snapshot = structuredClone(input);
  if (!snapshot.version?.trim()) {
    throw new RuntimeError("Binding snapshot version is required");
  }
  if (!snapshot.api || !snapshot.queues) {
    throw new RuntimeError("Binding snapshot requires api and queues maps");
  }
  snapshot.sql ??= {};

  const names = new Set<string>();
  for (const [name, descriptor] of Object.entries(snapshot.api)) {
    assertBindingName(name);
    names.add(name);
    if (
      !descriptor || typeof descriptor.baseUrl !== "string" || !descriptor.auth
    ) {
      throw new RuntimeError(`Invalid descriptor for API binding "${name}"`);
    }
    validateBaseUrl(name, descriptor.baseUrl);
    if (descriptor.auth.kind === "bearer") {
      if (!descriptor.auth.scope?.trim()) {
        throw new RuntimeError(
          `API binding "${name}" requires a bearer token scope`,
        );
      }
    } else if (descriptor.auth.kind !== "none") {
      throw new RuntimeError(
        `Unsupported auth adapter for API binding "${name}"`,
      );
    }
    if (
      descriptor.defaultHeaders &&
      Object.keys(descriptor.defaultHeaders).some((header) =>
        header.toLowerCase() === "authorization"
      )
    ) {
      throw new RuntimeError(
        `API binding "${name}" cannot configure an Authorization header`,
      );
    }
  }

  const resolvedSecrets = new Map<string, string>();
  for (const [name, descriptor] of Object.entries(snapshot.queues)) {
    assertBindingName(name);
    if (names.has(name)) {
      throw new RuntimeError(`Duplicate binding name: "${name}"`);
    }
    names.add(name);
    if (!descriptor || typeof descriptor !== "object") {
      throw new RuntimeError(`Invalid descriptor for queue binding "${name}"`);
    }
    if (descriptor.provider !== "azure-service-bus") {
      throw new RuntimeError(
        `Unsupported queue provider for binding "${name}"`,
      );
    }
    validateEntity(name, descriptor.entity);
    const capabilities = descriptor.capabilities ?? ["send"];
    if (
      capabilities.length === 0 ||
      new Set(capabilities).size !== capabilities.length ||
      capabilities.some((capability) =>
        capability !== "send" && capability !== "inspect"
      )
    ) {
      throw new RuntimeError(
        `Invalid capabilities for queue binding "${name}"`,
      );
    }
    if (!descriptor.connectionStringSecret?.trim()) {
      throw new RuntimeError(
        `Queue binding "${name}" requires a connection string secret reference`,
      );
    }
    if (
      descriptor.sasTokenTtlSeconds !== undefined &&
      (!Number.isInteger(descriptor.sasTokenTtlSeconds) ||
        descriptor.sasTokenTtlSeconds < 1)
    ) {
      throw new RuntimeError(
        `Queue binding "${name}" requires a positive SAS token TTL`,
      );
    }
    const secret = secrets.get(descriptor.connectionStringSecret);
    if (!secret) {
      throw new RuntimeError(
        `Secret reference for queue binding "${name}" could not be resolved`,
      );
    }
    resolvedSecrets.set(descriptor.connectionStringSecret, secret);
  }

  for (const [name, descriptor] of Object.entries(snapshot.sql)) {
    assertBindingName(name);
    if (names.has(name)) {
      throw new RuntimeError(`Duplicate binding name: "${name}"`);
    }
    names.add(name);
    if (!descriptor || typeof descriptor !== "object") {
      throw new RuntimeError(`Invalid descriptor for SQL binding "${name}"`);
    }
    validateSQLDescriptor(name, descriptor);
    const secret = secrets.get(descriptor.connectionStringSecret);
    if (!secret) {
      throw new RuntimeError(
        `Secret reference for SQL binding "${name}" could not be resolved`,
      );
    }
    resolvedSecrets.set(descriptor.connectionStringSecret, secret);
  }

  return {
    snapshot: deepFreeze(snapshot),
    resolvedSecrets,
  };
}
