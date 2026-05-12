---
title: OpenTelemetry for HMC Agents — Technical Memo
date: 2026-05-12
author: Pete Jensen
email: jensenp@hmc.harvard.edu
status: draft
service: HMC Agent Platform / HMC.ChatAI.Service / Agent Runtimes
tags: [opentelemetry, agents, observability, telemetry, governance, control-plane, chatai]
---

# OpenTelemetry for HMC Agents — Technical Memo

---

## Critical Context — What OTEL for Agents Actually Is

OpenTelemetry for agents is not normal application logging with token counts attached.

For HMC, the correct abstraction is an **agent execution flight recorder**: a traceable, queryable record of delegated action across model calls, retrieval, tool execution, policy checks, evaluations, human review, and final side effects.

The trace must answer:

- Who or what initiated the agent run?
- Which agent identity acted?
- What authority was delegated?
- Which model was used?
- Which tools or capability surfaces were invoked?
- What data sources were touched?
- What policy gates ran?
- What evaluations passed or failed?
- Was human review required?
- What did it cost?
- What failed?
- What side effects occurred?

This is a control-plane primitive, not an observability afterthought.

> **Application Insights tells us whether the service is healthy. Agent telemetry tells us whether non-human actors are acting safely, measurably, and economically.**

ChatAI is a good first proving ground because it already has model calls, tool dispatch, retrieval, streaming, conversation state, and user-facing behavior. But ChatAI should not define the architecture. The architecture should apply to any HMC agent runtime: ChatAI, research agents, document agents, code agents, scheduled agents, workflow agents, and future delegated-action systems.

---

## TL;DR

| Area | Recommendation |
|---|---|
| Telemetry standard | Use OpenTelemetry as the base standard |
| Agent semantics | Use OTEL GenAI semantic conventions where available |
| HMC-specific semantics | Add an `hmc.*` attribute namespace for authority, policy, capability, provenance, review, and cost |
| Backend routing | Emit OTLP to an OpenTelemetry Collector first, then export to Azure Monitor / Datadog / future backend |
| Root trace unit | `agent_run` / `invoke_workflow` |
| Core child spans | `invoke_agent`, `chat`, `retrieval`, `execute_tool`, `policy_check`, `eval_gate`, `human_review`, `commit_or_execute` |
| Sensitive data | Do not emit raw prompts, raw completions, SQL results, document text, or user-visible payloads by default |
| Primary dashboard | Cost per successful outcome, failures by capability, policy denies, review-required actions, write actions by agent |
| First implementation target | ChatAI / Aivy as the initial proving ground |
| Prime use | HMC-wide governed agent execution, not ChatAI-specific logging |
| Avoid | Treating Azure Monitor or Application Insights alone as the agent control plane |

---

## Current State of OTEL GenAI Support

OpenTelemetry now has GenAI semantic conventions for model calls, agent invocation, workflow invocation, retrieval, tool execution, token usage, and operation duration.

Useful standard operations include:

```text
chat
embeddings
execute_tool
generate_content
invoke_agent
invoke_workflow
retrieval
```

Important caveat: the GenAI conventions are still marked **Development**. HMC should use them, but should not let external convention churn control our internal audit model.

Practical implication:

```text
Use gen_ai.* where it exists.
Use hmc.* where HMC needs stronger operational semantics.
Version our own schema.
Keep raw content out by default.
```

---

## Architecture Principle

The important design unit is not the model call.

The important design unit is the **delegated action**.

A model call may be harmless. A retrieval call may expose confidential context. A tool call may mutate data. A workflow may combine several low-risk steps into a high-risk outcome. An agent may appear to be “just chatting” while actually exercising delegated authority through tools.

Telemetry needs to make that visible.

```text
User / Scheduler / System Trigger
    |
    v
Agent Runtime
    |
    | identity + delegated authority
    v
Agent / Workflow
    |
    | planning, reasoning, retrieval, model calls
    v
Capability Surface
    |
    | typed operation + known side effect + policy decision
    v
External System / Data Source / Write Target
```

