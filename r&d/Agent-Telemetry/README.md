## Basic Azure telemetry setup for LLM / agent monitoring

The clean architecture is this:

**Agent coding tools → OpenTelemetry Collector → Azure Monitor / Application Insights → Logs / Agents View / Grafana dashboards**

For C# agents built with Microsoft Agent Framework, the path can be simpler:

**C# Agent Framework app → OpenTelemetry exporter → Azure Monitor / Application Insights**

Azure Monitor Application Insights now has an **Agents** view intended for AI agent monitoring, including agent runs, token usage, tool calls, model calls, errors, and end-to-end trace inspection. Microsoft also documents coding-agent dashboards for GitHub Copilot, Claude Code, OpenClaw, and similar OTLP-emitting coding agents. ([Microsoft Learn][1])

## What we need

First, create or choose an **Application Insights** resource backed by a **Log Analytics Workspace**. This is the central telemetry destination. The Application Insights connection string is the value used by SDKs or collectors to send telemetry. Microsoft recommends treating that connection string as a secret. ([Microsoft Learn][2])

Second, decide whether we want **content capture**. This is the sensitive part. Prompts, responses, tool arguments, file paths, command output, and function-call results may be captured depending on tool settings. Default should be: **no prompt/response capture in production** until security signs off. Microsoft’s Agent Framework docs warn that sensitive data capture can expose prompts, responses, function arguments, and tool results. ([Microsoft Learn][3])

Third, define naming conventions up front:

```text
service.name = agent-coding-copilot
service.name = agent-coding-claude-code
service.name = agent-coding-codex
service.name = hmc-agent-framework-demo
deployment.environment = dev | test | prod
team = app-dev | ai | platform
```

Without this, the dashboards become sludge.

## Track 1: Agent coding tools

For coding tools, use an **OpenTelemetry Collector** as the ingestion chokepoint. The coding tools emit OTLP. The collector receives OTLP and forwards it to Application Insights using the Azure Monitor exporter. Microsoft’s coding-agent monitoring guide shows exactly this pattern. ([Microsoft Learn][2])

Minimal collector shape:

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
      grpc:
        endpoint: 0.0.0.0:4317

exporters:
  azuremonitor:
    connection_string: "${APPLICATIONINSIGHTS_CONNECTION_STRING}"

service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [azuremonitor]
    metrics:
      receivers: [otlp]
      exporters: [azuremonitor]
    logs:
      receivers: [otlp]
      exporters: [azuremonitor]
```

Run it somewhere controlled: local dev first, then a small internal host/container if useful. Microsoft’s example exposes `4318` for OTLP/HTTP and `4317` for OTLP/gRPC. ([Microsoft Learn][2])

For **GitHub Copilot in VS Code**, enable OTel in VS Code settings and point it at the collector:

```json
{
  "github.copilot.chat.otel.enabled": true,
  "github.copilot.chat.otel.exporterType": "otlp-http",
  "github.copilot.chat.otel.otlpEndpoint": "http://localhost:4318",
  "github.copilot.chat.otel.captureContent": false
}
```

VS Code Copilot OTel can emit traces, metrics, and events for agent interactions, LLM calls, tool execution, and token usage. Content capture is off by default and must be enabled explicitly. ([Visual Studio Code][4])

For **Claude Code**, configure environment variables or managed settings:

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "http/protobuf",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "http://localhost:4318",
    "OTEL_LOG_USER_PROMPTS": "0",
    "OTEL_LOG_TOOL_DETAILS": "1"
  }
}
```

Claude Code officially supports exporting usage, cost, and tool activity through OpenTelemetry. It exports metrics, events/logs, and optionally traces. ([Claude API Docs][5])

For **Codex**, configure OTel in `~/.codex/config.toml`:

```toml
[otel]
environment = "staging"
exporter = "otlp-http"
log_user_prompt = false

[otel.exporter.otlp-http]
endpoint = "http://localhost:4318/v1/logs"
protocol = "binary"
```

Codex OTel export is opt-in, disabled by default, and user prompts are redacted unless explicitly enabled. It can emit events for API requests, streams, prompts, tool approvals, and tool results. ([OpenAI Developers][6])

## Track 2: C# agents using Microsoft Agent Framework

For C# agents, instrument the chat client or the agent with Agent Framework’s OpenTelemetry hooks, then export traces, metrics, and logs to Azure Monitor.

Microsoft’s Agent Framework emits traces, logs, and metrics using OpenTelemetry GenAI semantic conventions. For C#, the core calls are `.UseOpenTelemetry(...)` on the chat client and `.WithOpenTelemetry(...)` on the agent. ([Microsoft Learn][3])

Basic shape:

