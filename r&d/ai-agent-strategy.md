# HMC AI Agent Strategy — Unified Analysis

**Date:** 2026-04-16  
**Author:** Pete Jensen  
**Status:** Decision document  
**Supersedes:** `semantic-kernel-spike.md`, `agent-framework-spike.md` (retained as research artifacts)

---

## The Story in Three Acts

### Act 1: Semantic Kernel (2023–2025) — Early Entrant

Microsoft shipped Semantic Kernel as their first production .NET SDK for LLM integration. It introduced the right abstractions — plugins, filters, memory, streaming — and became the reference implementation for .NET AI apps. SK's agent layer (`Microsoft.SemanticKernel.Agents`) followed, but remained experimental through most of 2025.

**SK's contribution:** proved out the primitive model. Plugins, prompt filters, vector store abstractions, and streaming patterns are all sound. These ideas survived into the next act.

### Act 2: AutoGen (2024–2025) — Multi-Agent Research

Microsoft Research shipped AutoGen (Python-first, .NET port) to explore multi-agent orchestration patterns: sequential, concurrent, handoff, group chat, Magentic-One. The actor/message-passing model was a clean mental fit for multi-agent coordination. The .NET port lagged Python and was never production-ready.

**AutoGen's contribution:** validated the orchestration patterns. All five patterns survived into the next act.

### Act 3: Microsoft Agent Framework (April 3, 2026) — The Unified Answer

Microsoft merged SK's foundations with AutoGen's orchestration patterns into a single, production-ready SDK. GA shipped April 3, 2026.

```
Semantic Kernel   ──┐
                    ├──► Microsoft Agent Framework 1.0 (Microsoft.Agents.AI)
AutoGen           ──┘
```

This is the answer. SK and AutoGen are predecessors. **Official migration guides exist from both.**

---

## Microsoft Agent Framework — What It Is