This is why the span model needs to represent more than LLM latency.

---

## Target Architecture

```text
Agent Runtime / ChatAI / Agent Framework / Workflow Runner / Code Agent
    |
    | OTLP traces / metrics / logs
    v
OpenTelemetry Collector
    |
    | processors:
    |   batch
    |   memory_limiter
    |   redaction
    |   attribute normalization
    |   sampling
    |   routing
    v
Backends
    ├── Azure Monitor / Application Insights
    ├── Datadog / other observability backend
    ├── Blob / JSONL immutable archive
    └── Query store for agent governance dashboards
```

The Collector should be treated as the first control boundary.

Do not wire every agent directly to a vendor backend. That removes HMC’s ability to redact, normalize, route, sample, or fork telemetry later.

---

## Trace Model

The trace should follow the actual lifecycle of an agent run.

```text
trace: agent_run
    span: invoke_workflow document-analysis
        span: policy_check initial_authority
        span: retrieval azure_ai_search
        span: invoke_agent research-agent
            span: chat gpt-4.1
            span: execute_tool fabric.search
            span: execute_tool sql.read
            span: execute_tool repo.patch
        span: eval_gate groundedness
        span: eval_gate policy_compliance
        span: human_review approval
        span: commit_or_execute final_action
```

For a simple single-agent assistant request:

```text
trace: agent_run
    span: invoke_agent assistant
        span: chat model
        span: execute_tool search
        span: retrieval index
        span: chat model
        span: final_response
```

For a future multi-agent workflow:

```text
trace: agent_run
    span: invoke_workflow research-summary-review
        span: invoke_agent planner
        span: invoke_agent researcher
            span: retrieval search
            span: execute_tool document.read
        span: invoke_agent reviewer
            span: eval_gate source_grounding
            span: eval_gate policy_check
        span: human_review
        span: publish_response
```

For a code agent:

```text
trace: agent_run
    span: invoke_agent code-agent
        span: execute_tool repo.read
        span: execute_tool test.run
        span: chat model
        span: execute_tool repo.patch
        span: execute_tool test.run
        span: eval_gate diff_review
        span: human_review pull_request
        span: execute_tool pr.open
```

For a scheduled operational agent:

```text
trace: agent_run
    span: invoke_workflow scheduled-reconciliation
        span: policy_check scheduled_authority
        span: execute_tool sql.read
        span: execute_tool search.compare
        span: eval_gate anomaly_threshold
        span: execute_tool report.write
        span: notify_or_escalate
```

---

## Standard OTEL Attributes to Use

Use the standard `gen_ai.*` attributes when they exist.

```text
gen_ai.operation.name
gen_ai.agent.name
gen_ai.agent.id
gen_ai.provider.name
gen_ai.request.model
gen_ai.response.model
gen_ai.output.type
gen_ai.usage.input_tokens
gen_ai.usage.output_tokens
gen_ai.usage.reasoning.output_tokens
gen_ai.response.finish_reasons
gen_ai.conversation.id
server.address
error.type
```

Recommended operation values:

```text
gen_ai.operation.name = invoke_agent
gen_ai.operation.name = invoke_workflow
gen_ai.operation.name = chat
gen_ai.operation.name = retrieval
gen_ai.operation.name = execute_tool
gen_ai.operation.name = embeddings
```

Do not invent a new name when a standard OTEL operation already exists.

---

## HMC Attribute Namespace

OTEL does not yet know enough about HMC’s governance model. Add an internal namespace.

### Agent identity and delegation

```text
hmc.agent.run_id
hmc.agent.session_id
hmc.agent.name
hmc.agent.version
hmc.agent.kind
hmc.agent.identity
hmc.agent.delegated_by
hmc.agent.authority_level
hmc.agent.execution_mode
```

Example values:

```text
hmc.agent.kind = chat_assistant | research_agent | code_agent | workflow_agent | scheduled_agent
hmc.agent.authority_level = read_only | propose_only | review_required | write_enabled
hmc.agent.execution_mode = interactive | batch | scheduled | ci
```

### Capability surface

