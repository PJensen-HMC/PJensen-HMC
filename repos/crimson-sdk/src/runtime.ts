import type {
  AIBinding,
  ConfigurationBinding,
  CosmosBinding,
  CrimsonSDKEnv,
  NotificationsBinding,
  TasksBinding,
  UniversesBinding,
  WebBinding,
} from "./env.ts";
import type {
  Fabric,
  FabricQueryOptions,
  FabricQueryResult,
} from "./capabilities/fabric.ts";
import { createAPIRegistry } from "./bindings/api_registry.ts";
import {
  type BindingSnapshot,
  prepareBindingSnapshot,
  type SecretProvider,
} from "./bindings/config.ts";
import { createQueueRegistry } from "./bindings/queue_registry.ts";
import { RuntimeError } from "./runtime_error.ts";

export { RuntimeError } from "./runtime_error.ts";
export type {
  APIAuthDescriptor,
  APIBindingDescriptor,
  AzureServiceBusQueueDescriptor,
  BindingSnapshot,
  QueueBindingDescriptor,
  QueueCapability,
  SecretProvider,
} from "./bindings/config.ts";

export type TokenScope = string;

export interface AccessToken {
  value: string;
  /** Expiration time as milliseconds since the Unix epoch. */
  expiresAt: number;
}

export interface AppIdentity {
  appId: string;
  appName: string;
  tenantId: string;
  grantedScopes: string[];
}

export interface ServiceUrls {
  fabric: string;
  ai: string;
  notifications: string;
  tasks: string;
  universes: string;
  web: string;
  cosmos: string;
}

export interface ServiceRoutes {
  notifications: {
    events: string;
  };
}

export interface TokenProvider {
  getToken(
    scope: string,
    opts?: { forceRefresh?: boolean },
  ): Promise<AccessToken>;
}

export interface RuntimeContext {
  appIdentity: AppIdentity;
  tokens: TokenProvider;
  serviceUrls: ServiceUrls;
  serviceRoutes: ServiceRoutes;
  bindingSnapshot: BindingSnapshot;
  secrets: SecretProvider;
}

const SERVICE_URL_KEYS: (keyof ServiceUrls)[] = [
  "fabric",
  "ai",
  "notifications",
  "tasks",
  "universes",
  "web",
  "cosmos",
];

