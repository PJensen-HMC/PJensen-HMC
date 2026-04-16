import { assertEquals, assertInstanceOf, assertRejects } from "@std/assert";
import {
  createEnv,
  RuntimeError,
  type AccessToken,
  type AppIdentity,
  type RuntimeContext,
  type ServiceUrls,
  type TokenScope,
} from "../src/runtime.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEST_SERVICE_URLS: ServiceUrls = {
  api: "https://api.crimson.test",
  fabric: "https://fabric.crimson.test",
  ai: "https://ai.crimson.test",
  notifications: "https://notifications.crimson.test",
  tasks: "https://tasks.crimson.test",
  notes: "https://notes.crimson.test",
  universes: "https://universes.crimson.test",
  web: "https://web.crimson.test",
  cosmos: "https://cosmos.crimson.test",
};

const TEST_APP_IDENTITY: AppIdentity = {
  appId: "app-test-001",
  appName: "Test App",
  tenantId: "tenant-test",
  grantedScopes: [
    "crimson.api",
    "crimson.fabric",
    "crimson.ai",
    "crimson.notifications",
    "crimson.tasks",
    "crimson.notes",
    "crimson.universes",
    "crimson.web",
  ],
};

function makeToken(scope: string): AccessToken {
  return {
    value: `mock-token-${scope}`,
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  };
}

function makeContext(overrides: Partial<RuntimeContext> = {}): RuntimeContext {
  return {
    appIdentity: TEST_APP_IDENTITY,
    tokens: {
      getToken: (scope: TokenScope) => Promise.resolve(makeToken(scope)),
    },
    serviceUrls: TEST_SERVICE_URLS,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// createEnv validation
// ---------------------------------------------------------------------------

Deno.test("createEnv returns a valid CrimsonSDKEnv with all bindings", () => {
  const env = createEnv(makeContext());
  assertEquals(typeof env.AI.run, "function");
  assertEquals(typeof env.API.call, "function");
  assertEquals(typeof env.CONFIGURATION.get, "function");
  assertEquals(typeof env.COSMOS.get, "function");
  assertEquals(typeof env.FABRIC.query, "function");
  assertEquals(typeof env.NOTES.deposit, "function");
  assertEquals(typeof env.NOTIFICATIONS.send, "function");
  assertEquals(typeof env.TASKS.create, "function");
  assertEquals(typeof env.UNIVERSES.list, "function");
  assertEquals(typeof env.UNIVERSES.constituents, "function");
  assertEquals(typeof env.WEB.search, "function");
});

Deno.test("createEnv throws RuntimeError when a service URL is missing", () => {
  const { cosmos: _omitted, ...withoutCosmos } = TEST_SERVICE_URLS;
  const ctx = makeContext({ serviceUrls: withoutCosmos as ServiceUrls });
  try {
    createEnv(ctx);
    throw new Error("Expected RuntimeError to be thrown");
  } catch (err) {
    assertInstanceOf(err, RuntimeError);
  }
});

// ---------------------------------------------------------------------------
// Token provider — getToken is called with correct scope
// ---------------------------------------------------------------------------

Deno.test("binding calls getToken with correct scope for AI", async () => {
  let capturedScope = "";

  const ctx = makeContext({
    tokens: {
      getToken: (scope: TokenScope) => {
        capturedScope = scope;
        return Promise.resolve(makeToken(scope));
      },
    },
  });

  // Intercept the fetch to avoid real network calls
  const origFetch = globalThis.fetch;
  globalThis.fetch = () =>
    Promise.resolve(
      new Response(
        JSON.stringify({ response: "ok", usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

  try {
    const env = createEnv(ctx);
    await env.AI.run("@cf/meta/llama-3.1-8b-instruct", { prompt: "test" });
    assertEquals(capturedScope, "crimson.ai");
  } finally {
    globalThis.fetch = origFetch;
  }
});

Deno.test("binding injects Bearer token into Authorization header", async () => {
  let capturedAuthHeader = "";

  const ctx = makeContext();
  const origFetch = globalThis.fetch;
  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    capturedAuthHeader = headers.get("Authorization") ?? "";
    return Promise.resolve(
      new Response(JSON.stringify({ universes: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }) as typeof fetch;

  try {
    const env = createEnv(ctx);
    await env.UNIVERSES.list();
    assertEquals(capturedAuthHeader, "Bearer mock-token-crimson.universes");
  } finally {
    globalThis.fetch = origFetch;
  }
});

Deno.test("binding injects X-Crimson-App-Id header", async () => {
  let capturedAppId = "";

  const ctx = makeContext();
  const origFetch = globalThis.fetch;
  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    capturedAppId = headers.get("X-Crimson-App-Id") ?? "";
    return Promise.resolve(
      new Response(JSON.stringify({ hits: [], estimatedTotal: 0, query: "" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }) as typeof fetch;

  try {
    const env = createEnv(ctx);
    await env.WEB.search("test query");
    assertEquals(capturedAppId, "app-test-001");
  } finally {
    globalThis.fetch = origFetch;
  }
});

// ---------------------------------------------------------------------------
// Token refresh on 401
// ---------------------------------------------------------------------------

Deno.test("binding retries with refreshed token on 401", async () => {
  let refreshCallCount = 0;
  let callCount = 0;

  const ctx = makeContext({
    tokens: {
      getToken: (_scope: TokenScope, opts?: { forceRefresh?: boolean }) => {
        if (opts?.forceRefresh) refreshCallCount++;
        return Promise.resolve(makeToken("crimson.tasks"));
      },
    },
  });

  const origFetch = globalThis.fetch;
  globalThis.fetch = (() => {
    callCount++;
    const status = callCount === 1 ? 401 : 200;
    return Promise.resolve(
      new Response(
        JSON.stringify({ taskId: "t-001", createdAt: "", title: "", assignedTo: "", status: "open", priority: "normal" }),
        { status, headers: { "Content-Type": "application/json" } },
      ),
    );
  }) as typeof fetch;

  try {
    const env = createEnv(ctx);
    await env.TASKS.create({ title: "Test", assignedTo: "user-001" });
    assertEquals(refreshCallCount, 1);
    assertEquals(callCount, 2);
  } finally {
    globalThis.fetch = origFetch;
  }
});

Deno.test("binding throws RuntimeError when 401 persists after token refresh", async () => {
  const ctx = makeContext();
  const origFetch = globalThis.fetch;
  globalThis.fetch = (() =>
    Promise.resolve(
      new Response("Unauthorized", { status: 401 }),
    )) as typeof fetch;

  try {
    const env = createEnv(ctx);
    await assertRejects(
      () => env.NOTES.deposit({ subject: "test", content: "x", createdBy: "u-1" }),
      RuntimeError,
    );
  } finally {
    globalThis.fetch = origFetch;
  }
});

// ---------------------------------------------------------------------------
// TokenProvider contract
// ---------------------------------------------------------------------------

Deno.test("TokenProvider.getToken receives the scope it was called with", async () => {
  const received: TokenScope[] = [];

  const ctx = makeContext({
    tokens: {
      getToken: (scope: TokenScope) => {
        received.push(scope);
        return Promise.resolve(makeToken(scope));
      },
    },
  });

  const origFetch = globalThis.fetch;
  globalThis.fetch = (() =>
    Promise.resolve(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }))) as typeof fetch;

  try {
    const env = createEnv(ctx);
    await env.FABRIC.query("portfolio.positions");
    assertEquals(received[0], "crimson.fabric");
  } finally {
    globalThis.fetch = origFetch;
  }
});
