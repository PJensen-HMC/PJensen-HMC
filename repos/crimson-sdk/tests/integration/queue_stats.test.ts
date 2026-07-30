import { assertEquals } from "@std/assert";
import { createEnv, StaticTokenProvider } from "../../src/mod.ts";

const RUN_INTEGRATION =
  Deno.env.get("RUN_CRIMSON_QUEUE_STATS_INTEGRATION") === "1";
const QUEUE_BINDING = "index-document-command";
const CONNECTION_STRING_SECRET = "AzureServiceBus";
const DEFAULT_INTERVAL_MS = 60_000;
const MINIMUM_INTERVAL_MS = 30_000;
const DEFAULT_SAMPLES = 10;
const MAXIMUM_SAMPLES = 60;

function boundedInteger(
  variable: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const value = Number(Deno.env.get(variable) ?? fallback);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(
      `${variable} must be an integer between ${minimum} and ${maximum}`,
    );
  }
  return value;
}

interface DepthObservation {
  observedAt: number;
  activeMessageCount: number;
  totalMessageCount: number;
}

function slopePerMinute(
  observations: DepthObservation[],
  field: "activeMessageCount" | "totalMessageCount",
): number | undefined {
  if (observations.length < 2) return undefined;
  const origin = observations[0].observedAt;
  const points = observations.map((observation) => ({
    x: (observation.observedAt - origin) / 60_000,
    y: observation[field],
  }));
  const meanX = points.reduce((sum, point) => sum + point.x, 0) /
    points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) /
    points.length;
  const denominator = points.reduce(
    (sum, point) => sum + (point.x - meanX) ** 2,
    0,
  );
  if (denominator === 0) return undefined;
  return points.reduce(
    (sum, point) => sum + (point.x - meanX) * (point.y - meanY),
    0,
  ) / denominator;
}

function signedRate(value: number | undefined): string {
  if (value === undefined) return "n/a";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}/min`;
}
Deno.test({
  name: "QUEUES observes index-document-command depth at a measured interval",
  ignore: !RUN_INTEGRATION,
  async fn() {
    const connectionString = Deno.env.get(
      "CRIMSON_SERVICE_BUS_CONNECTION_STRING",
    );
    if (!connectionString) {
      throw new Error(
        "CRIMSON_SERVICE_BUS_CONNECTION_STRING must contain a Service Bus " +
          "connection string with Manage rights",
      );
    }
    const intervalMs = boundedInteger(
      "CRIMSON_QUEUE_STATS_INTERVAL_MS",
      DEFAULT_INTERVAL_MS,
      MINIMUM_INTERVAL_MS,
      15 * 60_000,
    );
    const samples = boundedInteger(
      "CRIMSON_QUEUE_STATS_SAMPLES",
      DEFAULT_SAMPLES,
      1,
      MAXIMUM_SAMPLES,
    );

    const unusedUrl = "https://unused.invalid";
    const env = createEnv({
      appIdentity: {
        appId: "queue-stats-integration-test",
        appName: "Queue stats integration test",
        tenantId: "hmc",
        grantedScopes: [],
      },
      tokens: new StaticTokenProvider({}),
      bindingSnapshot: {
        version: "queue-stats-integration-test",
        api: {},
        queues: {
          [QUEUE_BINDING]: {
            provider: "azure-service-bus",
            entity: QUEUE_BINDING,
            connectionStringSecret: CONNECTION_STRING_SECRET,
            capabilities: ["inspect"],
          },
        },
      },
      secrets: {
        get: (name) =>
          name === CONNECTION_STRING_SECRET ? connectionString : undefined,
      },
      serviceUrls: {
        fabric: unusedUrl,
        ai: unusedUrl,
        notifications: unusedUrl,
        tasks: unusedUrl,
        universes: unusedUrl,
        web: unusedUrl,
        cosmos: unusedUrl,
      },
      serviceRoutes: { notifications: { events: "/unused" } },
    });

    const observations: DepthObservation[] = [];
    for (let sample = 1; sample <= samples; sample++) {
      try {
        const stats = await env.QUEUES.stats(QUEUE_BINDING);
        const observedAt = Date.now();
        observations.push({
          observedAt,
          activeMessageCount: stats.activeMessageCount,
          totalMessageCount: stats.totalMessageCount,
        });
        console.log(
          `[${new Date(observedAt).toISOString()}] ${QUEUE_BINDING} ` +
            `active=${stats.activeMessageCount} ` +
            `deadLettered=${stats.deadLetterMessageCount} ` +
            `scheduled=${stats.scheduledMessageCount} ` +
            `total=${stats.totalMessageCount} ` +
            `activeSlope=${
              signedRate(
                slopePerMinute(observations, "activeMessageCount"),
              )
            } ` +
            `totalSlope=${
              signedRate(
                slopePerMinute(observations, "totalMessageCount"),
              )
            }`,
        );
      } catch (cause) {
        throw new Error(
          `Could not inspect ${QUEUE_BINDING}. Azure Service Bus queue ` +
            "inspection requires a SAS policy with Manage rights.",
          { cause },
        );
      }

      if (sample < samples) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    assertEquals(observations.length, samples);
    console.log(`Final active backlog slope: ${
      signedRate(
        slopePerMinute(observations, "activeMessageCount"),
      )
    }`);
  },
});