```text
hmc.capability.name
hmc.capability.version
hmc.capability.owner
hmc.capability.side_effect
hmc.capability.criticality
hmc.capability.rollback_supported
```

Example values:

```text
hmc.capability.side_effect = none | read | write | external
hmc.capability.criticality = low | medium | high | restricted
hmc.capability.rollback_supported = true | false
```

This is the key move.

A tool is not just a function. A tool is a governed capability surface.

### Policy and authorization

```text
hmc.policy.decision
hmc.policy.rule_id
hmc.policy.reason
hmc.policy.review_required
hmc.policy.effective_permissions
```

Example values:

```text
hmc.policy.decision = allow | deny | review_required
hmc.policy.review_required = true | false
```

### Provenance and context

```text
hmc.provenance.source_ids
hmc.provenance.source_count
hmc.provenance.context_hash
hmc.provenance.prompt_hash
hmc.provenance.document_ids
hmc.provenance.index_name
hmc.provenance.retrieval_mode
```

Example values:

```text
hmc.provenance.retrieval_mode = keyword | vector | hybrid | semantic_hybrid
```

### Evaluation and gates

```text
hmc.eval.name
hmc.eval.version
hmc.eval.outcome
hmc.eval.score
hmc.eval.threshold
hmc.eval.blocking
```

Example values:

```text
hmc.eval.outcome = pass | fail | warn | skipped
hmc.eval.blocking = true | false
```

### Human review

```text
hmc.review.required
hmc.review.requested_by
hmc.review.reviewer
hmc.review.outcome
hmc.review.duration_ms
```

Example values:

```text
hmc.review.outcome = approved | rejected | modified | expired | skipped
```

### Cost and budget

```text
hmc.cost.usd_estimate
hmc.cost.budget_name
hmc.cost.budget_remaining
hmc.cost.cost_center
hmc.cost.billable_unit
```

Primary metric:

```text
cost per successful outcome
```

Not cost per call. Not tokens alone. Outcome-adjusted cost.

---

## Required Span Types

### Root span: agent run

```text
name: agent_run {agent_name_or_workflow_name}
kind: INTERNAL
```

Attributes:

```text
hmc.agent.run_id
hmc.agent.session_id
hmc.agent.name
hmc.agent.version
hmc.agent.identity
hmc.agent.delegated_by
hmc.agent.authority_level
hmc.agent.execution_mode
hmc.cost.usd_estimate
```

### Agent invocation span

```text
name: invoke_agent {gen_ai.agent.name}
gen_ai.operation.name = invoke_agent
```

Use this for each logical agent.

### Workflow span

```text
name: invoke_workflow {workflow_name}
gen_ai.operation.name = invoke_workflow
```

Use this when the runtime is orchestrating multiple agents or explicit workflow phases.

### Model span

```text
name: chat {model}
gen_ai.operation.name = chat
```

Attributes:

```text
gen_ai.provider.name
gen_ai.request.model
gen_ai.response.model
gen_ai.output.type
gen_ai.usage.input_tokens
gen_ai.usage.output_tokens
gen_ai.response.finish_reasons
hmc.cost.usd_estimate
hmc.provenance.prompt_hash
```

Do not record `gen_ai.input.messages` or `gen_ai.output.messages` by default.

### Tool span

```text
name: execute_tool {capability_name}
gen_ai.operation.name = execute_tool
```

Attributes:

```text
hmc.capability.name
hmc.capability.version
hmc.capability.side_effect
hmc.capability.criticality
hmc.policy.decision
hmc.review.required
```

### Retrieval span

```text
name: retrieval {source}
gen_ai.operation.name = retrieval
```

Attributes:

```text
hmc.provenance.index_name
hmc.provenance.retrieval_mode
hmc.provenance.source_count
hmc.provenance.source_ids
```

### Eval span

```text
name: eval_gate {eval_name}
```

Attributes:

```text
hmc.eval.name
hmc.eval.version
hmc.eval.outcome
hmc.eval.score
hmc.eval.threshold
hmc.eval.blocking
```

