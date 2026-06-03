# Azure Agent Telemetry Setup

## Purpose

We need basic telemetry for two different agent categories:

1. Agent coding tools, such as Claude Code, Codex, and VS Code agent tooling.
2. Agents we build ourselves, especially C# agents using Microsoft Agent Framework.

The goal is not a large monitoring program on day one. The first goal is visibility into usage, failures, tool calls, latency, and token pressure.

## Basic Architecture

### Agent Coding Tools

```text
Developer machine
  Claude Code
  Codex
  VS Code / Copilot agent tooling
    ↓ OTLP
Internal Agent Telemetry Endpoint
    ↓
OpenTelemetry Collector
    ↓
Azure Monitor / Application Insights / Log Analytics
```

### C# Agent Framework Agents

```text
C# Agent Framework service
    ↓ OpenTelemetry / Azure Monitor exporter
Azure Monitor / Application Insights / Log Analytics
```

## Key Point

We do not build the OpenTelemetry Collector itself.

We do need to build and own a small internal telemetry intake layer around it.

That means we own:

* The deployment
* The endpoint
* The collector configuration
* The network access model
* Secret handling
* Naming conventions
* Basic dashboards
* Onboarding instructions
* Data capture policy

## What Is the OpenTelemetry Collector?

The OpenTelemetry Collector is an off-the-shelf telemetry relay.

It receives telemetry from tools and services, then forwards that telemetry to a backend such as Azure Monitor or Application Insights.

For our use case, it receives OTLP telemetry from developer tools and forwards it into Azure.

It usually listens on:

```text
4317 = OTLP over gRPC
4318 = OTLP over HTTP
```

## Why Use a Shared Collector?

A shared collector prevents every developer machine from being individually wired to Azure.

It gives us one place to control:

* Azure connection strings
* Routing
* Environment labels
* Tool labels
* Sampling
* Field dropping
* Future filtering
* Endpoint access

Without this layer, each tool either emits no telemetry or sends telemetry directly to Azure in an ad hoc way.

## What We Need in Azure

Create or identify:

* Application Insights resource
* Log Analytics Workspace
* Azure Monitor access model
* Key Vault entry for the Application Insights connection string
* Dashboard location, likely Azure Monitor Workbook or Azure Managed Grafana

The Application Insights connection string should stay server-side. It should not be distributed to every developer laptop.

## Internal Agent Telemetry Endpoint

This is the piece we need to stand up.

It can start as a small containerized service.

Possible hosting options:

* Internal VM
* Azure Container Apps
* App Service container
* AKS
* Existing internal container platform

For a first pass, the endpoint should expose OTLP HTTP:

```text
https://otel-agent-dev.company.net/v1/traces
https://otel-agent-dev.company.net/v1/metrics
https://otel-agent-dev.company.net/v1/logs
```

Local proof-of-concept can use:

```text
http://localhost:4318
```

## Collector Responsibilities

The collector should:

* Receive OTLP telemetry from coding tools
* Attach standard resource labels where possible
* Drop known risky fields where possible
* Forward telemetry to Azure Monitor / Application Insights
* Keep Azure secrets off developer machines

The collector should not be treated as a full data-loss-prevention layer.

The primary safety control is still configuring each tool not to emit raw prompts, responses, attachments, command output, or file contents unless explicitly approved.

## First Telemetry Fields to Care About

Start with a narrow set.

### Usage

* Sessions by tool
* Active users or machines, if allowed
* Agent runs per day
* Model calls per day

### Cost and Token Pressure

* Input tokens
* Output tokens
* Total tokens
* Model name
* Tool name
* Runtime or source tool

### Reliability

* Failed runs
* Tool errors
* Timeouts
* Retry counts
* Slow model calls
* Slow tool calls

### Governance

* Which tools were invoked
* Whether approvals occurred
* Whether prompt capture is disabled
* Which runtime emitted the trace
* Which environment emitted the trace

## Naming Conventions

Define these before the pilot spreads.