```csharp
const string SourceName = "hmc-agent-framework-demo";
const string ServiceName = "hmc-agent-framework-demo";

var instrumentedChatClient = chatClient
    .AsBuilder()
    .UseOpenTelemetry(
        sourceName: SourceName,
        configure: cfg => cfg.EnableSensitiveData = false)
    .Build();

var agent = new ChatClientAgent(
    instrumentedChatClient,
    name: "DemoAgent",
    instructions: "You are a monitored internal demo agent.",
    tools: [/* tools here */])
    .WithOpenTelemetry(
        sourceName: SourceName,
        configure: cfg => cfg.EnableSensitiveData = false);
```

Then wire exporters in startup:

```csharp
var appInsightsConnectionString =
    Environment.GetEnvironmentVariable("APPLICATIONINSIGHTS_CONNECTION_STRING")
    ?? throw new InvalidOperationException("APPLICATIONINSIGHTS_CONNECTION_STRING is not set.");

var resourceBuilder = ResourceBuilder
    .CreateDefault()
    .AddService(ServiceName);

using var tracerProvider = Sdk.CreateTracerProviderBuilder()
    .SetResourceBuilder(resourceBuilder)
    .AddSource(SourceName)
    .AddAzureMonitorTraceExporter(options =>
        options.ConnectionString = appInsightsConnectionString)
    .Build();

using var meterProvider = Sdk.CreateMeterProviderBuilder()
    .SetResourceBuilder(resourceBuilder)
    .AddSource(SourceName)
    .AddAzureMonitorMetricExporter(options =>
        options.ConnectionString = appInsightsConnectionString)
    .Build();
```

The `AddSource(SourceName)` value must match the source name used by `.UseOpenTelemetry(...)` / `.WithOpenTelemetry(...)`, otherwise traces may not appear where expected. Microsoft calls this out directly. ([Microsoft Learn][3])

## What we monitor first

Start with these, not everything:

```text
Adoption
    active users
    sessions per day
    tool usage by team

Cost / token pressure
    input tokens
    output tokens
    tokens by model
    tokens by tool or task type

Reliability
    failed runs
    tool errors
    timeout rate
    retry count
    slow model calls
    slow tool calls

Governance
    which tools were invoked
    whether approvals happened
    whether sensitive data capture is disabled
    which agent/runtime produced the trace
```

That is enough to make the conversation real. The point is not “we have observability.” The point is: **we can see cost, behavior, failure, and tool use before agent adoption becomes invisible infrastructure.** ⚙️

## Immediate next steps

1. Create a small **Application Insights + Log Analytics** target for agent telemetry.

2. Put the Application Insights connection string in **Key Vault** or an equivalent secret store. Do not paste it into repo config.

3. Stand up a local **OpenTelemetry Collector** and prove one coding agent can send telemetry into Azure.

4. Start with **Claude Code or Copilot**, because both have documented OTel paths. Add Codex once the collector path is proven.

5. Build one C# Microsoft Agent Framework demo with `.UseOpenTelemetry(...)` / `.WithOpenTelemetry(...)` and export to the same Application Insights resource.

6. Verify with simple KQL:

```kusto
dependencies
| where timestamp > ago(1h)
| summarize count() by cloud_RoleName
```

```kusto
customMetrics
| where timestamp > ago(1h)
| summarize count() by name
```

7. Review whether the **Agents** view in Application Insights gives enough out-of-box value. If not, add Azure Managed Grafana dashboards for coding-agent cost, tool use, latency, and errors.

8. Set the default policy: **no prompt/response capture in production** until approved. Enable it only in dev/test or for tightly scoped troubleshooting.

## Clean framing for the group

We need two telemetry paths.

For **coding agents**, the safest first move is a shared OpenTelemetry Collector that receives telemetry from tools like Copilot, Claude Code, and Codex, then forwards it to Azure Monitor.

For **our own C# agents**, we instrument the agent code directly with Microsoft Agent Framework’s OpenTelemetry support and export to Application Insights.

The first milestone is not a grand dashboard. It is a working trace that shows: who ran the agent, which model was called, which tools executed, how many tokens were used, how long it took, and where it failed.

[1]: https://learn.microsoft.com/en-us/azure/azure-monitor/app/agents-view "Monitor AI Agents with Application Insights - Azure Monitor | Microsoft Learn"
[2]: https://learn.microsoft.com/en-us/azure/managed-grafana/grafana-opentelemetry-app-insights "Monitor AI coding agents with Grafana | Microsoft Learn"
[3]: https://learn.microsoft.com/en-us/agent-framework/agents/observability "Observability | Microsoft Learn"
[4]: https://code.visualstudio.com/docs/copilot/guides/monitoring-agents "Monitor agent usage with OpenTelemetry"
[5]: https://docs.anthropic.com/en/docs/claude-code/monitoring-usage?utm_source=chatgpt.com "Monitoring - Claude Code Docs"
[6]: https://developers.openai.com/codex/config-advanced?utm_source=chatgpt.com "Advanced Configuration – Codex"