This is HMC-specific for now.

### Human review span

```text
name: human_review {review_type}
```

Attributes:

```text
hmc.review.required
hmc.review.reviewer
hmc.review.outcome
hmc.review.duration_ms
```

---

## Events vs Spans

Use spans for timed operations.

Use events for significant state transitions.

Recommended event names:

```text
AgentSessionStarted
PolicyEvaluated
CapabilityResolved
ToolInvoked
ToolCompleted
RetrievalPerformed
ModelInvoked
EvalExecuted
ApprovalRequested
ApprovalGranted
ApprovalRejected
CommandExecuted
FileRead
FileWritten
DiffProduced
PullRequestOpened
SessionCompleted
SessionFailed
```

Important distinction:

```text
Trace = timing and causality view.
Event stream = audit and replay primitive.
```

HMC should not rely on traces alone for audit. Traces can be sampled, dropped, truncated, or backend-limited. Critical governance events should also be written to an append-only event stream.

Recommended storage split:

```text
OTEL traces
    Used for debugging, latency, correlation, operational visibility.

Append-only JSONL / Blob archive
    Used for durable audit and replay.

Queryable table store
    Used for dashboards, investigations, governance reports.
```

---

## Collector Configuration

Minimal local collector:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 512

  batch: {}

exporters:
  debug:
    verbosity: basic

  otlphttp/main:
    endpoint: ${env:OTEL_BACKEND_OTLP_ENDPOINT}
    headers:
      api-key: ${env:OTEL_BACKEND_API_KEY}

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [debug, otlphttp/main]

    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [debug, otlphttp/main]

    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [debug, otlphttp/main]
```

Production should add:

```text
redaction processor
attribute normalization
tail sampling for agent failures
routing by environment / service / data classification
separate export path for audit-critical events
```

---

## .NET Implementation Shape

Implement agent telemetry as middleware around the execution loop, not as scattered logging calls.

```csharp
public interface IAgentTelemetry
{
    Task<T> RunAgentSpanAsync<T>(
        AgentTelemetryContext context,
        Func<Activity, Task<T>> operation);

    Task<T> RunModelSpanAsync<T>(
        ModelTelemetryContext context,
        Func<Activity, Task<T>> operation);

    Task<T> RunToolSpanAsync<T>(
        CapabilityTelemetryContext context,
        Func<Activity, Task<T>> operation);

