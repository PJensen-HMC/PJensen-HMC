import type {
  AIBinding,
  APIBinding,
  ConfigurationBinding,
  CosmosBinding,
  CrimsonSDKEnv,
  NotesBinding,
  NotificationsBinding,
  ServiceBusBinding,
  TasksBinding,
  UniversesBinding,
  WebBinding,
} from "./env.ts";
import type {
  Fabric,
  FabricQueryOptions,
  FabricQueryResult,
} from "./capabilities/fabric.ts";

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

export interface ServiceRoutes {
  notifications: {
    events: string;
  };
}

export interface TokenProvider {
  getToken(
    scope: TokenScope,
    opts?: { forceRefresh?: boolean },
  ): Promise<AccessToken>;
}

export interface ServiceBusRuntimeConfig {
  /** Kept in the runtime; never exposed through CrimsonSDKEnv. */
  connectionString: string;
  /** Lifetime of generated SAS tokens. Defaults to 300 seconds. */
  sasTokenTtlSeconds?: number;
}

export interface RuntimeContext {
  appIdentity: AppIdentity;
  tokens: TokenProvider;
  serviceUrls: ServiceUrls;
  serviceRoutes: ServiceRoutes;
  serviceBus?: ServiceBusRuntimeConfig;
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

function contentDispositionFileName(value: string | null): string | null {
  if (!value) return null;

  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(value)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }

  return /filename="([^"]+)"/i.exec(value)?.[1] ??
    /filename=([^;]+)/i.exec(value)?.[1]?.trim() ??
    null;
}

interface ParsedServiceBusConnectionString {
  endpoint: string;
  keyName: string;
  key: string;
  entityPath?: string;
}

function parseServiceBusConnectionString(
  connectionString: string,
): ParsedServiceBusConnectionString {
  const values = new Map<string, string>();
  for (const component of connectionString.split(";")) {
    if (!component) continue;
    const separator = component.indexOf("=");
    if (separator < 1) continue;
    values.set(
      component.slice(0, separator).trim().toLowerCase(),
      component.slice(separator + 1).trim(),
    );
  }

  const rawEndpoint = values.get("endpoint");
  const keyName = values.get("sharedaccesskeyname");
  const key = values.get("sharedaccesskey");
  if (!rawEndpoint || !keyName || !key) {
    throw new RuntimeError(
      "Service Bus connection string requires Endpoint, " +
        "SharedAccessKeyName, and SharedAccessKey",
    );
  }

  let endpoint: URL;
  try {
    endpoint = new URL(rawEndpoint.replace(/^sb:/i, "https:"));
  } catch (cause) {
    throw new RuntimeError("Invalid Service Bus Endpoint", cause);
  }
  if (endpoint.protocol !== "https:" || !endpoint.hostname) {
    throw new RuntimeError("Service Bus Endpoint must use sb:// or https://");
  }

  return {
    endpoint: `https://${endpoint.host}`,
    keyName,
    key,
    entityPath: values.get("entitypath") || undefined,
  };
}

function normalizeServiceBusEntity(entity: string): string {
  const normalized = entity.replace(/^\/+|\/+$/g, "");
  const segments = normalized.split("/");
  if (
    !normalized ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new RuntimeError(`Invalid Service Bus entity: "${entity}"`);
  }
  return segments.map(encodeURIComponent).join("/");
}

