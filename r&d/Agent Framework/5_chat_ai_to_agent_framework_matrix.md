# HMC ChatAI vs Microsoft Agent Framework Capability Matrix

Date: 2026-05-13  
Status: planning companion to `4_agent_framework_chat_ai_microsite.html`  
Service: `HMC.ChatAI.Service`  
Scope: Agent Framework capabilities compared to current ChatAI capabilities. Provider selection is intentionally secondary here.

## Purpose

This document separates the Agent Framework discussion from the provider discussion.

The core question is not "OpenAI vs Anthropic vs Gemini." The core question is:

> Which parts of ChatAI are HMC product/runtime capabilities, and which parts are generic agent framework mechanics that should move behind Microsoft Agent Framework?

The migration frame should be read narrowly:

> This is not a ChatAI service rewrite. It is an orchestration-layer rewrite behind the existing ChatAI product/runtime contracts.

We keep ChatAI as the HMC-owned product shell, but replace the custom agent runtime inside it with Microsoft Agent Framework, using a strangler path and parity gates.

What is not a rewrite:

- Controllers/API shape.
- SignalR/UI streaming contract.
- Cosmos `ChatHistory`.
- `ChatCoordinator` stop/cancel semantics.
- SmartSearch2 RAG execution.
- Document ingestion/vectorization pipeline.
- User profile/prompt policy.
- Ask-Aivy as an e-mail-native surface.

What probably is a rewrite:

- `ChatJob` agent loop.
- Tool-call accumulation/dispatch.
- `IChatFunction` schema/invocation plumbing.
- Duplicated `ReflectService` tool loop.
- Provider/model selection plumbing.
- Parts of streaming/event translation.
- Eventually, Ask-Aivy's shallow loop if it becomes more truly agentic.

The target posture remains:

- Single Aivy agent first.
- Provider-pluggable underneath.
- No assumption that multi-agent workflows belong inside ChatAI by default.
- Keep HMC retrieval, persistence, SignalR, user profile, prompt policy, and document pipeline authoritative until parity is proven.

## Executive Takeaways

- Agent Framework is strongest where ChatAI currently has custom agent-loop plumbing: agent invocation, tool schema/invocation, middleware, and session-like state.
- ChatAI is strongest where the behavior is HMC-specific: SmartSearch2 semantics, source blocks, document extraction, Cosmos history shape, SignalR UI contract, stop/cancellation, user profile, and permission boundaries.
- The ChatAI migration should not start with multi-agent workflows. It should start by replacing the single-agent execution loop while preserving ChatAI's runtime contract.
- Workflows are an Agent Framework capability for explicit business processes that may live in the owning domain service/API, not something ChatAI should absorb by default.
- Provider abstraction matters, but it should be a `ModelProfile` / `ReasoningProfile` registry concern, not the headline of the migration.
- Microsoft docs currently describe Agent Framework as public preview, so the initial implementation should stay feature-flagged, version-pinned, and rollbackable.

## Disposition Legend

| Disposition | Meaning |
|---|---|
| Stays | Keep in ChatAI as an HMC-owned product/runtime capability. |
| Moves | Move generic mechanics behind Agent Framework once parity is proven. |
| Hybrid | Use Agent Framework primitives, but keep ChatAI semantics or adapters. |
| Defer | Keep out of Phase 1 unless a specific business process requires it. |

## Capability Matrix