```text
service.name = claude-code
service.name = codex
service.name = vscode-agent-tools
service.name = hmc-agent-framework-demo

deployment.environment = dev | test | prod
source_tool = claude-code | codex | copilot | agent-framework
team = ai | app-dev | platform
```

Bad naming will make the telemetry hard to use later.

## Track 1: Agent Coding Tools

For coding tools, point the tool at the shared OTLP endpoint.

Example local development endpoint:

```text
http://localhost:4318
```

Example shared endpoint:

```text
https://otel-agent-dev.company.net
```

Each tool will have its own configuration shape, but the pattern is the same:

```text
Tool emits OTLP telemetry
Collector receives it
Collector forwards to Azure
```

Default policy:

* Prompt logging off
* Response logging off
* Tool details limited
* Command output off unless approved
* File contents off

## Track 2: C# Agent Framework Agents

For C# agents we own, start with direct Azure Monitor export from the app.

The app should emit:

* Traces
* Metrics
* Logs
* Model calls
* Tool calls
* Errors
* Latency

Use the same naming conventions as the coding-tool path.

Later, we can decide whether C# agents should also route through the collector. For the first pass, direct Azure export is simpler.

## Minimal Collector Configuration Shape

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch: {}

exporters:
  azuremonitor:
    connection_string: ${APPLICATIONINSIGHTS_CONNECTION_STRING}

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [azuremonitor]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [azuremonitor]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [azuremonitor]
```

## TODO List

### 1. Choose the Azure Target

* Create or identify the Application Insights resource.
* Confirm the backing Log Analytics Workspace.
* Confirm who can view telemetry.
* Confirm retention period.

### 2. Store the Azure Connection String

* Store the Application Insights connection string in Key Vault or an approved secret store.
* Do not put it in source control.
* Do not distribute it to developer laptops.

### 3. Stand Up the First Collector

* Start with a local Docker proof-of-concept.
* Confirm the collector starts cleanly.
* Confirm the health endpoint responds.
* Confirm it can reach Azure Monitor.

### 4. Create the Shared Endpoint

* Pick hosting target.
* Expose OTLP HTTP.
* Add TLS.
* Restrict access to internal users or networks.
* Decide whether authentication is needed for the pilot.

### 5. Connect One Coding Tool

Pick one first:

* Claude Code
* Codex
* VS Code / Copilot agent tooling

Configure it to send OTLP telemetry to the collector.

Keep prompt and response capture disabled.

### 6. Validate the First Signal

Confirm we can see:

* One session
* One model call
* One tool call, if available
* One error, if forced intentionally
* Token fields, if emitted by the tool
* Source tool name
* Environment name

### 7. Add Basic Dashboards

Start with four views:

* Usage by source tool
* Token volume by model and source tool
* Error rate by source tool
* Slow calls and failed tool calls

Do not start with a huge dashboard set.

### 8. Define Capture Policy

Write down what is allowed and what is not allowed.

Decide policy for:

* Prompts
* Responses
* File paths
* File contents
* Shell commands
* Shell output
* Tool arguments
* Tool results
* Attachments
* User identifiers

Default should be minimal capture.

### 9. Add C# Agent Framework Instrumentation

* Add OpenTelemetry instrumentation to one C# agent.
* Export to Azure Monitor.
* Use the same service naming conventions.
* Confirm traces appear in Application Insights.
* Confirm model calls and tool calls are visible.

### 10. Prepare Pilot Instructions

Write a short setup page for pilot users:

* What tool is supported
* What endpoint to use
* What settings to enable
* What settings must remain disabled
* How to verify telemetry is being sent
* Who owns support

## First Milestone

The first milestone is not a polished dashboard.

The first milestone is proving that one coding tool and one C# agent can emit telemetry into Azure with prompt and response capture disabled.

A successful first milestone shows:

* Source tool
* Agent or session identifier
* Model call
* Token count, if available
* Tool call, if available
* Latency
* Error status
* Azure visibility

Once that works, we can expand from proof-of-concept to pilot.
