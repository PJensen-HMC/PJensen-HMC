import { assertEquals, assertGreater, assertRejects } from "@std/assert";
import {
  AzureTokenProvider,
  type ScopeResourceMap,
  StaticTokenProvider,
} from "../src/auth/mod.ts";
import { RuntimeError } from "../src/runtime.ts";

const SCOPE_RESOURCES: ScopeResourceMap = {
  "crimson.api": "api://crimson-api",
  "crimson.fabric": "api://crimson-fabric",
  "crimson.ai": "api://crimson-ai",
  "crimson.notifications": "api://crimson-notifications",
  "crimson.tasks": "api://crimson-tasks",
  "crimson.notes": "api://crimson-notes",
  "crimson.universes": "api://crimson-universes",
  "crimson.web": "api://crimson-web",
  "crimson.cosmos": "api://crimson-cosmos",
};

Deno.test("StaticTokenProvider returns a token with epoch-millisecond expiry", async () => {
  const before = Date.now();
  const provider = new StaticTokenProvider(
    { "crimson.api": "test-token" },
    60_000,
  );

  const token = await provider.getToken("crimson.api");

  assertEquals(token.value, "test-token");
  assertGreater(token.expiresAt, before + 59_000);
});

Deno.test("StaticTokenProvider rejects an unconfigured scope", async () => {
  const provider = new StaticTokenProvider({});

  await assertRejects(
    () => provider.getToken("crimson.ai"),
    RuntimeError,
    "no token configured",
  );
});

Deno.test("AzureTokenProvider caches tokens and honors forceRefresh", async () => {
  let requestCount = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
    requestCount++;
    assertEquals(init?.method, "POST");
    return Promise.resolve(Response.json({
      access_token: `azure-token-${requestCount}`,
      expires_in: 3600,
    }));
  }) as typeof fetch;

  try {
    const provider = new AzureTokenProvider(
      "tenant-id",
      "client-id",
      "client-secret",
      SCOPE_RESOURCES,
    );

    const first = await provider.getToken("crimson.api");
    const cached = await provider.getToken("crimson.api");
    const refreshed = await provider.getToken("crimson.api", {
      forceRefresh: true,
    });

    assertEquals(first, cached);
    assertEquals(refreshed.value, "azure-token-2");
    assertEquals(requestCount, 2);
    assertGreater(first.expiresAt, Date.now() + 3_500_000);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
