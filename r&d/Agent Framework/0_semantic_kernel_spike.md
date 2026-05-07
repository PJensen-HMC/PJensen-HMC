---
title: Semantic Kernel — Technical Spike
date: 2026-04-16
author: Pete Jensen
email: jensenp@hmc.harvard.edu
status: archived
service: HMC.ChatAI.Service
tags: [semantic-kernel, spike, chatai]
superseded-by: ai-agent-strategy.md
---

# Semantic Kernel — Technical Spike

---

## Status Note (April 2026)

> **Microsoft Agent Framework 1.0 GA'd April 3, 2026** — a unified successor combining SK + AutoGen into `Microsoft.Agents.AI`. Official migration guides exist FROM SK. For new agent work, evaluate Agent Framework first (see `agent-framework-spike.md`). SK core concepts (plugins, filters, vector stores) remain directly relevant as Agent Framework builds on the same foundations — this spike is still the right reference for understanding those primitives.

---

## What Is It

Microsoft's official .NET SDK for integrating LLMs into applications. First-class Azure OpenAI support. ASP.NET Core DI native. GA at `1.0.0` Jan 2024; superseded for agent work by Microsoft Agent Framework in April 2026.

---

## Version Status

- `Microsoft.SemanticKernel` core: **stable (1.x)**. No breaking changes commitment.
- `Microsoft.SemanticKernel.Connectors.AzureOpenAI`: **stable** — the connector for your stack.
- `Microsoft.SemanticKernel.Agents.Core` / `.Agents.OpenAI`: **RC** — nearly GA, acceptable for new work.
- `Microsoft.SemanticKernel.Agents.AzureAI` (Azure AI Foundry agents): **experimental** (`--prerelease`).
- `Microsoft.SemanticKernel.Agents.Orchestration` (multi-agent patterns): **experimental** — do not take prod dependency yet.
- All non-Azure connectors (Mistral, Google, Ollama, Bedrock, etc.): `--prerelease`, require `#pragma warning disable SKEXP0070`.

Verify exact versions at `nuget.org/packages/Microsoft.SemanticKernel` — NuGet query was unavailable during research.

## NuGet Packages

```xml
<!-- Stable -->
<PackageReference Include="Microsoft.SemanticKernel" Version="1.*" />
<PackageReference Include="Microsoft.SemanticKernel.Connectors.AzureOpenAI" Version="1.*" />
<PackageReference Include="Microsoft.SemanticKernel.Connectors.AzureAISearch" Version="1.*" />

<!-- RC — acceptable for new work, watch for minor API churn -->
<PackageReference Include="Microsoft.SemanticKernel.Agents.Core" Version="1.*" />
<PackageReference Include="Microsoft.SemanticKernel.Agents.OpenAI" Version="1.*" />

<!-- Experimental — do not take hard prod dependency -->
<!-- Microsoft.SemanticKernel.Agents.AzureAI -->
<!-- Microsoft.SemanticKernel.Agents.Orchestration -->
<!-- Microsoft.SemanticKernel.Agents.Runtime.InProcess -->
```

To suppress experimental warnings globally:
```xml
<NoWarn>$(NoWarn);SKEXP0070;SKEXP0110</NoWarn>
```

---

## Core Abstractions

| SK concept | What it does | Replaces in ChatAI |
|---|---|---|
| `Kernel` | DI root; wires AI services + plugins | n/a (new) |
| `KernelPlugin` / `[KernelFunction]` | Typed tool exposed to model | `IChatFunction` |
| `KernelArguments` | Typed bag of function inputs | `FunctionCallingContext` |
| `IAutoFunctionInvocationFilter` | Hook into tool dispatch loop | `FunctionConfiguration` / `FunctionExtensions` |
| `IPromptRenderingFilter` | Intercept + mutate prompts before send | `PromptEngineeringProvider` |
| `ChatHistory` | Conversation message list | `ChatHistory` / `WorkingMemory` |
| `IChatCompletionService` | Provider-agnostic LLM call | Raw `OpenAI.Chat.ChatClient` |
| `ITextEmbeddingGenerationService` | Embedding generation | `VectorizationService` |
| `IVectorStore` | Vector memory abstraction | `VectorizationService` + Azure AI Search plumbing |
| `TextChunker` | Chunk text for embedding | `IChunkingStrategy` / chunking pipeline |

---

## DI Setup

