import { assertEquals, assertRejects } from "@std/assert";
import { createMockEnv } from "../../src/testing.ts";
import { Errors } from "../../src/errors.ts";

Deno.test("NOTIFICATIONS.send default stub accepts an event", async () => {
  const env = createMockEnv();
  await env.NOTIFICATIONS.send({
    name: "test",
    metadata: { source: "unit-test" },
  });
});

Deno.test("NOTIFICATIONS.send override receives payload and options", async () => {
  let captured: unknown;

  const env = createMockEnv({
    NOTIFICATIONS: {
      send: (payload, options) => {
        captured = { payload, options };
        return Promise.resolve();
      },
    },
  });

  await env.NOTIFICATIONS.send({
    name: "threshold-exceeded",
    metadata: { priority: "high", userId: "user-in-property-bag" },
  }, { userId: "user-on-query-string" });

  assertEquals(captured, {
    payload: {
      name: "threshold-exceeded",
      metadata: { priority: "high", userId: "user-in-property-bag" },
    },
    options: { userId: "user-on-query-string" },
  });
});

Deno.test("NOTIFICATIONS.send propagates notification errors", async () => {
  const env = createMockEnv({
    NOTIFICATIONS: {
      send: () =>
        Promise.reject(new Errors.Notifications("Event not permitted")),
    },
  });

  await assertRejects(
    () => env.NOTIFICATIONS.send({ name: "not-permitted" }),
    Errors.Notifications,
    "Event not permitted",
  );
});
