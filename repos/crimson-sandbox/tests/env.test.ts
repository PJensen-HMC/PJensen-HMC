import { assertEquals } from "@std/assert";
import { defineCrimsonApp } from "../src/env.ts";
import { createMockEnv } from "../src/testing.ts";

Deno.test("defineCrimsonApp returns the handler unchanged", () => {
  const handler = async () => ({ ok: true });
  const app = defineCrimsonApp(handler);
  assertEquals(app, handler);
});

Deno.test("handler receives env.CONFIGURATION identity", async () => {
  let receivedUserId = "";

  const app = defineCrimsonApp(async (env) => {
    receivedUserId = env.CONFIGURATION.getIdentity().userId;
    return { ok: true };
  });

  await app(createMockEnv());
  assertEquals(receivedUserId, "test-user-id");
});

Deno.test("handler can work with AI binding via createMockEnv", async () => {
  const app = defineCrimsonApp(async (env) => {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      prompt: "Summarize positions",
    });
    return { summary: result.response };
  });

  const env = createMockEnv({
    AI: {
      run: () =>
        Promise.resolve({
          response: "mocked summary",
          usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
        }),
    },
  });

  const result = await app(env) as { summary: string };
  assertEquals(result.summary, "mocked summary");
});

Deno.test("mock CONFIGURATION.getPolicy returns defaults", () => {
  const env = createMockEnv();
  const policy = env.CONFIGURATION.getPolicy();
  assertEquals(policy.maxAITokensPerRequest, 4096);
  assertEquals(policy.allowedFabricDatasets, ["*"]);
});

Deno.test("mock CONFIGURATION.get returns undefined for unknown keys", () => {
  const env = createMockEnv();
  assertEquals(env.CONFIGURATION.get("UNKNOWN_KEY"), undefined);
});

Deno.test("mock CONFIGURATION.get returns overridden value", () => {
  const env = createMockEnv({
    CONFIGURATION: { get: (key) => key === "APP_URL" ? "https://app.example.com" : undefined },
  });
  assertEquals(env.CONFIGURATION.get("APP_URL"), "https://app.example.com");
  assertEquals(env.CONFIGURATION.get("OTHER"), undefined);
});