```csharp
// Program.cs
builder.Services.AddKernel()
    .AddAzureOpenAIChatCompletion(
        deploymentName: config["AzureOpenAI:Deployment"]!,
        endpoint: config["AzureOpenAI:Endpoint"]!,
        apiKey: config["AzureOpenAI:Key"]!)
    .AddAzureAISearchVectorStore(
        new Uri(config["AzureSearch:Endpoint"]!),
        new AzureKeyCredential(config["AzureSearch:Key"]!))
    .Plugins.AddFromType<SearchPlugin>()
    .Plugins.AddFromType<CalendarPlugin>()
    .Plugins.AddFromType<UserProfilePlugin>();
```

Plugins resolve from DI — inject whatever services they need. Same pattern as existing `IChatFunction` registrations.

---

## Plugins (Tool Declaration)

```csharp
public class SearchPlugin(ISearchService search)
{
    [KernelFunction, Description("Search the knowledge base for relevant documents")]
    public async Task<string> SearchAsync(
        [Description("The search query")] string query,
        CancellationToken cancellationToken = default)
    {
        var results = await search.SearchAsync(query, cancellationToken);
        return JsonConvert.SerializeObject(results); // Newtonsoft per HMC convention
    }
}
```

SK serializes `[KernelFunction]` metadata → JSON schema for the model automatically. No manual `JsonPropertyDescriptionAttribute` (bye `JsonPropertyDescriptionAttribute.cs`).

---

## Function Calling Behavior

```csharp
var settings = new AzureOpenAIPromptExecutionSettings
{
    FunctionChoiceBehavior = FunctionChoiceBehavior.Auto(),   // model decides
    // FunctionChoiceBehavior.Required(functions: [...])      // force specific tools
    // FunctionChoiceBehavior.None()                          // disable tools
};
```

SK handles the dispatch loop internally:
1. Sends tool schemas to model
2. Detects `tool_calls` in response
3. Dispatches to your `[KernelFunction]` implementation (parallel if model emits multiple)
4. Appends result, calls model again
5. Repeat until no tool calls → final answer

Replaces `ToolCallAccumulator`, `FunctionExtensions`, and the `ChatJob` dispatch loop entirely.

---

## Filters (Cross-Cutting Concerns)

### Prompt Rendering Filter
Replaces `PromptEngineeringProvider` / `CapabilityAreaAttribute` system:

```csharp
public class HMCPromptFilter : IPromptRenderingFilter
{
    public async Task OnPromptRenderingAsync(PromptRenderingContext ctx, Func<PromptRenderingContext, Task> next)
    {
        // inject HMC system prompt, nudge, capabilities
        await next(ctx);
        // post-process rendered prompt
    }
}
```

### Auto Function Invocation Filter
Hook into each tool call — replaces `IStreamingFunction.ChunkReceived` / `IStatusEmitterFunction.StatusChanged`:

```csharp
public class SignalRToolStatusFilter(ChatContext chatContext) : IAutoFunctionInvocationFilter
{
    public async Task OnAutoFunctionInvocationAsync(AutoFunctionInvocationContext ctx, Func<AutoFunctionInvocationContext, Task> next)
    {
        await chatContext.SignalChatStatusMessage(LogLevel.Information, $"Calling {ctx.Function.Name}...");
        await next(ctx);
    }
}
```

---

## Streaming

SK has first-class streaming via `InvokeStreamingAsync`. Maps onto existing SignalR bridge:

```csharp
// In a SignalR Hub method
public async Task SendMessage(string chatId, string message)
{
    var history = await _repo.LoadAsync(chatId) ?? new ChatHistory();
    history.AddUserMessage(message);

    await Clients.Caller.SendAsync("ReceiveChatMessageUpdateStart", chatId);

    await foreach (var chunk in _kernel.InvokeStreamingAsync<StreamingChatMessageContent>(prompt, settings))
    {
        if (chunk.Content is not null)
            await Clients.Caller.SendAsync("ReceiveChatMessageUpdate", chatId, chunk.Content);
    }

    await Clients.Caller.SendAsync("ReceiveChatMessageUpdateStop", chatId);
    await _repo.SaveAsync(chatId, history);
}
```

`ChatContext.Signal*` methods survive — they become the SignalR adapter SK calls into, not the orchestration layer.

---

## Memory / Embeddings

SK's `IVectorStore` abstraction wraps Azure AI Search (which ChatAI already uses):

```csharp
// Define a record type for vector storage
[VectorStoreRecordCollection("documents")]
public class DocumentRecord
{
    [VectorStoreRecordKey] public string Id { get; set; } = "";
    [VectorStoreRecordData] public string Content { get; set; } = "";
    [VectorStoreRecordVector(1536)] public ReadOnlyMemory<float> Embedding { get; set; }
}

// Query
var collection = vectorStore.GetCollection<string, DocumentRecord>("documents");
var results = await collection.VectorizedSearchAsync(queryEmbedding, new() { Top = 5 });
```