**NuGet:** `Microsoft.Agents.AI` + `Microsoft.Agents.AI.OpenAI`  
**Foundation:** `Microsoft.Extensions.AI` (`IChatClient`) — .NET platform-level AI abstraction  
**Providers (1.0):** Azure OpenAI, OpenAI, Anthropic Claude, Amazon Bedrock, Google Gemini, Ollama  
**GitHub:** [microsoft/agent-framework](https://github.com/microsoft/agent-framework)

### Core Model

```
Agent = IChatClient (provider) + instructions + tools + memory + middleware
```

```csharp
// Azure Foundry path (recommended for Azure shops)
var agent = new AIProjectClient(new Uri(endpoint), new DefaultAzureCredential())
    .AsAIAgent(
        model: "gpt-4o",
        name: "Aivy",
        instructions: "You are Aivy, Harvard Medical Community's AI assistant.");

var result = await agent.RunAsync("user message");
```

### Tools

`AIFunctionFactory.Create()` — accepts delegates, generates JSON schema automatically. No attributes required.

```csharp
var searchTool = AIFunctionFactory.Create(
    async (string query) => await searchService.SearchAsync(query),
    name: "search_knowledge_base",
    description: "Search the HMC knowledge base");

var calendarTool = AIFunctionFactory.Create(
    async (string userId, DateTimeOffset start, DateTimeOffset end) =>
        await calendarService.GetEventsAsync(userId, start, end),
    name: "get_calendar_events",
    description: "Get calendar events for a user");

var agent = client.AsAIAgent(
    model: "gpt-4o",
    name: "Aivy",
    instructions: "...",
    tools: [searchTool, calendarTool]);
```

MCP server tools supported — discover tools from any MCP-compliant server at runtime.

### Middleware Pipeline

Intercept execution stages for status signaling, logging, safety, compliance:

```csharp
agent.Use(async (context, next) =>
{
    // pre: signal tool status to SignalR
    await chatContext.SignalChatStatusMessage(LogLevel.Information, "Thinking...");
    await next(context);
    // post: observe result, log, etc.
});
```

### Memory Providers

Pluggable backends — conversation history, key-value state, vector retrieval:
- Microsoft Foundry (Azure-native)
- Redis, Neo4j, Mem0
- Azure AI Search and Cosmos expected via connectors

### Multi-Agent Orchestration (5 patterns — all stable in 1.0)

```csharp
// Route based on intent — triage agent decides who handles it
var workflow = new HandoffOrchestration(triageAgent, officeAgent, searchAgent);

// All agents work same task in parallel — aggregate results
var workflow = new ConcurrentOrchestration(agent1, agent2, agent3);

// Output of A feeds B feeds C
var workflow = new SequentialOrchestration(researchAgent, summaryAgent, reviewerAgent);

// Shared conversation — manager selects speaker each turn
var workflow = new GroupChatOrchestration(managerAgent, agents: [officeAgent, searchAgent]);

// Generalist multi-agent — Microsoft Research's Magentic-One pattern
var workflow = new MagenticOneOrchestration(agents);

var result = await workflow.RunAsync("task description");
```

### A2A Protocol

Agent-to-Agent protocol enables cross-framework coordination. HMC agents can interoperate with agents in other frameworks/languages via structured messaging.

---

## HMC Migration: Raw OpenAI SDK → Agent Framework

Current state: `HMC.ChatAI.Service` runs directly on the OpenAI .NET SDK (`OpenAI.Chat.ChatClient`). This is the right starting point — no SK detour needed.

### Mapping

| Current (`HMC.ChatAI.Service`) | Agent Framework replacement |
|---|---|
| `IChatFunction` + `WrapAsync()` | `AIFunctionFactory.Create(delegate)` |
| `IStreamingFunction.ChunkReceived` | middleware pipeline (pre/post hook per tool call) |
| `IStatusEmitterFunction.StatusChanged` | middleware pipeline → `ChatContext.SignalChatStatusMessage` |
| `FunctionCallingContext` | framework-managed (not passed manually) |
| `ToolCallAccumulator` | handled internally |
| `ChatJob` (tool dispatch loop) | `agent.RunAsync()` / `InvokeStreamingAsync()` |
| `PromptEngineeringProvider` | middleware pipeline (pre-send prompt mutation) |
| `PromptTemplateService` / `PromptRepository` | agent `instructions` + runtime-composed prompt strings |
| `WorkingMemory` | memory provider (vector retrieval) |
| `VectorizationService` | memory provider (vector backend) |
| `ChatHistory` + truncation strategies | framework conversation threading + memory providers |
| `ModelCapabilities` / `ModelPromptConstraints` | per-agent model selection via `IChatClient` |

### What Does NOT Change

| Component | Reason it stays |
|---|---|
| `ChatContext` (SignalR signals) | Transport layer — Agent Framework calls into it via middleware |
| `ChatCoordinator` (distributed cancel, semaphores) | Concurrency concern outside agent scope |
| `DataExtractionServices` (PDF, Office, audio, HTML) | Domain-specific; wrap as `AIFunctionFactory.Create()` tools |
| `DocumentAnalysis` / chunking / Document Intelligence | Custom pipeline; expose as tools |
| `EMailAiCoordinator` / AskAivy | Becomes an `agent.RunAsync()` call |
| Cosmos + Blob persistence | Survives; Agent Framework memory providers sit on top |
| Auth / user profile middleware | ASP.NET Core concern, unchanged |

### Migration Phases

**Phase 1 — Single agent, tool calling (replaces today's ChatJob loop)**
- Replace `IChatFunction` registrations with `AIFunctionFactory.Create()` tools
- Replace `ToolCallAccumulator` + dispatch loop with `agent.RunAsync()`
- Wire existing `ChatContext.Signal*` calls into agent middleware

**Phase 2 — Memory / RAG**
- Replace `VectorizationService` + raw Azure AI Search calls with Agent Framework memory provider
- `SmartSearch2Function` becomes a memory-backed retrieval tool or a memory provider

**Phase 3 — Named agents (optional architecture evolution)**
- Split Aivy into specialized agents: `OfficeAssistantAgent` (calendar, email), `SearchAgent`, `LearningAgent`
- Wire with `HandoffOrchestration` — triage agent routes per intent

**Phase 4 — Multi-agent orchestration (future)**
- `GroupChatOrchestration` or `MagenticOneOrchestration` for complex cross-domain tasks

---

## Why Not Semantic Kernel

SK is not wrong — it's the predecessor. The primitives (plugins = `[KernelFunction]`, filters = `IFunctionInvocationFilter`, vector stores) map 1:1 to Agent Framework concepts. If you understand SK, you understand Agent Framework's foundations.

But: SK as a NuGet dependency today means adopting something Microsoft is actively migrating away from. The official SK → Agent Framework migration guide exists precisely because Microsoft expects teams to move. There is no reason to land on SK when Agent Framework 1.0 is stable and shipping.

> **For new work: `Microsoft.Agents.AI`. For understanding what it does under the hood: read the SK spike.**

---

## Why Not AutoGen.NET

AutoGen's orchestration ideas all landed in Agent Framework. AutoGen.NET (the .NET port) never reached production stability. Nothing to gain from adopting it directly.

---

## Shared Library Opportunity

`HMC.Shared.AgentCore` — follows `HMC.Shared.Web/ServiceExtensions.cs` pattern:

```csharp
public static class AgentServiceExtensions
{
    public static IServiceCollection AddHMCAIAgent(
        this IServiceCollection services,
        IConfiguration config,
        Action<AgentBuilder>? configure = null)
    {
        // standard HMC Azure Foundry client + agent config
        // standard HMC tools: search, calendar, user profile
        // standard HMC middleware: SignalR status signaling, telemetry
    }
}
```

All microservices that need AI capabilities adopt HMC-standard agent config in one call.

---

## Decision

| Question | Answer |
|---|---|
| Which framework? | **Microsoft Agent Framework (`Microsoft.Agents.AI`)** |
| When available? | GA April 3, 2026 — now |
| Migration source | Raw OpenAI SDK → Agent Framework (no SK detour) |
| SK useful? | As conceptual reference only — do not take NuGet dependency |
| AutoGen useful? | No — its patterns absorbed into Agent Framework |
| Multi-agent now? | No — Phase 1 first; orchestration is Phase 3+ |

---

## References

- [Microsoft Agent Framework 1.0 announcement](https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-version-1-0/)
- [Agent Framework devblog](https://devblogs.microsoft.com/agent-framework/)
- [GitHub: microsoft/agent-framework](https://github.com/microsoft/agent-framework)
- [VSMag: SK + AutoGen = Agent Framework (origin story, Oct 2025)](https://visualstudiomagazine.com/articles/2025/10/01/semantic-kernel-autogen--open-source-microsoft-agent-framework.aspx)
- [VSMag: Agent Framework 1.0 ships](https://visualstudiomagazine.com/articles/2026/04/06/microsoft-ships-production-ready-agent-framework-1-0-for-net-and-python.aspx)
- [InfoQ: Agent Framework RC](https://www.infoq.com/news/2026/02/ms-agent-framework-rc/)
- [Start Debugging: C# deep dive](https://startdebugging.net/2026/04/microsoft-agent-framework-1-0-ai-agents-in-csharp/)
- NuGet: `Microsoft.Agents.AI`, `Microsoft.Agents.AI.OpenAI`