async function fetchWithAuth(
  url: string,
  scope: string,
  ctx: RuntimeContext,
  init: RequestInit = {},
): Promise<Response> {
  const token = await ctx.tokens.getToken(scope);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token.value}`);
  headers.set("X-Crimson-App-Id", ctx.appIdentity.appId);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    const refreshed = await ctx.tokens.getToken(scope, { forceRefresh: true });
    headers.set("Authorization", `Bearer ${refreshed.value}`);
    res = await fetch(url, { ...init, headers });
    if (res.status === 401) {
      throw new RuntimeError("Unauthorized: token refresh did not resolve 401");
    }
  }
  return res;
}

function resolveServiceRoute(baseUrl: string, route: string): URL {
  return new URL(route, `${baseUrl.replace(/\/$/, "")}/`);
}

export function createEnv(ctx: RuntimeContext): CrimsonSDKEnv {
  for (const key of SERVICE_URL_KEYS) {
    if (!ctx.serviceUrls[key]) {
      throw new RuntimeError(`Missing required service URL: ${key}`);
    }
  }
  if (!ctx.serviceRoutes?.notifications?.events) {
    throw new RuntimeError(
      "Missing required service route: notifications.events",
    );
  }

  const prepared = prepareBindingSnapshot(ctx.bindingSnapshot, ctx.secrets);
  const API = createAPIRegistry(
    prepared.snapshot.api,
    ctx.tokens,
    ctx.appIdentity.appId,
  );
  const QUEUES = createQueueRegistry(
    prepared.snapshot.queues,
    prepared.resolvedSecrets,
  );

  const AI: AIBinding = {
    async run(model, options) {
      const res = await fetchWithAuth(
        `${ctx.serviceUrls.ai}/run`,
        "crimson.ai",
        ctx,
        { method: "POST", body: JSON.stringify({ model, ...options }) },
      );
      return await res.json() as ReturnType<AIBinding["run"]> extends
        Promise<infer R> ? R : never;
    },
  };

  const CONFIGURATION: ConfigurationBinding = {
    get(_key) {
      return undefined;
    },
    getIdentity() {
      return {
        userId: ctx.appIdentity.appId,
        displayName: ctx.appIdentity.appName,
        email: `${ctx.appIdentity.appId}@crimson.app`,
      };
    },
    getPolicy() {
      return { maxAITokensPerRequest: 4096, allowedFabricDatasets: ["*"] };
    },
  };

  const COSMOS: CosmosBinding = {
    async get<T = unknown>(key: string): Promise<T | undefined> {
      const res = await fetchWithAuth(
        `${ctx.serviceUrls.cosmos}/v1/kv/${encodeURIComponent(key)}`,
        "crimson.cosmos",
        ctx,
        { method: "GET" },
      );
      if (res.status === 404) return undefined;
      return await res.json() as T;
    },
    async set(key, value, _options?) {
      await fetchWithAuth(
        `${ctx.serviceUrls.cosmos}/v1/kv/${encodeURIComponent(key)}`,
        "crimson.cosmos",
        ctx,
        { method: "PUT", body: JSON.stringify(value) },
      );
    },
    async delete(key) {
      await fetchWithAuth(
        `${ctx.serviceUrls.cosmos}/v1/kv/${encodeURIComponent(key)}`,
        "crimson.cosmos",
        ctx,
        { method: "DELETE" },
      );
    },
    async increment(key, delta = 1) {
      const res = await fetchWithAuth(
        `${ctx.serviceUrls.cosmos}/v1/increment/${encodeURIComponent(key)}`,
        "crimson.cosmos",
        ctx,
        { method: "POST", body: JSON.stringify({ delta }) },
      );
      const body = await res.json() as { value: number };
      return body.value;
    },
    async lock(key, options?) {
      const res = await fetchWithAuth(
        `${ctx.serviceUrls.cosmos}/v1/lock/${encodeURIComponent(key)}`,
        "crimson.cosmos",
        ctx,
        { method: "POST", body: JSON.stringify(options ?? {}) },
      );
      const body = await res.json() as { lockId: string };
      return {
        release: async () => {
          await fetchWithAuth(
            `${ctx.serviceUrls.cosmos}/v1/lock/${
              encodeURIComponent(key)
            }/${body.lockId}`,
            "crimson.cosmos",
            ctx,
            { method: "DELETE" },
          );
        },
      };
    },
  };

  const FABRIC: Fabric = {
    async query<T = unknown>(
      dataset: string,
      options?: FabricQueryOptions,
    ): Promise<FabricQueryResult<T>> {
      const res = await fetchWithAuth(
        `${ctx.serviceUrls.fabric}/v1/query`,
        "crimson.fabric",
        ctx,
        { method: "POST", body: JSON.stringify({ dataset, ...options }) },
      );
      return await res.json() as FabricQueryResult<T>;
    },
  };

  const NOTIFICATIONS: NotificationsBinding = {
    async send(payload, options) {
      const url = resolveServiceRoute(
        ctx.serviceUrls.notifications,
        ctx.serviceRoutes.notifications.events,
      );
      if (options?.userId) url.searchParams.set("userId", options.userId);
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
  };

  const TASKS: TasksBinding = {
    async create(options) {
      const res = await fetchWithAuth(
        `${ctx.serviceUrls.tasks}/v1/tasks`,
        "crimson.tasks",
        ctx,
        { method: "POST", body: JSON.stringify(options) },
      );
      return await res.json() as Awaited<ReturnType<TasksBinding["create"]>>;
    },
  };

  const UNIVERSES: UniversesBinding = {
    async list() {
      const res = await fetchWithAuth(
        `${ctx.serviceUrls.universes}/v1/universes`,
        "crimson.universes",
        ctx,
        { method: "GET" },
      );
      return await res.json() as Awaited<ReturnType<UniversesBinding["list"]>>;
    },
    async constituents(universeId) {
      const res = await fetchWithAuth(
        `${ctx.serviceUrls.universes}/v1/universes/${
          encodeURIComponent(universeId)
        }/constituents`,
        "crimson.universes",
        ctx,
        { method: "GET" },
      );
      return await res.json() as Awaited<
        ReturnType<UniversesBinding["constituents"]>
      >;
    },
  };

  const WEB: WebBinding = {
    async search(query, options?) {
      const url = new URL(`${ctx.serviceUrls.web}/v1/search`);
      url.searchParams.set("q", query);
      if (options?.limit !== undefined) {
        url.searchParams.set("limit", String(options.limit));
      }
      const res = await fetchWithAuth(url.toString(), "crimson.web", ctx, {
        method: "GET",
      });
      return await res.json() as Awaited<ReturnType<WebBinding["search"]>>;
    },
  };

  return Object.freeze({
    AI,
    API,
    CONFIGURATION,
    COSMOS,
    FABRIC,
    NOTIFICATIONS,
    QUEUES,
    TASKS,
    UNIVERSES,
    WEB,
  });
}
