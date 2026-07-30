import type { QueueRegistry, QueueStats } from "../capabilities/queues.ts";
import { RuntimeError } from "../runtime_error.ts";
import type { QueueBindingDescriptor, QueueCapability } from "./config.ts";

interface ParsedConnectionString {
  endpoint: string;
  keyName: string;
  key: string;
  entityPath?: string;
}

interface QueueAdapter {
  send?(message: unknown): Promise<void>;
  stats?(): Promise<QueueStats>;
}

function parseConnectionString(value: string): ParsedConnectionString {
  const fields = new Map<string, string>();
  for (const component of value.split(";")) {
    const separator = component.indexOf("=");
    if (separator < 1) continue;
    fields.set(
      component.slice(0, separator).trim().toLowerCase(),
      component.slice(separator + 1).trim(),
    );
  }
  const rawEndpoint = fields.get("endpoint");
  const keyName = fields.get("sharedaccesskeyname");
  const key = fields.get("sharedaccesskey");
  if (!rawEndpoint || !keyName || !key) {
    throw new RuntimeError("Invalid Azure Service Bus connection string");
  }
  let endpoint: URL;
  try {
    endpoint = new URL(rawEndpoint.replace(/^sb:/i, "https:"));
  } catch (cause) {
    throw new RuntimeError("Invalid Azure Service Bus endpoint", cause);
  }
  if (endpoint.protocol !== "https:" || !endpoint.hostname) {
    throw new RuntimeError("Invalid Azure Service Bus endpoint");
  }
  return {
    endpoint: `https://${endpoint.host}`,
    keyName,
    key,
    entityPath: fields.get("entitypath") || undefined,
  };
}

function normalizeEntity(entity: string): string {
  return entity.replace(/^\/+|\/+$/g, "").split("/").map(encodeURIComponent)
    .join("/");
}

async function createSasToken(
  resourceUri: string,
  keyName: string,
  key: string,
  ttlSeconds: number,
): Promise<string> {
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

function xmlInteger(xml: string, name: string): number | undefined {
  const expression = new RegExp(
    `<(?:[\\w.-]+:)?${name}(?:\\s[^>]*)?>\\s*(\\d+)\\s*<\\/(?:[\\w.-]+:)?${name}\\s*>`,
    "i",
  );
  const raw = expression.exec(xml)?.[1];
  if (raw === undefined) return undefined;
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) {
    throw new RuntimeError(`Invalid queue runtime property: ${name}`);
  }
  return value;
}

function parseQueueStats(xml: string): QueueStats {
  const required = (name: string): number => {
    const value = xmlInteger(xml, name);
    if (value === undefined) {
      throw new RuntimeError(`Missing queue runtime property: ${name}`);
    }
    return value;
  };
  const activeMessageCount = required("ActiveMessageCount");
  const deadLetterMessageCount = required("DeadLetterMessageCount");
  const scheduledMessageCount = required("ScheduledMessageCount");
  const transferMessageCount = required("TransferMessageCount");
  const transferDeadLetterMessageCount = required(
    "TransferDeadLetterMessageCount",
  );
  const totalMessageCount = xmlInteger(xml, "MessageCount") ??
    activeMessageCount + deadLetterMessageCount + scheduledMessageCount +
      transferMessageCount + transferDeadLetterMessageCount;
  const sizeInBytes = xmlInteger(xml, "SizeInBytes");
  return {
    activeMessageCount,
    deadLetterMessageCount,
    scheduledMessageCount,
    transferMessageCount,
    transferDeadLetterMessageCount,
    totalMessageCount,
    ...(sizeInBytes === undefined ? {} : { sizeInBytes }),
  };
}

function createAzureAdapter(
  descriptor: QueueBindingDescriptor,
  connectionString: string,
): QueueAdapter {
  const config = parseConnectionString(connectionString);
  const entity = normalizeEntity(descriptor.entity);
  if (config.entityPath && normalizeEntity(config.entityPath) !== entity) {
    throw new RuntimeError(
      "Queue connection string is scoped to a different entity",
    );
  }
  const resourceUri = `${config.endpoint}/${entity}`;
  const ttlSeconds = descriptor.sasTokenTtlSeconds ?? 300;
  const capabilities = new Set<QueueCapability>(
    descriptor.capabilities ?? ["send"],
  );
  const authorization = () =>
    createSasToken(resourceUri, config.keyName, config.key, ttlSeconds);
  const adapter: QueueAdapter = {};

  if (capabilities.has("send")) {
    adapter.send = async (message) => {
      const body = JSON.stringify(message);
      if (body === undefined) {
        throw new RuntimeError("Queue message must be JSON serializable");
      }
      const response = await fetch(`${resourceUri}/messages`, {
        method: "POST",
        headers: {
          Authorization: await authorization(),
          "Content-Type": "application/json",
        },
        body,
      });
      if (!response.ok) {
        throw new RuntimeError(
          `Queue send failed for configured binding: HTTP ${response.status}`,
        );
      }
    };
  }

  if (capabilities.has("inspect")) {
    adapter.stats = async () => {
      const url = new URL(resourceUri);
      url.searchParams.set("api-version", "2021-05");
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/atom+xml",
          Authorization: await authorization(),
        },
      });
      if (!response.ok) {
        throw new RuntimeError(
          `Queue inspection failed for configured binding: HTTP ${response.status}`,
        );
      }
      return parseQueueStats(await response.text());
    };
  }

  return Object.freeze(adapter);
}

export function createQueueRegistry(
  descriptors: Readonly<Record<string, QueueBindingDescriptor>>,
  resolvedSecrets: ReadonlyMap<string, string>,
): QueueRegistry {
  const adapters = new Map<string, QueueAdapter>();
  for (const [name, descriptor] of Object.entries(descriptors)) {
    const connectionString = resolvedSecrets.get(
      descriptor.connectionStringSecret,
    );
    if (!connectionString) {
      throw new RuntimeError(
        `Secret reference for queue binding "${name}" could not be resolved`,
      );
    }
    adapters.set(name, createAzureAdapter(descriptor, connectionString));
  }

  const operation = <K extends keyof QueueAdapter>(
    binding: string,
    name: K,
  ): NonNullable<QueueAdapter[K]> => {
    const adapter = adapters.get(binding);
    if (!adapter) {
      throw new RuntimeError(`Queue binding not granted: "${binding}"`);
    }
    const handler = adapter[name];
    if (!handler) {
      throw new RuntimeError(
        `Queue operation not granted for binding "${binding}": ${name}`,
      );
    }
    return handler as NonNullable<QueueAdapter[K]>;
  };

  return Object.freeze({
    async send<T>(binding: string, message: T): Promise<void> {
      await operation(binding, "send")(message);
    },
    async stats(binding: string): Promise<QueueStats> {
      return await operation(binding, "stats")();
    },
  });
}
