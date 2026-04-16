# Agent Framework — Technical Spike

**Date:** 2026-04-16  
**Author:** Pete Jensen  
**Context:** Evaluating agent framework options for HMC ChatAI evolution

---

## Critical Context — What "Agent Framework" Actually Is

**Microsoft Agent Framework** is a distinct, standalone product that GA'd **April 3, 2026**. It is NOT Semantic Kernel's agent layer — it's the unified successor to both SK and AutoGen, combining the best of both into a single SDK.

- GitHub: [microsoft/agent-framework](https://github.com/microsoft/agent-framework) (9.5k stars, 44% C#)
- NuGet: `Microsoft.Agents.AI`
- Explicit migration guides exist FROM SK and FROM AutoGen
- Built on `Microsoft.Extensions.AI` (`IChatClient`) — provider-agnostic by design
- Covers: single agents, middleware, memory, workflows, multi-agent orchestration

> **The previous spike docs (SK Agents layer) described the predecessor. This is the current answer.**

---

## TL;DR

| Scenario | Recommendation |
|---|---|
| New agent work, greenfield | **Microsoft Agent Framework (`Microsoft.Agents.AI`)** — GA, 1.0 stable |
| Migrate ChatAI tool calling | Agent Framework single-agent + `AIFunctionFactory.Create()` |
| Named personas (Aivy, OfficeAssistant, Search) | Separate `AIAgent` instances per persona |
| Multi-agent orchestration | Agent Framework built-in: sequential, concurrent, handoff, group chat, Magentic-One |
| Existing SK code | Migrate via official SK → Agent Framework guide |
| Existing AutoGen code | Migrate via official AutoGen → Agent Framework guide |

---

---

## Microsoft Agent Framework 1.0

### NuGet Packages

```xml
<!-- Core -->
<PackageReference Include="Microsoft.Agents.AI" Version="1.*" />

<!-- Provider-specific (choose one or more) -->
<PackageReference Include="Microsoft.Agents.AI.OpenAI" Version="1.*" />
<!-- Azure Foundry path uses AIProjectClient — included in Azure.AI.Projects -->
```

### Foundation: Microsoft.Extensions.AI

Built on `IChatClient` from `Microsoft.Extensions.AI` — the .NET platform-level AI abstraction. All providers (Azure OpenAI, OpenAI, Anthropic, Bedrock, Gemini, Ollama) implement `IChatClient`. Swap providers without rewriting agent code.

```csharp
// Azure Foundry path (recommended for Azure shops)
var agent = new AIProjectClient(new Uri(endpoint), new DefaultAzureCredential())
    .AsAIAgent(
        model: "gpt-4o",
        name: "Aivy",
        instructions: "You are Aivy, Harvard Medical Community's AI assistant.");

var result = await agent.RunAsync("user message");

// Direct OpenAI path
var agent = new OpenAIClient(apiKey)
    .GetResponsesClient()
    .AsAIAgent(model: "gpt-4o", name: "Aivy", instructions: "...");
```

### Tools (Function Calling)

`AIFunctionFactory.Create()` replaces `[KernelFunction]`. Accepts delegates; generates JSON schema automatically.

```csharp
var searchTool = AIFunctionFactory.Create(
    async (string query) =>
    {
        var results = await searchService.SearchAsync(query);
        return JsonConvert.SerializeObject(results);
    },
    name: "search_knowledge_base",
    description: "Search the HMC knowledge base for relevant documents");

var calendarTool = AIFunctionFactory.Create(
    async (string userId, DateTimeOffset start, DateTimeOffset end) =>
        await calendarService.GetEventsAsync(userId, start, end),
    name: "get_calendar_events",
    description: "Get calendar events for a user within a date range");

var agent = client.AsAIAgent(
    model: "gpt-4o",
    name: "Aivy",
    instructions: "...",
    tools: [searchTool, calendarTool]);
```

MCP server tools also supported — discover tools from any MCP-compliant server at runtime.

### Middleware Pipeline

Replaces SK filters. Intercept execution stages for logging, safety, compliance, SignalR signaling:

```csharp
// Pseudocode — exact API TBD from docs
agent.Use(async (context, next) =>
{
    await chatContext.SignalChatStatusMessage(LogLevel.Information, $"Thinking...");
    await next(context);
});
```

### Memory Providers

Pluggable backends — conversation history, key-value state, vector retrieval:
- Microsoft Foundry (Azure-native)
- Redis
- Neo4j
- Mem0
- (Cosmos, Azure AI Search expected via connectors)

### Multi-Agent Orchestration (5 built-in patterns)

All patterns ship in 1.0 stable — unlike SK's experimental orchestration packages.

```csharp
// Sequential — output of A feeds B feeds C
var workflow = new SequentialOrchestration(researchAgent, summaryAgent, reviewAgent);
var result = await workflow.RunAsync("Research and summarize topic X");

// Handoff — triage agent routes to specialist
var workflow = new HandoffOrchestration(triageAgent, officeAgent, searchAgent, learningAgent);

// Group Chat — manager selects speaker each turn
var workflow = new GroupChatOrchestration(managerAgent, agents: [officeAgent, searchAgent]);

// Concurrent — all agents work same task in parallel
var workflow = new ConcurrentOrchestration(agent1, agent2, agent3);

// Magentic-One — Microsoft Research's generalist multi-agent pattern
var workflow = new MagenticOneOrchestration(agents);
```

### A2A Protocol

Agent-to-Agent (A2A) protocol enables cross-framework coordination — your HMC agents can interoperate with agents built in other frameworks/languages via structured messaging. Future-proofing for multi-system agent networks.

---

## What "Agent Framework" Means

An AI agent: LLM + tools + a loop that runs until goal met.

```
User → LLM → tool_call → execute → result → LLM → tool_call → ... → final answer
```

Three fundamental patterns:

### Tool Use / Function Calling
Model has a set of callable functions (JSON schema). On each turn it either answers or emits `tool_calls`. Host executes, feeds result back. Repeat.  
**This is what ChatAI does today** — manually, through `IChatFunction` + `ToolCallAccumulator`.

### ReAct / Multi-Step Reasoning
Interleaved Thought → Action → Observation loop. Modern models do this implicitly via chain-of-thought + function calling. You don't implement it; you enable it via `FunctionChoiceBehavior.Auto()`.

### Multi-Agent Orchestration
Multiple specialized agents collaborate. Key topologies:

| Pattern | Description | SK Support |
|---|---|---|
| Sequential | A → B → C output chain | `SequentialOrchestration` (experimental) |
| Concurrent | All agents run on same input in parallel | `ConcurrentOrchestration` (experimental) |
| Handoff | Agent A routes to Agent B based on context | `HandoffOrchestration` (experimental) |
| Group Chat | N agents in shared conversation; manager selects speaker | `GroupChatOrchestration` (experimental) |
| Supervisor | Orchestrator decomposes task, delegates to workers as tools | Manual via `[KernelFunction]` wrapping agents |

---

## Option 1: SK Core (No Explicit Agent Layer)

Just use `Kernel` + `FunctionChoiceBehavior.Auto()`. Simplest migration path.

```csharp
var settings = new AzureOpenAIPromptExecutionSettings
{
    FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()
};

var result = await chatCompletionService.GetChatMessageContentAsync(
    history,
    executionSettings: settings,
    kernel: kernel);  // kernel carries plugins; SK runs the tool loop
```

SK handles the full tool dispatch loop internally. No `ToolCallAccumulator`, no manual function dispatch. Filters (`IAutoFunctionInvocationFilter`) let you hook into each tool invocation for status signals.

**When to use:** Most of ChatAI's current flows. Single-assistant, tool-using conversation.

---

## Option 2: ChatCompletionAgent (RC)

Adds identity (name + instructions) and thread management. Cleaner when you have multiple named personas or want explicit agent abstraction.

```csharp
var agent = new ChatCompletionAgent
{
    Name = "Aivy",
    Instructions = """
        You are Aivy, Harvard Medical Community's AI assistant.
        You have access to calendar, search, and email tools.
        """,
    Kernel = kernel  // carries all HMC plugins
};

// Thread manages ChatHistory; can be backed by custom persistence
AgentThread thread = new ChatHistoryAgentThread();

await foreach (var response in agent.InvokeStreamingAsync(userMessage, thread))
{
    await chatContext.SignalDataBlock("text", "markdown", response.Content);
}
```

**SignalR integration:** `InvokeStreamingAsync` yields chunks. Wire directly into `ChatContext.SignalDataBlock`.

**When to use:** Replacing `ChatJob` + `PromptService` as the single Aivy assistant. Thread gives a clean home for `ChatHistory`.

---

## Option 3: OpenAIAssistantAgent (RC)

Server-managed threads. OpenAI/Azure holds conversation history. Useful when:
- Conversations span server restarts
- You want Azure-managed code interpreter or file search
- Thread ID stored client-side; resume by ID

```csharp
// Create assistant (do once, cache assistant ID)
AssistantClient client = OpenAIAssistantAgent.CreateAzureOpenAIClient(config).GetAssistantClient();
Assistant assistant = await client.CreateAssistantAsync("gpt-4o", "Aivy", instructions: "...");

OpenAIAssistantAgent agent = new(assistant, client);

// Per-conversation
AgentThread thread = new OpenAIAssistantAgentThread(client);

await foreach (var response in agent.InvokeAsync(userMessage, thread))
    Console.WriteLine(response.Content);

// Store thread.Id in Cosmos/Redis → resume next turn without history rebuild
```

**Trade-off:** History on Azure = no local test without Azure. Currently ChatAI reconstitutes history from Cosmos per turn — this replaces that with Azure-managed threads. Simpler but less control.

**When to use:** If you want Azure to manage history persistence and thread state. Otherwise `ChatCompletionAgent` + serialize `ChatHistory` to Cosmos is equivalent and more testable.

---

## Option 4: AzureAIAgent (Experimental)

Azure AI Foundry-backed agents. **Most capability but most experimental.**

What it adds over `OpenAIAssistantAgent`:
- Azure AI Search as a built-in tool (no custom plugin needed for your existing indexes)
- Bing Grounding (web search without custom plugin)
- Code Interpreter
- OpenAPI tool invocation
- All from Azure-managed server-side execution

```csharp
PersistentAgentsClient client = AzureAIAgent.CreateAgentsClient(foundryEndpoint, new DefaultAzureCredential());

// Wire existing Azure AI Search index as a built-in tool
ToolDefinition searchTool = new AzureAISearchToolDefinition(
    new AzureAISearchConfiguration(searchEndpoint, searchKey, indexName));

PersistentAgent definition = await client.Administration.CreateAgentAsync(
    "gpt-4o",
    name: "Aivy",
    instructions: "...",
    tools: [searchTool]);

AzureAIAgent agent = new(definition, client);
```

**When to use:** If/when this goes GA and your SmartSearch path wants to delegate to Azure-managed RAG. Not yet for production — watch SDK churn.

---

## Option 5: Multi-Agent Orchestration (Experimental)

SK's `Agents.Orchestration` package. **Do not use in production yet.** But worth understanding the architecture for future planning.

### Handoff Pattern
Agent A hands off to Agent B with context:

```csharp
// Each agent has specialized instructions + focused plugins
var officeAgent  = new ChatCompletionAgent { Name = "OfficeAssistant",  Instructions = "Handle calendar and email.", Kernel = officeKernel };
var searchAgent  = new ChatCompletionAgent { Name = "SearchAssistant",  Instructions = "Handle knowledge base search.", Kernel = searchKernel };
var triage       = new ChatCompletionAgent { Name = "Triage",           Instructions = "Route to the right specialist.", Kernel = triageKernel };

var orchestration = new HandoffOrchestration(triage, officeAgent, searchAgent);

var runtime = new InProcessRuntime();
await runtime.StartAsync();

var result = await orchestration.InvokeAsync("Book a meeting and find docs about project X", runtime);
```

### GroupChat Pattern

```csharp
var groupChat = new GroupChatOrchestration(
    manager: new ChatCompletionAgent { Name = "Manager", Instructions = "Coordinate the group.", Kernel = managerKernel },
    officeAgent, searchAgent, learningAgent);

await foreach (var msg in (await groupChat.InvokeAsync(task, runtime)).GetStreamingValueAsync())
    Console.WriteLine($"[{msg.AuthorName}]: {msg.Content}");
```

### Supervisor via KernelFunctions (stable alternative)

Use stable SK features: wire agent invocations as `[KernelFunction]` plugins on a supervisor kernel:

```csharp
public class AgentToolPlugin(ChatCompletionAgent officeAgent, ChatCompletionAgent searchAgent)
{
    [KernelFunction, Description("Handles calendar and email tasks")]
    public async Task<string> InvokeOfficeAgentAsync(string task)
    {
        var thread = new ChatHistoryAgentThread();
        var sb = new StringBuilder();
        await foreach (var r in officeAgent.InvokeAsync(new ChatMessageContent(AuthorRole.User, task), thread))
            sb.Append(r.Content);
        return sb.ToString();
    }

    [KernelFunction, Description("Searches the knowledge base")]
    public async Task<string> InvokeSearchAgentAsync(string query) { ... }
}

// Supervisor kernel has AgentToolPlugin registered — stable today
var supervisorKernel = builder.Build();
supervisorKernel.Plugins.AddFromObject(new AgentToolPlugin(officeAgent, searchAgent));
```

This supervisor pattern works with **stable SK today** — no experimental orchestration packages needed.

---

## Option 6: AutoGen.NET

Microsoft Research's multi-agent framework. .NET port of Python AutoGen.

**Packages:**
```xml
<PackageReference Include="AutoGen.Core" Version="0.*" />
<PackageReference Include="AutoGen.OpenAI" Version="0.*" />
<PackageReference Include="AutoGen.SemanticKernel" Version="0.*" />  <!-- wrap SK as AutoGen agent -->
```

**Key difference from SK agents:** Actor / message-passing model. Each agent is like an Orleans grain — receives typed messages, produces typed messages.

```csharp
// AutoGen wrapping an SK agent
var skAgent = new ChatCompletionAgent { Name = "Aivy", Kernel = kernel };
var autoGenWrapper = new SemanticKernelAgent(skAgent, name: "Aivy");

var groupChat = new RoundRobinGroupChat(agents: [autoGenWrapper, reviewerAgent]);
var result = await groupChat.InitiateChat(
    initiateAgent: autoGenWrapper,
    message: "Research and summarize the topic",
    maxRound: 5);
```

**Strengths over SK orchestration:**
- Cleaner actor mental model for complex multi-agent flows
- Source generator for tool contracts: `[Function]` attribute → generates wrapper + schema
- `SemanticKernelAgent` bridge means you get SK's Azure connectors + AutoGen's orchestration

**Weaknesses:**
- .NET port lagged Python by 6–12 months through 2024–2025; version 0.x, API unstable
- Less Azure-native DI integration
- Smaller .NET community; fewer samples

**When AutoGen over SK orchestration:** If SK's `AgentGroupChat` / `HandoffOrchestration` proves too restrictive and you need fine-grained control over message routing. Start with SK. Switch if you hit walls.

---

## Decision Tree for HMC

```
New agent work / greenfield?
└── Microsoft Agent Framework (Microsoft.Agents.AI) — GA 1.0, start here

Migrating existing ChatAI?
└── Official SK → Agent Framework migration guide
    └── IChatFunction + ToolCallAccumulator → AIFunctionFactory.Create()
    └── PromptEngineeringProvider → middleware pipeline
    └── ChatHistory + truncation → Agent Framework memory providers

Need multi-agent orchestration?
└── Agent Framework built-in patterns — all stable in 1.0
    ├── Simple routing → HandoffOrchestration
    ├── Specialized parallel work → ConcurrentOrchestration  
    ├── Consensus/review loop → GroupChatOrchestration
    └── Complex generalist tasks → MagenticOneOrchestration

Stuck with SK agent code already written?
└── SK ChatCompletionAgent → Agent Framework migration guide exists
```

---

## Mapping to ChatAI Today

| Current component | Migration target | Stability |
|---|---|---|
| `IChatFunction` dispatch loop | `FunctionChoiceBehavior.Auto()` | Stable |
| `ToolCallAccumulator` | SK handles internally | Stable |
| `FunctionCallingContext` | `KernelArguments` + `IAutoFunctionInvocationFilter` | Stable |
| `ChatJob` (orchestration) | `ChatCompletionAgent` | RC |
| `PromptService` | SK `PromptTemplateConfig` + `IPromptRenderingFilter` | Stable |
| `IStreamingFunction.ChunkReceived` | `IAutoFunctionInvocationFilter` + existing SignalR | Stable |
| Multiple personas (future) | Separate `ChatCompletionAgent` per persona | RC |
| Agent routing (future) | `HandoffOrchestration` or supervisor plugin pattern | Experimental / Stable |

---

## What Does NOT Change

- `ChatContext` (SignalR narrowcast) — becomes the transport SK filters call into, not the orchestration layer
- `ChatCoordinator` (distributed cancel, semaphores) — outside SK's scope, survives as-is
- `DataExtractionServices` (PDF, Office, audio) — domain-specific; wrap as `[KernelFunction]` plugin
- `DocumentAnalysis` / chunking pipeline — wrap as plugin; SK's `TextChunker` may replace some chunking logic
- Cosmos + Blob persistence layer — survives; serialize SK `ChatHistory` instead of custom model

---

## References

- [Microsoft Agent Framework 1.0 announcement](https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-version-1-0/)
- [Agent Framework devblog](https://devblogs.microsoft.com/agent-framework/)
- [GitHub: microsoft/agent-framework](https://github.com/microsoft/agent-framework)
- [GitHub releases](https://github.com/microsoft/agent-framework/releases)
- [VSMag: SK + AutoGen = Agent Framework (origin story)](https://visualstudiomagazine.com/articles/2025/10/01/semantic-kernel-autogen--open-source-microsoft-agent-framework.aspx)
- [Start Debugging: Agent Framework 1.0 C# deep dive](https://startdebugging.net/2026/04/microsoft-agent-framework-1-0-ai-agents-in-csharp/)
- [InfoQ: Agent Framework RC](https://www.infoq.com/news/2026/02/ms-agent-framework-rc/)
- NuGet: `Microsoft.Agents.AI`, `Microsoft.Agents.AI.OpenAI`

### SK / AutoGen (predecessors — still relevant for existing code)
- [SK Agent Framework](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/)
- [AutoGen .NET repo](https://github.com/microsoft/autogen)
