import type {
  AIBinding,
  APIBinding,
  ConfigurationBinding,
  CosmosBinding,
  CrimsonSDKEnv,
  NotesBinding,
  NotificationsBinding,
  TasksBinding,
  UniversesBinding,
  WebBinding,
} from "./env.ts";
import type { Fabric, FabricQueryOptions, FabricQueryResult } from "./capabilities/fabric.ts";

export type TokenScope =
  | "crimson.api"
  | "crimson.fabric"
  | "crimson.ai"
  | "crimson.notifications"
  | "crimson.tasks"
  | "crimson.notes"
  | "crimson.universes"
  | "crimson.web"
  | "crimson.cosmos";

export interface AccessToken {
  value: string;
  expiresAt: number;
}

export interface AppIdentity {
  appId: string;
  appName: string;
  tenantId: string;
  grantedScopes: string[];
}

export interface ServiceUrls {
  api: string;
  fabric: string;
  ai: string;
  notifications: string;
  tasks: string;
  notes: string;
  universes: string;
  web: string;
  cosmos: string;
}

export interface TokenProvider {
  getToken(scope: TokenScope, opts?: { forceRefresh?: boolean }): Promise<AccessToken>;
}

export interface RuntimeContext {
  appIdentity: AppIdentity;
  tokens: TokenProvider;
  serviceUrls: ServiceUrls;
}

export class RuntimeError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "RuntimeError";
  }
}

const SERVICE_URL_KEYS: (keyof ServiceUrls)[] = [
  "api",
  "fabric",
  "ai",
  "notifications",
  "tasks",
  "notes",
  "universes",
  "web",
  "cosmos",
];

async function fetchWithAuth(
  url: string,
  scope: TokenScope,
  ctx: RuntimeContext,
  init: RequestInit = {},
): Promise<Response> {
  const token = await ctx.tokens.getToken(scope);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token.value}`);
  headers.set("X-Crimson-App-Id", ctx.appIdentity.appId);
  headers.set("Content-Type", "application/json");

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

export function createEnv(ctx: RuntimeContext): CrimsonSDKEnv {
  for (const key of SERVICE_URL_KEYS) {
    if (!ctx.serviceUrls[key]) {
      throw new RuntimeError(`Missing required service URL: ${key}`);
    }
  }

  const AI: AIBinding = {
    async run(model, options) {
      const res = await fetchWithAuth(
        `${ctx.serviceUrls.ai}/run`,
        "crimson.ai",
        ctx,
        { method: "POST", body: JSON.stringify({ model, ...options }) },
      );
      return await res.json() as ReturnType<AIBinding["run"]> extends Promise<infer R> ? R : never;
    },
  };

  const API: APIBinding = {
    async call<T = unknown>(path: string, options?: { params?: Record<string, string>; body?: unknown; method?: string }) {
      const url = new URL(`${ctx.serviceUrls.api}${path}`);
      if (options?.params) {
        for (const [k, v] of Object.entries(options.params)) {
          url.searchParams.set(k, v);
        }
      }
      const method = options?.method ?? (options?.body !== undefined ? "POST" : "GET");
      const body = options?.body !== undefined ? JSON.stringify(options.body) : undefined;
      const res = await fetchWithAuth(url.toString(), "crimson.api", ctx, { method, body });
      const data = await res.json() as T;
      return { status: res.status, data };
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
      const lockId = body.lockId;
      return {
        release: async () => {
          await fetchWithAuth(
            `${ctx.serviceUrls.cosmos}/v1/lock/${encodeURIComponent(key)}/${lockId}`,
            "crimson.cosmos",
            ctx,
            { method: "DELETE" },
          );
        },
      };
    },
  };

  const FABRIC: Fabric = {
    async query<T = unknown>(dataset: string, options?: FabricQueryOptions): Promise<FabricQueryResult<T>> {
      const res = await fetchWithAuth(
        `${ctx.serviceUrls.fabric}/v1/query`,
        "crimson.fabric",
        ctx,
        { method: "POST", body: JSON.stringify({ dataset, ...options }) },
      );
      return await res.json() as FabricQueryResult<T>;
    },
  };

  const NOTES: NotesBinding = {
    async deposit(options) {
      const res = await fetchWithAuth(
        `${ctx.serviceUrls.notes}/v1/deposit`,
        "crimson.notes",
        ctx,
        { method: "POST", body: JSON.stringify(options) },
      );
      return await res.json() as Awaited<ReturnType<NotesBinding["deposit"]>>;
    },
  };

  const NOTIFICATIONS: NotificationsBinding = {
    async send(payload) {
      const res = await fetchWithAuth(
        `${ctx.serviceUrls.notifications}/v1/send`,
        "crimson.notifications",
        ctx,
        { method: "POST", body: JSON.stringify(payload) },
      );
      return await res.json() as Awaited<ReturnType<NotificationsBinding["send"]>>;
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
        `${ctx.serviceUrls.universes}/v1/universes/${encodeURIComponent(universeId)}/constituents`,
        "crimson.universes",
        ctx,
        { method: "GET" },
      );
      return await res.json() as Awaited<ReturnType<UniversesBinding["constituents"]>>;
    },
  };

  const WEB: WebBinding = {
    async search(query, options?) {
      const url = new URL(`${ctx.serviceUrls.web}/v1/search`);
      url.searchParams.set("q", query);
      if (options?.limit !== undefined) url.searchParams.set("limit", String(options.limit));
      const res = await fetchWithAuth(url.toString(), "crimson.web", ctx, { method: "GET" });
      return await res.json() as Awaited<ReturnType<WebBinding["search"]>>;
    },
  };

  return { AI, API, CONFIGURATION, COSMOS, FABRIC, NOTES, NOTIFICATIONS, TASKS, UNIVERSES, WEB };
}