Replaces `VectorizationService`, `VectorReader`/`VectorWriter`, and the raw Azure AI Search calls in `SmartSearch2Function`.

---

## Important Gotchas

### Kernel must be Transient
Register `Kernel` as `AddTransient` in ASP.NET Core — plugin collections are mutable. AI services (Azure OpenAI connector) registered as singletons are shared; the kernel wrapper is cheap per-request. Singleton kernel = thread-safety issues.

### STJ vs Newtonsoft at the SK boundary
SK uses `System.Text.Json` internally for function schema generation. Your app stays Newtonsoft — they don't collide. But: plugin parameter types need `[Description]` or `[System.Text.Json.Serialization.JsonPropertyName]` for schema naming. Newtonsoft `[JsonProperty]` attributes are invisible to SK's schema generator.

### Plugin function count
OpenAI recommends ≤ 10–20 tools per call. Beyond that, model accuracy in tool selection degrades. Keep plugin surface area narrow per scenario.

### Planners are gone
`StepwisePlanner` and `HandlebarsPlanner` removed. All planning is now `FunctionChoiceBehavior.Auto()`. The model is the planner.

### MCP support (new)
SK can now both consume MCP servers as plugins and expose a kernel as an MCP server. Relevant if external agents need to call your HMC tools.

---

## What Maps, What Stays

### Can be deleted / replaced by SK
- `IChatFunction`, `IStreamingFunction`, `IBlockStreamingFunction`, `IStatusEmitterFunction`
- `FunctionCallingContext`, `FunctionExtensions`, `FunctionConfiguration`
- `ToolCallAccumulator`
- `PromptEngineeringProvider`, `CapabilityAreaAttribute`, `CapabilityDescriptionAttribute`
- `SharpTokenCounter`, `TokenizationExtensions` (SK has `ITokenCounterService`)
- Truncation strategies — replace with SK `ChatHistory` + token counting
- `VectorizationService`, `VectorizationCache`, `VectorReader`, `VectorWriter`
- `WorkingMemory` (partially — SK memory replaces the vector side)
- `ChatHistory` model + `ChatStoragePersistent` persistence (SK `ChatHistory` + serialize to Cosmos)

### Stays as HMC glue
- `ChatContext` (SignalR narrowcast signals) — becomes the SignalR adapter SK filters call into
- `ChatCoordinator` (distributed cancellation / semaphore per chat) — survives, not SK's concern
- `DataExtractionServices` (PDF, Office, audio, HTML extraction) — domain-specific, no SK equivalent
- `DocumentAnalysis` pipeline (chunking strategies, Document Intelligence OCR bridge) — SK has `TextChunker` but our Document Intelligence integration is custom
- `EMailAiCoordinator` / AskAivy flow — becomes an SK agent invocation
- Cosmos persistence layer for chat history
- Auth / user profile middleware

### Needs evaluation
- `ReflectService` — SK structured output or a dedicated extraction agent could replace this
- `ModelCapabilities` / `ModelPromptConstraints` — SK has execution settings per model; assess overlap
- `PromptRepository` / `ChatPromptTemplate` — SK `PromptTemplateFactory` could replace this

---

## Shared Library Opportunity

`HMC.Shared.AgentCore` following the existing `ServiceExtensions.cs` pattern:

```csharp
public static class AgentServiceExtensions
{
    public static IKernelBuilder AddHMCAgentCore(this IKernelBuilder builder, IConfiguration config)
    {
        return builder
            .AddAzureOpenAIChatCompletion(...)
            .AddAzureAISearchVectorStore(...);
    }
}
```

All microservices adopt HMC-standard Kernel config in one call.

---

## Risk / Concerns

- **Agents layer `[Experimental]` tag** — check current NuGet before committing to `Agents.Core`. May have stabilized by now.
- **STJ vs Newtonsoft** — SK uses `System.Text.Json` internally. Plugin return types need to serialize cleanly. Watch for Newtonsoft-only types surfacing at the boundary.
- **`ChatContext` coupling** — the existing `ChatContext` is deeply wired to SignalR + Polly retry. Migrating to SK filters requires threading the SignalR hub context through; it's doable but non-trivial.
- **Streaming response shape** — SK `StreamingChatMessageContent` is different from `StreamingChatCompletionUpdate` (Azure SDK). Existing SignalR channels need mapping checked.
- **No equivalent for `OpenAiPayloadShapingPolicy`** — SK abstracts away raw payload shaping. If you're doing non-standard payload mutations, that surface goes away.

---

## References

- https://learn.microsoft.com/semantic-kernel — official docs
- https://github.com/microsoft/semantic-kernel — source + changelog
- NuGet: `Microsoft.SemanticKernel.Agents.Core` — check latest stable vs preview