    Task<T> RunEvalSpanAsync<T>(
        EvalTelemetryContext context,
        Func<Activity, Task<T>> operation);
}
```

Recommended `ActivitySource`:

```csharp
public static class AgentTelemetry
{
    public const string ActivitySourceName = "HMC.AgentRuntime";
    public static readonly ActivitySource ActivitySource = new(ActivitySourceName, "0.1.0");
}
```

Agent span wrapper:

```csharp
public async Task<T> RunAgentSpanAsync<T>(
    AgentTelemetryContext context,
    Func<Activity, Task<T>> operation)
{
    using var activity = AgentTelemetry.ActivitySource.StartActivity(
        $"invoke_agent {context.AgentName}",
        ActivityKind.Internal);

    if (activity is null)
    {
        return await operation(null!);
    }

    activity.SetTag("gen_ai.operation.name", "invoke_agent");
    activity.SetTag("gen_ai.agent.name", context.AgentName);
    activity.SetTag("gen_ai.agent.version", context.AgentVersion);

    activity.SetTag("hmc.agent.run_id", context.RunId);
    activity.SetTag("hmc.agent.session_id", context.SessionId);
    activity.SetTag("hmc.agent.identity", context.AgentIdentity);
    activity.SetTag("hmc.agent.delegated_by", context.DelegatedBy);
    activity.SetTag("hmc.agent.authority_level", context.AuthorityLevel);
    activity.SetTag("hmc.agent.execution_mode", context.ExecutionMode);

    try
    {
        var result = await operation(activity);
        activity.SetStatus(ActivityStatusCode.Ok);
        return result;
    }
    catch (Exception ex)
    {
        activity.SetTag("error.type", ex.GetType().Name);
        activity.SetStatus(ActivityStatusCode.Error, ex.Message);
        activity.AddException(ex);
        throw;
    }
}
```

Tool span wrapper:

```csharp
public async Task<T> RunToolSpanAsync<T>(
    CapabilityTelemetryContext context,
    Func<Activity, Task<T>> operation)
{
    using var activity = AgentTelemetry.ActivitySource.StartActivity(
        $"execute_tool {context.CapabilityName}",
        ActivityKind.Internal);

    if (activity is null)
    {
        return await operation(null!);
    }

    activity.SetTag("gen_ai.operation.name", "execute_tool");

    activity.SetTag("hmc.capability.name", context.CapabilityName);
    activity.SetTag("hmc.capability.version", context.CapabilityVersion);
    activity.SetTag("hmc.capability.owner", context.Owner);
    activity.SetTag("hmc.capability.side_effect", context.SideEffect);
    activity.SetTag("hmc.capability.criticality", context.Criticality);
    activity.SetTag("hmc.capability.rollback_supported", context.RollbackSupported);

    activity.SetTag("hmc.policy.decision", context.PolicyDecision);
    activity.SetTag("hmc.review.required", context.ReviewRequired);

    try
    {
        var result = await operation(activity);
        activity.SetStatus(ActivityStatusCode.Ok);
        return result;
    }
    catch (Exception ex)
    {
        activity.SetTag("error.type", ex.GetType().Name);
        activity.SetStatus(ActivityStatusCode.Error, ex.Message);
        activity.AddException(ex);
        throw;
    }
}
```

Model span wrapper:

```csharp
public async Task<T> RunModelSpanAsync<T>(
    ModelTelemetryContext context,
    Func<Activity, Task<ModelCallResult<T>>> operation)
{
    using var activity = AgentTelemetry.ActivitySource.StartActivity(
        $"chat {context.RequestModel}",
        ActivityKind.Client);

    if (activity is null)
    {
        return (await operation(null!)).Value;
    }

    activity.SetTag("gen_ai.operation.name", "chat");
    activity.SetTag("gen_ai.provider.name", context.ProviderName);
    activity.SetTag("gen_ai.request.model", context.RequestModel);
    activity.SetTag("gen_ai.output.type", context.OutputType);

    activity.SetTag("hmc.provenance.prompt_hash", context.PromptHash);
    activity.SetTag("hmc.cost.budget_name", context.BudgetName);

    try
    {
        var result = await operation(activity);

        activity.SetTag("gen_ai.response.model", result.ResponseModel);
        activity.SetTag("gen_ai.usage.input_tokens", result.InputTokens);
        activity.SetTag("gen_ai.usage.output_tokens", result.OutputTokens);
        activity.SetTag("hmc.cost.usd_estimate", result.CostUsdEstimate);

        activity.SetStatus(ActivityStatusCode.Ok);
        return result.Value;
    }
    catch (Exception ex)
    {
        activity.SetTag("error.type", ex.GetType().Name);
        activity.SetStatus(ActivityStatusCode.Error, ex.Message);
        activity.AddException(ex);
        throw;
    }
}
```

---

## OpenTelemetry Registration in .NET

```csharp
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource =>
    {
        resource
            .AddService(
                serviceName: "HMC.AgentRuntime",
                serviceVersion: ThisAssembly.AssemblyInformationalVersion)
            .AddAttributes(new Dictionary<string, object>
            {
                ["deployment.environment"] = builder.Environment.EnvironmentName,
                ["service.namespace"] = "hmc.ai",
            });
    })
    .WithTracing(tracing =>
    {
        tracing
            .AddSource("HMC.AgentRuntime")
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddOtlpExporter();
    })
    .WithMetrics(metrics =>
    {
        metrics
            .AddMeter("HMC.AgentRuntime")
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddOtlpExporter();
    });
```

Environment:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
OTEL_SERVICE_NAME=HMC.AgentRuntime
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=dev,service.namespace=hmc.ai
```

For Azure Monitor direct export:

```csharp
builder.Services.AddOpenTelemetry()
    .UseAzureMonitor(options =>
    {
        options.ConnectionString = configuration["ApplicationInsights:ConnectionString"];
    });
```

Recommendation: prefer OTLP to Collector first unless there is a strong reason to export directly.

---

## Deno / Sandbox Runtime Shape

For Deno-based agent harnesses or sandboxed micro-apps:

```bash
OTEL_DENO=true \
OTEL_SERVICE_NAME=hmc-agent-sandbox \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 \
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf \
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=dev,service.namespace=hmc.ai \
deno run --allow-net --allow-env main.ts
```

Manual spans:

```ts
import { trace, SpanStatusCode } from "npm:@opentelemetry/api@1";

const tracer = trace.getTracer("HMC.AgentRuntime", "0.1.0");

export async function executeCapability<T>(
  capabilityName: string,
  sideEffect: "none" | "read" | "write" | "external",
  fn: () => Promise<T>,
): Promise<T> {
  return await tracer.startActiveSpan(
    `execute_tool ${capabilityName}`,
    {
      attributes: {
        "gen_ai.operation.name": "execute_tool",
        "hmc.capability.name": capabilityName,
        "hmc.capability.side_effect": sideEffect,
      },
    },
    async (span) => {
      try {
        const result = await fn();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setAttribute(
          "error.type",
          error instanceof Error ? error.name : "UnknownError",
        );
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    },
  );
}
```

---

## Metrics

Required first-pass metrics:

```text
agent.run.count
agent.run.duration
agent.run.failure.count
agent.run.success.count
agent.cost.usd
agent.cost.per_successful_outcome
agent.policy.deny.count
agent.policy.review_required.count
agent.review.approval.count
agent.review.rejection.count
agent.capability.invocation.count
agent.capability.failure.count
agent.eval.pass.count
agent.eval.fail.count
agent.eval.warn.count
```

Use OTEL GenAI metrics for model-level usage where available:

```text
gen_ai.client.token.usage
gen_ai.client.operation.duration
gen_ai.client.operation.time_to_first_chunk
gen_ai.client.operation.time_per_output_chunk
```

HMC-specific dashboards should derive from both standard GenAI metrics and `hmc.*` attributes.

---

## First Dashboards

### 1. Agent Run Health

```text
runs by agent/version
success rate
failure rate
p95 duration
top error.type values
```

### 2. Cost and Budget

```text
cost by agent
cost by model
cost by capability
cost per successful outcome
token usage by task type
```

### 3. Capability Surface Risk

```text
tool calls by side-effect class
write actions by agent identity
restricted capability calls
capability failures
capability owner view
```

### 4. Policy and Review

```text
policy allows
policy denies
review-required actions
approval rate
rejection rate
average review duration
```

### 5. Retrieval and Provenance

```text
retrieval mode
index name
source count
empty retrievals
low-confidence retrievals
responses without sufficient provenance
```

### 6. Eval Gates

```text
eval pass/fail/warn
blocking eval failures
eval score drift
failures by model
failures by agent version
```

---

## High-Value Queries

Every write action by an agent:

```text
hmc.capability.side_effect = write
```

Every write action that required review:

```text
hmc.capability.side_effect = write
AND hmc.review.required = true
```

Every denied action:

```text
hmc.policy.decision = deny
```

Every agent run with a failed blocking eval:

```text
hmc.eval.outcome = fail
AND hmc.eval.blocking = true
```

Every high-cost failed run:

```text
agent.run.status = failed
AND hmc.cost.usd_estimate > 5.00
```

Every restricted capability call:

```text
hmc.capability.criticality = restricted
```

The killer control-plane view:

```text
Show me every trace where:
    hmc.capability.side_effect = write
    OR hmc.policy.decision = deny
    OR hmc.review.required = true
    OR hmc.eval.outcome = fail
    OR error.type exists
```

---

## Data Handling Rules

Default: do not record content.

Do not emit:

```text
raw prompts
raw completions
document text
SQL result sets
email bodies
chat history
user names
account numbers
portfolio holdings
file contents
secrets
access tokens
```