| Capability | Agent Framework capability | ChatAI service today | Disposition | Relative strength |
|---|---|---|---|---|
| Agent runtime | Agents use LLMs to process inputs, call tools and MCP servers, and generate responses. Agent runs can be synchronous or streaming, with instructions, model clients, sessions, and middleware around the run. | `ChatJob` manually drives the OpenAI chat-completions loop, prompt construction, tool detection, streamed output, storage updates, SignalR lifecycle, and closeout. | Moves. Replace the generic model/run loop with a side-by-side Agent Framework path, while keeping a ChatAI facade for controllers and UI semantics. | Agent Framework is stronger for generic agent execution. ChatAI should not keep owning raw agent-loop mechanics forever. |
| Function tools | Agent Framework supports custom function tools, tool approval patterns, function-call middleware, and provider-specific hosted tools where available. | Tools are `IChatFunction` implementations with JSON-string `WrapAsync`, reflective OpenAI tool schema generation, manual lookup, and `ToolCallAccumulator` for streamed tool-call fragments. | Hybrid. Move schema binding and invocation mechanics to Agent Framework. Keep HMC tools and adapt them one at a time. | Agent Framework is stronger for schema/invocation mechanics. ChatAI is stronger for business behavior inside tools. |
| MCP and external tool ecosystem | Agent Framework exposes MCP client/tool integration and hosted MCP options depending on provider/client path. | ChatAI integrates directly through DI, typed HTTP clients, HMC packages, and hand-written chat functions. | Defer. Use MCP only after HMC-owned tools are expressed cleanly and governance/data-flow review is settled. | Agent Framework is stronger for tool standardization. ChatAI is stronger for current permission boundaries. |
| Sessions and conversation state | `AgentSession` keeps conversation context between invocations and can be serialized/deserialized or rehydrated via service conversation IDs where supported. | Cosmos `ChatHistory`, document session storage, distributed cache, message metadata, and `ChatCoordinator` define the production conversation model. | Stays initially. Treat AgentSession as an adapter detail until storage parity and rollback are proven. | ChatAI is stronger today because production behavior is tied to existing HMC storage and UI contracts. |
| Context engineering and retrieval handoff | Agent Framework documents context providers, history providers, context compaction, storage patterns, and memory/persistence hooks. These help assemble and inject context around an agent run; they are not the RAG implementation by themselves. | `PromptEngineeringProvider`, user profile, working memory shape, document/session state, and source-block expectations shape the context sent to the model. SmartSearch2 owns the RAG call path and retrieval/synthesis semantics. | Hybrid. Use framework context hooks for context engineering and expose SmartSearch2 as a tool. Keep RAG execution inside SmartSearch2. | ChatAI/SmartSearch2 is stronger for HMC retrieval semantics. Agent Framework helps organize context injection. |
| Middleware | Agent Framework supports agent-run middleware, function-call middleware, and chat/IChatClient middleware for logging, validation, security checks, error handling, and result transformation. | ChatAI has `OpenAiPayloadShapingPolicy`, action filters, prompt/model policy, token telemetry, truncation, and tool callback conventions spread across service code. | Moves selectively. Move cross-cutting agent/tool/chat concerns into middleware where the framework path owns the call. Keep HMC policy decisions centralized. | Agent Framework is stronger for reusable interception points. ChatAI still owns policy meaning. |
| Streaming surface | Agent runs and workflows can stream events/results incrementally. | SignalR hub, `ChatContext.SignalDataBlock`, SmartSearch2 blocks, status messages, heartbeat, stop streaming, and UI-visible sequencing form the frontend contract. | Hybrid. Let Agent Framework emit agent/tool/workflow events. Translate them into the existing ChatAI SignalR contract. | Shared. Framework supplies execution events; ChatAI owns what users see and what gets persisted. |
| Structured and typed outputs | Agent Framework supports schema-aware tool/result patterns and typed workflow messages; structured model outputs depend on selected model/client support. | `ReflectService` has a separate stateless OpenAI/tool loop for introspection and structured API responses. | Moves after core parity. Reflect is a good cleanup target once main chat and tools work through Agent Framework. | Agent Framework is stronger for removing duplicated structured-response mechanics. |
| Model-client abstraction | Agent Framework sits over chat completion, responses-style, Foundry, Azure OpenAI, OpenAI, Anthropic, Ollama, and custom `IChatClient` paths depending on package/provider. | ChatAI is OpenAI-only for chat/embeddings today, with OpenAI-specific payload shaping and token handling. | Moves. Centralize provider/client choice into `ModelProfile` and `ReasoningProfile`. | Agent Framework is stronger for provider/client abstraction. ChatAI should keep provider policy, not provider plumbing. |
| Workflows | Workflows are graph-based orchestration with executors, edges, type-safe routing, conditional/parallel execution, external request/response, checkpointing, human-in-the-loop, and multi-agent patterns. | ChatAI is a single Aivy chat service. Ask-Aivy is a background e-mail agentic loop/handler, not a general multi-agent workflow engine,| placement decision. Use workflows for explicit durable business processes in the service that owns the process. Do not use ChatAI as the default agent warehouse or provider router. | Agent Framework is stronger for workflow orchestration. Ownership should follow the domain, not the existing ChatAI service boundary. |
| Telemetry and safety hooks | Middleware and workflow events provide natural locations for telemetry, validation, and safety checks. | Logging, status emission, token telemetry, model shaping, and safety-ish checks are distributed across service code. | Hybrid. Consolidate generic telemetry/safety hooks in middleware while preserving HMC audit and policy requirements. | Agent Framework improves consistency; ChatAI retains audit semantics. |
| Hosting and integration surface | Agent Framework includes hosting/integration paths and can be composed into existing .NET services. | ChatAI is already an ASP.NET Core service with controllers, SignalR, Azure Service Bus handlers, Cosmos persistence, and HMC shared services. | Stays. Keep ChatAI as the host/application boundary. Agent Framework is an internal runtime dependency, not a new service boundary by default. | ChatAI is stronger as the HMC application shell. |

## What Goes

These are candidates to move behind Agent Framework once a side-by-side path proves parity:

- `ChatJob` raw OpenAI streaming/model loop.
- Manual tool-call accumulation and dispatch.
- Reflect's duplicated stateless tool loop.
- Reflective OpenAI tool schema generation where typed `AIFunction` registration can replace it.
- Provider-specific branching scattered through orchestration code.
- Cross-cutting model/tool/chat interception that fits middleware.

