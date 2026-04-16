/**
 * Liquidity Dashboard — a sample Crimson micro-app.
 *
 * Demonstrates all ten capability bindings working together:
 *
 *   env.CONFIGURATION — resolve identity and per-user cache key
 *   env.COSMOS        — cache expensive results; lock prevents duplicate work
 *   env.UNIVERSES     — resolve the instruments in the liquidity universe
 *   env.FABRIC        — read live portfolio positions for those instruments
 *   env.API           — fetch current risk limits from the risk service
 *   env.WEB           — search for current market context
 *   env.AI            — summarize exposure and risk in natural language
 *   env.NOTIFICATIONS — alert the user when exposure exceeds threshold
 *   env.TASKS         — create a follow-up task when a breach is detected
 *   env.NOTES         — deposit an audit note on the account record
 *
 * A real app would live in its own repo and import from "@crimsonsdk/sdk".
 * Here we import direct from src to keep the sample self-contained.
 */

import { defineCrimsonApp } from "../../src/env.ts";
import { Errors } from "../../src/errors.ts";
import type { Fabric } from "../../src/capabilities/fabric.ts";

interface Position {
  symbol: string;
  quantity: number;
  value: number;
  currency: string;
}

interface RiskLimits {
  portfolioLimit: number;
  alertThreshold: number;
  currency: string;
  riskManagerId: string;
}

export interface DashboardResult {
  identity: { userId: string; displayName: string };
  universeId: string;
  summary: string;
  totalExposure: number;
  positionCount: number;
  breachDetected: boolean;
  taskId?: string;
  noteId?: string;
  fromCache: boolean;
}

const CACHE_TTL_SECONDS = 300;
const UNIVERSE_ID = "UNIV-LIQUIDITY-TOP50";

export default defineCrimsonApp(async (env) => {
  const identity = env.CONFIGURATION.getIdentity();
  const cacheKey = `liquidity:dashboard:${identity.userId}`;

  const cached = await env.COSMOS.get<DashboardResult>(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const lock = await env.COSMOS.lock(`lock:${cacheKey}`, { ttlMs: 30_000, waitMs: 5_000 });

  try {
    const afterLock = await env.COSMOS.get<DashboardResult>(cacheKey);
    if (afterLock) return { ...afterLock, fromCache: true };

    // Resolve the universe so we know which symbols are in scope
    const { constituents } = await env.UNIVERSES.constituents(UNIVERSE_ID);
    const symbols = constituents.map((c) => c.symbol);

    // Read positions for the in-scope instruments from the Fabric data platform
    const positions = await env.FABRIC.query<Position>("portfolio.positions", {
      filter: { accountId: identity.userId },
      orderBy: "value",
      order: "desc",
      limit: symbols.length || 50,
    });

    const totalExposure = positions.rows.reduce((sum, p) => sum + p.value, 0);

    // Fetch risk limits for this account
    const { data: riskLimits } = await env.API.call<RiskLimits>("/risk/v1/limits", {
      params: { accountId: identity.userId },
    });

    // Pull current market context via web search to ground the AI summary
    const marketContext = await env.WEB.search(
      `liquidity risk ${riskLimits.currency} market conditions ${new Date().getFullYear()}`,
      { limit: 3 },
    );
    const contextSnippets = marketContext.hits.map((h) => `- ${h.title}: ${h.snippet}`).join("\n");

    const topPositions = positions.rows
      .slice(0, 5)
      .map((p) => `${p.symbol} (${p.currency} ${p.value.toLocaleString()})`)
      .join(", ");

    const aiResult = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      system: "You are a financial analyst. Respond in 2-3 concise sentences.",
      prompt: [
        `Account: ${identity.displayName}`,
        `Total exposure: ${riskLimits.currency} ${totalExposure.toLocaleString()}`,
        `Portfolio limit: ${riskLimits.currency} ${riskLimits.portfolioLimit.toLocaleString()}`,
        `Top positions: ${topPositions}`,
        `Market context:\n${contextSnippets}`,
        `Summarize the key liquidity risks.`,
      ].join("\n"),
      maxTokens: 256,
    });

    let breachDetected = false;
    let taskId: string | undefined;
    let noteId: string | undefined;

    if (totalExposure > riskLimits.alertThreshold) {
      breachDetected = true;

      // Alert the account holder
      await env.NOTIFICATIONS.send({
        channel: "email",
        to: identity.email,
        subject: `Liquidity alert: exposure ${riskLimits.currency} ${totalExposure.toLocaleString()} exceeds threshold`,
        body: aiResult.response,
        metadata: { accountId: identity.userId, severity: "high" },
      });

      // Assign a follow-up task to the risk manager
      const task = await env.TASKS.create({
        title: `Review liquidity breach: ${identity.displayName} — ${riskLimits.currency} ${totalExposure.toLocaleString()}`,
        assignedTo: riskLimits.riskManagerId,
        status: "open",
        priority: "high",
      });
      taskId = task.taskId;

      // Deposit an audit note on the account record
      const note = await env.NOTES.deposit({
        subject: `Liquidity threshold breach detected`,
        content: aiResult.response,
        createdBy: identity.userId,
        linkedEntities: [{ type: "account", id: identity.userId }],
      });
      noteId = note.noteId;
    }

    const result: DashboardResult = {
      identity: { userId: identity.userId, displayName: identity.displayName },
      universeId: UNIVERSE_ID,
      summary: aiResult.response,
      totalExposure,
      positionCount: positions.total,
      breachDetected,
      taskId,
      noteId,
      fromCache: false,
    };

    await env.COSMOS.set(cacheKey, result, { ttlSeconds: CACHE_TTL_SECONDS });
    return result;
  } catch (err) {
    if (err instanceof Errors.Base) throw err;
    throw new Errors.Base("Dashboard computation failed", err);
  } finally {
    await lock.release();
  }
});

