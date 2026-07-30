import type { QueueRegistry } from "../capabilities/queues.ts";
import { RuntimeError } from "../runtime_error.ts";
import type { QueueBindingDescriptor } from "./config.ts";

interface ParsedConnectionString {
  endpoint: string;
  keyName: string;
  key: string;
  entityPath?: string;
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

function createSender(
  descriptor: QueueBindingDescriptor,
  connectionString: string,
): (message: unknown) => Promise<void> {
  const config = parseConnectionString(connectionString);
  const entity = normalizeEntity(descriptor.entity);
  if (
    config.entityPath && normalizeEntity(config.entityPath) !== entity
  ) {
    throw new RuntimeError(
      `Queue connection string is scoped to a different entity`,
    );
  }
  const resourceUri = `${config.endpoint}/${entity}`;
  return async (message) => {
    const body = JSON.stringify(message);
    if (body === undefined) {
      throw new RuntimeError("Queue message must be JSON serializable");
    }
    const authorization = await createSasToken(
      resourceUri,
      config.keyName,
      config.key,
      descriptor.sasTokenTtlSeconds ?? 300,
    );
    const response = await fetch(`${resourceUri}/messages`, {
      method: "POST",
      headers: {
        Authorization: authorization,
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

export function createQueueRegistry(
  descriptors: Readonly<Record<string, QueueBindingDescriptor>>,
  resolvedSecrets: ReadonlyMap<string, string>,
): QueueRegistry {
  const senders = new Map<string, (message: unknown) => Promise<void>>();
  for (const [name, descriptor] of Object.entries(descriptors)) {
    const connectionString = resolvedSecrets.get(
      descriptor.connectionStringSecret,
    );
    if (!connectionString) {
      throw new RuntimeError(
        `Secret reference for queue binding "${name}" could not be resolved`,
      );
    }
    senders.set(name, createSender(descriptor, connectionString));
  }
  return Object.freeze({
    async send<T>(binding: string, message: T): Promise<void> {
      const sender = senders.get(binding);
      if (!sender) {
        throw new RuntimeError(`Queue binding not granted: "${binding}"`);
      }
      await sender(message);
    },
  });
}
