import { assertEquals, assertRejects } from "@std/assert";
import { createMockEnv } from "../../src/testing.ts";
import { Errors } from "../../src/errors.ts";

Deno.test("NOTIFICATIONS.send default stub returns mock delivery ID", async () => {
  const env = createMockEnv();
  const result = await env.NOTIFICATIONS.send({
    channel: "teams",
    to: "channel-id",
    body: "Hello from CrimsonSDK",
  });
  assertEquals(result.deliveryId, "mock-delivery-id");
});

Deno.test("NOTIFICATIONS.send default stub returns a valid ISO timestamp", async () => {
  const env = createMockEnv();
  const result = await env.NOTIFICATIONS.send({
    channel: "email",
    to: "user@example.com",
    body: "test",
  });
  // Must be parseable as a date
  assertEquals(isNaN(Date.parse(result.acceptedAt)), false);
});

Deno.test("NOTIFICATIONS.send override receives full payload", async () => {
  let captured: unknown;

  const env = createMockEnv({
    NOTIFICATIONS: {
      send: (payload) => {
        captured = payload;
        return Promise.resolve({ deliveryId: "dlv-001", acceptedAt: "2026-04-02T00:00:00.000Z" });
      },
    },
  });

  await env.NOTIFICATIONS.send({
    channel: "email",
    to: ["alice@example.com", "bob@example.com"],
    subject: "Alert: threshold exceeded",
    body: "Detail here",
    metadata: { priority: "high" },
  });

  assertEquals(captured, {
    channel: "email",
    to: ["alice@example.com", "bob@example.com"],
    subject: "Alert: threshold exceeded",
    body: "Detail here",
    metadata: { priority: "high" },
  });
});

Deno.test("NOTIFICATIONS.send override returns custom delivery ID", async () => {
  const env = createMockEnv({
    NOTIFICATIONS: {
      send: (payload) =>
        Promise.resolve({
          deliveryId: `dlv-${payload.channel}-001`,
          acceptedAt: "2026-04-02T00:00:00.000Z",
        }),
    },
  });

  const result = await env.NOTIFICATIONS.send({
    channel: "email",
    to: "alice@example.com",
    subject: "Alert",
    body: "Threshold exceeded",
  });

  assertEquals(result.deliveryId, "dlv-email-001");
});

Deno.test("NOTIFICATIONS.send throws Errors.Notifications on rejected channel", async () => {
  const env = createMockEnv({
    NOTIFICATIONS: {
      send: () => Promise.reject(new Errors.Notifications("Channel not permitted")),
    },
  });

  await assertRejects(
    () =>
      env.NOTIFICATIONS.send({
        channel: "webhook",
        to: "https://external.example.com",
        body: "test",
      }),
    Errors.Notifications,
    "Channel not permitted",
  );
});