async function createServiceBusSasToken(
  resourceUri: string,
  keyName: string,
  key: string,
  ttlSeconds: number,
): Promise<string> {
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 1) {
    throw new RuntimeError(
      "Service Bus SAS token TTL must be a positive integer",
    );
  }

  const expiresAt = Math.floor(Date.now() / 1_000) + ttlSeconds;
  const encodedResource = encodeURIComponent(resourceUri);
  const stringToSign = `${encodedResource}\n${expiresAt}`;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      new TextEncoder().encode(stringToSign),
    ),
  );
  const encodedSignature = encodeURIComponent(
    btoa(String.fromCharCode(...signature)),
  );

  return `SharedAccessSignature sr=${encodedResource}&sig=${encodedSignature}` +
    `&se=${expiresAt}&skn=${encodeURIComponent(keyName)}`;
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

  const API: APIBinding = {
    async call<T = unknown>(
      path: string,
      options?: {
        params?: Record<string, string>;
        body?: unknown;
        method?: string;
      },
    ) {
      const url = new URL(`${ctx.serviceUrls.api}${path}`);
      if (options?.params) {
        for (const [k, v] of Object.entries(options.params)) {
          url.searchParams.set(k, v);
        }
      }
      const method = options?.method ??
        (options?.body !== undefined ? "POST" : "GET");
      const body = options?.body !== undefined
        ? JSON.stringify(options.body)
        : undefined;
      const res = await fetchWithAuth(url.toString(), "crimson.api", ctx, {
        method,
        body,
      });
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
            `${ctx.serviceUrls.cosmos}/v1/lock/${
              encodeURIComponent(key)
            }/${lockId}`,
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
    async reindex(entries, options) {
      if (entries.length === 0) {
        throw new RuntimeError("At least one indexing entry is required");
      }
      if (
        entries.some((entry) => !entry.entryType.trim() || !entry.id.trim())
      ) {
        throw new RuntimeError("Indexing entries require entryType and id");
      }

      const url = new URL(`${ctx.serviceUrls.notes}/v1/Indexing`);
      url.searchParams.set(
        "fireAndForget",
        String(options?.fireAndForget ?? true),
      );
      url.searchParams.set("force", String(options?.force ?? true));
      url.searchParams.set("quality", options?.quality ?? "med");
      const res = await fetchWithAuth(
        url.toString(),
        "crimson.notes",
        ctx,
        {
          method: "PATCH",
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json-patch+json",
          },
          body: JSON.stringify(entries),
        },
      );
      if (!res.ok) {
        throw new RuntimeError(`Notes reindex failed: HTTP ${res.status}`);
      }
    },
    async downloadAttachment(attachmentId) {
      if (!attachmentId.trim()) {
        throw new RuntimeError("Attachment ID is required");
      }

      const url = new URL(
        `${ctx.serviceUrls.notes}/v1/Attachments/${
          encodeURIComponent(attachmentId)
        }`,
      );
      const res = await fetchWithAuth(
        url.toString(),
        "crimson.notes",
        ctx,
        { method: "GET", headers: { Accept: "*/*" } },
      );
      if (!res.ok) {
        throw new RuntimeError(
          `Attachment download failed for "${attachmentId}": HTTP ${res.status}`,
        );
      }

      return {
        attachmentId,
        content: new Uint8Array(await res.arrayBuffer()),
        contentType: res.headers.get("Content-Type"),
        fileName: contentDispositionFileName(
          res.headers.get("Content-Disposition"),
        ),
      };
    },
  };

  const NOTIFICATIONS: NotificationsBinding = {
    async send(payload, options) {
      const url = resolveServiceRoute(
        ctx.serviceUrls.notifications,
        ctx.serviceRoutes.notifications.events,
      );
      if (options?.userId) {
        url.searchParams.set("userId", options.userId);
      }

      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
  };

  const SERVICE_BUS: ServiceBusBinding = {
    async send(entity, message) {
      if (!ctx.serviceBus?.connectionString) {
        throw new RuntimeError(
          "Missing Service Bus runtime configuration: connectionString",
        );
      }

      const config = parseServiceBusConnectionString(
        ctx.serviceBus.connectionString,
      );
      const entityPath = normalizeServiceBusEntity(entity);
      if (
        config.entityPath &&
        normalizeServiceBusEntity(config.entityPath) !== entityPath
      ) {
        throw new RuntimeError(
          `Service Bus connection string is scoped to "${config.entityPath}"`,
        );
      }

      const resourceUri = `${config.endpoint}/${entityPath}`;
      const authorization = await createServiceBusSasToken(
        resourceUri,
        config.keyName,
        config.key,
        ctx.serviceBus.sasTokenTtlSeconds ?? 300,
      );
      const body = JSON.stringify(message);
      if (body === undefined) {
        throw new RuntimeError("Service Bus message must be JSON serializable");
      }

      const res = await fetch(`${resourceUri}/messages`, {
        method: "POST",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        body,
      });
      if (!res.ok) {
        throw new RuntimeError(
          `Service Bus send failed for "${entity}": HTTP ${res.status}`,
        );
      }
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

  return {
    AI,
    API,
    CONFIGURATION,
    COSMOS,
    FABRIC,
    NOTES,
    NOTIFICATIONS,
    SERVICE_BUS,
    TASKS,
    UNIVERSES,
    WEB,
  };
}