## What Stays

These should remain ChatAI-owned unless a later proof shows a better HMC-compatible replacement:

- SignalR and `ChatContext` user-visible streaming contract.
- Cosmos `ChatHistory` shape and persisted message semantics.
- `ChatCoordinator` stop, cancellation, and readiness semantics.
- SmartSearch2 RAG execution, source blocks, filters, permissions, and answer semantics.
- Document ingestion, extraction, thumbnailing, chunking, embeddings, and indexing.
- Prompt engineering, Azure App Configuration prompts, user profile, and HMC policy choices.
- Ask-Aivy e-mail orchestration and concurrency semantics.
- HMC audit, compliance, and permission boundaries.

## Hybrid Areas

These areas should bridge the two worlds rather than fully move or fully stay:

| Area | Bridge approach |
|---|---|
| Tools | Wrap existing `IChatFunction` tools as Agent Framework functions first. Convert to typed functions gradually. |
| Streaming | Map framework stream events into `ChatContext.SignalDataBlock`, status, and block events. |
| Context engineering | Use framework context providers to assemble and inject user/profile/history/document context. Keep RAG execution in SmartSearch2. |
| Sessions | Use AgentSession only as an internal framework construct until Cosmos parity is proven. |
| Middleware | Move generic interception to framework middleware; keep HMC decisions in policy services. |
| Provider choice | Use `ModelProfile` and `ReasoningProfile`; avoid controller-level provider branching. |

## Suggested Migration Shape

### Phase 0: Framework Boundary

- Add `AgentFramework:Enabled=false`.
- Define `ModelProfile`, `ReasoningProfile`, and provider capability metadata.
- Decide which current ChatAI contracts are non-negotiable parity gates.
- Keep provider details in the provider matrix, not in this core boundary doc.

### Phase 1: Single Aivy Agent

- Build `AivyAgentFactory`.
- Build `AivyAgentRunService` behind a feature flag.
- Wrap `WebSearchFunction` and `SmartSearch2Function`.
- Preserve SignalR, stop/cancel, persistence, prompts, and Ask-Aivy behavior.

### Phase 2: Tool Cleanup

- Convert JSON-string tools to typed methods where practical.
- Replace `ToolCallAccumulator` with framework tool invocation.
- Move status/block streaming into tool event adapters or middleware.

### Phase 3: Reflect Cleanup

- Move Reflect/introspection onto the same agent/tool registry.
- Prefer schema-aware structured output over prompt-only JSON.
- Delete the duplicated stateless tool loop after parity.

### Phase 4: Organization-Level Workflow Evaluation

- Only introduce Agent Framework workflows where HMC has a durable, explicit business process.
- Place each workflow in the service/API that owns the business process instead of assuming ChatAI is the default host.
- Good candidates may include review/approval flows, multi-step research workflows, or human-in-the-loop jobs.
- Do not use workflows for ordinary provider routing.

## Phase 1 Parity Gates

The Agent Framework path is not ready to become default until all of these hold:

- Normal chat streams into the current UI without changing frontend contracts.
- Stop streaming still works.
- Cosmos history has the same user-visible answer shape.
- SmartSearch2 emits the same visible blocks and persisted answer content.
- Tool permissions and context values are preserved.
- PromptEngineeringProvider behavior is preserved or intentionally mapped.
- Ask-Aivy produces a coherent e-mail response.
- Rollback to the legacy OpenAI path is one setting change.

## Sources

Primary docs checked:

- Microsoft Agent Framework overview: https://learn.microsoft.com/en-us/agent-framework/overview/
- Agent Framework documentation index: https://learn.microsoft.com/en-us/agent-framework/
- Tools overview: https://learn.microsoft.com/en-us/agent-framework/user-guide/agents/agent-tools
- Conversations and memory: https://learn.microsoft.com/en-us/agent-framework/agents/conversations/
- Agent middleware: https://learn.microsoft.com/en-us/agent-framework/user-guide/agents/agent-middleware
- Workflows overview: https://learn.microsoft.com/en-us/agent-framework/user-guide/workflows/overview
- Workflow orchestration patterns: https://learn.microsoft.com/en-us/agent-framework/journey/workflows

Repository baseline checked:

- `HMC.ChatAI.Service.csproj`
- `Program.cs`
- `ExtensionMethods.cs`
- `Domain/Services/ChatJob.cs`
- `Domain/Services/ChatContext.cs`
- `Domain/Services/ChatCoordinator.cs`
- `Domain/Services/Reflect/ReflectService.cs`
- `Domain/ChatFunctions/IStreamingFunction.cs`
- `Domain/ChatFunctions/ToolCallAccumulator.cs`
- `Domain/ChatFunctions/FunctionExtensions.cs`
- `Domain/ChatFunctions/SmartSearch2/SmartSearch2Function.cs`
- `Domain/DocumentAnalysis/Vectorization/VectorizationService.cs`
