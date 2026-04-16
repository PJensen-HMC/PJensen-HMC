# Agent Framework — Technical Spike

**Date:** 2026-04-16  
**Author:** Pete Jensen  
**Context:** Evaluating agent framework options for HMC ChatAI evolution

---

## TL;DR

Semantic Kernel IS an agent framework. The question isn't "SK vs agent framework" — it's "how deep into SK's agent layer do we go, and do we need AutoGen for multi-agent orchestration?"

| Scenario | Recommendation |
|---|---|
| Migrate ChatAI tool calling | SK core (`ChatCompletionAgent` or just `Kernel` + `FunctionChoiceBehavior.Auto`) |
| Named persona agents (Aivy, OfficeFunctions, Search) | `ChatCompletionAgent` per persona — RC, acceptable |
| Multi-agent orchestration (route between agents) | SK `AgentGroupChat` — experimental, evaluate carefully |
| Distributed/durable agents at scale | Azure AI Agent Service via `AzureAIAgent` — experimental |
| Complex multi-agent research patterns | AutoGen.NET wrapper over SK — only if SK orchestration is insufficient |

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
Current ChatAI flow (single assistant, tool calling)?
└── Migrate to SK Kernel + FunctionChoiceBehavior.Auto()
    └── Want explicit agent identity / thread management?
        └── Use ChatCompletionAgent (RC)
            └── Want server-managed threads + Azure-native RAG tools?
                └── Evaluate AzureAIAgent when it GAs
            └── Need multiple specialized agents collaborating?
                └── Use AgentToolPlugin supervisor pattern (stable now)
                    └── Need more complex orchestration topology?
                        └── Try SK AgentGroupChat/HandoffOrchestration (experimental)
                            └── Still insufficient?
                                └── AutoGen.NET wrapping SK agents
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

- [SK Agent Framework overview](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/)
- [ChatCompletionAgent](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/agent-types/chat-completion-agent)
- [OpenAIAssistantAgent](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/agent-types/assistant-agent)
- [AzureAIAgent](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/agent-types/azure-ai-agent)
- [Agent Orchestration](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/agent-orchestration/)
- [AutoGen .NET repo](https://github.com/microsoft/autogen) — .NET under `dotnet/` subfolder
- [Function Calling deep dive](https://learn.microsoft.com/en-us/semantic-kernel/concepts/ai-services/chat-completion/function-calling/)