Emit:

```text
hashes
IDs
counts
classifications
model names
token counts
cost estimates
source IDs
trace IDs
capability names
policy decisions
eval outcomes
review outcomes
```

Optional debug mode may capture content only when all are true:

```text
explicit debug flag enabled
non-production environment
short retention
redaction enabled
access restricted
payload size capped
sensitive data classification checked
```

---

## Decision Tree for HMC

```text
Are we instrumenting normal web/service behavior?
└── Use existing OpenTelemetry + Application Insights patterns.

Are we instrumenting model calls?
└── Use OTEL GenAI spans and metrics.
    └── Record model, provider, token counts, latency, finish reason.
    └── Do not record raw input/output by default.

Are we instrumenting tool use?
└── Wrap every tool as execute_tool.
    └── Add hmc.capability.* attributes.
    └── Add hmc.policy.* attributes.
    └── Add hmc.review.* attributes when applicable.

Are we instrumenting agent workflows?
└── Root the trace around agent_run / invoke_workflow.
    └── Child spans for agents, model calls, retrieval, tools, evals, review.

Is the action side-effecting?
└── Require policy decision + review semantics in telemetry.
    └── No write action should be invisible to the control plane.

Do we need audit/replay?
└── Write append-only agent events in addition to OTEL traces.
```

---

## Where ChatAI Fits

ChatAI is the right first implementation target because it already exercises the core shape:

```text
user request
conversation/session state
model call
retrieval
tool/function dispatch
streaming response
cost/token tracking
errors
```

That makes it a good pilot surface for the telemetry spine.

But ChatAI should be treated as **Phase 0**, not the destination architecture.

The goal is not:

```text
Add better tracing to ChatAI.
```

The goal is:

```text
Create the HMC agent execution telemetry pattern,
prove it in ChatAI,
then apply it consistently to every agent runtime.
```

---

## Mapping to ChatAI as Phase 0

| Current ChatAI area | OTEL target |
|---|---|
| `ChatJob` / orchestration | Root `agent_run` span |
| Aivy assistant execution | `invoke_agent aivy` span |
| Azure OpenAI calls | `chat {model}` spans |
| Tool/function dispatch | `execute_tool {capability}` spans |
| SmartSearch / Azure AI Search | `retrieval {index}` spans |
| SignalR status updates | span events or logs correlated by trace ID |
| Cosmos-backed history | `gen_ai.conversation.id` + `hmc.agent.session_id` |
| Prompt construction | `hmc.provenance.prompt_hash` |
| Document grounding | `hmc.provenance.source_ids` |
| Safety checks | `policy_check` / `eval_gate` spans |
| Human approval | `human_review` span |
| Cost tracking | `hmc.cost.*` attributes + metrics |

This gives HMC a real trace corpus quickly without pretending ChatAI is the only consumer.

---

## Other Likely Consumers

### Research agents

```text
research task
retrieval
source inspection
synthesis
citation/provenance checks
eval gates
final artifact
```

### Document agents

```text
document intake
classification
extraction
chunking
summarization
indexing
validation
```

### Code agents

```text
repo read
plan
diff generation
test execution
static analysis
pull request creation
human review
```

### Scheduled agents

```text
time-based trigger
policy check
read operations
comparison/reconciliation
threshold checks
notification or escalation
```

### Workflow agents

```text
multi-step orchestration
handoffs
parallel agent execution
review gates
side-effecting final action
```

Each of these should emit the same basic telemetry shape.

---

## What Changes

- Every agent run gets a trace ID.
- Every model call is visible.
- Every tool call is visible.
- Every side effect is classified.
- Every policy decision is recorded.
- Every review gate is recorded.
- Every eval is recorded.
- Cost becomes attributable to agent, model, workflow, and capability.
- Debugging moves from “read logs” to “inspect execution graph.”

---

## What Does NOT Change

