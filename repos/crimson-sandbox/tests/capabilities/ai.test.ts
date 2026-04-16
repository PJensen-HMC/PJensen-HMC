import { assertEquals, assertRejects } from "@std/assert";
import { createMockEnv } from "../../src/testing.ts";
import { Errors } from "../../src/errors.ts";

Deno.test("AI.run default stub returns empty response and zero usage", async () => {
  const env = createMockEnv();
  const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    prompt: "anything",
  });
  assertEquals(result.response, "");
  assertEquals(result.usage.totalTokens, 0);
  assertEquals(result.usage.promptTokens, 0);
  assertEquals(result.usage.completionTokens, 0);
});

Deno.test("AI.run override receives model and prompt", async () => {
  let capturedModel = "";
  let capturedPrompt = "";

  const env = createMockEnv({
    AI: {
      run: (model, options) => {
        capturedModel = model;
        capturedPrompt = options.prompt;
        return Promise.resolve({
          response: "ok",
          usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        });
      },
    },
  });

  await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    prompt: "Summarize positions",
  });

  assertEquals(capturedModel, "@cf/meta/llama-3.1-8b-instruct");
  assertEquals(capturedPrompt, "Summarize positions");
});

Deno.test("AI.run override echoes prompt in response", async () => {
  const env = createMockEnv({
    AI: {
      run: (_model, options) =>
        Promise.resolve({
          response: `Echo: ${options.prompt}`,
          usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        }),
    },
  });

  const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    prompt: "Summarize positions",
  });

  assertEquals(result.response, "Echo: Summarize positions");
  assertEquals(result.usage.totalTokens, 15);
});

Deno.test("AI.run throws Errors.AI when model not on allowlist", async () => {
  const env = createMockEnv({
    AI: {
      run: () => Promise.reject(new Errors.AI("Model not on allowlist")),
    },
  });

  await assertRejects(
    () => env.AI.run("@unknown/model", { prompt: "test" }),
    Errors.AI,
    "Model not on allowlist",
  );
});

Deno.test("AI.run throws Errors.AI when token budget exceeded", async () => {
  const env = createMockEnv({
    AI: {
      run: () => Promise.reject(new Errors.AI("Token budget exceeded")),
    },
  });

  await assertRejects(
    () => env.AI.run("@cf/meta/llama-3.1-8b-instruct", { prompt: "x".repeat(10000) }),
    Errors.AI,
    "Token budget exceeded",
  );
});
