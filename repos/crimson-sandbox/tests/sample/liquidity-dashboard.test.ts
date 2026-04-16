import { assertEquals, assertObjectMatch } from "@std/assert";
import { createMockEnv } from "../../src/testing.ts";
import app, { type DashboardResult } from "./liquidity-dashboard.ts";

// Shared mock positions and risk data used across tests
const MOCK_POSITIONS = [
  { symbol: "AAPL", quantity: 100, value: 15_000, currency: "USD" },
  { symbol: "MSFT", quantity: 50, value: 12_000, currency: "USD" },
];

const MOCK_RISK_LIMITS = {
  portfolioLimit: 200_000,
  alertThreshold: 100_000,
  currency: "USD",
  riskManagerId: "rm-user-001",
};

function buildEnv(overrides = {}) {
  return createMockEnv({
    UNIVERSES: {
      constituents: (universeId) =>
        Promise.resolve({
          universeId,
          asOf: "2026-04-02T00:00:00.000Z",
          constituents: [
            { symbol: "AAPL", name: "Apple Inc.", assetClass: "equity", currency: "USD" },
            { symbol: "MSFT", name: "Microsoft Corp.", assetClass: "equity", currency: "USD" },
          ],
        }),
    },
    FABRIC: {
      query: () =>
        Promise.resolve({
          rows: MOCK_POSITIONS as never,
          total: MOCK_POSITIONS.length,
          hasMore: false as const,
        }),
    },
    API: {
      call: () => Promise.resolve({ status: 200, data: MOCK_RISK_LIMITS as never }),
    },
    WEB: {
      search: (query) =>
        Promise.resolve({
          query,
          hits: [{ title: "Market conditions stable", url: "https://example.com", snippet: "Markets are calm." }],
          estimatedTotal: 1,
        }),
    },
    AI: {
      run: () =>
        Promise.resolve({
          response: "Exposure is within normal range. No immediate liquidity concerns.",
          usage: { promptTokens: 50, completionTokens: 30, totalTokens: 80 },
        }),
    },
    ...overrides,
  });
}

Deno.test("dashboard returns summary and position count below threshold", async () => {
  const result = await app(buildEnv()) as DashboardResult;

  assertEquals(result.fromCache, false);
  assertEquals(result.positionCount, 2);
  assertEquals(result.totalExposure, 27_000);
  assertEquals(result.breachDetected, false);
  assertEquals(result.taskId, undefined);
  assertEquals(result.noteId, undefined);
  assertEquals(typeof result.summary, "string");
});

Deno.test("dashboard returns identity from CONFIGURATION", async () => {
  const result = await app(buildEnv()) as DashboardResult;

  assertObjectMatch(result.identity, { userId: "test-user-id", displayName: "Test User" });
});

Deno.test("dashboard detects breach, creates task and note above threshold", async () => {
  let taskCreated = false;
  let noteDeposited = false;
  let notificationSent = false;

  const env = buildEnv({
    FABRIC: {
      query: () =>
        Promise.resolve({
          rows: [{ symbol: "AAPL", quantity: 1000, value: 150_000, currency: "USD" }],
          total: 1,
          hasMore: false,
        }),
    },
    TASKS: {
      create: (opts: { title: string }) => {
        taskCreated = true;
        return Promise.resolve({
          taskId: "task-breach-001",
          createdAt: "2026-04-02T00:00:00.000Z",
          title: opts.title,
          assignedTo: "rm-user-001",
          status: "open" as const,
          priority: "high" as const,
        });
      },
    },
    NOTES: {
      deposit: (opts: { subject: string; createdBy: string }) => {
        noteDeposited = true;
        return Promise.resolve({
          noteId: "note-breach-001",
          createdAt: "2026-04-02T00:00:00.000Z",
          subject: opts.subject,
          createdBy: opts.createdBy,
          linkedEntities: [],
        });
      },
    },
    NOTIFICATIONS: {
      send: () => {
        notificationSent = true;
        return Promise.resolve({ deliveryId: "dlv-001", acceptedAt: "2026-04-02T00:00:00.000Z" });
      },
    },
  });

  const result = await app(env) as DashboardResult;

  assertEquals(result.breachDetected, true);
  assertEquals(result.totalExposure, 150_000);
  assertEquals(taskCreated, true);
  assertEquals(noteDeposited, true);
  assertEquals(notificationSent, true);
  assertEquals(result.taskId, "task-breach-001");
  assertEquals(result.noteId, "note-breach-001");
});

Deno.test("dashboard returns cached result on second call", async () => {
  const store = new Map<string, unknown>();
  let fabricCallCount = 0;

  const env = buildEnv({
    COSMOS: {
      get: (key: string) => Promise.resolve(store.get(key) as never),
      set: (key: string, value: unknown, _opts?: unknown) =>
        Promise.resolve(void store.set(key, value)),
      delete: (key: string) => Promise.resolve(void store.delete(key)),
      increment: () => Promise.resolve(1),
      lock: () => Promise.resolve({ release: () => Promise.resolve() }),
    },
    FABRIC: {
      query: () => {
        fabricCallCount++;
        return Promise.resolve({ rows: MOCK_POSITIONS, total: MOCK_POSITIONS.length, hasMore: false });
      },
    },
  });

  await app(env); // First call — populates cache, hits Fabric
  const second = await app(env) as DashboardResult; // Second call — should hit cache

  assertEquals(second.fromCache, true);
  assertEquals(fabricCallCount, 1); // Fabric called exactly once
});

Deno.test("dashboard includes universeId in result", async () => {
  const result = await app(buildEnv()) as DashboardResult;
  assertEquals(result.universeId, "UNIV-LIQUIDITY-TOP50");
});