- Existing service boundaries remain valid.
- Azure Monitor can still be a backend.
- Application Insights can still track standard service health.
- Cosmos / Blob persistence still exists.
- Existing search/indexing pipelines do not need to be rewritten.
- Tool implementations do not need to become agent-specific.
- ChatAI does not become the agent platform by implication.

The change is wrapping and standardizing execution, not rewriting the platform.

---

## Risks

### Risk: OTEL GenAI conventions are still moving

Mitigation:

```text
Use standard fields where mature enough.
Keep HMC governance fields in hmc.*.
Version the internal schema.
Avoid backend-specific coupling.
```

### Risk: Sensitive data leaks into telemetry

Mitigation:

```text
No raw content by default.
Redaction at SDK and Collector layers.
Use hashes and references.
Explicit debug-only content capture.
Short retention for debug payloads.
```

### Risk: High-cardinality attributes explode cost

Mitigation:

```text
Be careful with source_ids, document_ids, user-level identifiers.
Hash or bucket where necessary.
Put large arrays in audit/event storage, not span attributes.
Use trace links or blob references for large provenance sets.
```

### Risk: Traces are mistaken for audit

Mitigation:

```text
Use OTEL for observability.
Use append-only events for durable audit/replay.
Project both into governance dashboards.
```

### Risk: Teams add telemetry inconsistently

Mitigation:

```text
Create one shared HMC.AgentTelemetry package.
Centralize span wrappers.
Require capability metadata.
Block raw tool invocation without telemetry wrapper.
```

### Risk: The first implementation overfits to ChatAI

Mitigation:

```text
Treat ChatAI as Phase 0 only.
Name the package HMC.AgentTelemetry, not HMC.ChatAITelemetry.
Keep schema agent-runtime neutral.
Use generic capability metadata.
Validate against at least one non-ChatAI workflow before calling the pattern stable.
```

---

## Recommended Implementation Plan

### Phase 0 — Prove the telemetry spine in ChatAI

Scope:

```text
Aivy request lifecycle
model calls
tool calls
retrieval calls
token counts
errors
cost estimates
```

Deliverables:

```text
HMC.AgentTelemetry package
OTEL Collector config
local dev trace viewer
Azure Monitor export path
first agent run dashboard
```

### Phase 1 — Generalize across agent runtimes

Scope:

```text
shared run/span schema
agent identity
workflow identity
execution mode
standard root span behavior
```

Deliverables:

```text
agent telemetry schema document
shared .NET wrapper package
Deno wrapper for sandbox agents
example traces from at least two runtimes
```

### Phase 2 — Capability surface telemetry

Scope:

```text
tool registry
capability metadata
side-effect classification
policy decisions
review-required flags
```

Deliverables:

```text
capability schema
execute_tool wrapper
policy_check span
review_required telemetry
restricted capability dashboard
```

### Phase 3 — Evals and review gates

Scope:

```text
groundedness checks
policy checks
format checks
human review
approval/rejection outcomes
```

Deliverables:

```text
eval_gate span wrapper
review span wrapper
eval metrics
blocked-action dashboard
```

### Phase 4 — Audit/replay event stream

Scope:

```text
append-only agent events
blob/JSONL immutable archive
queryable projection store
trace-to-event correlation
```

Deliverables:

```text
agent event schema
event writer
trace_id/run_id correlation
replay investigation view
```

---

## Recommendation

Start with the smallest useful control-plane slice:

```text
ChatAI / Aivy as Phase 0
    root agent run span
    model call spans
    tool call spans
    retrieval spans
    token/cost metrics
    policy/review placeholders
    no raw content
    OTLP to Collector
```

But design the package, schema, and dashboards around HMC-wide agent execution.

The durable spine is:

```text
identity
delegation
capability
policy
provenance
eval
review
cost
audit
```

Build the control plane, not the magic trick.

---

## References

- OpenTelemetry GenAI agent semantic conventions
- OpenTelemetry GenAI span semantic conventions
- OpenTelemetry GenAI metrics semantic conventions
- OpenTelemetry Collector architecture and configuration
- Azure Monitor OpenTelemetry configuration
- Microsoft Foundry Agent Framework tracing preview
