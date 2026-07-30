import {
  assertEquals,
  assertNotEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from "@std/assert";
import {
  type BindingSnapshot,
  createEnv,
  type RuntimeContext,
  RuntimeError,
  StaticTokenProvider,
} from "../src/mod.ts";

const SERVICE_URLS = {
  fabric: "https://fabric.test",
  ai: "https://ai.test",
  notifications: "https://notifications.test",
  tasks: "https://tasks.test",
  universes: "https://universes.test",
  web: "https://web.test",
  cosmos: "https://cosmos.test",
};

function snapshot(): BindingSnapshot {
  return {
    version: "2026-07-30.1",
    api: {
      research: {
        baseUrl: "https://api.test/root",
        auth: { kind: "bearer", scope: "api://research" },
      },
    },
    queues: {},
  };
}

function context(overrides: Partial<RuntimeContext> = {}): RuntimeContext {
  return {
    appIdentity: {
      appId: "test-app",
      appName: "Test App",
      tenantId: "hmc",
      grantedScopes: [],
    },
    tokens: new StaticTokenProvider({ "api://research": "test-token" }),
    serviceUrls: SERVICE_URLS,
    serviceRoutes: { notifications: { events: "/events" } },
    bindingSnapshot: snapshot(),
    secrets: { get: () => undefined },
    ...overrides,
  };
}

Deno.test("env exposes immutable API and QUEUES registries", () => {
  const env = createEnv(context());
  assertEquals(typeof env.API.service, "function");
  assertEquals(typeof env.QUEUES.send, "function");
  assertEquals(Object.isFrozen(env), true);
  assertEquals("NOTES" in env, false);
  assertEquals("SERVICE_BUS" in env, false);
});

Deno.test("snapshot validation rejects malformed and unsupported descriptors", () => {
  for (
    const bindingSnapshot of [
      { version: "", api: {}, queues: {} },
      {
        version: "v",
        api: { bad: { baseUrl: "not a url", auth: { kind: "none" } } },
        queues: {},
      },
      {
        version: "v",
        api: { bad: { baseUrl: "https://api.test", auth: { kind: "magic" } } },
        queues: {},
      },
      {
        version: "v",
        api: {},
        queues: {
          bad: {
            provider: "other",
            entity: "q",
            connectionStringSecret: "q-secret",
          },
        },
      },
    ]
  ) {
    assertThrows(
      () =>
        createEnv(
          context({ bindingSnapshot: bindingSnapshot as BindingSnapshot }),
        ),
      RuntimeError,
    );
  }
});

Deno.test("snapshot validation rejects duplicate names and unresolved secrets", () => {
  const duplicate: BindingSnapshot = {
    version: "v",
    api: { shared: { baseUrl: "https://api.test", auth: { kind: "none" } } },
    queues: {
      shared: {
        provider: "azure-service-bus",
        entity: "q",
        connectionStringSecret: "missing",
      },
    },
  };
  assertThrows(
    () => createEnv(context({ bindingSnapshot: duplicate })),
    RuntimeError,
    "Duplicate binding name",
  );

  duplicate.queues = { queue: duplicate.queues.shared };
  assertThrows(
    () => createEnv(context({ bindingSnapshot: duplicate })),
    RuntimeError,
    "could not be resolved",
  );
});

Deno.test("API resolves relative paths, serializes query/body, and injects auth", async () => {
  const originalFetch = globalThis.fetch;
  let request: Request | undefined;
  globalThis.fetch = (input, init) => {
    request = new Request(input, init);
    return Promise.resolve(new Response(null, { status: 204 }));
  };
  try {
    const response = await createEnv(context()).API.service("research").patch(
      "/items",
      { ok: true },
      { query: { force: true, tag: ["a", "b"] }, headers: { "X-Test": "yes" } },
    );
    assertEquals(response.status, 204);
    assertEquals(
      request?.url,
      "https://api.test/root/items?force=true&tag=a&tag=b",
    );
    assertEquals(request?.method, "PATCH");
    assertEquals(request?.headers.get("authorization"), "Bearer test-token");
    assertEquals(request?.headers.get("x-crimson-app-id"), "test-app");
    assertEquals(request?.headers.get("x-test"), "yes");
    assertEquals(await request?.text(), '{"ok":true}');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("API fetch preserves binary responses and non-success responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () =>
    Promise.resolve(new Response(new Uint8Array([1, 2, 3]), { status: 503 }));
  try {
    const response = await createEnv(context()).API.service("research").fetch(
      "/blob",
    );
    assertEquals(response.status, 503);
    assertEquals(
      new Uint8Array(await response.arrayBuffer()),
      new Uint8Array([1, 2, 3]),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("API rejects unknown bindings, absolute paths, and traversal", async () => {
  const env = createEnv(context());
  assertThrows(() => env.API.service("ungranted"), RuntimeError, "not granted");
  assertThrows(
    () => env.API.service("research").get("https://evil.test"),
    RuntimeError,
    "relative",
  );
  assertThrows(
    () => env.API.service("research").get("../secret"),
    RuntimeError,
    "traverse",
  );
  assertThrows(
    () => env.API.service("research").get("/%2e%2e/secret"),
    RuntimeError,
    "traverse",
  );
  await assertRejects(
    () =>
      env.API.service("research").fetch("/items", {
        headers: { Authorization: "Bearer app-token" },
      }),
    RuntimeError,
    "controlled",
  );
});

Deno.test("API retries once with a refreshed bearer token", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  const refreshes: boolean[] = [];
  globalThis.fetch = () =>
    Promise.resolve(new Response(null, { status: ++calls === 1 ? 401 : 204 }));
  try {
    const ctx = context({
      tokens: {
        getToken: (_scope, options) => {
          refreshes.push(options?.forceRefresh ?? false);
          return Promise.resolve({
            value: options?.forceRefresh ? "fresh" : "stale",
            expiresAt: Date.now() + 60_000,
          });
        },
      },
    });
    assertEquals(
      (await createEnv(ctx).API.service("research").get("/items")).status,
      204,
    );
    assertEquals(refreshes, [false, true]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("binding snapshot is copied before env construction", async () => {
  const originalFetch = globalThis.fetch;
  let url = "";
  globalThis.fetch = (input, init) => {
    url = new Request(input, init).url;
    return Promise.resolve(new Response());
  };
  try {
    const input = snapshot();
    const env = createEnv(context({ bindingSnapshot: input }));
    input.api.research.baseUrl = "https://changed.test";
    await env.API.service("research").get("/items");
    assertEquals(url, "https://api.test/root/items");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

const CONNECTION =
  "Endpoint=sb://bus.test/;SharedAccessKeyName=send;SharedAccessKey=test-key";
function queueContext(): RuntimeContext {
  return context({
    bindingSnapshot: {
      version: "v",
      api: {},
      queues: {
        indexing: {
          provider: "azure-service-bus",
          entity: "research-indexing",
          connectionStringSecret: "AzureServiceBus",
          sasTokenTtlSeconds: 60,
        },
      },
    },
    secrets: {
      get: (name) => name === "AzureServiceBus" ? CONNECTION : undefined,
    },
  });
}

Deno.test("QUEUES resolves named Azure destinations and JSON serializes", async () => {
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  const requests: Request[] = [];
  Date.now = () => 1_800_000_000_000;
  globalThis.fetch = (input, init) => {
    requests.push(new Request(input, init));
    return Promise.resolve(new Response(null, { status: 201 }));
  };
  try {
    const queues = createEnv(queueContext()).QUEUES;
    await queues.send("indexing", { id: 7 });
    await queues.send("indexing", { id: 8 });
    assertEquals(
      requests[0].url,
      "https://bus.test/research-indexing/messages",
    );
    assertEquals(await requests[0].text(), '{"id":7}');
    const firstSas = requests[0].headers.get("authorization");
    const secondSas = requests[1].headers.get("authorization");
    assertEquals(firstSas, secondSas);
    assertStringIncludes(
      firstSas ?? "",
      "sr=https%3A%2F%2Fbus.test%2Fresearch-indexing",
    );
    assertStringIncludes(firstSas ?? "", "se=1800000060");
  } finally {
    Date.now = originalNow;
    globalThis.fetch = originalFetch;
  }
});

Deno.test("QUEUES rejects unknown bindings, scoped mismatches, and failed sends", async () => {
  await assertRejects(
    () => createEnv(queueContext()).QUEUES.send("other", {}),
    RuntimeError,
    "not granted",
  );
  const scoped = queueContext();
  scoped.secrets = { get: () => `${CONNECTION};EntityPath=other` };
  assertThrows(
    () => createEnv(scoped),
    RuntimeError,
    "different entity",
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response(null, { status: 500 }));
  try {
    await assertRejects(
      () => createEnv(queueContext()).QUEUES.send("indexing", {}),
      RuntimeError,
      "HTTP 500",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("secrets are absent from env and error messages", () => {
  const env = createEnv(queueContext());
  assertNotEquals(JSON.stringify(env).includes("test-key"), true);
  const bad = queueContext();
  bad.secrets = { get: () => "the-sensitive-value" };
  let message = "";
  try {
    createEnv(bad);
  } catch (error) {
    message = String(error);
  }
  assertEquals(message.includes("the-sensitive-value"), false);
});
