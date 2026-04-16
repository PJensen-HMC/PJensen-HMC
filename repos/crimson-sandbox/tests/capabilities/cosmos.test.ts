import { assertEquals, assertRejects } from "@std/assert";
import { createMockEnv } from "../../src/testing.ts";
import { Errors } from "../../src/errors.ts";

Deno.test("COSMOS.get default stub returns undefined", async () => {
  const env = createMockEnv();
  const value = await env.COSMOS.get("missing-key");
  assertEquals(value, undefined);
});

Deno.test("COSMOS.increment default stub returns 1", async () => {
  const env = createMockEnv();
  const count = await env.COSMOS.increment("page:views");
  assertEquals(count, 1);
});

Deno.test("COSMOS.get and set round-trip through in-memory store", async () => {
  const store = new Map<string, unknown>();

  const env = createMockEnv({
    COSMOS: {
      get: (key) => Promise.resolve(store.get(key) as never),
      set: (key, value) => Promise.resolve(void store.set(key, value)),
    },
  });

  await env.COSMOS.set("user:pref:theme", "dark");
  const value = await env.COSMOS.get<string>("user:pref:theme");
  assertEquals(value, "dark");
});

Deno.test("COSMOS.set with TTL does not affect stored value", async () => {
  const store = new Map<string, unknown>();

  const env = createMockEnv({
    COSMOS: {
      get: (key) => Promise.resolve(store.get(key) as never),
      set: (key, value) => Promise.resolve(void store.set(key, value)),
    },
  });

  await env.COSMOS.set("portfolio:summary", { total: 42 }, { ttlSeconds: 300 });
  const value = await env.COSMOS.get<{ total: number }>("portfolio:summary");
  assertEquals(value?.total, 42);
});

Deno.test("COSMOS.increment accumulates correctly", async () => {
  const counters = new Map<string, number>();

  const env = createMockEnv({
    COSMOS: {
      increment: (key, delta = 1) => {
        const next = (counters.get(key) ?? 0) + delta;
        counters.set(key, next);
        return Promise.resolve(next);
      },
    },
  });

  assertEquals(await env.COSMOS.increment("hits"), 1);
  assertEquals(await env.COSMOS.increment("hits"), 2);
  assertEquals(await env.COSMOS.increment("hits", 3), 5);
  assertEquals(await env.COSMOS.increment("hits", -1), 4);
});

Deno.test("COSMOS.delete removes key from store", async () => {
  const store = new Map<string, unknown>([["key", "value"]]);

  const env = createMockEnv({
    COSMOS: {
      get: (key) => Promise.resolve(store.get(key) as never),
      delete: (key) => Promise.resolve(void store.delete(key)),
    },
  });

  await env.COSMOS.delete("key");
  assertEquals(await env.COSMOS.get("key"), undefined);
});

Deno.test("COSMOS.lock default stub returns a releasable handle", async () => {
  const env = createMockEnv();
  const lock = await env.COSMOS.lock("job:process");
  await lock.release(); // must not throw
});

Deno.test("COSMOS.lock throws Errors.Cosmos when unavailable", async () => {
  const env = createMockEnv({
    COSMOS: {
      lock: () => Promise.reject(new Errors.Cosmos("Lock unavailable: timeout")),
    },
  });

  await assertRejects(
    () => env.COSMOS.lock("job:process", { waitMs: 100 }),
    Errors.Cosmos,
    "Lock unavailable",
  );
});
